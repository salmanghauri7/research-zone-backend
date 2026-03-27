# Workspaces Module Documentation

## Overview

The Workspaces Module enables users to create collaborative workspaces, manage team members, organize research papers, and facilitate group discussions. It's a core feature allowing multi-user collaboration with granular permission controls.

**Module Location:** `src/modules/workspaces/`

## Business Logic

### Workspace Lifecycle

#### 1. Workspace Creation
- User creates a new workspace with a title
- Creator automatically becomes the **owner**
- Creator is added to members list
- System auto-generates a random invite code (UUID)
- System assigns a random color from predefined palette
- Workspace is created with empty saved papers and folders

#### 2. Access Control & Permissions

**Owner Permissions:**
- Create/edit/delete workspace
- Invite new members via email
- Remove members from workspace
- Transfer ownership (if implemented)
- Delete their saved papers
- Create folders
- Access all workspace data

**Member Permissions:**
- View workspace and its contents
- Save/organize papers within workspace
- Participate in paper-chat discussions
- View folder structure
- Does NOT have invitation/removal permissions

#### 3. Workspace Invitation System

**Invitation Flow:**
1. Owner requests to invite user by email
2. System checks:
   - User is owner of workspace
   - Target email not already a member
   - No pending invitation exists for email
3. Create invitation record with:
   - Unique JWT token (expires in 7 days)
   - Email address
   - Workspace ID
   - Inviter information
4. Send invitation email with:
   - Workspace title
   - Inviter name
   - Clickable link with token
5. User clicks link and receives verification
6. User (if logged in) accepts invitation
7. User added to workspace members

**Invitation States:**
- `pending`: Created, awaiting user action
- `accepted`: User joined workspace
- `declined`: User rejected invitation (if applicable)
- `expired`: 7-day timeout reached

#### 4. Workspace Organization

**Folders Module** (`workspaces/folders/`):
- Users create folders within workspaces
- Folders organize saved papers
- Hierarchical structure (parent-child folders possible)
- Folder ownership tied to creator

**Saved Papers Module** (`workspaces/saved-papers/`):
- Papers saved to specific workspaces
- Accessible by all workspace members
- Can be organized into folders
- Metadata: paper info, tags, notes, save date

#### 5. Chat Integration

- **Workspace Chat**: General chat for workspace members
- **Paper Chat**: Discussion specific to individual papers
- Chat messages linked to workspace for context
- Socket.io handles real-time message updates

## Architecture

### File Structure

```
src/modules/workspaces/
├── controller.js           # API request handlers
├── model.js               # Workspace MongoDB schema
├── routes.js              # Workspace endpoints
├── services.js            # Business logic
├── invitationModel.js      # Invitation schema
├── folders/
│   ├── controller.js
│   ├── model.js
│   ├── routes.js
│   └── services.js
└── saved-papers/
    ├── controller.js
    ├── model.js
    ├── routes.js
    └── services.js
```

### Layer Responsibilities

**Controller Layer** (`controller.js`)
- Validates incoming requests
- Extracts user from request context
- Calls appropriate service methods
- Formats responses
- Error handling and HTTP status codes

**Service Layer** (`services.js`)
- Extends BaseRepository for database operations
- Implements workspace creation logic
- Member invitation and acceptance logic
- Permission checks (owner verification)
- Aggregation pipelines for data retrieval
- Email notification logic

**Model Layer** (`model.js`)
- Workspace schema definition
- Indexes for performance optimization
- References to User model
- Pre-save hooks for defaults (color assignment)

**Invitation Model** (`invitationModel.js`)
- Separate collection for invitation records
- Token generation and expiry
- Status tracking

## Database Schema

### Workspace Collection

```javascript
{
  _id: ObjectId,
  title: String (required),
  owner: ObjectId (ref: User, indexed),
  members: [
    {
      user: ObjectId (ref: User),
      joinedAt: Date (default: now)
    }
  ],
  color: String (e.g., "#6366f1"),
  inviteCode: String (unique UUID),
  createdAt: Date (auto-set),
  updatedAt: Date (auto-updated on changes)
}
```

### Key Indexes

