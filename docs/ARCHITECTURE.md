# Architecture & Data Relationships

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         SYSTEM ENTITIES                         │
└─────────────────────────────────────────────────────────────────┘

                          ┌──────────────┐
                          │    User      │
                          ├──────────────┤
                          │ - email      │
                          │ - firstName  │
                          │ - username   │
                          │ - passwordHash
                          │ - isVerified │
                          │ - otp        │
                          │ - authProviders
                          │ - refreshToken
                          │ - profilePicture
                          └──────────────┘
                              △   │
                            1 │   │ *
   ┌──────────────────────────┴───┴──────────────────────────┐
   │                                                          │
   │                        owns/manages                      │
   │                                                          │
   ▼                                                          ▼
┌──────────────────┐                                    ┌──────────────────┐
│   Workspace      │                                    │  SavedPaper      │
├──────────────────┤     saved into                    ├──────────────────┤
│ - title          │◄──────────────────┐              │ - paperId        │
│ - owner *        │◄┐                 │              │ - workspaceId    │
│ - members[] *    │ │ belongsTo       │              │ - folderId       │
│ - color          │ │                 │              │ - savedBy        │
│ - inviteCode     │ │                 │              │ - notes          │
│ - createdAt      │ │                 │              │ - tags           │
│ - updatedAt      │ │         ┌───────┴──────────┐   │ - savedAt        │
└──────────────────┘ │         │                  │   │ - updatedAt      │
        │            │         │    Paper         │   └──────────────────┘
        │            │         │                  │
        │contains    │         └──────────────────┘
        │            │              △
        │            └──── linked to ┘
        │
        │ contains
        │
        ▼
    ┌──────────────┐
    │   Folder     │        ┌──────────────────┐
    ├──────────────┤        │  Message (Chat)  │
    │ - name       │        ├──────────────────┤
    │ - workspaceId├───────►│ - workspaceId    │
    │ - parentFolder         │ - sender         │
    │ - createdBy  │        │ - content        │
    │ - createdAt  │        │ - reactions      │
    └──────────────┘        │ - createdAt      │
           │ organizes       │ - updatedAt      │
           │                 └──────────────────┘
           │
           ▼
    ┌──────────────┐
    │ SavedPaper   │
    │  (organized) │
    └──────────────┘

                    ┌───────────────────────┐
                    │WorkspaceInvitation    │
                    ├───────────────────────┤
                    │ - email               │
                    │ - workspaceId         │
                    │ - inviterId           │
                    │ - token               │
                    │ - status              │
                    │ - expiresAt           │
                    │ - acceptedAt          │
                    └───────────────────────┘

    ┌──────────────────────┐
    │  PaperChat/          │
    │  Conversation        │
    ├──────────────────────┤
    │ - paperId            │
    │ - workspaceId        │
    │ - messages[] (nested)│
    │ - summaries          │
    │ - createdAt          │
    └──────────────────────┘
```

## Relationship Types

### 1:N (One-to-Many) Relationships

| Parent | Child | Field | Notes |
|--------|-------|-------|-------|
| User | Workspace | `workspace.owner` | 1 user owns many workspaces |
| User | Message | `message.sender` | 1 user sends many messages |
| User | SavedPaper | `savedpaper.savedBy` | 1 user saves many papers |
| Workspace | Message | `message.workspaceId` | 1 workspace has many messages |
| Workspace | SavedPaper | `savedpaper.workspaceId` | 1 workspace has many saved papers |
| Workspace | Folder | `folder.workspaceId` | 1 workspace has many folders |
| Workspace | Member | `workspace.members[]` | 1 workspace has many members |
| Paper | SavedPaper | `savedpaper.paperId` | 1 paper can be saved in many workspaces |
| Folder | SavedPaper | `savedpaper.folderId` | 1 folder contains many papers |

### M:N (Many-to-Many) Relationships

| Entity 1 | Entity 2 | Through | Type |
|----------|----------|---------|------|
| Workspace | User | `workspace.members[]` | Members can belong to multiple workspaces |
| User | AuthProvider | `user.authProviders[]` | Users can have multiple auth methods |

### Nested/Embedded Relationships

```javascript
// Workspace members embedeed in workspace document
workspace.members = [
  { user: ObjectId, joinedAt: Date },
  { user: ObjectId, joinedAt: Date }
]

