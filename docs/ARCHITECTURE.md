# Architecture & Data Relationships

## Entity Relationship Diagram

```mermaid
flowchart TD
   U[User]
   W[Workspace]
   P[Paper]
   SP[SavedPaper]
   F[Folder]
   M[Message Chat]
   WI[WorkspaceInvitation]
   PC[PaperChat Conversation]

   U -->|owns| W
   U -->|saves| SP
   U -->|sends| M
   W -->|contains members| U
   W -->|contains folders| F
   W -->|contains messages| M
   W -->|contains saved papers| SP
   P -->|linked to| SP
   F -->|organizes| SP
   F -->|belongs to workspace| W
   WI -->|invites user to workspace| W
   WI -->|invited user email| U
   PC -->|for workspace| W
   PC -->|for paper| P
```

## Relationship Types

### 1:N (One-to-Many) Relationships

| Parent    | Child      | Field                    | Notes                                   |
| --------- | ---------- | ------------------------ | --------------------------------------- |
| User      | Workspace  | `workspace.owner`        | 1 user owns many workspaces             |
| User      | Message    | `message.sender`         | 1 user sends many messages              |
| User      | SavedPaper | `savedpaper.savedBy`     | 1 user saves many papers                |
| Workspace | Message    | `message.workspaceId`    | 1 workspace has many messages           |
| Workspace | SavedPaper | `savedpaper.workspaceId` | 1 workspace has many saved papers       |
| Workspace | Folder     | `folder.workspaceId`     | 1 workspace has many folders            |
| Workspace | Member     | `workspace.members[]`    | 1 workspace has many members            |
| Paper     | SavedPaper | `savedpaper.paperId`     | 1 paper can be saved in many workspaces |
| Folder    | SavedPaper | `savedpaper.folderId`    | 1 folder contains many papers           |

### M:N (Many-to-Many) Relationships

| Entity 1  | Entity 2     | Through                | Type                                      |
| --------- | ------------ | ---------------------- | ----------------------------------------- |
| Workspace | User         | `workspace.members[]`  | Members can belong to multiple workspaces |
| User      | AuthProvider | `user.authProviders[]` | Users can have multiple auth methods      |

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

```mermaid
sequenceDiagram
   participant C as Client
   participant S as Server
   participant D as Database

   C->>S: POST /signup (email, password, name)
   S->>S: Validate input
   S->>S: Generate OTP and hash password
   S->>D: Create/Update user
   S->>S: Send OTP email
   S-->>C: Return signup token (20 min)

   C->>S: POST /verify-otp (otp + signup-token)
   S->>S: Verify OTP and expiry
   S->>D: Set isVerified true
   S->>S: Generate access and refresh tokens
   S->>S: Create personal workspace
   S-->>C: Return user profile + access token + refresh cookie
```

### Workspace Invitation System

```mermaid
sequenceDiagram
   participant O as Owner
   participant S as Server
   participant I as Invitee
   participant D as Database

   O->>S: POST /invite {email}
   S->>S: Verify owner and check duplicates
   S->>D: Create invitation with token
   S-->>I: Send invitation email link
   S-->>O: Invitation sent success

   I->>S: GET /invitations/verify {token}
   S->>S: Verify token
   S-->>I: Return workspace preview

   I->>S: POST /invitations/accept {token}
   S->>S: Verify token and auth
   S->>D: Add user to workspace members
   S->>D: Update invitation status accepted
   S-->>I: Return workspace details
```

### Workspace Member Access

```mermaid
flowchart TD
   A[Endpoint request with auth token] --> B[Permission check]
   B --> C{Is owner}
   C -->|Yes| D[Allow owner actions]
   C -->|No| E{Is in workspace members}
   E -->|Yes| F[Allow member actions]
   E -->|No| G[Deny access or redirect]

   D --> D1[Invite or remove members]
   D --> D2[Delete workspace]
   D --> D3[Create folders save papers chat]

   F --> F1[View workspace]
   F --> F2[Save and organize papers]
   F --> F3[Create folders and chat]

   G --> G1[Can verify invitation token]
   G --> G2[Can join if invited]
```

## Data State Transitions

### User State Diagram

```mermaid
flowchart TD
  A[Created user isVerified false] --> B[POST verify-otp with valid OTP]
  B --> C[Verified user isVerified true]
  C --> D[Refresh token stored]
  D --> E[User can access app features and workspaces and chat]
```

### Workspace Invitation State Diagram

```mermaid
flowchart TD
   A[Pending invitation invited expires in 7 days] -->|Accept| B[Accepted]
   A -->|Expire auto| C[Expired invalid]
   B --> D[Workspace member]
```

### Workspace Operation Permissions

```mermaid
flowchart TD
  A[Workspace operation] --> B[Owner only actions]
  A --> C[Member allowed actions]

  B --> B1[Invite and remove members]
  B --> B2[Transfer ownership]
  B --> B3[Delete workspace edit name color roles archive]

  C --> C1[View workspace]
  C --> C2[Save papers and chat]
  C --> C3[Create folders and edit own papers]
```

## Request/Response Flow

### Typical Protected Endpoint Flow

```mermaid
flowchart TD
  A[Client request with headers body params] --> B[Router matches endpoint]
  B --> C[Middleware checkAccessToken]
  C --> D[Controller validates input and calls service]
  D --> E[Service checks permissions and business rules]
  E --> F[BaseRepository executes database operation]
  F --> G[Service formats result or throws]
  G --> H[Controller formats API response]
  H --> I[Response status body cookies sent to client]
  I --> J[Client stores tokens updates UI handles errors]
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
await userDb.updateOne({ _id: userId }, { $set: { isVerified: true } });

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
await Model.updateMany({ condition }, { $set: { field: value } });

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

```mermaid
flowchart TD
  A[Error occurs in service or controller] --> B[ApiError instance]
  B --> C[Message statusCode errorCode]
  C --> D[Controller catches and formats error response]
  D --> E[Global error handler if bubbled]
  E --> F[Client receives error response]
  F --> G[Frontend shows message suggests action logs monitoring]
```

## Security Layers

```mermaid
flowchart TD
   A[Incoming request] --> B[CORS validation check origin]
   B --> C[Body parser size limits and JSON parse]
   C --> D[Auth middleware verify JWT expiry extract user]
   D --> E[Input validation schema type and XSS checks]
   E --> F[Business logic permission and ownership checks]
   F --> G[Database operations with sanitized queries]
   G --> H[Secure response HTTPS headers HTTP-only cookies]
```

---

**Architecture Version**: 1.0.0
**Last Updated**: March 28, 2024
