# Development Guide & Troubleshooting

Quick reference for common development tasks, debugging, and troubleshooting.

## Local Development Setup

### Prerequisites

- Node.js v16+ (check with `node -v`)
- MongoDB running locally or connection string available
- Environment variables configured (.env file)

### Installation & Startup

```bash
# Install dependencies
npm install

# Start development server (with auto-reload)
npm run dev

# Server runs on http://localhost:5000
```

### Environment Variables

Create `.env` file in project root:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/research-zone

# Server
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-key-min-32-chars
ACCESS_TOKEN_EXPIRY=20m
REFRESH_TOKEN_EXPIRY=7d

# Email Service
MAIL_SERVICE_ADDRESS=smtp.gmail.com
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-gmail-app-password
MAIL_FROM_NAME=Research Zone

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-id
GITHUB_CLIENT_SECRET=your-github-secret

# AWS Configuration
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_S3_BUCKET=your-bucket-name
CLOUDFRONT_DOMAIN=d123abcd.cloudfront.net
CLOUDFRONT_KEY_PAIR_ID=your-cloudfront-key-id
CLOUDFRONT_PRIVATE_KEY=/path/to/private.key

# Optional
DEBUG=research-zone:*
```

### Obtaining Required Credentials

#### Google OAuth

1. Visit [Google Cloud Console](https://console.cloud.google.com)
2. Create new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add `http://localhost:3000` to authorized redirects
6. Copy Client ID and Secret

#### Gmail SMTP (for email)