- `owner`: Fast lookups of workspaces by owner
- `inviteCode`: Fast lookups by invite code
- Implicit index on `_id` (default)

### Workspace Invitation Collection

```javascript
{
  _id: ObjectId,
  email: String (recipient email),
  workspaceId: ObjectId (ref: Workspace),
  inviterId: ObjectId (ref: User),
  token: String (unique JWT token),
  status: String (enum: ['pending', 'accepted', 'declined']),
  createdAt: Date,
  expiresAt: Date (7 days from creation),
  acceptedAt: Date (when user accepts)
}
```

### Folder Collection (Linked)

```javascript
{
  _id: ObjectId,
  workspaceId: ObjectId (ref: Workspace),
  name: String,
  parentFolder: ObjectId (ref: Folder, optional),
  createdBy: ObjectId (ref: User),
  createdAt: Date
}
```

### Saved Papers Collection (Linked)

```javascript
{
  _id: ObjectId,
  workspaceId: ObjectId (ref: Workspace),
  paperId: ObjectId (ref: Paper),
  folderId: ObjectId (ref: Folder, optional),
  savedBy: ObjectId (ref: User),
  notes: String (user's notes),
  tags: [String],
  savedAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### POST `/api/workspaces`

**Purpose:** Create a new workspace

**Request Body:**
```json
{
  "title": "AI Research 2024"
}
```

**Request Headers:**
```
Authorization: Bearer <access-token>
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Workspace created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "AI Research 2024",
    "owner": "507f1f77bcf86cd799439012",
    "members": [
      {
        "user": "507f1f77bcf86cd799439012",
        "joinedAt": "2024-03-28T10:00:00Z"
      }
    ],
    "color": "#6366f1",
    "inviteCode": "a3b2c1d0-e5f4-4g3h-i2j1-k0l9m8n7o6p5",
    "createdAt": "2024-03-28T10:00:00Z",
    "updatedAt": "2024-03-28T10:00:00Z"
  }
}
```

**Business Rules:**
- Authenticated user required (via middleware)
- Title is required and must not be empty
- Creator becomes owner and first member
- Color is auto-assigned from palette
- Invite code is auto-generated (UUID)

**Error Codes:**
- 400: Title not provided
- 401: No authentication token
- 500: Database error

---

### GET `/api/workspaces/owner`

**Purpose:** Get all workspaces owned by the current user

**Request Headers:**
```
Authorization: Bearer <access-token>
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Workspaces retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "AI Research 2024",
      "color": "#6366f1",
      "memberCount": 3,
      "savedPaperCount": 15,
      "createdAt": "1 week ago"
    }
  ]
}
```

**Business Rules:**
- Only returns workspaces where user is owner
- Includes member count (from aggregation)
- Includes saved paper count
- CreatedAt formatted as relative time ("1 week ago")

**Error Codes:**
- 401: Invalid/expired token
- 500: Database error

---

### GET `/api/workspaces`

**Purpose:** Get all workspaces the user is member of (owned + joined)

**Request Headers:**
```
Authorization: Bearer <access-token>
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "All workspaces retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "AI Research 2024",
      "isOwner": true,
      "color": "#6366f1"
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "title": "Deep Learning Team",
      "isOwner": false,
      "color": "#8b5cf6"
    }
  ]
}
```

**Business Rules:**
- Returns both owned and joined workspaces
- `isOwner` flag indicates ownership status
- Aggregation pipeline handles owner detection
- Minimal data returned (for sidebar/list display)

**Error Codes:**
- 401: Invalid/expired token
- 500: Database error

---

### POST `/api/workspaces/:workspaceId/invite`

**Purpose:** Send invitation to join workspace

**Route Parameters:**
```
workspaceId: ID of workspace to invite user to
```

**Request Body:**
```json
{
  "email": "colleague@example.com"
}
```

**Request Headers:**
```
Authorization: Bearer <access-token>
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Invitation sent successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "email": "colleague@example.com",
    "workspaceId": "507f1f77bcf86cd799439011",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "status": "pending",
    "createdAt": "2024-03-28T10:00:00Z",
    "expiresAt": "2024-04-04T10:00:00Z"
  }
}
```

**Business Rules:**
- Only workspace owner can invite
- Target email must not be already a member
- No pending invitation should exist for that email
- Token is valid for 7 days
- Email is sent with invitation link

**Validation Checks:**
1. Email provided in request
2. Workspace ID provided in URL
3. Workspace exists
4. Requester is workspace owner
5. Email not already a member
6. No pending invitation exists

**Error Codes:**
- 400: Email not provided or already a member
- 403: User is not workspace owner
- 404: Workspace not found
- 409: Pending invitation already exists
- 500: Email sending failed

---

### POST `/api/workspaces/invitations/verify`

**Purpose:** Verify invitation token (shows workspace details)

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Token verified successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "workspaceId": "507f1f77bcf86cd799439011",
    "workspace": {
      "title": "AI Research 2024",
      "color": "#6366f1",
      "memberCount": 3
    },
    "inviterName": "John Doe",
    "status": "pending"
  }
}
```

