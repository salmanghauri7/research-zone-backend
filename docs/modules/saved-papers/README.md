# Saved Papers Module Documentation

**START HERE:** Read [docs/INDEX.md](../../INDEX.md) first to understand the project structure and documentation guide.

**IMPORTANT:** Before making any changes, read [docs/AGENT_GUIDELINES.md](../../AGENT_GUIDELINES.md) to understand coding standards and architecture patterns.

## Overview

The Saved Papers Module manages papers that users save to workspaces. It creates links between papers, workspaces, and users with optional folder organization and annotations.

**Module Location:** `src/modules/workspaces/saved-papers/`

## Business Logic

### Saving Papers

Users can save papers from:
1. Search results
2. Uploaded papers
3. Shared papers
4. Recommended papers

### Paper Organization

- Same paper can be saved in multiple workspaces
- Same paper can be in multiple folders within a workspace
- Users can add personal notes and tags
- Each save creates a SavedPaper record

### Access Control

```
- Save paper: Workspace member
- View saved papers: Workspace members
- Edit notes: Paper saver or workspace owner
- Remove paper: Paper saver or workspace owner
- Share SavedPaper: Workspace members (share paper, not SavedPaper record)
```

## Architecture

### File Structure

```
src/modules/workspaces/saved-papers/
├── controller.js      # API request handling
├── model.js          # SavedPaper schema
├── routes.js         # API endpoints
└── services.js       # Business logic
```

### Data Relationships

```
User
  ↓
SavedPaper ← → Paper
  ↓           ↓
Workspace   Metadata
  ↓
Folder (optional)
```

## Database Schema

### SavedPaper Collection

```javascript
{
  _id: ObjectId,
  
  // References
  paperId: ObjectId (ref: Paper, indexed),
  workspaceId: ObjectId (ref: Workspace, indexed),
  folderId: ObjectId (ref: Folder, nullable),
  savedBy: ObjectId (ref: User, indexed),
  
  // Annotations
  notes: String,                    // User's personal notes
  tags: [String],                   // Custom tags
  importance: Number (0-5),         // User rating
  readStatus: String (enum: [
    'not-read',
    'reading',
    'completed'
  ]),
  
  // Metadata
  savedAt: Date (default: now),
  updatedAt: Date (auto),
  lastAccessedAt: Date,            // When last viewed
  
  // Optional: Highlights/annotations
  highlights: [
    {
      page: Number,
      text: String,
      color: String,
      createdAt: Date
    }
  ],
  
  // Quick reference
  paperTitle: String,               // Denormalized for quick display
  paperAuthors: [String],          // Denormalized
  pdfUrl: String                    // Denormalized from Paper
}
```

### Index Strategy

```javascript
// Find saved papers by workspace
schema.index({ workspaceId: 1, savedAt: -1 });

// Find papers saved by user
schema.index({ savedBy: 1, workspaceId: 1 });

// Find paper in workspace
schema.index({ paperId: 1, workspaceId: 1 });

// Folder organization
schema.index({ folderId: 1, workspaceId: 1 });

// Search saved papers
schema.index({ "tags": 1, workspaceId: 1 });
schema.index({ "paperTitle": "text", "notes": "text" });
```

## API Endpoints

### POST `/api/workspaces/:workspaceId/saved-papers`

**Purpose:** Save a paper to workspace

**Request Body:**
```json
{
  "paperId": "507f...",
  "folderId": "507f...",  // Optional
  "notes": "Great paper on attention mechanisms",
  "tags": ["nlp", "attention", "transformers"],
  "importance": 4
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Paper saved successfully",
  "data": {
    "_id": "507f...",
    "paperId": "507f...",
    "workspaceId": "507f...",
    "savedBy": "507f...",
    "folderId": "507f...",
    "notes": "Great paper on attention mechanisms",
    "tags": ["nlp", "attention", "transformers"],
    "importance": 4,
    "readStatus": "not-read",
    "paperTitle": "Attention is All You Need",
    "paperAuthors": ["Vaswani et al"],
    "savedAt": "2024-03-28T10:00:00Z"
  }
}
```

**Business Rules:**
- User must be workspace member
- Paper must exist
- Cannot save same paper twice (check before save)
- If already saved, update instead of duplicate
- Folder must be in same workspace (if provided)

**Error Codes:**
- 400: Invalid paperId or folderId
- 403: Not workspace member
- 404: Paper or folder not found
- 409: Paper already saved (optional, can update instead)

---

### GET `/api/workspaces/:workspaceId/saved-papers`

**Purpose:** Get all saved papers in workspace

