# Hostel Management System - API Documentation

Base URL: `http://localhost:5000` (adjust port as needed)

## Table of Contents

- [Authentication Routes](#authentication-routes)
- [Student Routes](#student-routes)
- [Warden Routes](#warden-routes)
- [Admin Routes](#admin-routes)
- [Canteen Routes](#canteen-routes)
- [Health Check](#health-check)

---

## User Roles

| Role              | Description           | Access                                                        |
| ----------------- | --------------------- | ------------------------------------------------------------- |
| `STUDENT`         | Hostel residents      | View profile, attendance, canteen balance, leaves, complaints |
| `WARDEN`          | Hostel staff          | Manage attendance, leaves, complaints                         |
| `ADMIN`           | System administrators | Full access + user/room/menu management                       |
| `CANTEEN_MANAGER` | Canteen staff         | Food ordering, billing, menu viewing                          |

---

## Authentication Routes

**Base Path:** `/api/auth`

| Method | Endpoint                        | Auth Required | Description                          |
| ------ | ------------------------------- | ------------- | ------------------------------------ |
| POST   | `/api/auth/register`            | No            | Register a new user                  |
| POST   | `/api/auth/login`               | No            | Login user                           |
| POST   | `/api/auth/refresh-token`       | No            | Refresh access token                 |
| POST   | `/api/auth/logout`              | No            | Logout user                          |
| GET    | `/api/auth/verify-email`        | No            | Verify email address                 |
| POST   | `/api/auth/resend-verification` | No            | Resend verification email            |
| POST   | `/api/auth/forgot-password`     | No            | Request password reset email         |
| POST   | `/api/auth/reset-password`      | No            | Reset password with token            |
| PUT    | `/api/auth/change-password`     | Yes           | Change password (authenticated user) |

---

### 1. Register User

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "Password123!",
  "name": "John Doe",
  "role": "STUDENT",
  "rollNo": "S12345",
  "phone": "1234567890",
  "course": "Computer Science",
  "year": 2,
  "parentPhone": "9876543210",
  "address": "123 Main St, City"
}
```

**Required Fields:** `email`, `password`, `name`, `rollNo`, `phone`, `course`, `year`  
**Optional Fields:** `role` (defaults to STUDENT), `parentPhone`, `address`  
**Valid Roles:** `STUDENT`

> Note: Only STUDENT role can be self-registered. Other roles must be created by ADMIN.

**Response (201 Created):**

```json
{
  "message": "User registered",
  "data": {
    "user": {
      "id": "uuid",
      "email": "student@example.com",
      "role": "STUDENT",
      "createdAt": "2025-12-13T10:00:00.000Z",
      "profile": {
        "id": "profile_uuid",
        "name": "John Doe",
        "rollNo": "S12345",
        "phone": "1234567890",
        "parentPhone": "9876543210",
        "photo": null,
        "course": "Computer Science",
        "year": 2,
        "address": "123 Main St, City"
      }
    },
    "message": "Registration successful! Please check your email to verify your account."
  }
}
```

> Important: A verification email is sent automatically. User must verify email before logging in.

---

### 2. Verify Email

Called when user clicks the verification link in their email.

```http
GET /api/auth/verify-email?token=<verification_token>
```

**Query Parameters:**

| Parameter | Required | Description                       |
| --------- | -------- | --------------------------------- |
| `token`   | Yes      | JWT verification token from email |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Email verified successfully! You can now login to your account."
}
```

**Error Responses:**

```json
// Token expired (400)
{
  "success": false,
  "message": "Verification link has expired. Please request a new one."
}

// Invalid token (400)
{
  "success": false,
  "message": "Invalid verification link"
}
```

---

### 3. Resend Verification Email

Request a new verification email if the previous one expired or wasn't received.

```http
POST /api/auth/resend-verification
Content-Type: application/json

{
  "email": "student@example.com"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "If an account with that email exists and is not verified, a verification link has been sent."
}
```

> Note: Response is always the same to prevent email enumeration attacks.

---

### 4. Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "Password123!"
}
```

**Response (200 OK):**

```json
{
  "user": {
    "id": "uuid",
    "email": "student@example.com",
    "role": "STUDENT",
    "isEmailVerified": true,
    "roomId": null,
    "createdAt": "2025-12-13T10:00:00.000Z",
    "profile": {
      "id": "profile_uuid",
      "name": "John Doe",
      "rollNo": "S12345",
      "phone": "1234567890",
      "parentPhone": "9876543210",
      "photo": null,
      "course": "Computer Science",
      "year": 2,
      "address": "123 Main St, City"
    }
  },
  "tokens": {
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

**Error Response (403 - Email Not Verified):**

```json
{
  "success": false,
  "message": "Please verify your email before logging in. Check your inbox for the verification link."
}
```

---

### 5. Refresh Token

```http
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "your_refresh_token"
}
```

**Response (200 OK):**

```json
{
  "accessToken": "new_jwt_token",
  "refreshToken": "new_refresh_token"
}
```

---

### 6. Logout

```http
POST /api/auth/logout
```

**Response (200 OK):**

```json
{
  "message": "Logged out"
}
```

---

### 7. Forgot Password

Request a password reset email.

```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "student@example.com"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

> Note: Response is always the same to prevent email enumeration attacks.

---

### 8. Reset Password

Reset password using the token from the email.

```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token_from_email",
  "password": "NewPassword123!"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Password has been reset successfully. You can now login with your new password."
}
```

**Error Responses:**

```json
// Token expired (400)
{
  "success": false,
  "message": "Password reset link has expired. Please request a new one."
}

// Invalid token (400)
{
  "success": false,
  "message": "Invalid password reset link"
}
```

---

### 9. Change Password (Authenticated)

Change the password for the currently logged-in user using the current password.

```http
PUT /api/auth/change-password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

---

## Student Routes

**Base Path:** `/api/student`  
**Auth Required:** Yes (Role: STUDENT)  
**Headers Required:** `Authorization: Bearer <access_token>`

| Method | Endpoint                  | Description                     |
| ------ | ------------------------- | ------------------------------- |
| GET    | `/api/student/me`         | Get student profile             |
| PUT    | `/api/student/me`         | Update student profile          |
| GET    | `/api/student/attendance` | Get student attendance records  |
| GET    | `/api/student/canteen`    | Get canteen transaction summary |
| GET    | `/api/student/wallet`     | Get wallet summary with stats   |
| GET    | `/api/student/leaves`     | List leave requests             |
| POST   | `/api/student/leaves`     | Create leave request            |
| GET    | `/api/student/complaints` | List student complaints         |
| POST   | `/api/student/complaints` | Create complaint                |

### 1. Get Profile

```http
GET /api/student/me
Authorization: Bearer <access_token>
```

### 2. Update Profile

```http
PUT /api/student/me
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "John Doe Updated",
  "phone": "9876543210",
  "parentPhone": "1112223333",
  "address": "New Address"
}
```

### 3. Get Attendance

```http
GET /api/student/attendance
Authorization: Bearer <access_token>
```

### 4. Get Canteen Summary

```http
GET /api/student/canteen
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "balance": 500,
    "transactions": [
      {
        "id": "uuid",
        "amount": 150,
        "type": "DEBIT",
        "description": "Canteen LUNCH: Apple x2, Samosa x1",
        "date": "2025-11-21T12:00:00.000Z"
      }
    ]
  }
}
```

### 5. Get Wallet Summary (with Stats)

```http
GET /api/student/wallet
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "balance": 500,
    "recentTransactions": [...],
    "stats": {
      "totalCredits": 2000,
      "totalDebits": 1500,
      "creditCount": 5,
      "debitCount": 12,
      "totalTransactions": 17
    }
  }
}
```

### 6. Create Leave Request

```http
POST /api/student/leaves
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "fromDate": "2025-12-15",
  "toDate": "2025-12-17",
  "reason": "Family function"
}
```

### 7. Create Complaint

```http
POST /api/student/complaints
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Water leakage in room",
  "description": "There is water leaking from the bathroom ceiling"
}
```

---

## Warden Routes

**Base Path:** `/api/warden`  
**Auth Required:** Yes (Role: WARDEN or ADMIN)  
**Headers Required:** `Authorization: Bearer <access_token>`

| Method | Endpoint                            | Description                         |
| ------ | ----------------------------------- | ----------------------------------- |
| GET    | `/api/warden/leaves/pending`        | Get pending leave requests          |
| PATCH  | `/api/warden/leaves/:id/approve`    | Approve leave request               |
| PATCH  | `/api/warden/leaves/:id/reject`     | Reject leave request                |
| POST   | `/api/warden/attendance/mark`       | Mark attendance for students        |
| GET    | `/api/warden/attendance/:studentId` | Get attendance for specific student |
| GET    | `/api/warden/complaints`            | List all complaints                 |
| PATCH  | `/api/warden/complaints/:id`        | Update complaint status             |

### 1. Get Pending Leaves

```http
GET /api/warden/leaves/pending
Authorization: Bearer <access_token>
```

### 2. Approve Leave

```http
PATCH /api/warden/leaves/:id/approve
Authorization: Bearer <access_token>
```

### 3. Reject Leave

```http
PATCH /api/warden/leaves/:id/reject
Authorization: Bearer <access_token>
```

### 4. Mark Attendance

```http
POST /api/warden/attendance/mark
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "studentId": "student_uuid",
  "date": "2025-12-13",
  "status": "PRESENT",
  "inTime": "2025-12-13T08:00:00.000Z",
  "outTime": "2025-12-13T22:00:00.000Z"
}
```

### 5. Update Complaint Status

```http
PATCH /api/warden/complaints/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "status": "IN_PROGRESS"
}
```

**Valid Statuses:** `PENDING`, `IN_PROGRESS`, `RESOLVED`

---

## Admin Routes

**Base Path:** `/api/admin`  
**Auth Required:** Yes (Role: ADMIN)  
**Headers Required:** `Authorization: Bearer <access_token>`

| Method | Endpoint                                | Description                             |
| ------ | --------------------------------------- | --------------------------------------- |
| POST   | `/api/admin/users`                      | Create new user (any role)              |
| GET    | `/api/admin/users`                      | List all users                          |
| DELETE | `/api/admin/users/:id`                  | Delete a user                           |
| POST   | `/api/admin/rooms`                      | Create new room                         |
| PATCH  | `/api/admin/rooms/:id/assign`           | Assign room to student                  |
| DELETE | `/api/admin/rooms/:id/assign`           | Unassign a student from a room          |
| GET    | `/api/admin/rooms`                      | List rooms with students and pagination |
| GET    | `/api/admin/reports/summary`            | Get summary report                      |
| POST   | `/api/admin/canteen/transactions`       | Create canteen transaction              |
| GET    | `/api/admin/canteen/transactions`       | List all transactions (filtered)        |
| GET    | `/api/admin/canteen/stats`              | Get transaction statistics              |
| GET    | `/api/admin/canteen/balance/:studentId` | Get specific student's balance          |

### 1. Create User (Any Role)

```http
POST /api/admin/users
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "email": "canteen@cdac.edu",
  "password": "Password123!",
  "name": "Canteen Manager",
  "rollNo": "CM001",
  "phone": "9876543210",
  "course": "Staff",
  "year": 1,
  "role": "CANTEEN_MANAGER"
}
```

**Valid Roles:** `STUDENT`, `WARDEN`, `ADMIN`, `CANTEEN_MANAGER`

> Note: Users created by admin have `isEmailVerified: true` by default.

### 2. List Users

```http
GET /api/admin/users?role=CANTEEN_MANAGER&page=1&limit=10
Authorization: Bearer <access_token>
```

**Query Parameters:**

| Parameter | Required | Description                                              |
| --------- | -------- | -------------------------------------------------------- |
| `role`    | No       | Filter by role (STUDENT, WARDEN, ADMIN, CANTEEN_MANAGER) |
| `page`    | No       | Page number (default: 1)                                 |
| `limit`   | No       | Items per page (default: 10)                             |

### 3. Delete User

```http
DELETE /api/admin/users/:id
Authorization: Bearer <access_token>
```

### 4. Create Room

```http
POST /api/admin/rooms
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "roomNo": "A101",
  "floor": 1,
  "capacity": 4
}
```

### 5. Assign Room to Student

```http
PATCH /api/admin/rooms/:id/assign
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "studentId": "student_uuid"
}
```

### 6. Unassign Room from Student

```http
DELETE /api/admin/rooms/:id/assign
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "studentId": "student_uuid"
}
```

Removes the student from the specified room and decrements the room's `occupied` count (if greater than 0).

  ### 7. List Rooms

  ```http
  GET /api/admin/rooms?page=1&limit=10&floor=1&onlyAvailable=true
  Authorization: Bearer <access_token>
  ```

  **Query Parameters:**

  | Parameter       | Required | Description                              |
  | --------------- | -------- | ---------------------------------------- |
  | `page`          | No       | Page number (default: 1)                 |
  | `limit`         | No       | Items per page (default: 10, max: 100)   |
  | `floor`         | No       | Filter rooms by floor                    |
  | `onlyAvailable` | No       | If `true`, only rooms with free capacity |

  **Response:**

  ```json
  {
    "success": true,
    "data": {
      "rooms": [
        {
          "id": "room_uuid",
          "roomNo": "A101",
          "floor": 1,
          "capacity": 4,
          "occupied": 2,
          "students": [
            {
              "id": "student_uuid",
              "email": "student@example.com",
              "profile": {
                "name": "John Doe",
                "rollNo": "S12345"
              }
            }
          ]
        }
      ],
      "pagination": {
        "total": 5,
        "page": 1,
        "limit": 10,
        "totalPages": 1
      }
    }
  }
  ```

### 8. Create Canteen Transaction (Add/Deduct Money)

```http
POST /api/admin/canteen/transactions
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "studentId": "student_uuid",
  "amount": 500,
  "type": "CREDIT",
  "description": "Monthly recharge"
}
```

**Response:**

```json
{
  "success": true,
  "message": "₹500.00 credited successfully",
  "data": {
    "transaction": {...},
    "previousBalance": 100,
    "newBalance": 600,
    "lowBalanceWarning": false
  }
}
```

---

## Canteen Routes

**Base Path:** `/api/canteen`  
**Auth Required:** Yes  
**Headers Required:** `Authorization: Bearer <access_token>`

### Overview

The canteen system allows:

- **Admin**: Manage menu items (create, update, delete, set prices)
- **Canteen Manager**: Bill students (enter student ID/roll no + items)
- **Students**: View menu and their food orders

### Menu Endpoints

| Method | Endpoint                       | Role Required          | Description                   |
| ------ | ------------------------------ | ---------------------- | ----------------------------- |
| GET    | `/api/canteen/menu`            | Any authenticated      | View available menu items     |
| GET    | `/api/canteen/menu/all`        | ADMIN                  | All items (incl. unavailable) |
| GET    | `/api/canteen/menu/:id`        | ADMIN, CANTEEN_MANAGER | Get single menu item          |
| POST   | `/api/canteen/menu`            | ADMIN                  | Create menu item              |
| POST   | `/api/canteen/menu/bulk`       | ADMIN                  | Bulk create items             |
| PATCH  | `/api/canteen/menu/prices`     | ADMIN                  | Bulk update prices            |
| PATCH  | `/api/canteen/menu/:id`        | ADMIN                  | Update item                   |
| PATCH  | `/api/canteen/menu/:id/toggle` | ADMIN                  | Toggle availability           |
| DELETE | `/api/canteen/menu/:id`        | ADMIN                  | Delete item                   |

### Order/Billing Endpoints

| Method | Endpoint                                 | Role Required          | Description                 |
| ------ | ---------------------------------------- | ---------------------- | --------------------------- |
| POST   | `/api/canteen/orders`                    | CANTEEN_MANAGER, ADMIN | Create order by student ID  |
| POST   | `/api/canteen/orders/quick`              | CANTEEN_MANAGER, ADMIN | Create order by roll number |
| GET    | `/api/canteen/orders`                    | CANTEEN_MANAGER, ADMIN | List all orders             |
| GET    | `/api/canteen/orders/my`                 | STUDENT                | Get my food orders          |
| GET    | `/api/canteen/orders/:id`                | CANTEEN_MANAGER, ADMIN | Get order details           |
| GET    | `/api/canteen/orders/student/:studentId` | CANTEEN_MANAGER, ADMIN | Get student's orders        |
| GET    | `/api/canteen/dashboard/today`           | CANTEEN_MANAGER, ADMIN | Today's summary             |

---

### Menu Categories

```
BREAKFAST, LUNCH, DINNER, SNACKS, FRUITS, BEVERAGES, EXTRAS
```

### Meal Types (for billing)

```
BREAKFAST, LUNCH, EVENING_SNACKS, DINNER, OTHER
```

---

### Create Single Menu Item

```http
POST /api/canteen/menu
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Apple",
  "category": "FRUITS",
  "price": 20,
  "unit": "piece",
  "isAvailable": true
}
```

### Bulk Create Menu Items

```http
POST /api/canteen/menu/bulk
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "items": [
    { "name": "Apple", "category": "FRUITS", "price": 20, "unit": "piece" },
    { "name": "Banana", "category": "FRUITS", "price": 10, "unit": "piece" },
    { "name": "Samosa", "category": "SNACKS", "price": 15, "unit": "piece" },
    { "name": "Tea", "category": "BEVERAGES", "price": 10, "unit": "cup" },
    { "name": "Rice Plate", "category": "LUNCH", "price": 50, "unit": "plate" }
  ]
}
```

### View Available Menu

```http
GET /api/canteen/menu
Authorization: Bearer <any_token>
```

**Query Parameters:**

| Parameter  | Required | Description                               |
| ---------- | -------- | ----------------------------------------- |
| `category` | No       | Filter by category (e.g., FRUITS, SNACKS) |

**Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      { "id": "...", "name": "Apple", "category": "FRUITS", "price": 20, "unit": "piece" }
    ],
    "grouped": {
      "FRUITS": [...],
      "SNACKS": [...]
    },
    "total": 10
  }
}
```

### Create Food Order (By Student ID)

```http
POST /api/canteen/orders
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "studentId": "student_uuid",
  "mealType": "LUNCH",
  "items": [
    { "menuItemId": "menu_apple_id", "quantity": 2 },
    { "menuItemId": "menu_samosa_id", "quantity": 3 }
  ]
}
```

### Create Food Order (By Roll Number - Quick Billing)

```http
POST /api/canteen/orders/quick
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "rollNo": "S12345",
  "mealType": "LUNCH",
  "items": [
    { "menuItemId": "menu_apple_id", "quantity": 2 },
    { "menuItemId": "menu_samosa_id", "quantity": 3 }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Order ORD-20251213-ABC123 created for John Doe. ₹85.00 deducted.",
  "data": {
    "order": {
      "id": "order_uuid",
      "orderNumber": "ORD-20251213-ABC123",
      "mealType": "LUNCH",
      "totalAmount": 85,
      "items": [...]
    },
    "receipt": {
      "previousBalance": 500,
      "newBalance": 415
    },
    "lowBalanceWarning": false
  }
}
```

### Get My Orders (Student)

```http
GET /api/canteen/orders/my
Authorization: Bearer <student_token>
```

**Query Parameters:**

| Parameter   | Required | Description          |
| ----------- | -------- | -------------------- |
| `mealType`  | No       | Filter by meal type  |
| `startDate` | No       | Start date for range |
| `endDate`   | No       | End date for range   |
| `page`      | No       | Page number          |
| `limit`     | No       | Items per page       |

### Today's Dashboard Summary

```http
GET /api/canteen/dashboard/today
Authorization: Bearer <manager_token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "ordersCount": 45,
    "totalRevenue": 5250,
    "mealTypeBreakdown": [
      { "mealType": "BREAKFAST", "count": 20, "revenue": 1500 },
      { "mealType": "LUNCH", "count": 25, "revenue": 3750 }
    ],
    "popularItems": [
      { "name": "Rice Plate", "totalQuantity": 30 },
      { "name": "Roti", "totalQuantity": 45 }
    ]
  }
}
```

---

## Email Notifications

The system automatically sends emails for:

| Event                  | Description                                 |
| ---------------------- | ------------------------------------------- |
| Registration           | Verification email sent to new users        |
| Email Verification     | Confirmation when email is verified         |
| Password Reset Request | Reset link sent to user's email             |
| Transaction            | When money is credited or debited           |
| Low Balance Alert      | When balance falls below ₹250 after a debit |

Configure email in `.env`:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM="CDAC Hostel <your-email@gmail.com>"
FRONTEND_URL=http://localhost:5173
```

