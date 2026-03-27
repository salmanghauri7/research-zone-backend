# Authentication Module Documentation

## Overview

The Authentication Module is a critical component of the Research Zone backend that handles user registration, email verification, multi-provider authentication (Google, GitHub, Kaggle, local), token generation, and session management.

**Module Location:** `src/modules/users/`

## Business Logic

### User Registration Flow

1. **Signup Process**
   - User provides email, firstName, lastName, password, and username
   - System generates a 4-digit OTP (One-Time Password)
   - OTP is sent to user's email with 5-minute expiry
   - User record is created/updated with OTP and password hash
   - If email sending fails, the user record is automatically deleted
   - Response includes a 20-minute JWT token for accessing OTP verification endpoint

2. **OTP Verification**
   - User provides the OTP received in their email
   - System verifies OTP hasn't expired (5-minute window)
   - Upon successful verification:
     - User is marked as `isVerified: true`
     - Refresh token is generated and stored
     - Access token is generated (short-lived)
     - CloudFront signed cookies are generated for secure CDN access
     - Personal workspace is created automatically
   - User receives user profile data and access token

3. **OTP Resend**
   - User can request a new OTP before 5-minute expiry
   - JWT token from signup response is used to identify user
   - New OTP is generated and sent via email
   - Database is updated only after successful email delivery

4. **Multi-Provider Authentication**
   - Supports local (email/password), Google OAuth, GitHub OAuth, and Kaggle auth
   - `authProviders` field tracks which auth methods are linked to an account
   - User can sign up via one method and login via another if email matches

### Token Management

- **Access Token**: Short-lived JWT (expires as per config), used for API requests
- **Refresh Token**: Long-lived token stored in HTTP-only cookies, used to obtain new access tokens
- **Signup Token**: 20-minute JWT containing email and firstName, used to verify signup session during OTP verification

### Security Features

- Passwords are hashed using bcryptjs before storage
- OTP is generated randomly and has strict expiry validation
- Email verification required before account activation
- JWT tokens are signed and require valid signature for verification
- CloudFront signed cookies for secure content delivery
- HTTP-only cookies for refresh token storage

## Architecture

### File Structure

```
src/modules/users/
├── controller.js      # API request handlers, request/response validation
├── model.js          # MongoDB schema and User model
├── routes.js         # API endpoint definitions
└── services.js       # Business logic implementation
```

### Layer Responsibilities

**Controller Layer** (`controller.js`)
- Receives HTTP requests
- Validates presence of required data
- Delegates business logic to services
- Formats and sends API responses
- Handles error responses

**Service Layer** (`services.js`)
- Extends BaseRepository for database operations
- Implements core business logic
- Password hashing and OTP generation
- OTP expiry validation
- Email sending with error handling
- User creation and updates
- Token generation

**Model Layer** (`model.js`)
- Defines User schema with validation
- Field indexes for query optimization
- Optional fields (lastName, profilePicture)
- Pre-save hooks for data transformation

## Database Schema

### User Collection

```javascript
{
  _id: ObjectId,
  email: String (required, unique, lowercase, indexed),
  passwordHash: String (optional, for local auth),
  firstName: String (required),
  lastName: String (optional),
  username: String (unique, lowercase, sparse index),
  profilePictureUrl: String (optional),
  authProviders: [String] (enum: ['local', 'google', 'github', 'kaggle']),
  isVerified: Boolean (default: false),
  otp: Number (4-digit code),
  otpExpiresAt: Date (5 minutes from generation),
  refreshToken: String (stored in HTTP-only cookie),
  createdAt: Date (auto-set on creation)
}
```

### Key Indexes

- `email`: Fast lookups by email
- `username`: Fast lookups by username
- Sparse index on `username`: Allows multiple null values

## API Endpoints

### POST `/api/users/signup`

**Purpose:** Register a new user or resend OTP to existing unverified user

**Request Body:**
```json
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",
  "password": "securePassword123"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Signup successful. Please verify your email.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Business Rules:**
- Email must be unique (case-insensitive)
- If email exists and user is verified → Error 409
- If email exists and user is unverified → Regenerate OTP
- Username must be unique (if provided)
- OTP expires in 5 minutes
- Returned token expires in 20 minutes

**Error Codes:**
- 400: Missing required fields
- 409: User already exists
- 500: Email sending failed

---

### POST `/api/users/verify-otp`

**Purpose:** Verify OTP and complete user registration

**Request Body:**
```json
{
  "otp": 1234
}
```

**Request Headers:**
```
Authorization: Bearer <signup-token>
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "username": "johndoe",
      "email": "user@example.com"
    }
  }
}
```

**Cookies Set:**
- `refreshToken`: Refresh token (7 days expiry)
- `CloudFront cookies`: For CDN access

**Business Rules:**
- OTP must be valid and not expired (5-minute window)
- User is marked as verified
- Access token is generated
- Refresh token is stored in HTTP-only cookie
- Personal workspace is auto-created

**Error Codes:**
- 400: Invalid or expired OTP
- 401: Invalid/expired signup token
- 500: Token generation failed

---

### POST `/api/users/resend-otp/:token`

**Purpose:** Resend OTP to user's email

**Route Parameters:**
```
token: JWT token from signup response
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