**Business Rules:**
- Token must not be expired (7-day window)
- Returns workspace details for preview
- Used before user actually accepts invitation

**Error Codes:**
- 400: Token not provided or expired
- 404: Invitation not found
- 500: Database error

---

### POST `/api/workspaces/invitations/accept`

**Purpose:** Accept workspace invitation and join workspace

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Request Headers:**
```
Authorization: Bearer <access-token>
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Invitation accepted successfully",
  "data": {
    "workspaceId": "507f1f77bcf86cd799439011",
    "workspace": {
      "title": "AI Research 2024",
      "color": "#6366f1"
    },
    "joinedAt": "2024-03-28T10:30:00Z"
  }
}
```

**Business Rules:**
- User must be authenticated
- Token must be valid and not expired
- User email must match invitation email
- User is added to workspace members
- Invitation status changed to "accepted"
- User is added to accept timestamp

**Error Codes:**
- 400: Token invalid or expired
- 401: User not authenticated
- 404: Invitation or workspace not found
- 409: User already member of workspace
- 500: Database error

---

## Aggregation Pipelines

### Owner Workspaces Pipeline

**Purpose:** Get detailed workspace list for workspace owner view

**Steps:**
1. Match workspaces where `owner == userId`
2. Lookup user details (owner info)
3. Lookup all member user details
4. Lookup saved papers in workspace
5. Count members and papers
6. Project only needed fields

**Returned Fields:**
- Workspace ID, title, color
- Member list with details
- Member count
- Saved paper count
- Created date

### All Workspaces Pipeline

**Purpose:** Get workspaces for sidebar/list view (owned + joined)

**Steps:**
1. Match workspaces where user is in members OR user is owner
2. Add flag `isOwner` based on owner field
3. Lookup owner details
4. Project minimal fields for UI

**Returned Fields:**
- Workspace ID, title, color
- Owner details
- isOwner flag (true/false)

## Email Notifications

### Invitation Email Template

**Subject:** `Invitation to join {workspaceTitle}`

**HTML Body Contains:**
- Workspace title
- Inviter name
- "Join Workspace" button with token link
- Invitation expiry info (7 days)
- Option to login/signup if needed

**Email Configuration:**
- Service: Nodemailer
- Template: `src/utils/emailTemplates/invitationTemp.js`
- Sent from: Admin email (from config)
- Delivery: After invitation creation
- Retry: On failure, invitation record still valid

## Permission Matrix

| Action | Owner | Member | Non-Member |
|--------|-------|--------|-----------|
| View workspace | ✅ | ✅ | ❌ |
| View members | ✅ | ✅ | ❌ |
| Invite users | ✅ | ❌ | ❌ |
| Remove members | ✅ | ❌ | ❌ |
| Delete workspace | ✅ | ❌ | ❌ |
| Save papers | ✅ | ✅ | ❌ |
| Chat in workspace | ✅ | ✅ | ❌ |
| Create folders | ✅ | ✅ | ❌ |
| Edit folder | Creator | ❌ | ❌ |
| Delete folder | Creator | ❌ | ❌ |

## UI Specifications

### Workspace Dashboard

**Components:**
1. **Workspace List/Sidebar**
   - List of all workspaces (owned + joined)
   - Color-coded workspace icons
   - "New Workspace" button
   - Icon indicating ownership status