---

## Health Check

```http
GET /health
```

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-12-13T10:00:00.000Z"
}
```

---

## Data Models

### User Object

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "STUDENT|WARDEN|ADMIN|CANTEEN_MANAGER",
  "isEmailVerified": true,
  "roomId": "room_uuid",
  "createdAt": "2025-12-13T10:00:00.000Z",
  "profile": {
    "name": "User Name",
    "rollNo": "S12345",
    "phone": "1234567890",
    "course": "Computer Science",
    "year": 2
  }
}
```

### MenuItem Object

```json
{
  "id": "uuid",
  "name": "Apple",
  "category": "FRUITS",
  "price": 20,
  "unit": "piece",
  "isAvailable": true,
  "createdAt": "2025-12-13T10:00:00.000Z",
  "updatedAt": "2025-12-13T10:00:00.000Z"
}
```

### FoodOrder Object

```json
{
  "id": "uuid",
  "orderNumber": "ORD-20251213-ABC123",
  "studentId": "student_uuid",
  "mealType": "LUNCH",
  "totalAmount": 85,
  "transactionId": "transaction_uuid",
  "servedById": "manager_uuid",
  "createdAt": "2025-12-13T12:30:00.000Z",
  "items": [
    {
      "id": "uuid",
      "itemName": "Apple",
      "quantity": 2,
      "unitPrice": 20,
      "subtotal": 40
    }
  ]
}
```

