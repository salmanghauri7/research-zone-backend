# Papers Module Documentation

**START HERE:** Read [docs/INDEX.md](../../INDEX.md) first to understand the project structure and documentation guide.

**IMPORTANT:** Before making any changes, read [docs/AGENT_GUIDELINES.md](../../AGENT_GUIDELINES.md) to understand coding standards and architecture patterns.

## Overview

The Papers Module manages research papers in the system. It handles paper uploads, metadata management, storage on AWS S3, and paper visibility/access control.

**Module Location:** `src/modules/papers/`

## Table of Contents

1. [Business Logic](#business-logic)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [File Upload Flow](#file-upload-flow)
6. [Integration Points](#integration-points)
7. [Error Handling](#error-handling)

## Business Logic

### Paper Lifecycle

#### 1. Paper Upload
- User uploads a PDF/document file
- File uploaded to AWS S3 bucket
- Metadata extracted (title, authors, abstract, etc.)
- Paper record created with S3 URL
- Paper assigned unique ID
- Creator set as paper owner

#### 2. Paper Visibility
- Papers can be:
  - **Private**: Only owner can view/save
  - **Workspace**: Only workspace members can view
  - **Public**: Any authenticated user can view
- Visibility controlled via `accessLevel` field

#### 3. Paper Preview
- Metadata available: title, authors, abstract, publication date
- CloudFront URLs generated for secure file delivery
- Thumbnails optionally generated

#### 4. Paper Metadata
- Supported fields: title, authors, abstract, publicationDate, pdfUrl, citations, keywords
- Citations tracked for paper relationships
- Tags for organization

### Search & Discovery

Papers can be searched by:
- Title (full-text search)
- Authors
- Keywords
- Publication date range
- By workspace (if workspace-specific)

## Architecture

### File Structure

```
src/modules/papers/
├── controller.js      # API request handling
├── model.js          # Paper MongoDB schema
├── routes.js         # API endpoints
└── service.js        # Business logic
```

### Layer Responsibilities

**Controller** (`controller.js`)
- Validate file uploads
- Check user authentication
- Call service methods
- Return formatted responses

**Service** (`service.js`)
- Handle file upload to S3
- Extract metadata from PDF
- Manage paper records
- Search and filtering logic
- Permission checks

**Model** (`model.js`)
- Paper document schema
- Indexes for search
- Relationships to users and workspaces

## Database Schema

### Paper Collection

```javascript
{
  _id: ObjectId,
  title: String (required),
  authors: [String],                    // Array of author names
  abstract: String,
  pdfUrl: String (required),           // AWS S3 URL
  uploadedBy: ObjectId (ref: User),    // Paper owner
  uploadedAt: Date (default: now),
  
  // Metadata
  publicationDate: Date,
  publicationVenue: String,            // Journal/Conference
  doi: String,                         // Digital Object Identifier
  citations: Number,                   // Citation count
  
  // Organization
  tags: [String],                      // User tags
  keywords: [String],                  // Paper keywords
  
  // Visibility
  accessLevel: String (enum: ['private', 'workspace', 'public']),
  workspaceId: ObjectId (ref: Workspace, conditional),
  
  // File info
  fileSize: Number,                    // In bytes
  mimeType: String,                    // Usually application/pdf
  
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

### Key Indexes

- `uploadedBy`: Quick lookup of user's papers
- `workspaceId`: Papers in a workspace
- `title`: Full-text search
- `accessLevel`: Filter by visibility

### Optional: Paper Interactions Collection

```javascript
{
  _id: ObjectId,
  paperId: ObjectId (ref: Paper),
  userId: ObjectId (ref: User),
  action: String (enum: ['view', 'save', 'share', 'comment']),
  createdAt: Date
}
```

## API Endpoints

### POST `/api/papers/upload`

**Purpose:** Upload a new research paper

**Request:**
```
Authorization: Bearer <access-token>
Content-Type: multipart/form-data

Fields:
- file: PDF file (required)
- title: Paper title (required)
- authors: Comma-separated author names (optional)
- abstract: Paper abstract (optional)
- keywords: Comma-separated keywords (optional)
- accessLevel: 'private' | 'workspace' | 'public' (default: 'private')
- workspaceId: Workspace ID if accessLevel is 'workspace' (conditional)
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Paper uploaded successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Deep Learning in NLP",
    "authors": ["John Doe", "Jane Smith"],
    "abstract": "...",
    "pdfUrl": "https://cdn.research.com/papers/abc123.pdf",
    "uploadedBy": "507f1f77bcf86cd799439012",
    "uploadedAt": "2024-03-28T10:00:00Z",
    "accessLevel": "public",
    "fileSize": 2048576,
    "mimeType": "application/pdf"
  }
}
```

**Business Rules:**
- File must be PDF (validate MIME type)
- File size limit: 50MB
- Title required, min 5 characters
- Authors validated as array
- Only owner can change access level
- If accessLevel is 'workspace', workspaceId required

**Error Codes:**
- 400: Missing/invalid fields, file too large
- 401: Not authenticated
- 403: User not verified
- 413: File too large
- 500: S3 upload failed

---

### GET `/api/papers/search`

**Purpose:** Search papers with filters

**Query Parameters:**
```
GET /api/papers/search?title=deep+learning&authors=John&limit=20&page=1
```

**Parameters:**
- `title`: Search in title (optional)
- `authors`: Search in authors (optional)
- `keywords`: Match keywords (optional)
- `workspace`: Workspace ID filter (optional)
- `accessLevel`: Filter by access level (optional)
- `limit`: Results per page (default: 20, max: 100)
- `page`: Page number (default: 1)

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Papers found",
  "data": {
    "items": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "title": "Deep Learning in NLP",
        "authors": ["John Doe"],
        "abstract": "...",
        "uploadedBy": "507f1f77bcf86cd799439012",
        "uploadedAt": "2024-03-28T10:00:00Z"
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 20,
      "totalPages": 3
    }
  }
}
```

**Business Rules:**
- Search respects access level (don't show private papers of others)
- Workspace filter only shows papers accessible to user
- Full-text search on title and keywords

---

### GET `/api/papers/:id`

**Purpose:** Get paper details

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Paper retrieved",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Deep Learning in NLP",
    "authors": ["John Doe", "Jane Smith"],
    "abstract": "...",
    "pdfUrl": "https://cdn.research.com/papers/abc123.pdf",
    "publicationDate": "2023-01-15",
    "publicationVenue": "NeurIPS 2023",
    "doi": "10.1234/example",
    "citations": 45,
    "tags": ["nlp", "deep-learning"],
    "keywords": ["transformer", "attention"],
    "uploadedBy": "507f1f77bcf86cd799439012",
    "accessLevel": "public",
    "fileSize": 2048576,
    "createdAt": "2024-03-28T10:00:00Z"
  }
}
```

**Permission Rules:**
- Public papers: anyone can view
- Workspace papers: only workspace members
- Private papers: only owner

---

### PUT `/api/papers/:id`

**Purpose:** Update paper metadata

**Request Body:**
```json
{
  "title": "Updated Title",
  "authors": ["Author 1", "Author 2"],
  "abstract": "Updated abstract",
  "tags": ["tag1", "tag2"],
  "accessLevel": "workspace"
}
```

**Business Rules:**
- Only owner can update
- Cannot update file itself (delete + reupload required)
- Only verified users can update

**Error Codes:**
- 403: Not owner
- 404: Paper not found

---

### DELETE `/api/papers/:id`

**Purpose:** Delete a paper and remove from S3

**Business Rules:**
- Only owner can delete
- Deletes from S3 and database
- Cannot restore (soft delete optional)
- All associated saved papers/comments should be handled

---

### GET `/api/papers/:id/download`

**Purpose:** Get signed CloudFront URL for file download

**Response:**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://cdn.research.com/papers/abc123.pdf?...",
    "expiresIn": 3600
  }
}
```