2. **Workspace Header**
   - Workspace title
   - Color badge
   - Member count with avatars
   - Settings menu (owner only)
   - Search bar

3. **Workspace Tabs**
   - Papers tab (saved papers list)
   - Folders tab (folder structure)
   - Chat tab (workspace messages)
   - Members tab (member list + invite option)
   - Settings tab (owner only)

### Create Workspace Modal

**Form Fields:**
- Workspace title (text input, required)
- Description (optional textarea)
- Privacy setting (private/public dropdown)
- Color selector (visual palette)

**Actions:**
- Create button
- Cancel button

**Validation:**
- Title required and min 3 characters
- Real-time availability check (if needed)

### Invite Members Modal

**Form Fields:**
- Email input (can be single or comma-separated for bulk)
- Optional message to invitee
- Permission level selector (Member/Editor/etc)

**Actions:**
- Send invite button
- Preview invitees count
- Cancel button

**After Send:**
- Show success message
- Display pending invitations list
- Show "Copy invite link" option (if using invite codes)

### Members List

**For Each Member:**
- User avatar
- User name
- Email
- Join date
- Owner badge (if applicable)
- Actions:
  - Remove button (owner only)
  - Email button

**Pending Invitations Section:**
- Email address
- Sent date
- Expiry countdown
- Resend button
- Cancel invitation button (owner only)

### Folders View

**Tree Structure:**
- Root level folders
- Expandable/collapsible folder items
- Paper count indicator per folder
- Drag-and-drop for organizing

**Actions:**
- New folder button
- Rename folder (creator/owner only)
- Delete folder (creator/owner only, with confirmation)
- Create subfolder
- Move papers into folder

### Settings (Owner Only)

**Sections:**
1. **Workspace Info**
   - Edit title
   - Change color
   - Update description

2. **Danger Zone**
   - Delete workspace button (with confirmation)
   - Leave workspace button (if multi-owner possible)

## Integration Points

1. **User Module**: Member references, invitation emails
2. **Papers Module**: Link saved papers to workspaces
3. **Chat Module**: Workspace-specific messages
4. **Folders Module**: Organization of papers within workspace
5. **Auth Middleware**: User validation on all endpoints
6. **Email Service**: Invitation notifications

## Socket.io Events

**Workspace-Related Events (if implemented):**
```javascript
// User joins workspace
socket.emit("workspace:user-joined", { workspaceId, userId, userName })

// Invitation sent
socket.emit("workspace:invitation-sent", { workspaceId, email })

// Member removed
socket.emit("workspace:member-removed", { workspaceId, userId })

// Workspace updated
socket.emit("workspace:updated", { workspaceId, workspaceData })
```

## State Management Recommendations

**Redux/Context Store:**
```javascript
{
  workspaces: {
    active: Object,           // Currently selected workspace
    owned: Array,             // Owner's workspaces
    joined: Array,            // Joined workspaces
    isLoading: Boolean,
    error: String
  },
  members: {
    list: Array,              // Members of active workspace
    pending: Array,           // Pending invitations
    isLoading: Boolean
  }
}
```

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Email not sent | SMTP misconfigured | Check email service config |
| Invitation expired | 7-day window passed | User must request new invite |
| User can't join workspace | Invitation email mismatch | Ensure signup with same email |
| Duplicate members | Race condition | Use database unique constraint |
| Owner left workspace | No owner assigned | Auto-transfer ownership to oldest member |

## Future Enhancements

- **Granular Permissions**: Editor, Viewer, Admin roles
- **Workspace Visibility**: Private vs Public workspaces
- **Bulk Invitations**: CSV import for team invites
- **Workspace Templates**: Pre-configured folder/paper structures
- **Analytics**: Activity tracking, member engagement
- **Audit Logs**: Track all workspace changes
- **Archive Feature**: Archive old workspaces
- **Merge Workspaces**: Combine multiple workspaces

## Dependencies

- **mongoose**: Database operations (v8.19.2)
- **dayjs**: Date formatting and relative time (v1.11.19)
- **nodemailer**: Email sending (v7.0.10)
- **jsonwebtoken**: Token verification (v9.0.2)