1. Enable 2-factor authentication on Gmail account
2. Generate App Password: [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Use the 16-character password as MAIL_PASSWORD

#### AWS S3 & CloudFront

1. Create IAM user with S3 access
2. Generate Access Key ID and Secret
3. Create S3 bucket
4. Setup CloudFront distribution for bucket
5. Generate CloudFront key pair for signed cookies

#### MongoDB

**Local:**
```bash
# Install MongoDB Community
brew install mongodb-community    # macOS
# or use Docker:
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Connect with URI: mongodb://localhost:27017/research-zone
```

**Cloud (MongoDB Atlas):**
1. Create account at [mongodb.com](https://www.mongodb.com)
2. Create cluster
3. Get connection string
4. Use as MONGODB_URI

## Testing API Endpoints

### Using REST Client Extension (VS Code)

Open any `.http` file in `api_testing/` and click "Send Request"

**Example** (`api_testing/user.http`):

```http
@baseUrl=http://localhost:5000/api
@signup_token={{signup_token}}

### 1. Signup
POST {{baseUrl}}/users/signup
Content-Type: application/json

{
  "email": "test@example.com",
  "firstName": "Test",
  "lastName": "User",
  "username": "testuser",
  "password": "TestPass123"
}

@signup_token = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

### 2. Verify OTP (use OTP from console logs)
POST {{baseUrl}}/users/verify-otp
Authorization: Bearer {{signup_token}}
Content-Type: application/json

{
  "otp": 1234
}
```

### Using cURL

```bash
# Signup
curl -X POST http://localhost:5000/api/users/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "username": "testuser",
    "password": "TestPass123"
  }'

# Verify OTP
curl -X POST http://localhost:5000/api/users/verify-otp \
  -H "Authorization: Bearer <signup-token>" \
  -H "Content-Type: application/json" \
  -d '{"otp": 1234}'

# Create Workspace
curl -X POST http://localhost:5000/api/workspaces \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "My Workspace"}'
```

### Using Postman

1. Import collection (optional, or create manually)
2. Set variables:
   - `base_url`: http://localhost:5000/api
   - `access_token`: (from verify-otp response)
3. Send requests with Authorization Bearer token

## Common Development Workflows

### Adding a New Endpoint

**1. Create route** (`src/modules/example/routes.js`):

```javascript
import { Router } from 'express';
import { checkAccessToken } from '../../middlewares/authMiddleware.js';
import exampleController from './controller.js';

const router = Router();

router.post('/', checkAccessToken, exampleController.create);
router.get('/:id', checkAccessToken, exampleController.getById);

export default router;
```

**2. Create controller** (`src/modules/example/controller.js`):

```javascript
import { errorMessages, successMessages } from "../../constants/messages.js";
import apiResponse from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";
import Example from "./model.js";
import exampleServices from "./services.js";

const exampleDb = new exampleServices(Example);

export default class exampleController {
  static async create(req, res) {
    try {
      const { title } = req.body;
      const user = req.user;

      if (!title) {
        throw new ApiError("Title is required", 400);
      }

      const example = await exampleDb.create({ title, user });

      return apiResponse.success(
        res,
        "Created successfully",
        200,
        example
      );
    } catch (err) {
      return apiResponse.error(
        res,
        err.message || "Creation failed",
        err.statusCode || 500
      );
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const example = await exampleDb.findById(id);

      if (!example) {
        throw new ApiError("Not found", 404);
      }

      return apiResponse.success(res, "Retrieved", 200, example);
    } catch (err) {
      return apiResponse.error(
        res,
        err.message || "Retrieval failed",
        err.statusCode || 500
      );
    }
  }
}
```

**3. Create service** (`src/modules/example/services.js`):

```javascript
import BaseRepository from "../../utils/baseRepository.js";

export default class exampleServices extends BaseRepository {
  constructor(model) {
    super(model);
  }

  async create({ title, user }) {
    const example = await this.create({
      title,
      createdBy: user.id,
    });
    return example;
  }
}
```

**4. Create model** (`src/modules/example/model.js`):

```javascript
import mongoose from "mongoose";

const exampleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

const Example = mongoose.model("Example", exampleSchema);
export default Example;
```

**5. Register route** (`src/routes/index.js`):

```javascript
import exampleRoutes from "../modules/example/routes.js";

router.use("/examples", exampleRoutes);
```

**6. Test the endpoint** (use `.http` file or cURL)

### Modifying Authentication Flow

**To change OTP validity:**

```javascript
// In src/modules/users/services.js
const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // Changed to 10 min
```

**To add new auth provider:**

1. Add to enum in User model:
```javascript
authProviders: {
  type: [String],
  enum: ["local", "google", "github", "kaggle", "microsoft"],
}
```

2. Create OAuth handler in controller
3. Update signup/login logic
4. Test with provider

### Adding Pagination

**In service:**

```javascript
async getPaginated(page = 1, limit = 20, filter = {}) {
  const skip = (page - 1) * limit;
  
  const items = await this.model
    .find(filter)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });
  
  const total = await this.model.countDocuments(filter);
  
  return {
    items,
    pagination: {
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}
```

**In controller:**

```javascript
const { page = 1, limit = 20 } = req.query;
const result = await exampleDb.getPaginated(page, limit);
```

## Debugging Techniques

### 1. Console Logging

```javascript
// In service/controller
console.log("User object:", req.user);
console.log("Error:", err);
console.error("Critical error:", error.message);

// In MongoDB operations
console.log("Query:", filter);
console.log("Result:", result);
```

**View logs:**

```bash
npm run dev  # Logs show in terminal
```

### 2. MongoDB Compass (GUI)

```bash
# Download from mongodb.com/products/compass
# Connect to: mongodb://localhost:27017
# Browse collections, documents, and indexes
```

### 3. Browser DevTools

**Network Tab:**
- See all API requests/responses
- Check headers, body, status codes
- Inspect cookies

**Console Tab:**
- View JavaScript errors
- Frontend logs
- Test token/data

### 4. Check Token Contents

```bash
# Decode JWT online at jwt.io
# Or in Node.js terminal:

import jwt from 'jsonwebtoken';
const decoded = jwt.decode('your-token-here');
console.log(decoded);
```

### 5. Database Query Debugging

Enable Mongoose debug logging:

```javascript
import mongoose from 'mongoose';
mongoose.set('debug', true);

// Now all queries are logged to console
```

### 6. Email Testing

**Catch emails in development:**

```javascript
// Use Mailtrap.io or similar service
// Email gets captured instead of actually sent
// View in web dashboard
```

**Gmail SMTP Testing:**

```javascript
// Setup test email listener
import Nodemailer from 'nodemailer';
const transporter = nodemailer.createTestAccount();

// Send test email
transporter.sendMail({ to, from, subject, html }, (err, info) => {
  console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
});
```

## Common Issues & Solutions

### Issue: MongoDB Connection Failed

**Symptoms:**
- Server starts but crashes
- `MongoError` in logs
- Cannot create/update documents

**Solutions:**

```bash
# 1. Check MongoDB is running
brew services list | grep mongodb    # macOS
# or
ps aux | grep mongod                 # Any OS

# 2. Start MongoDB if not running
brew services start mongodb-community  # macOS
mongod                                # Generic

# 3. Check connection string
# Verify MONGODB_URI in .env

# 4. Check authentication if using MongoDB Atlas
# Password might have special characters - URL encode them
# special: & → %26, : → %3A, etc
```

### Issue: OTP Not Received

**Symptoms:**
- Signup successful but no email
- User stuck at OTP screen

**Debugging:**

```javascript
// In services.js - add logging
try {
  await sendEmail(email, subject, html);
  console.log("✅ Email sent successfully to", email);
} catch (error) {
  console.error("❌ Email failed:", error.message);
  // Email service error codes:
  // - EAUTH: Gmail password wrong
  // - ESOCKET: Network blocked
  // - ECONNREFUSED: Service down
}
```

**Solutions:**

```bash
# 1. Check SMTP credentials in .env
# MAIL_USERNAME: must be Gmail address
# MAIL_PASSWORD: must be App Password (not account password)

# 2. Allow less secure apps (if not using App Passwords)
# Google Account Settings → Security → Less secure app access

# 3. Check firewall
# Gmail SMTP uses port 587 (TLS) or 465 (SSL)
# Ensure outbound on these ports is allowed

# 4. Test SMTP connection
npm install nodemailer
# Create test.js with SMTP test code
```

### Issue: Token Expired Immediately

**Symptoms:**
- Verify OTP returns access token but it's immediately invalid
- `TokenExpiredError` on next request

**Debugging:**

```javascript
// Check token expiry
import jwt from 'jsonwebtoken';
const decoded = jwt.decode(token);
console.log("Expires:", new Date(decoded.exp * 1000));
console.log("Current time:", new Date());
```

**Solutions:**

```javascript
// 1. Check JWT_SECRET is consistent
// - Must be same value used to sign AND verify
// - Check no typos in .env

// 2. Increase expiry time if too short
// In .env or constants/config.js:
ACCESS_TOKEN_EXPIRY=2h  // Increased from default

// 3. Check system clock
// If server time is wrong, tokens expire/are invalid
date  // Check date on server
# Sync time if needed
```

### Issue: Workspace Invitation Not Sending

**Symptoms:**
- Invite request succeeds but email not received
- Invitation created in DB

**Debugging:**

```javascript
// In workspaceServices.js inviteUserToWorkspace()
console.log("Sending to email:", email);
console.log("Workspace:", workspace.title);
console.log("Template:", emailHtml);

// Check if email sending is silent failing
try {
  await sendEmail(email, subject, emailHtml);
  console.log("✅ Sent");
} catch (err) {
  console.error("❌ Failed:", err);
  throw new ApiError("Email sending failed", 500);
}
```

**Solutions:**

1. Double-check recipient email is valid format
2. Check SMTP service is running
3. Look in email's spam folder
4. Check email service rate limits
5. Verify email service credentials

### Issue: User Can Access Others' Workspaces

**Symptoms:**
- User can view/edit workspaces they're not member of
- Permission bypass

**Debugging:**

```javascript
// Check auth middleware is working
console.log("req.user:", req.user);  // Should be populated

// Check permission checks in service
if (workspace.owner.toString() !== user.id.toString()) {
  throw new ApiError("Not owner", 403);
}
```

**Solutions:**

1. Verify `checkAccessToken` middleware is applied to route
2. Verify permission checks in service layer
3. Check logic for owner vs member access
4. Add explicit `req.user` validation

### Issue: Database Queries Slow

**Symptoms:**
- API responses take 5+ seconds
- High CPU/memory usage

**Debugging:**

```javascript
// Enable query logging
mongoose.set('debug', true);

// Log execution time
console.time("query-example");
const result = await this.findOne({ email });
console.timeEnd("query-example");
```

**Solutions:**

```javascript
// 1. Add missing indexes
workspaceSchema.index({ owner: 1 });
userSchema.index({ email: 1 });

// 2. Use aggregation instead of multiple queries
// Bad: fetch workspace, then fetch each member separately
// Good: use $lookup in aggregation pipeline

// 3. Paginate large datasets
// Instead of returning 10,000 items at once
const { items, pagination } = await service.getPaginated(page, limit);

// 4. Cache frequently accessed data
// Cache user profile, workspace list, etc
```

### Issue: CORS Error in Frontend

**Symptoms:**
- API called but response blocked
- `Access to XMLHttpRequest ... blocked by CORS policy`
- Network tab shows response but JS can't access it

**Debugging:**

```bash
# Check CORS middleware in server.js
# Should have something like:
# app.use(cors({ 
#   origin: "http://localhost:3000",
#   credentials: true 
# }))
```

**Solutions:**

```javascript
// In src/server.js - ensure CORS is configured
import cors from 'cors';

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,  // Allow cookies
  optionsSuccessStatus: 200
}));

// Or allow all origins (dev only!)
// app.use(cors());
```

## Performance Optimization

### Database Optimization

```javascript
// Good: Single aggregation query
const users = await userDb.aggregate([
  { $match: { workspaceId: id } },
  { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
  { $project: { user: 1, joinedAt: 1 } }
]);

// Bad: Multiple separate queries
const workspace = await Workspace.findById(id);
for (let member of workspace.members) {
  const user = await User.findById(member.user);  // N+1 query problem!
}
```

### Connection Pooling

```javascript
// Mongoose automatically pools connections
// For high volume, increase pool size:
mongoose.connect(uri, {
  maxPoolSize: 10,
  minPoolSize: 5
});
```

### Caching Strategy

```javascript
// Simple in-memory cache
const cache = new Map();

async function getUserCached(userId) {
  if (cache.has(userId)) {
    return cache.get(userId);
  }
  
  const user = await User.findById(userId);
  cache.set(userId, user);
  
  // Clear cache after 1 hour
  setTimeout(() => cache.delete(userId), 3600000);
  
  return user;
}
```

## Code Quality

### Linting (if ESLint configured)

```bash
npm run lint          # Check for issues
npm run lint:fix      # Auto-fix issues
```

### Code Formatting (if Prettier configured)

```bash
npm run format        # Format all files
```

### Testing (if test framework configured)

```bash
npm test              # Run tests
npm test -- --watch   # Watch mode
npm test -- --coverage  # Coverage report
```

## Deployment Preparation

### Pre-deployment Checklist

- [ ] All environment variables set correctly
- [ ] Database has backups enabled
- [ ] SSL certificate obtained (HTTPS)
- [ ] Email service credentials verified
- [ ] AWS S3 and CloudFront configured
- [ ] Database indexes created
- [ ] Error logging setup (Sentry, etc.)
- [ ] API rate limiting enabled
- [ ] CORS origins set correctly
- [ ] Security headers configured
- [ ] Database migrations run
- [ ] Tests passing

### Build for Production

```bash
# Ensure production dependencies only
npm ci --only=production

# Start server (no auto-reload)
# Server listens on PORT (default 5000)
npm start  # or: node src/server.js
```

### Docker Deployment

```bash
# Build image
npm run docker:build

# Test locally
docker run -p 5000:5000 \
  -e MONGODB_URI=... \
  -e JWT_SECRET=... \
  salmanghauri/node-backend:latest

# Push to registry
npm run docker:push

# Deploy to server
npm run deploy
```

---

**Last Updated**: March 28, 2024
**Development Version**: 1.0.0