---

## HTTP Status Codes

| Code | Description                                               |
| ---- | --------------------------------------------------------- |
| 200  | Success                                                   |
| 201  | Created                                                   |
| 400  | Bad Request (validation error)                            |
| 401  | Unauthorized (invalid/missing token)                      |
| 403  | Forbidden (insufficient permissions / email not verified) |
| 404  | Not Found                                                 |
| 409  | Conflict (duplicate resource)                             |
| 500  | Internal Server Error                                     |

---

## Rate Limiting

| Route Type         | Limit                 |
| ------------------ | --------------------- |
| General API        | 100 requests / 15 min |
| Auth Routes        | 5 requests / 15 min   |
| Transaction Routes | 30 requests / 15 min  |

---

**Last Updated**: December 13, 2025  
**Version**: 2.1.0

## Changelog

### Version 2.1.0 (December 13, 2025)

- Added email verification system
  - `GET /api/auth/verify-email` - Verify email with token
  - `POST /api/auth/resend-verification` - Resend verification email
- Added password reset documentation
  - `POST /api/auth/forgot-password` - Request reset email
  - `POST /api/auth/reset-password` - Reset with token
- Login now requires email verification (returns 403 if not verified)
- Registration no longer returns tokens (user must verify email first)
- Added `isEmailVerified` field to User model
- Verification tokens expire in 24 hours
- Password reset tokens expire in 15 minutes

### Version 2.0.0 (December 6, 2025)

- Added `CANTEEN_MANAGER` role
- Added complete canteen food ordering system
- Menu management (Admin): create, update, delete, bulk operations
- Food order billing (Canteen Manager): by student ID or roll number
- Student food order history
- Manager dashboard with daily summary
- Automatic transaction creation on food orders
- Email notifications for transactions
- Low balance alerts (below ₹250)

### Version 1.2.0 (November 23, 2025)

- Added delete user functionality for admins
- Transaction management with balance tracking
- Wallet summary with statistics

### Version 1.1.0 (November 22, 2025)

- Implemented complaint service
- Fixed registration roles

### Version 1.0.0 (November 21, 2025)

- Initial API documentation release