// Chat reactions embedded in message
message.reactions = [
  { emoji: "👍", users: [ObjectId, ObjectId] },
  { emoji: "😂", users: [ObjectId] }
]

// Paper chat messages embedded in conversation
conversation.messages = [
  { sender: ObjectId, content: String, reactions: [], createdAt: Date },
  ...
]
```

## Data Flow Architecture

### Authentication System

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                      │
└─────────────────────────────────────────────────────────────┘

CLIENT                          SERVER                    DATABASE
   │                               │                           │
   ├─ POST /signup ─────────────►  │                           │
   │  (email, password, name)      ├─ Validate input           │
   │                               │                           │
   │                               ├─ Generate OTP             │
   │                               ├─ Hash password            │
   │                               ├─ Create/Update User ──────►│
   │                               │                    Create  │
   │                               ├─ Send email (OTP)         │
   │                               │                           │
   │  ◄─ Return signup-token ──────┤                           │
   │  (valid 20 min)               │                           │
   │                               │                           │
   │ [User enters OTP]             │                           │
   │                               │                           │
   ├─ POST /verify-otp ────────►   │                           │
   │  (otp)                       ├─ Verify OTP               │
   │  Header: signup-token        ├─ Check expiry             │
   │                              ├─ Set isVerified=true ─────►│
   │                              ├─ Generate tokens          │
   │                              ├─ Create personal workspace │
   │                              │                           │
   │  ◄─ Return ─────────────────  │                           │
   │  - accessToken               │                           │
   │  - refreshToken (cookie)     │                           │
   │  - user profile              │                           │
   │                              │                           │
   │ [Save tokens]                │                           │
   │ [Authenticated]              │                           │
```

### Workspace Invitation System

```
┌──────────────────────────────────────────────────────────────┐
│              WORKSPACE INVITATION FLOW                      │
└──────────────────────────────────────────────────────────────┘

OWNER                    SERVER                INVITEE          DB
   │                        │                    │              │
   ├─ POST /invite ────────►│                    │              │
   │  {email}               ├─ Verify owner      │              │
   │                        ├─ Check duplicates  │              │
   │                        ├─ Create invitation────────────────►│
   │                        ├─ Generate token    │              │
   │                        ├─ Send email ──────────────────────►│
   │                        │  (with invite link)INVITEE        │
   │  ◄─ Success ───────────┤                    │              │
   │                        │                  Clicks link      │
   │                        │                    │              │
   │                        │◄─ GET /invitations/verify ┐       │
   │                        │  {token}          │       │       │
   │                        ├─ Verify token    │       │       │
   │                        │ ─────────────────────────►│       │
   │                        │  Returns workspace info   │       │
   │                        │                  │       │       │
   │                        │ Shows preview   │       │       │
   │                        │                  │       │       │
   │                        │◄─ POST /invitations/accept       │
   │                        │  {token}          │              │
   │                        ├─ Verify token    │              │
   │                        ├─ Check auth      │              │
   │                        ├─ Add to members ────────────────►│
   │                        ├─ Update invitation status        │
   │                        │  ─────────────────────────►      │
   │                        │  (accepted, acceptedAt)          │
   │  ◄─ Accept confirmed ──┤                    │              │
   │                        ├─ Return workspace details        │
   │                        │                    │              │
   │                        │                  [User added]    │
   │                        │                    │              │
   │ [Workspace updated]    │                    │              │
```

### Workspace Member Access

