# Hostel Management System - API Documentation

Base URL: `http://localhost:3000` (adjust port as needed)

## 📋 Table of Contents

- [Authentication Routes](#authentication-routes)
- [Student Routes](#student-routes)
- [Warden Routes](#warden-routes)
- [Admin Routes](#admin-routes)
- [Health Check](#health-check)

---

## 🔐 Authentication

### Authentication Routes

**Base Path:** `/api/auth`

| Method | Endpoint                  | Auth Required | Description          |
| ------ | ------------------------- | ------------- | -------------------- |
| POST   | `/api/auth/register`      | ❌ No         | Register a new user  |
| POST   | `/api/auth/login`         | ❌ No         | Login user           |
| POST   | `/api/auth/refresh-token` | ❌ No         | Refresh access token |
| POST   | `/api/auth/logout`        | ❌ No         | Logout user          |

#### 1. Register User

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

**Response:**

```json
{
  "user": {
    "id": "uuid",
    "email": "student@example.com",
    "role": "STUDENT",
    "createdAt": "2025-11-22T10:00:00.000Z",
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

#### 2. Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "Password123!"
}
```

**Response:**

```json
{
  "user": {
    "id": "uuid",
    "email": "student@example.com",
    "role": "STUDENT",
    "roomId": null,
    "createdAt": "2025-11-22T10:00:00.000Z",
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

#### 3. Refresh Token

```http
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "your_refresh_token"
}
```

**Response:**

```json
{
  "accessToken": "new_jwt_token",
  "refreshToken": "new_refresh_token"
}
```

#### 4. Logout

```http
POST /api/auth/logout
```

**Response:**

```json
{
  "message": "Logged out successfully"
}
```

---

## 👨‍🎓 Student Routes

**Base Path:** `/api/student`
**Auth Required:** ✅ Yes (Role: STUDENT)
**Headers Required:** `Authorization: Bearer <access_token>`

| Method | Endpoint                  | Description                     |
| ------ | ------------------------- | ------------------------------- |
| GET    | `/api/student/me`         | Get student profile             |
| PUT    | `/api/student/me`         | Update student profile          |
| GET    | `/api/student/attendance` | Get student attendance records  |
| GET    | `/api/student/canteen`    | Get canteen transaction summary |
| GET    | `/api/student/leaves`     | List leave requests             |
| POST   | `/api/student/leaves`     | Create leave request            |
| GET    | `/api/student/complaints` | List student complaints         |
| POST   | `/api/student/complaints` | Create complaint                |

#### 1. Get Profile

```http
GET /api/student/me
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "message": "Student profile placeholder",
  "user": {
    "userId": "uuid",
    "role": "STUDENT"
  }
}
```

#### 2. Update Profile

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

**Response:**

```json
{
  "message": "Update profile placeholder",
  "data": {
    "name": "John Doe Updated",
    "phone": "9876543210"
  }
}
```

#### 3. Get Attendance

```http
GET /api/student/attendance
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "attendance": {
    "records": [
      {
        "id": "uuid",
        "date": "2025-11-21T00:00:00.000Z",
        "inTime": "2025-11-21T08:30:00.000Z",
        "outTime": "2025-11-21T18:00:00.000Z",
        "status": "PRESENT"
      }
    ],
    "summary": {
      "totalDays": 30,
      "presentDays": 28,
      "absentDays": 2,
      "attendancePercentage": 93.33
    }
  }
}
```

#### 4. Get Canteen Summary

```http
GET /api/student/canteen
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "balance": {
    "studentId": "uuid",
    "balance": 500
  },
  "transactions": [
    {
      "id": "uuid",
      "amount": 150,
      "type": "DEBIT",
      "description": "Lunch",
      "date": "2025-11-21T12:00:00.000Z"
    }
  ]
}
```

#### 5. List Leave Requests

```http
GET /api/student/leaves
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "leaves": [
    {
      "id": "uuid",
      "fromDate": "2025-12-01T00:00:00.000Z",
      "toDate": "2025-12-05T00:00:00.000Z",
      "reason": "Family function",
      "status": "PENDING",
      "createdAt": "2025-11-21T10:00:00.000Z"
    }
  ]
}
```

#### 6. Create Leave Request

```http
POST /api/student/leaves
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "fromDate": "2025-12-01",
  "toDate": "2025-12-05",
  "reason": "Family function"
}
```

**Response:**

```json
{
  "leave": {
    "id": "uuid",
    "fromDate": "2025-12-01T00:00:00.000Z",
    "toDate": "2025-12-05T00:00:00.000Z",
    "reason": "Family function",
    "status": "PENDING"
  }
}
```

#### 7. List Complaints

```http
GET /api/student/complaints
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "complaints": [
    {
      "id": "uuid",
      "title": "AC not working",
      "description": "Room AC has stopped working",
      "image": null,
      "status": "PENDING",
      "resolvedAt": null,
      "student": {
        "id": "student_uuid",
        "email": "student@example.com",
        "profile": {
          "name": "John Doe",
          "rollNo": "S12345"
        }
      }
    }
  ]
}
```

#### 8. Create Complaint

```http
POST /api/student/complaints
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "AC not working",
  "description": "Room AC has stopped working since yesterday",
  "image": "https://example.com/image.jpg"
}
```

**Required Fields:** `title`, `description`  
**Optional Fields:** `image` (URL to complaint image)

**Response:**

```json
{
  "complaint": {
    "id": "uuid",
    "studentId": "student_uuid",
    "title": "AC not working",
    "description": "Room AC has stopped working since yesterday",
    "image": "https://example.com/image.jpg",
    "status": "PENDING",
    "resolvedAt": null,
    "student": {
      "id": "student_uuid",
      "email": "student@example.com",
      "profile": {
        "name": "John Doe",
        "rollNo": "S12345"
      }
    }
  }
}
```

---

## 👮 Warden Routes

**Base Path:** `/api/warden`
**Auth Required:** ✅ Yes (Role: WARDEN or ADMIN)
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

#### 1. Get Pending Leaves

```http
GET /api/warden/leaves/pending
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "student": {
        "id": "student_uuid",
        "name": "John Doe",
        "email": "student@example.com"
      },
      "startDate": "2025-12-01",
      "endDate": "2025-12-05",
      "reason": "Family function",
      "status": "PENDING"
    }
  ]
}
```

#### 2. Approve Leave

```http
PATCH /api/warden/leaves/:id/approve
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "remarks": "Approved for family emergency"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "APPROVED",
    "remarks": "Approved for family emergency"
  }
}
```

#### 3. Reject Leave

```http
PATCH /api/warden/leaves/:id/reject
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "remarks": "Insufficient reason provided"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "REJECTED",
    "remarks": "Insufficient reason provided"
  }
}
```

#### 4. Mark Attendance

```http
POST /api/warden/attendance/mark
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "studentIds": ["student_uuid_1", "student_uuid_2"],
  "date": "2025-11-21",
  "isPresent": true,
  "remarks": "Present"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "marked": 2,
    "date": "2025-11-21"
  }
}
```

#### 5. Get Student Attendance

```http
GET /api/warden/attendance/:studentId
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "student": {
      "id": "student_uuid",
      "name": "John Doe",
      "email": "student@example.com"
    },
    "attendance": [
      {
        "date": "2025-11-21",
        "isPresent": true,
        "remarks": "Present"
      }
    ],
    "summary": {
      "totalDays": 30,
      "presentDays": 28,
      "attendancePercentage": 93.33
    }
  }
}
```

#### 6. List All Complaints

```http
GET /api/warden/complaints
Authorization: Bearer <access_token>
```

**Query Parameters:**

- `status` (optional): Filter by status (`PENDING`, `IN_PROGRESS`, `RESOLVED`)

**Response:**

```json
{
  "complaints": [
    {
      "id": "uuid",
      "studentId": "student_uuid",
      "title": "AC not working",
      "description": "Room AC has stopped working",
      "image": null,
      "status": "PENDING",
      "resolvedAt": null,
      "student": {
        "id": "student_uuid",
        "email": "student@example.com",
        "roomId": "room_uuid",
        "profile": {
          "name": "John Doe",
          "rollNo": "S12345",
          "phone": "1234567890"
        },
        "room": {
          "roomNo": "101",
          "floor": 1
        }
      }
    }
  ]
}
```

#### 7. Update Complaint

```http
PATCH /api/warden/complaints/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "status": "IN_PROGRESS",
  "remarks": "Maintenance team assigned"
}
```

**Valid Status Values:** `PENDING`, `IN_PROGRESS`, `RESOLVED`  
**Optional Fields:** `remarks`

**Response:**

```json
{
  "complaint": {
    "id": "uuid",
    "studentId": "student_uuid",
    "title": "AC not working",
    "description": "Room AC has stopped working",
    "image": null,
    "status": "IN_PROGRESS",
    "resolvedAt": null,
    "student": {
      "id": "student_uuid",
      "email": "student@example.com",
      "profile": {
        "name": "John Doe",
        "rollNo": "S12345"
      }
    }
  }
}
```

**Note:** When status is set to `RESOLVED`, the `resolvedAt` field is automatically set to the current timestamp.

---

## 👔 Admin Routes

**Base Path:** `/api/admin`
**Auth Required:** ✅ Yes (Role: ADMIN)
**Headers Required:** `Authorization: Bearer <access_token>`

| Method | Endpoint                          | Description                |
| ------ | --------------------------------- | -------------------------- |
| POST   | `/api/admin/users`                | Create new user            |
| GET    | `/api/admin/users`                | List all users             |
| POST   | `/api/admin/rooms`                | Create new room            |
| PATCH  | `/api/admin/rooms/:id/assign`     | Assign room to student     |
| GET    | `/api/admin/reports/summary`      | Get summary report         |
| POST   | `/api/admin/canteen/transactions` | Create canteen transaction |

#### 1. Create User

```http
POST /api/admin/users
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "Password123!",
  "name": "Jane Smith",
  "role": "STUDENT",
  "phoneNumber": "1234567890"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "newuser@example.com",
    "name": "Jane Smith",
    "role": "STUDENT"
  }
}
```

#### 2. List Users

```http
GET /api/admin/users
Authorization: Bearer <access_token>
```

**Query Parameters:**

- `role` (optional): Filter by role (STUDENT, WARDEN, ADMIN)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "email": "student@example.com",
        "name": "John Doe",
        "role": "STUDENT",
        "phoneNumber": "1234567890",
        "room": {
          "roomNumber": "101"
        }
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  }
}
```