**Business Rules:**
- URL valid for 1 hour
- Permission checks enforced
- Tracks download statistics (optional)

---

## File Upload Flow

```
1. Client uploads file with metadata
         ↓
   Controller validates:
   - File exists
   - File is PDF
   - Size < 50MB
         ↓
   Service receives file
         ↓
   2. Upload to AWS S3
         ↓
   3. Extract metadata from PDF
         ↓
   4. Create paper document with S3 URL
         ↓
   5. Return paper ID + details
         ↓
   Client receives response
```

### S3 Configuration

```javascript
// Bucket: research-zone-papers
// ACL: Private (CloudFront delivery)
// Versioning: Enabled
// Encryption: AES-256

// File path: papers/{userId}/{paperId}/{filename}
```

### CloudFront Delivery

```javascript
// CloudFront signed cookies for security
// URLs valid for 1 hour
// Prevents direct S3 access
```

## Integration Points

### 1. Workspace Module
- Papers can be scoped to workspaces
- Workspace members can access workspace papers

### 2. Saved Papers Module
- SavedPaper references Paper
- Same paper can be saved in multiple workspaces

### 3. Paper Chat Module
- Paper-specific discussions reference papers
- Comments attached to paper objects

### 4. User Module
- Papers owned by users
- Tracks uploader