**Business Rules:**
- Token must be valid and not expired
- New OTP is generated (5-minute expiry)
- Email must be sent successfully before DB update
- User is identified from JWT payload

**Error Codes:**
- 400: Invalid token
- 500: Email sending failed, no database changes made

---

### POST `/api/users/login` *(Inferred from structure)*

**Purpose:** Login existing verified user

**Typical Implementation:**
- Email + password authentication
- Password hash comparison
- Access + Refresh token generation
- Return user data with tokens

---

## Error Handling

### Custom Error Class (ApiError)

```javascript
new ApiError(message, statusCode, code)
```

**Common Auth Errors:**
- `USER_EXISTS`: User already verified
- `USERNAME_EXISTS`: Username taken
- `OTP_VERIFICATION_FAILED`: Invalid/expired OTP
- `TOKEN_EXPIRED`: JWT token expired
- `INVALID_CREDENTIALS`: Invalid email/password
- `AUTH_NOT_PROVIDED`: Missing Authorization header

### Email Validation & Retry

- Email sending failures trigger user record cleanup
- OTP is only updated AFTER email is sent successfully
- Ensures data consistency between email and database

## Configuration

**Environment Variables Required:**
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `JWT_SECRET`: Secret key for signing JWTs
- `MAIL_SERVICE_ADDRESS`: Email service configuration
- `OTP_EXPIRY_MINUTES`: OTP validity period (default: 5)
- `ACCESS_TOKEN_EXPIRY`: Access token validity (default: varies)
- `REFRESH_TOKEN_EXPIRY`: Refresh token validity (default: 7 days)

## Dependencies

- **bcryptjs**: Password hashing (v3.0.2)
- **jsonwebtoken**: JWT creation and verification (v9.0.2)
- **nodemailer**: Email sending (v7.0.10)
- **google-auth-library**: Google OAuth integration (v10.4.2)
- **mongoose**: Database connection (v8.19.2)

## Middleware Integration

**Route Protection:**
```javascript
import { checkAccessToken } from "../middlewares/authMiddleware.js";

router.post("/protected-route", checkAccessToken, controller.method);
```

**Middleware Behavior:**
- Validates Authorization header format (Bearer token)
- Decodes and verifies JWT signature
- Inserts user object into `req.user`
- Returns 401 for missing/invalid/expired tokens

## UI Specifications

### Signup Flow (Frontend)

1. **Signup Form**
   - Email input (validated with regex)
   - First Name input (required)
   - Last Name input (optional)
   - Username input (required, unique validation)
   - Password input (strength indicator recommended)
   - Submit button

2. **OTP Verification Screen**
   - Display after successful signup
   - OTP input (4-digit)
   - Timer showing OTP expiry (5 minutes)
   - "Resend OTP" button (disabled until 30 seconds before expiry)
   - Verification submit button
   - Loading state during verification

3. **Login Form**
   - Email/username input
   - Password input
   - "Forgot Password" link (if applicable)
   - Login submit button
   - OAuth provider buttons (Google, GitHub, Kaggle)

4. **OAuth Flow**
   - Click provider button → OAuth dialog
   - User authorizes app
   - Redirect back with auth code
   - Backend exchanges code for tokens

### HTTP Cookies Handling

- **refreshToken cookie**
  - HTTP-only (not accessible from JavaScript)
  - Secure flag (HTTPS only in production)
  - Path: /
  - Domain: localhost (dev) / domain (prod)

- **CloudFront cookies**
  - AWS credential cookies for CDN access
  - Set after successful OTP verification
  - Used for secure file/image delivery

### State Management

**Redux/Context Store Recommendations:**
- `authToken`: Access token (expires on token expiry)
- `user`: User profile object
- `isAuthLoading`: Signup/login request state
- `authError`: Error message from signup/login
- `isVerified`: Whether user is verified
- `otpExpiry`: Countdown timer for OTP validity

## Integration Points

1. **Workspace Creation**: On OTP verification, create personal workspace
2. **Email Service**: Must be initialized before signup
3. **JWT Config**: Token expiry settings used across app
4. **S3/CloudFront**: Cookie signing for secure file access

## Future Enhancements

- Password reset/recovery flow
- Email change verification
- Social login linking to existing accounts
- Account deletion with data cleanup
- Login history and device management
- Two-factor authentication
- Session management (single session vs multiple sessions)

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| OTP not received | Email service down | Check email service logs |
| OTP expired before use | User delayed verification | Implement resend mechanism |
| Duplicate user error | Race condition on signup | Use database unique constraint + transaction |
| Token validation fails | Token signature invalid | Verify JWT_SECRET matches across services |
| CloudFront cookies missing | S3 signer misconfigured | Check AWS credentials and CloudFront config |