**Query Parameters:**
```
limit: Number (default: 20)
page: Number (default: 1)
folderId: ObjectId (filter by folder)
tags: String (comma-separated, find papers with any tag)
importance: Number (filter by min importance)
readStatus: String ('not-read', 'reading', 'completed')
search: String (search in title and notes)
sortBy: String ('savedAt', 'importance', 'title', default: 'savedAt')
sortOrder: 'asc' | 'desc' (default: 'desc')
```

**Response:**
```json
{
  "success": true,
  "data": {
    "savedPapers": [
      {
        "_id": "507f...",
        "paperId": "507f...",
        "paperTitle": "Attention is All You Need",
        "paperAuthors": ["Vaswani et al"],
        "savedAt": "2024-03-28T10:00:00Z",
        "tags": ["nlp", "transformers"],
        "importance": 5,
        "readStatus": "completed",
        "notes": "Foundational paper in modern NLP",
        "lastAccessedAt": "2024-03-28T15:00:00Z",
        "highlightCount": 3
      }
    ],
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 20,
      "totalPages": 3
    },
    "stats": {
      "totalSaved": 45,
      "byReadStatus": {
        "not-read": 15,
        "reading": 20,
        "completed": 10
      },
      "avgImportance": 3.5
    }
  }
}
```

---

### GET `/api/saved-papers/:savedPaperId`

