# Documentation Index

Complete list and guide for all documentation files in the Research Zone Backend project.

## 📚 Documentation Files

### Main Documentation

| File | Purpose | Audience |
|------|---------|----------|
| [README.md](./README.md) | **START HERE** - Project overview, tech stack, directory structure, key concepts | Everyone |
| [API_REFERENCE.md](./API_REFERENCE.md) | Complete API endpoints, data models, request/response formats | Backend developers, API consumers, frontend developers |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, data relationships, flow diagrams, security layers | Architects, senior developers |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | Setup guide, debugging, common issues & solutions, testing | New developers, troubleshooters, QA |

### Core Documentation

| File | Purpose |
|------|---------|
| [AGENT_GUIDELINES.md](./AGENT_GUIDELINES.md) | **READ FIRST** - Coding standards, architecture patterns, best practices for agents |

### Module Documentation

| Module | File | Key Topics |
|--------|------|-----------|
| **Authentication** | [modules/authentication/README.md](./modules/authentication/README.md) | User signup, OTP verification, JWT tokens, multi-provider auth, password hashing, email validation |
| **Workspaces** | [modules/workspaces/README.md](./modules/workspaces/README.md) | Workspace creation, team collaboration, member invitations, permissions |
| **Papers** | [modules/papers/README.md](./modules/papers/README.md) | Paper uploads, AWS S3 storage, metadata, CloudFront delivery, search |
| **Chat** | [modules/chat/README.md](./modules/chat/README.md) | Workspace messaging, real-time Socket.io, reactions, mentions |
| **Paper-Chat** | [modules/paper-chat/README.md](./modules/paper-chat/README.md) | Paper-specific discussions, nested messages, AI summaries |
| **Folders** | [modules/folders/README.md](./modules/folders/README.md) | Paper organization, hierarchical folders, permission controls |
| **Saved Papers** | [modules/saved-papers/README.md](./modules/saved-papers/README.md) | Save papers to workspaces, annotations, highlights, filtering |

## 🎯 Quick Start by Role

### I'm a New Backend Developer