#### 3. Create Room

```http
POST /api/admin/rooms
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "roomNumber": "201",
  "floor": 2,
  "capacity": 3,
  "type": "SHARED"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "roomNumber": "201",
    "floor": 2,
    "capacity": 3,
    "type": "SHARED",
    "occupiedCount": 0
  }
}
```

#### 4. Assign Room

```http
PATCH /api/admin/rooms/:id/assign
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "studentId": "student_uuid"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "room": {
      "id": "room_uuid",
      "roomNumber": "201",
      "occupiedCount": 1
    },
    "student": {
      "id": "student_uuid",
      "name": "John Doe"
    }
  }
}
```

#### 5. Get Summary Report

```http
GET /api/admin/reports/summary
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "totalStudents": 150,
    "totalRooms": 50,
    "occupiedRooms": 45,
    "pendingLeaves": 5,
    "pendingComplaints": 3,
    "attendanceToday": {
      "present": 140,
      "absent": 10,
      "percentage": 93.33
    }
  }
}
```

#### 6. Create Canteen Transaction

```http
POST /api/admin/canteen/transactions
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "studentId": "student_uuid",
  "amount": 200,
  "type": "CREDIT",
  "description": "Monthly allowance"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "studentId": "student_uuid",
    "amount": 200,
    "type": "CREDIT",
    "description": "Monthly allowance",
    "balance": 700,
    "createdAt": "2025-11-21T10:00:00.000Z"
  }
}
```