### 5. AWS S3
- File storage
- CloudFront for delivery

## Error Handling

### File Upload Errors

```javascript
// File validation
if (!file) throw new ApiError("File required", 400);
if (file.mimetype !== 'application/pdf') throw new ApiError("Only PDF", 400);
if (file.size > 50 * 1024 * 1024) throw new ApiError("File too large", 413);

// S3 errors
try {
  const url = await uploadToS3(file);
} catch (err) {
  throw new ApiError("S3 upload failed", 500);
}
```

### Permission Errors

```javascript
if (paper.uploadedBy.toString() !== user.id.toString()) {
  throw new ApiError("Only owner can delete", 403);
}
```

### Resource Not Found

```javascript
if (!paper) {
  throw new ApiError("Paper not found", 404);
}
```

## Performance Optimization

### Indexing Strategy

```javascript
// For search performance
schema.index({ title: "text", keywords: "text" });

// For user papers lookup
schema.index({ uploadedBy: 1, createdAt: -1 });

// For workspace papers
schema.index({ workspaceId: 1, accessLevel: 1 });
```

### Pagination

Always paginate search results:
```javascript
const skip = (page - 1) * limit;
const papers = await Paper.find(filter)
  .skip(skip)
  .limit(limit)
  .sort({ createdAt: -1 });
```

### Caching

- Cache frequently viewed papers
- Clear cache on updates
- TTL: 1 hour

## UI Specifications

### Paper Upload Form

**Fields:**
- File input (PDF only)
- Title (required)
- Authors (multi-input or textarea)
- Abstract (textarea)
- Keywords (tags input)
- Publication date (optional)
- Access level dropdown
- Workspace selector (if workspace-scoped)

**Upload States:**
- Idle (ready to upload)
- Uploading (progress bar)
- Processing (extracting metadata)
- Success (show paper details)
- Error (show error message)

### Paper Search/Browse

**Components:**
- Search bar (title, authors)
- Filter panel (keywords, date, access level)
- Result list with:
  - Title
  - Authors
  - Abstract preview
  - Upload date
  - Access level badge
- Pagination controls

### Paper Detail View

**Sections:**
1. **Metadata**
   - Title, authors
   - Publication info (date, venue)
   - DOI, citations
   
2. **Abstract & Keywords**
   - Full abstract
   - Tags/keywords list
   
3. **Document**
   - PDF viewer or download button
   - File size, type info
   
4. **Actions** (owner only)
   - Edit metadata
   - Change access level
   - Delete button
   - Share options

5. **Interactions**
   - Save button (if not owner)
   - Start discussion link
   - Related papers

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| PDF upload fails | File not actually PDF | Validate MIME type and magic bytes |
| CloudFront URLs broke | S3 URL changed | Regenerate signed URLs on request |
| Search slow | Missing indexes | Add text index on title/keywords |
| Large file timeouts | Upload timeout too short | Increase timeout or use chunked upload |
| Out of S3 quota | Too many files | Implement cleanup policy |

## Future Enhancements

- PDF text extraction for full-text search
- Automatic metadata extraction from PDF
- Duplicate detection
- Paper recommendation engine
- Citation tracking
- Paper versioning
- Comments on papers
- Paper tagging system
- Export bibliography

---

**Module Version**: 1.0.0
**Last Updated**: March 28, 2024