1. Read [README.md](./README.md) - Get project overview
2. Read [DEVELOPMENT.md](./DEVELOPMENT.md) - Setup local environment
3. Read module docs for features you'll work on
4. Reference [API_REFERENCE.md](./API_REFERENCE.md) for data models
5. Consult [DEVELOPMENT.md](./DEVELOPMENT.md#debugging-techniques) for debugging

### I'm Adding a New Feature

1. Check [ARCHITECTURE.md](./ARCHITECTURE.md) - Understand where it fits
2. Review [module documentation](./modules/) for similar features
3. Follow "Adding a New Endpoint" in [DEVELOPMENT.md](./DEVELOPMENT.md#adding-a-new-endpoint)
4. Reference [API_REFERENCE.md](./API_REFERENCE.md) for response format
5. Use [DEVELOPMENT.md](./DEVELOPMENT.md#testing-api-endpoints) for testing

### I'm Debugging an Issue

1. Go to [DEVELOPMENT.md](./DEVELOPMENT.md#common-issues--solutions)
2. Find your issue in the table
3. Follow the debugging section
4. Check [DEVELOPMENT.md](./DEVELOPMENT.md#debugging-techniques) for tools

### I'm Writing Code for Authentication

1. Read [modules/authentication/README.md](./modules/authentication/README.md) completely
2. Understand OTP flow and token lifecycle
3. Check [API_REFERENCE.md](./API_REFERENCE.md) for User model
4. Reference endpoint examples in [modules/authentication/README.md](./modules/authentication/README.md#api-endpoints)

### I'm Writing Code for Workspaces

1. Read [modules/workspaces/README.md](./modules/workspaces/README.md) completely  
2. Understand permission matrix and invitation flow
3. Check [API_REFERENCE.md](./API_REFERENCE.md) for Workspace model
4. Reference aggregation pipelines section
5. Understand [ARCHITECTURE.md](./ARCHITECTURE.md#workspace-member-access) for access control

### I'm an AI/Coding Agent (READ IN THIS ORDER)

1. **MANDATORY FIRST**: [AGENT_GUIDELINES.md](./AGENT_GUIDELINES.md) - Learn coding standards, layer separation, permission checks (~30 min)
2. **Full Context**: [README.md](./README.md) for project overview and key concepts
3. **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md) - Understand system design, relationships, data flow
4. **API Reference**: [API_REFERENCE.md](./API_REFERENCE.md) - All endpoints, data models, error codes
5. **Module-Specific**: Read the complete README for the module(s) you're modifying:
   - [modules/authentication/README.md](./modules/authentication/README.md)
   - [modules/workspaces/README.md](./modules/workspaces/README.md)
   - [modules/papers/README.md](./modules/papers/README.md)
   - [modules/chat/README.md](./modules/chat/README.md)
   - [modules/paper-chat/README.md](./modules/paper-chat/README.md)
   - [modules/folders/README.md](./modules/folders/README.md)
   - [modules/saved-papers/README.md](./modules/saved-papers/README.md)
6. **Setup & Testing**: [DEVELOPMENT.md](./DEVELOPMENT.md) - Environment setup, testing procedures, debugging

## 📖 Documentation Structure

```
docs/
├── README.md                          # Start here - Overview & concepts
├── API_REFERENCE.md                   # API endpoints & data models
├── ARCHITECTURE.md                    # System design & relationships
├── DEVELOPMENT.md                     # Setup, debugging, workflow
├── AGENT_GUIDELINES.md                # MANDATORY - Coding standards & patterns
├── INDEX.md                           # This file
└── modules/
    ├── authentication/
    │   └── README.md                  # User auth, OTP, JWT, multi-provider
    ├── workspaces/
    │   └── README.md                  # Workspace creation, teams, permissions
    ├── papers/
    │   └── README.md                  # Paper uploads, S3, metadata, search
    ├── chat/
    │   └── README.md                  # Real-time workspace messaging, Socket.io
    ├── paper-chat/
    │   └── README.md                  # Paper discussions, nested messages
    ├── folders/
    │   └── README.md                  # Paper organization, hierarchies
    └── saved-papers/
        └── README.md                  # User annotations, highlights, filtering
```

## 🔍 Search Guide

### Looking for...

| What | Where |
|------|-------|
| How to setup development environment | [DEVELOPMENT.md - Local Development Setup](./DEVELOPMENT.md#local-development-setup) |
| User database schema | [API_REFERENCE.md - User Model](./API_REFERENCE.md#user-model) |
| Signup flow | [modules/authentication/README.md - User Registration Flow](./modules/authentication/README.md#user-registration-flow) |
| All endpoints list | [API_REFERENCE.md - API Endpoint Summary](./API_REFERENCE.md#api-endpoint-summary) |
| Permission checks | [modules/workspaces/README.md - Permission Matrix](./modules/workspaces/README.md#permission-matrix) |
| Error codes | [API_REFERENCE.md - Error Code Reference](./API_REFERENCE.md#error-code-reference) |
| How requests flow through system | [ARCHITECTURE.md - Request/Response Flow](./ARCHITECTURE.md#requestresponse-flow) |
| Paper upload process | [modules/papers/README.md - Paper Upload Flow](./modules/papers/README.md#paper-upload-flow) |
| S3 and CloudFront setup | [modules/papers/README.md - AWS Integration](./modules/papers/README.md#aws-integration) |
| Real-time messaging | [modules/chat/README.md - Socket.io Integration](./modules/chat/README.md#real-time-socket-io-integration) |
| Paper discussions/threading | [modules/paper-chat/README.md - Conversation Model](./modules/paper-chat/README.md#conversation-model--data-structure) |
| Paper organization | [modules/folders/README.md - Folder Hierarchy](./modules/folders/README.md#folder-hierarchy) |
| Saving papers and annotations | [modules/saved-papers/README.md - Denormalization Strategy](./modules/saved-papers/README.md#denormalization-strategy) |
| Database indexing strategy | [ARCHITECTURE.md - Optimization Opportunities](./ARCHITECTURE.md#optimization-opportunities) |
| How to test an endpoint | [DEVELOPMENT.md - Testing API Endpoints](./DEVELOPMENT.md#testing-api-endpoints) |
| OTP debugging | [DEVELOPMENT.md - OTP Not Received](./DEVELOPMENT.md#issue-otp-not-received) |
| Permission bypass issues | [DEVELOPMENT.md - User Can Access Others Workspaces](./DEVELOPMENT.md#issue-user-can-access-others-workspaces) |
| BaseRepository methods | [ARCHITECTURE.md - Database Query Patterns](./ARCHITECTURE.md#database-query-patterns) |
| Coding standards | [AGENT_GUIDELINES.md - Mandatory Standards](./AGENT_GUIDELINES.md) |
| Common mistakes | [AGENT_GUIDELINES.md - Anti-Patterns](./AGENT_GUIDELINES.md#anti-patterns-what-not-to-do) |
| Adding pagination | [DEVELOPMENT.md - Adding Pagination](./DEVELOPMENT.md#adding-pagination) |

## 📋 Key Concepts by Topic

### Authentication & Security

**Read:**
- [modules/authentication/README.md](./modules/authentication/README.md) - Complete auth system
- [ARCHITECTURE.md - Security Layers](./ARCHITECTURE.md#security-layers)
- [DEVELOPMENT.md - Debugging Auth Issues](./DEVELOPMENT.md#issue-user-can-access-others-workspaces)

**Key files:** `src/modules/users/`, `src/middlewares/authMiddleware.js`

### Database & Models

**Read:**
- [API_REFERENCE.md - Data Models](./API_REFERENCE.md#data-models)
- [ARCHITECTURE.md - Entity Relationship Diagram](./ARCHITECTURE.md#entity-relationship-diagram)
- [ARCHITECTURE.md - Database Query Patterns](./ARCHITECTURE.md#database-query-patterns)

**Key files:** `src/modules/*/model.js`, `src/utils/baseRepository.js`

### API Design & Responses

**Read:**
- [API_REFERENCE.md - Global Response Format](./API_REFERENCE.md#global-response-format)
- [API_REFERENCE.md - API Endpoint Summary](./API_REFERENCE.md#api-endpoint-summary)
- [modules/authentication/README.md - API Endpoints](./modules/authentication/README.md#api-endpoints)

**Key files:** `src/modules/*/routes.js`, `src/utils/apiResponse.js`

### Error Handling

**Read:**
- [API_REFERENCE.md - Error Codes](./API_REFERENCE.md#error-code-reference)
- [modules/authentication/README.md - Error Handling](./modules/authentication/README.md#error-handling)
- [DEVELOPMENT.md - Common Issues](./DEVELOPMENT.md#common-issues--solutions)

**Key files:** `src/utils/apiError.js`, `src/constants/messages.js`

### Email & Notifications

**Read:**
- [modules/authentication/README.md - Email Validation](./modules/authentication/README.md#email-validation--retry)
- [modules/workspaces/README.md - Email Notifications](./modules/workspaces/README.md#email-notifications)
- [DEVELOPMENT.md - Email Testing](./DEVELOPMENT.md#email-testing)

**Key files:** `src/utils/sendMail.js`, `src/utils/emailTemplates/`

### Real-time Features

**Read:**
- [modules/chat/README.md](./modules/chat/README.md) - Workspace messaging
- [modules/paper-chat/README.md](./modules/paper-chat/README.md) - Paper discussions
- [ARCHITECTURE.md - Scalability](./ARCHITECTURE.md#scalability-considerations)

**Key files:** `src/config/socketConfig.js`, `src/middlewares/socketAuthMiddleware.js`

### Permissions & Access Control

**Read:**
- [modules/workspaces/README.md - Permissions](./modules/workspaces/README.md#permission-matrix)
- [ARCHITECTURE.md - Workspace Member Access](./ARCHITECTURE.md#workspace-member-access)

**Key pattern:** Check owner/member status before allowing operations

### Paper Management

**Read:**
- [modules/papers/README.md](./modules/papers/README.md) - Paper uploads, metadata, search
- [modules/folders/README.md](./modules/folders/README.md) - Paper organization
- [modules/saved-papers/README.md](./modules/saved-papers/README.md) - User annotations

**Key files:** `src/modules/papers/`, `src/modules/workspaces/folders/`, `src/modules/workspaces/saved-papers/`

### File Storage & CloudFront

**Read:**
- [modules/papers/README.md - AWS Integration](./modules/papers/README.md#aws-integration)
- [modules/papers/README.md - File Upload](./modules/papers/README.md#file-upload--s3-management)
- [DEVELOPMENT.md - AWS Configuration](./DEVELOPMENT.md#aws-configuration)

**Key files:** `src/modules/papers/service.js`, `src/utils/cloudFrontSigner.js`

### Messaging & Collaboration

**Read:**
- [modules/chat/README.md](./modules/chat/README.md) - Real-time messaging
- [modules/paper-chat/README.md](./modules/paper-chat/README.md) - Paper discussions
- [modules/chat/README.md - Message Types](./modules/chat/README.md#message-types)

**Key files:** `src/modules/chat/`, `src/modules/paper-chat/`

## 🛠️ Development Workflows

### Feature: Adding Email to OTP

1. Read [modules/authentication/README.md - OTP Verification](./modules/authentication/README.md#otp-verification)
2. Check email service setup in [DEVELOPMENT.md - Environment Variables](./DEVELOPMENT.md#environment-variables)
3. Follow email testing section in [DEVELOPMENT.md - Email Testing](./DEVELOPMENT.md#email-testing)
4. Implement in `src/modules/users/services.js`
5. Test using `.http` files from `/api_testing`

### Feature: Adding New Workspace Permission Level

1. Read [modules/workspaces/README.md - Permission Matrix](./modules/workspaces/README.md#permission-matrix)
2. Add role to database schema
3. Create permission check function
4. Apply to endpoints using the check
5. Document new permissions in role table

### Task: Debugging User Can't Save Paper

1. Go to [DEVELOPMENT.md - Issue: User Can Access Others' Workspaces](./DEVELOPMENT.md#issue-user-can-access-others-workspaces)
2. Verify auth middleware is applied
3. Check permission logic
4. Add console logging
5. Trace through [ARCHITECTURE.md - Workspace Member Access](./ARCHITECTURE.md#workspace-member-access)

## ✅ Documentation Checklist

### For Each Endpoint Added

- [ ] Document endpoint in module's README
- [ ] Add to [API_REFERENCE.md](./API_REFERENCE.md#api-endpoint-summary)
- [ ] Add error cases with codes
- [ ] Include request/response examples
- [ ] Document permission requirements
- [ ] Add business rule explanations

### For Each Data Model Added

- [ ] Schema documented in [API_REFERENCE.md](./API_REFERENCE.md#data-models)
- [ ] Relationships shown in [ARCHITECTURE.md](./ARCHITECTURE.md#entity-relationship-diagram)
- [ ] Indexes documented
- [ ] TTL if applicable

### For Each Feature Added

- [ ] Module documentation updated
- [ ] Flow diagram added if complex
- [ ] Integration points listed
- [ ] Migration guide if DB changes
- [ ] UI specs if applicable

## 📖 How to Update Documentation

### When Adding a Feature

1. Update relevant module README
2. Add endpoint to API_REFERENCE
3. Add data model if needed
4. Update architecture diagram
5. Add testing info to DEVELOPMENT.md
6. Update this index if needed

### When Fixing a Bug

1. Add to Common Issues in DEVELOPMENT.md
2. Include debugging steps
3. Include solution

### When Refactoring Code

1. Update architecture documentation
2. If changing data flow, update diagrams
3. Update code examples in docs

## 🔗 Important Files Reference

### Authentication System

- `src/modules/users/controller.js` - Auth endpoints
- `src/modules/users/services.js` - OTP logic, token generation
- `src/modules/users/model.js` - User schema
- `src/middlewares/authMiddleware.js` - JWT verification
- `src/utils/generateJWT.js` - Token creation
- `src/utils/generateOtp.js` - OTP generation
- `src/utils/sendMail.js` - Email service

### Workspace System

- `src/modules/workspaces/controller.js` - Workspace endpoints
- `src/modules/workspaces/services.js` - Workspace logic
- `src/modules/workspaces/model.js` - Workspace schema
- `src/modules/workspaces/invitationModel.js` - Invitation schema
- `src/aggregations/workspaces/pipelines.js` - Complex queries

### Paper Management

- `src/modules/papers/controller.js` - Paper endpoints
- `src/modules/papers/service.js` - Paper upload, search, metadata
- `src/modules/papers/model.js` - Paper schema

### Paper Organization

- `src/modules/workspaces/folders/controller.js` - Folder endpoints
- `src/modules/workspaces/folders/model.js` - Folder schema
- `src/modules/workspaces/folders/services.js` - Folder logic

### User Annotations

- `src/modules/workspaces/saved-papers/controller.js` - Save endpoints
- `src/modules/workspaces/saved-papers/model.js` - SavedPaper schema
- `src/modules/workspaces/saved-papers/services.js` - Annotation logic

### Messaging

- `src/modules/chat/controller.js` - Chat endpoints
- `src/modules/chat/model.js` - Message schema
- `src/modules/chat/services.js` - Message logic
- `src/modules/chat/socketHandler.js` - Socket.io events
- `src/aggregations/chat/pipelines.js` - Complex queries

### Paper Discussions

- `src/modules/paper-chat/controller.js` - Paper chat endpoints
- `src/modules/paper-chat/model.js` - Conversation model
- `src/modules/paper-chat/services.js` - Discussion logic
- `src/modules/paper-chat/conversationModel.js` - Nested message structure

### Base Architecture

- `src/utils/baseRepository.js` - DB abstraction layer
- `src/utils/apiResponse.js` - Response formatting
- `src/utils/apiError.js` - Error handling
- `src/utils/cloudFrontSigner.js` - CloudFront URL signing
- `src/constants/messages.js` - Error/success messages
- `src/constants/config.js` - Configuration

---

## 📞 Getting Help

1. **For setup issues**: See [DEVELOPMENT.md - Local Development Setup](./DEVELOPMENT.md#local-development-setup)
2. **For API questions**: Check [API_REFERENCE.md](./API_REFERENCE.md)
3. **For logic questions**: Read the relevant module documentation
4. **For debugging**: Follow [DEVELOPMENT.md - Debugging Techniques](./DEVELOPMENT.md#debugging-techniques)
5. **For architecture questions**: Review [ARCHITECTURE.md](./ARCHITECTURE.md)

---

**Document Version**: 2.0.0
**Last Updated**: December 2024
**Total Pages**: 4 main docs + 1 guidelines doc + 7 module docs + 1 index

---

## 📝 Quick Health Check

Use this to check if documentation is complete:

- [ ] README.md contains overview and tech stack
- [ ] API_REFERENCE.md has all endpoints documented
- [ ] Each module has complete README
- [ ] ARCHITECTURE.md has diagrams and flows
- [ ] DEVELOPMENT.md has setup and debugging
- [ ] All data models documented
- [ ] All error codes listed
- [ ] All permissions documented
- [ ] Integration points clear
- [ ] Testing procedures documented

**Note**: As the project evolves, keep documentation in sync with code changes!