---

## ❤️ Health Check

#### Health Check

```http
GET /health
```

**Response:**

```json
{
  "status": "ok"
}
```

---

## 🔑 Authentication Flow

### How to use protected routes:

1. **Login or Register** to get access token and refresh token
2. **Include Bearer Token** in all protected route requests:
   ```http
   Authorization: Bearer <your_access_token>
   ```
3. **Refresh Token** when access token expires:
   ```http
   POST /api/auth/refresh-token
   {
     "refreshToken": "your_refresh_token"
   }
   ```

---

## 📝 Common Response Formats

### Success Response

```json
{
  "success": true,
  "data": {
    /* response data */
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "error": {
    "code": "ERROR_CODE",
    "details": "Additional error details"
  }
}
```

### Validation Error Response

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

---

## 🚨 HTTP Status Codes

| Code | Description                          |
| ---- | ------------------------------------ |
| 200  | Success                              |
| 201  | Created                              |
| 400  | Bad Request (validation error)       |
| 401  | Unauthorized (invalid/missing token) |
| 403  | Forbidden (insufficient permissions) |
| 404  | Not Found                            |
| 409  | Conflict (duplicate resource)        |
| 500  | Internal Server Error                |

---

## 🧪 Testing Examples

### Using cURL

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","password":"Password123!"}'