```
┌─────────────────────────────────────────────────────────────┐
│         WORKSPACE MEMBER ACCESS CONTROL                     │
└─────────────────────────────────────────────────────────────┘

Endpoint Request with Auth Token
         │
         ▼
┌─────────────────────▐
│  Permission Check   │
└─────────────────────┘
         │
     ┌───┴───┐
     │       │
     ▼       ▼
IS_OWNER  IN_MEMBERS
     │       │
     │       ├─► Check workspace.members[]
     │       │   Contains current user?
     │       │
     │       ▼
     │   ┌──────────────┐
     │   │ YES allowed │
     │   └──────────────┘
     │       │
     │       ▼
     ▼   Check action
Can modify: fields
- Can invite/remove members
- Can delete workspace
- Can create folders
- Can save papers
- Can chat

Regular member can:
- View workspace content
- Save papers
- Create folders
- Organize papers
- Participate in chat

Non-member:
- Denied access
- Redirect to login or
- If invited:
  - Can verify token
  - Can join workspace
```

## Data State Transitions

### User State Diagram

```
         ┌─────────────┐
         │   CREATED   │
         │isVerified:  │
         │   false     │
         └─────────────┘
                │
      POST /verify-otp
         with valid OTP
                │
                ▼
         ┌─────────────┐
         │  VERIFIED   │
         │isVerified:  │
         │   true      │
         │ refreshToken│
         │   stored    │
         └─────────────┘
                │
         Can use app features
         Can access workspaces
         Can chat
         Tokens can refresh
```

### Workspace Invitation State Diagram

```
         ┌─────────────┐
         │   PENDING   │
         │ (invited)   │
         │expiresAt:   │
         │7 days later │
         └─────────────┘
            │       │
      ACCEPT │       │ EXPIRE
            │       │ (auto)
            ▼       ▼
      ┌──────┐  ┌─────────┐
      │ACCEPT│  │ EXPIRED │
      │      │  │(invalid)│
      └──────┘  └─────────┘
        │
        ▼
    ┌──────────┐
    │WORKSPACE │
    │ MEMBER   │
    └──────────┘
```

### Workspace Operation Permissions

```
                    ┌─────────────────┐
                    │  Workspace Op   │
                    └─────────────────┘
                            │
                    ┌───────┴────────┐
                    │                │
            OWNER_ONLY          MEMBER_OK
                    │                │
        ┌───────────┴──────────┐     │
        │                      │     │
        ▼                      ▼     ▼
   - Invite            - Delete WS - View
   - Remove            - Edit name - Save papers
   - Transfer          - Change color - Chat
     ownership         - Manage roles - Create folders
                       - Archive     - Edit own papers
```

## Request/Response Flow

### Typical Protected Endpoint Flow

```
1. Client sends Request
   ├─ Headers: { Authorization: "Bearer <token>" }
   ├─ Body: { data }
   └─ Params: { id }

2. Router matches endpoint
   └─ Calls middleware chain

3. Middleware: checkAccessToken
   ├─ Extract token from header
   ├─ Verify JWT signature
   ├─ Decode token
   ├─ Check expiry
   └─ Set req.user = decoded payload

4. Controller executes
   ├─ Validate request body
   ├─ Call service method
   └─ Pass req.user to service

5. Service layer executes
   ├─ Check permissions (req.user)
   ├─ Validate business rules
   ├─ Call database methods
   └─ Return result/throw error

6. BaseRepository queries MongoDB
   ├─ Execute CRUD operation
   ├─ Return result/throw error
   └─ Response to service

7. Service processes result
   ├─ Format response
   ├─ Catch errors
   └─ Return to controller

8. Controller handles response
   ├─ Format API response
   ├─ Set HTTP status
   └─ Send to client

9. Response sent to Client
   ├─ Status code
   ├─ Body: { success, message, data }
   └─ Cookies (if applicable)

10. Client handles response
    ├─ Store tokens if present
    ├─ Update UI state
    └─ Handle errors if any
```

## Database Query Patterns

### Simple CRUD Operations

```javascript
// Create
const user = await userDb.create({
  email: "user@example.com",
  firstName: "John",
  // ...
});

// Read
const user = await userDb.findOne({ email });
const user = await userDb.findById(userId);

// Update
await userDb.updateOne(
  { _id: userId },
  { $set: { isVerified: true } }
);

// Delete
await userDb.deleteOne({ _id: userId });
```

### Complex Queries with Aggregation