**Purpose:** Get detailed saved paper with annotations

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f...",
    "paperId": "507f...",
    "workspaceId": "507f...",
    "paperTitle": "Attention is All You Need",
    "paperAuthors": ["Vaswani et al"],
    "paperAbstract": "...",
    "pdfUrl": "https://cdn.research.com/...",
    
    "notes": "Foundational work in transformers",
    "tags": ["nlp", "attention", "transformers"],
    "importance": 5,
    "readStatus": "completed",
    
    "highlights": [
      {
        "page": 3,
        "text": "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks",
        "color": "yellow",
        "createdAt": "2024-03-28T10:15:00Z"
      }
    ],
    
    "savedAt": "2024-03-28T10:00:00Z",
    "lastAccessedAt": "2024-03-28T15:00:00Z"
  }
}
```

---

### PUT `/api/saved-papers/:savedPaperId`

**Purpose:** Update saved paper annotations

**Request Body:**
```json
{
  "notes": "Updated notes after re-reading",
  "tags": ["nlp", "attention", "architecture"],
  "importance": 5,
  "readStatus": "completed",
  "folderId": "507f..."  // Move to different folder
}
```

**Business Rules:**
- Only saver or workspace owner can update
- Folder must be in same workspace
- lastAccessedAt updated automatically

---

### DELETE `/api/saved-papers/:savedPaperId`

**Purpose:** Remove paper from saved papers

**Business Rules:**
- Only saver or workspace owner can delete
- Paper still exists in system
- Only removes from SavedPaper collection
- Returns HTTP 200 (no content needed)

---

### POST `/api/saved-papers/:savedPaperId/highlights`

**Purpose:** Add highlight/annotation to paper

**Request Body:**
```json
{
  "page": 5,
  "text": "The mechanism is crucial for modern NLP",
  "color": "yellow"  // yellow, green, blue, pink
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "highlightId": "507f...",
    "page": 5,
    "text": "The mechanism is crucial for modern NLP",
    "color": "yellow",
    "createdAt": "2024-03-28T15:00:00Z"
  }
}
```

---

### GET `/api/saved-papers/:savedPaperId/highlights`

**Purpose:** Get all highlights on saved paper

**Response:**
```json
{
  "success": true,
  "data": {
    "highlights": [
      { "page": 3, "text": "...", "color": "yellow", "createdAt": "..." },
      { "page": 5, "text": "...", "color": "green", "createdAt": "..." }
    ],
    "count": 2
  }
}
```

---

### DELETE `/api/saved-papers/:savedPaperId/highlights/:highlightId`

**Purpose:** Remove a highlight

---

## Search & Filtering

### Search Filters

```javascript
async searchSavedPapers(workspaceId, filters) {
  let query = { workspaceId };
  
  // Filter by folder
  if (filters.folderId) {
    query.folderId = filters.folderId;
  }
  
  // Filter by tags (OR condition)
  if (filters.tags && filters.tags.length > 0) {
    query.tags = { $in: filters.tags };
  }
  
  // Filter by importance
  if (filters.minImportance) {
    query.importance = { $gte: filters.minImportance };
  }
  
  // Filter by read status
  if (filters.readStatus) {
    query.readStatus = filters.readStatus;
  }
  
  // Full-text search on title and notes
  if (filters.search) {
    query.$text = { $search: filters.search };
  }
  
  // Sort
  const sortOptions = {};
  const sortField = filters.sortBy || 'savedAt';
  sortOptions[sortField] = filters.sortOrder === 'asc' ? 1 : -1;
  
  return await SavedPaper.find(query)
    .sort(sortOptions)
    .skip((filters.page - 1) * filters.limit)
    .limit(filters.limit);
}
```

## Denormalization Strategy

### Why Denormalize?

SavedPaper stores denormalized data (paperTitle, paperAuthors, pdfUrl) to:
- Avoid JOIN on every query
- Show paper info without fetching Paper document
- Handle paper deletion gracefully

### Update Denormalized Fields

```javascript
async savePaper(paperId, workspaceId, user) {
  // Get paper details
  const paper = await Paper.findById(paperId);
  
  if (!paper) {
    throw new ApiError("Paper not found", 404);
  }
  
  // Create SavedPaper with denormalized data
  const savedPaper = await SavedPaper.create({
    paperId,
    workspaceId,
    savedBy: user.id,
    
    // Denormalized fields
    paperTitle: paper.title,
    paperAuthors: paper.authors,
    pdfUrl: paper.pdfUrl
  });
  
  return savedPaper;
}
```

### Handle Paper Updates

If paper details change, update all SavedPapers:

```javascript
async updatePaperInSavedPapers(paperId, updates) {
  const { title, authors, pdfUrl } = updates;
  
  await SavedPaper.updateMany(
    { paperId },
    {
      $set: {
        paperTitle: title,
        paperAuthors: authors,
        pdfUrl: pdfUrl
      }
    }
  );
}
```

## Statistics & Analytics

### Workspace Stats

```javascript
async getWorkspaceStats(workspaceId) {
  const stats = await SavedPaper.aggregate([
    { $match: { workspaceId } },
    {
      $group: {
        _id: null,
        totalSaved: { $sum: 1 },
        avgImportance: { $avg: "$importance" },
        completedReads: {
          $sum: {
            $cond: [{ $eq: ["$readStatus", "completed"] }, 1, 0]
          }
        }
      }
    },
    {
      $facet: {
        readStatusBreakdown: [
          { $project: { readStatus: 1 } },
          { $group: { _id: "$readStatus", count: { $sum: 1 } } }
        ],
        topTags: [
          { $unwind: "$tags" },
          { $group: { _id: "$tags", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]
      }
    }
  ]);
  
  return stats[0];
}
```

## UI Specifications

### Saved Papers List

**Columns:**
- Paper title
- Authors
- Read status (badge)
- Importance (⭐ rating)
- Saved date
- Tags
- Folder

**Actions:**
- View details
- Move to folder
- Add/edit notes
- Remove from saved
- Open PDF

**Filters (Sidebar):**
- Folder selector
- Read status filter
- Importance range
- Tags multi-select
- Search box

### Paper Detail View

**Sections:**
1. **Paper Info**
   - Title, authors
   - PDF viewer or download

2. **Saved Paper Data**
   - Notes textarea
   - Tags input
   - Importance slider
   - Read status dropdown
   - Folder selector

3. **Highlights**
   - Timeline of highlights
   - Color-coded
   - Edit/delete options

4. **Metadata**
   - Saved date
   - Last accessed
   - Folder location

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Duplicate saves | No uniqueness check | Check paperId+workspaceId before save |
| Denormalized data stale | Paper updated but SavedPaper not | Update all SavedPapers when Paper changes |
| Slow search | Missing text index | Add full-text search index |
| Tags not searchable | No tag index | Index tags array field |
| Highlights lost | Document update overwrites | Use $push for array operations |
| Out of memory | Too many highlights | Archive old highlights |

## Best Practices

1. **Notes Quality**
   - Keep notes concise and meaningful
   - Use consistent format
   - Update as you read

2. **Tag Management**
   - Limit tags per paper (5-10)
   - Use consistent naming
   - Archive unused tags

3. **Organization**
   - Use folders wisely
   - Move papers as you read
   - Archive completed papers

4. **Performance**
   - Paginate results
   - Use text indexes for search
   - Cache frequently viewed

## Future Enhancements

- Collaborative annotations
- Paper recommendations
- Reading statistics
- Reading time estimates
- Bibliography export (BibTeX, APA)
- Paper comparison
- Annotation sharing
- Reading reminders
- Paper archiving
- Bulk operations (tag, move, delete)

---

**Module Version**: 1.0.0
**Last Updated**: March 28, 2024