# Get Profile (with token)
curl -X GET http://localhost:3000/api/student/me \
  -H "Authorization: Bearer <your_token>"

# Create Leave Request
curl -X POST http://localhost:3000/api/student/leaves \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{"startDate":"2025-12-01","endDate":"2025-12-05","reason":"Family function"}'
```

### Using JavaScript (Fetch)

```javascript
// Login
const login = async () => {
  const response = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "student@example.com",
      password: "Password123!",
    }),
  });
  const data = await response.json();
  return data.data.accessToken;
};

// Get Profile
const getProfile = async (token) => {
  const response = await fetch("http://localhost:3000/api/student/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return await response.json();
};
```

### Using Postman/Thunder Client

1. Create a new request
2. Set the method and URL
3. Add `Authorization` header with value `Bearer <token>` for protected routes
4. Add request body for POST/PUT/PATCH requests
5. Send the request

---

## 📦 Response Data Models

### User Object

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "STUDENT|WARDEN|ADMIN",
  "roomId": "room_uuid",
  "createdAt": "2025-11-22T10:00:00.000Z",
  "profile": {
    "id": "profile_uuid",
    "userId": "uuid",
    "name": "User Name",
    "rollNo": "S12345",
    "phone": "1234567890",
    "parentPhone": "9876543210",
    "photo": "https://example.com/photo.jpg",
    "course": "Computer Science",
    "year": 2,
    "address": "123 Main St, City"
  }
}
```

### Room Object

```json
{
  "id": "uuid",
  "roomNo": "101",
  "floor": 1,
  "capacity": 3,
  "occupied": 2
}
```

### Leave Object

```json
{
  "id": "uuid",
  "studentId": "student_uuid",
  "fromDate": "2025-12-01T00:00:00.000Z",
  "toDate": "2025-12-05T00:00:00.000Z",
  "reason": "Family function",
  "status": "PENDING|APPROVED|REJECTED",
  "approvedById": "warden_uuid",
  "createdAt": "2025-11-22T10:00:00.000Z"
}
```

### Complaint Object

```json
{
  "id": "uuid",
  "studentId": "student_uuid",
  "title": "Issue title",
  "description": "Detailed description",
  "image": "https://example.com/image.jpg",
  "status": "PENDING|IN_PROGRESS|RESOLVED",
  "resolvedAt": "2025-11-22T15:00:00.000Z"
}
```

### Attendance Object

```json
{
  "id": "uuid",
  "studentId": "student_uuid",
  "date": "2025-11-21T00:00:00.000Z",
  "inTime": "2025-11-21T08:30:00.000Z",
  "outTime": "2025-11-21T18:00:00.000Z",
  "status": "PRESENT|ABSENT|LATE"
}
```

### Transaction Object

```json
{
  "id": "uuid",
  "studentId": "student_uuid",
  "amount": 150.0,
  "type": "CREDIT|DEBIT",
  "description": "Lunch payment",
  "date": "2025-11-21T12:00:00.000Z"
}
```

---

## 📚 Notes for Frontend Developers

1. **Base URL**: Replace `http://localhost:3000` with your actual backend URL
2. **Token Storage**: Store access token securely (e.g., httpOnly cookies, localStorage with caution)
3. **Token Refresh**: Implement automatic token refresh when receiving 401 errors
4. **Error Handling**: Always handle errors gracefully and show user-friendly messages
5. **Loading States**: Show loading indicators during API calls
6. **Validation**: Implement client-side validation matching the backend rules
7. **CORS**: Backend has CORS enabled with credentials support
8. **Date Format**: All dates are in ISO 8601 format (YYYY-MM-DD or full ISO string)

---

## 🔧 Troubleshooting Common Issues

### Issue: 403 Forbidden Error on Student Routes

**Problem**: Getting `403 Forbidden` when accessing student routes like `/api/student/attendance`

**Solution**: Make sure the user is registered with the correct role:

```json
// When registering, include the role field:
{
  "email": "student@example.com",
  "password": "Password123!",
  "name": "John Doe",
  "role": "STUDENT", // ← Must be "STUDENT" for student routes
  "rollNo": "S12345",
  "phone": "1234567890",
  "course": "Computer Science",
  "year": 2
}
```

**Verify Role in Token**: After login, check the decoded JWT token to ensure `role: "STUDENT"`

### How Students Check Their Attendance

**Step 1**: Login as a student

```javascript
const response = await fetch("http://localhost:3000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "student@example.com",
    password: "Password123!",
  }),
});
const { data } = await response.json();
const token = data.tokens.accessToken;
```

**Step 2**: Get attendance with the token

```javascript
const attendanceResponse = await fetch(
  "http://localhost:3000/api/student/attendance",
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);
const attendanceData = await attendanceResponse.json();
console.log(attendanceData.attendance); // Array of attendance records
```

**Expected Response**:

```json
{
  "attendance": {
    "attendance": [
      {
        "id": "uuid",
        "date": "2025-11-21T00:00:00.000Z",
        "isPresent": true,
        "remarks": "Present"
      }
    ],
    "summary": {
      "totalDays": 30,
      "presentDays": 28,
      "absentDays": 2,
      "attendancePercentage": 93.33
    }
  }
}
```

### Common Error Codes

| Error            | Cause                       | Solution                                             |
| ---------------- | --------------------------- | ---------------------------------------------------- |
| 401 Unauthorized | Missing or invalid token    | Login again to get a new token                       |
| 403 Forbidden    | Wrong role for the endpoint | Check user role (must be STUDENT for student routes) |
| 404 Not Found    | Wrong endpoint URL          | Verify the endpoint path                             |
| 500 Server Error | Backend issue               | Check server logs                                    |

---

**Last Updated**: November 22, 2025  
**Version**: 1.1.0

## 📝 Changelog

### Version 1.1.0 (November 22, 2025)

- ✅ Implemented proper complaint service with database operations
- ✅ Fixed registration to use correct user roles (no longer hardcoded to ADMIN)
- ✅ Updated all API response examples to match actual implementation
- ✅ Added proper field validation and error handling for complaints
- ✅ Added `resolvedAt` timestamp for resolved complaints
- ✅ Improved complaint listing with student and room details
- ✅ Updated data models to reflect actual Prisma schema

### Version 1.0.0 (November 21, 2025)

- Initial API documentation release