```javascript
// Get owner workspaces with member count
const pipeline = buildOwnerWorkspacesPipeline(userId);
const workspaces = await workspaceDb.aggregate(pipeline);

// Pipeline steps:
// 1. $match: Filter workspaces by owner
// 2. $lookup: Join with User collection for member details
// 3. $group: Count members and papers
// 4. $project: Select fields for response
```

### Bulk Operations

```javascript
// Update multiple documents
await Model.updateMany(
  { condition },
  { $set: { field: value } }
);

// Delete multiple
await Model.deleteMany({ condition });
```

### Transaction Example (if needed)

```javascript
// For multi-document transactions
const session = await mongoose.startSession();
session.startTransaction();

try {
  await User.create([userData], { session });
  await Workspace.create([wsData], { session });
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

## Caching Strategy

**No caching currently implemented, but recommended for:**

1. **User Profile** (refresh on logout)
   ```javascript
   // Cache: user_{id}
   // TTL: 1 hour or refresh on changes
   ```

2. **Workspace List** (refresh on workspace changes)
   ```javascript
   // Cache: ws_list_{userId}
   // TTL: 5 minutes or invalidate on ops
   ```

3. **Member List** (refresh on invite/remove)
   ```javascript
   // Cache: ws_{wsId}_members
   // TTL: 10 minutes or invalidate
   ```

4. **Invitation** (valid until expiry)
   ```javascript
   // Cache: invitation_{token}
   // TTL: until expiry date
   ```

## Scalability Considerations

### Current Bottlenecks

1. **N+1 queries**: Aggregation adds lookups
   - Solution: Already using aggregation pipelines

2. **Embedded members array**
   - Solution: OK for small teams, consider sharding at scale

3. **Single MongoDB replica**
   - Solution: Implement replica sets for high availability

### Optimization Opportunities

1. **Redis caching layer**
   ```javascript
   // Cache tokens, user profiles, workspace lists
   ```

2. **Database sharding**
   ```javascript
   // Shard by workspaceId for saved papers
   ```

3. **Pagination**
   ```javascript
   // Implement limit/offset for large datasets
   ```

4. **Indexing strategy**
   ```javascript
   // Add compound indexes for common queries
   // e.g., { workspaceId: 1, createdAt: -1 }
   ```

## Error Handling Flow

```
Error occurs in Service/Controller
         │
         ▼
    ApiError instance
         │
    Custom message
    statusCode (4xx/5xx)
    errorCode (for frontend)
         │
         ▼
    Controller catches
         │
    Formats response:
    {
      success: false,
      message: "...",
      statusCode,
      code
    }
         │
         ▼
    Global error handler
    (if it bubbles up)
         │
         ▼
    Client receives
    error response
         │
         ▼
    Frontend handles:
    - Shows error message
    - Suggests action
    - Logs to monitoring
```

## Security Layers

```
┌────────────────────────────────────────┐
│     Incoming Request                   │
├────────────────────────────────────────┤
│                                        │
│ 1. CORS Validation                     │
│    └─ Check origin                     │
│                                        │
│ 2. Body Parser                         │
│    └─ Limit size, parse JSON           │
│                                        │
│ 3. Auth Middleware                     │
│    └─ Verify JWT signature             │
│    └─ Check expiry                     │
│    └─ Extract user                     │
│                                        │
│ 4. Input Validation                    │
│    └─ Schema validation (Zod)          │
│    └─ Type checking                    │
│    └─ XSS prevention                   │
│                                        │
│ 5. Business Logic                      │
│    └─ Permission checks                │
│    └─ Rate limiting (if needed)        │
│    └─ Resource ownership               │
│                                        │
│ 6. Database Operations                 │
│    └─ Parameterized queries (Mongoose) │
│    └─ SQL injection prevention         │
│    └─ Data sanitization                │
│                                        │
│ 7. Response                            │
│    └─ HTTPS only (production)          │
│    └─ Security headers                 │
│    └─ HTTP-only cookies                │
│                                        │
└────────────────────────────────────────┘
```

---

**Architecture Version**: 1.0.0
**Last Updated**: March 28, 2024

