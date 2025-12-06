# Hostel Management System - API Documentation

Base URL: `http://localhost:5000` (adjust port as needed)

## 📋 Table of Contents

- [Authentication Routes](#authentication-routes)
- [Student Routes](#student-routes)
- [Warden Routes](#warden-routes)
- [Admin Routes](#admin-routes)
- [Canteen Routes](#canteen-routes)
- [Health Check](#health-check)

---

## 🎭 User Roles

| Role              | Description           | Access                                                        |
| ----------------- | --------------------- | ------------------------------------------------------------- |
| `STUDENT`         | Hostel residents      | View profile, attendance, canteen balance, leaves, complaints |
| `WARDEN`          | Hostel staff          | Manage attendance, leaves, complaints                         |
| `ADMIN`           | System administrators | Full access + user/room/menu management                       |
| `CANTEEN_MANAGER` | Canteen staff         | Food ordering, billing, menu viewing                          |

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
**Valid Roles:** `STUDENT`, `WARDEN`, `ADMIN`, `CANTEEN_MANAGER`

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
| GET    | `/api/student/wallet`     | Get wallet summary with stats   |
| GET    | `/api/student/leaves`     | List leave requests             |
| POST   | `/api/student/leaves`     | Create leave request            |
| GET    | `/api/student/complaints` | List student complaints         |
| POST   | `/api/student/complaints` | Create complaint                |

#### 1. Get Profile

```http
GET /api/student/me
Authorization: Bearer <access_token>
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

#### 3. Get Attendance

```http
GET /api/student/attendance
Authorization: Bearer <access_token>
```

#### 4. Get Canteen Summary

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

#### 5. Get Wallet Summary (with Stats)

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

#### 6-9. Leaves & Complaints

See standard leave and complaint endpoints.

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

---

## 👔 Admin Routes

**Base Path:** `/api/admin`  
**Auth Required:** ✅ Yes (Role: ADMIN)  
**Headers Required:** `Authorization: Bearer <access_token>`

| Method | Endpoint                                | Description                      |
| ------ | --------------------------------------- | -------------------------------- |
| POST   | `/api/admin/users`                      | Create new user (any role)       |
| GET    | `/api/admin/users`                      | List all users                   |
| DELETE | `/api/admin/users/:id`                  | Delete a user                    |
| POST   | `/api/admin/rooms`                      | Create new room                  |
| PATCH  | `/api/admin/rooms/:id/assign`           | Assign room to student           |
| GET    | `/api/admin/reports/summary`            | Get summary report               |
| POST   | `/api/admin/canteen/transactions`       | Create canteen transaction       |
| GET    | `/api/admin/canteen/transactions`       | List all transactions (filtered) |
| GET    | `/api/admin/canteen/stats`              | Get transaction statistics       |
| GET    | `/api/admin/canteen/balance/:studentId` | Get specific student's balance   |

#### 1. Create User (Any Role)

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

#### 2. List Users

```http
GET /api/admin/users?role=CANTEEN_MANAGER&page=1&limit=10
Authorization: Bearer <access_token>
```

**Query Parameters:**

- `role` (optional): Filter by role (`STUDENT`, `WARDEN`, `ADMIN`, `CANTEEN_MANAGER`)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

#### 3. Create Canteen Transaction (Add/Deduct Money)

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

## 🍽️ Canteen Routes (NEW)

**Base Path:** `/api/canteen`  
**Auth Required:** ✅ Yes  
**Headers Required:** `Authorization: Bearer <access_token>`

### Overview

The canteen system allows:

- **Admin**: Manage menu items (create, update, delete, set prices)
- **Canteen Manager**: Bill students (enter student ID/roll no + items)
- **Students**: View menu and their food orders

### Menu Endpoints

| Method | Endpoint                       | Role Required     | Description                   |
| ------ | ------------------------------ | ----------------- | ----------------------------- |
| GET    | `/api/canteen/menu`            | Any authenticated | View available menu items     |
| GET    | `/api/canteen/menu/all`        | ADMIN             | All items (incl. unavailable) |
| POST   | `/api/canteen/menu`            | ADMIN             | Create menu item              |
| POST   | `/api/canteen/menu/bulk`       | ADMIN             | Bulk create items             |
| PATCH  | `/api/canteen/menu/prices`     | ADMIN             | Bulk update prices            |
| PATCH  | `/api/canteen/menu/:id`        | ADMIN             | Update item                   |
| PATCH  | `/api/canteen/menu/:id/toggle` | ADMIN             | Toggle availability           |
| DELETE | `/api/canteen/menu/:id`        | ADMIN             | Delete item                   |

### Order/Billing Endpoints

| Method | Endpoint                          | Role Required          | Description                 |
| ------ | --------------------------------- | ---------------------- | --------------------------- |
| POST   | `/api/canteen/orders`             | CANTEEN_MANAGER, ADMIN | Create order by student ID  |
| POST   | `/api/canteen/orders/quick`       | CANTEEN_MANAGER, ADMIN | Create order by roll number |
| GET    | `/api/canteen/orders`             | CANTEEN_MANAGER, ADMIN | List all orders             |
| GET    | `/api/canteen/orders/my`          | STUDENT                | Get my food orders          |
| GET    | `/api/canteen/orders/:id`         | CANTEEN_MANAGER, ADMIN | Get order details           |
| GET    | `/api/canteen/orders/student/:id` | CANTEEN_MANAGER, ADMIN | Get student's orders        |
| GET    | `/api/canteen/dashboard/today`    | CANTEEN_MANAGER, ADMIN | Today's summary             |

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

### Admin: Setup Menu Items

#### Create Single Menu Item

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

#### Bulk Create Menu Items (Initial Setup)

```http
POST /api/canteen/menu/bulk
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "items": [
    { "name": "Apple", "category": "FRUITS", "price": 20, "unit": "piece" },
    { "name": "Banana", "category": "FRUITS", "price": 10, "unit": "piece" },
    { "name": "Orange", "category": "FRUITS", "price": 25, "unit": "piece" },
    { "name": "Samosa", "category": "SNACKS", "price": 15, "unit": "piece" },
    { "name": "Sandwich", "category": "SNACKS", "price": 30, "unit": "piece" },
    { "name": "Tea", "category": "BEVERAGES", "price": 10, "unit": "cup" },
    { "name": "Coffee", "category": "BEVERAGES", "price": 15, "unit": "cup" },
    { "name": "Rice Plate", "category": "LUNCH", "price": 50, "unit": "plate" },
    { "name": "Roti", "category": "LUNCH", "price": 8, "unit": "piece" },
    { "name": "Dal", "category": "LUNCH", "price": 20, "unit": "bowl" }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "message": "10 menu items created",
  "data": { "count": 10 }
}
```

#### Update Prices in Bulk

```http
PATCH /api/canteen/menu/prices
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "updates": [
    { "id": "menu_item_id_1", "price": 25 },
    { "id": "menu_item_id_2", "price": 12 }
  ]
}
```

#### Toggle Item Availability

```http
PATCH /api/canteen/menu/:id/toggle
Authorization: Bearer <admin_token>
```

---

### View Available Menu

```http
GET /api/canteen/menu
Authorization: Bearer <any_token>
```

**Query Parameters:**

- `category` (optional): Filter by category (e.g., `FRUITS`, `SNACKS`)

**Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      { "id": "...", "name": "Apple", "category": "FRUITS", "price": 20, "unit": "piece" },
      { "id": "...", "name": "Samosa", "category": "SNACKS", "price": 15, "unit": "piece" }
    ],
    "grouped": {
      "FRUITS": [...],
      "SNACKS": [...],
      "BEVERAGES": [...]
    },
    "total": 10
  }
}
```

---

### Canteen Manager: Create Food Order (Billing)

#### Option 1: By Student ID

```http
POST /api/canteen/orders
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "studentId": "cmiblyvtc0005dujb14zhpf7t",
  "mealType": "LUNCH",
  "items": [
    { "menuItemId": "menu_apple_id", "quantity": 2 },
    { "menuItemId": "menu_samosa_id", "quantity": 3 }
  ]
}
```

#### Option 2: By Roll Number (Quick Billing)

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
  "message": "Order ORD-20251206-ABC123 created for John Doe. ₹85.00 deducted.",
  "data": {
    "order": {
      "id": "order_uuid",
      "orderNumber": "ORD-20251206-ABC123",
      "studentId": "student_uuid",
      "mealType": "LUNCH",
      "totalAmount": 85,
      "items": [
        { "itemName": "Apple", "quantity": 2, "unitPrice": 20, "subtotal": 40 },
        { "itemName": "Samosa", "quantity": 3, "unitPrice": 15, "subtotal": 45 }
      ],
      "student": {
        "email": "student@example.com",
        "profile": { "name": "John Doe", "rollNo": "S12345" }
      }
    },
    "receipt": {
      "orderNumber": "ORD-20251206-ABC123",
      "studentName": "John Doe",
      "rollNo": "S12345",
      "mealType": "LUNCH",
      "items": [...],
      "totalAmount": 85,
      "previousBalance": 500,
      "newBalance": 415
    },
    "lowBalanceWarning": false
  }
}
```

**Error (Insufficient Balance):**

```json
{
  "success": false,
  "message": "Insufficient balance. Current: ₹50.00, Required: ₹85.00"
}
```

---

### Student: View My Food Orders

```http
GET /api/canteen/orders/my
Authorization: Bearer <student_token>
```

**Query Parameters:**

- `mealType` (optional): Filter by meal type
- `startDate`, `endDate` (optional): Date range
- `page`, `limit` (optional): Pagination

**Response:**

```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "order_uuid",
        "orderNumber": "ORD-20251206-ABC123",
        "mealType": "LUNCH",
        "totalAmount": 85,
        "createdAt": "2025-12-06T12:30:00.000Z",
        "items": [
          {
            "itemName": "Apple",
            "quantity": 2,
            "unitPrice": 20,
            "subtotal": 40
          },
          {
            "itemName": "Samosa",
            "quantity": 3,
            "unitPrice": 15,
            "subtotal": 45
          }
        ]
      }
    ],
    "pagination": { "total": 25, "page": 1, "limit": 20, "totalPages": 2 }
  }
}
```

---

### Manager Dashboard: Today's Summary

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
      { "name": "Roti", "totalQuantity": 45 },
      { "name": "Tea", "totalQuantity": 25 }
    ]
  }
}
```

---

## 📧 Email Notifications

The system automatically sends emails for:

1. **Transaction Emails** - When money is credited or debited
2. **Low Balance Alert** - When balance falls below ₹250 after a debit

Configure email in `.env`:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM="CDAC Hostel <your-email@gmail.com>"
```

---

## ❤️ Health Check

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

## 📦 Data Models

### MenuItem Object

```json
{
  "id": "uuid",
  "name": "Apple",
  "category": "FRUITS",
  "price": 20,
  "unit": "piece",
  "isAvailable": true,
  "createdAt": "2025-12-06T10:00:00.000Z",
  "updatedAt": "2025-12-06T10:00:00.000Z"
}
```

### FoodOrder Object

```json
{
  "id": "uuid",
  "orderNumber": "ORD-20251206-ABC123",
  "studentId": "student_uuid",
  "mealType": "LUNCH",
  "totalAmount": 85,
  "transactionId": "transaction_uuid",
  "servedById": "manager_uuid",
  "createdAt": "2025-12-06T12:30:00.000Z",
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

### User Object

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "STUDENT|WARDEN|ADMIN|CANTEEN_MANAGER",
  "roomId": "room_uuid",
  "createdAt": "2025-11-22T10:00:00.000Z",
  "profile": {
    "name": "User Name",
    "rollNo": "S12345",
    "phone": "1234567890",
    "course": "Computer Science",
    "year": 2
  }
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

**Last Updated**: December 6, 2025  
**Version**: 2.0.0

## 📝 Changelog

### Version 2.0.0 (December 6, 2025)

- ✅ Added `CANTEEN_MANAGER` role
- ✅ Added complete canteen food ordering system
- ✅ Menu management (Admin): create, update, delete, bulk operations
- ✅ Food order billing (Canteen Manager): by student ID or roll number
- ✅ Student food order history
- ✅ Manager dashboard with daily summary
- ✅ Automatic transaction creation on food orders
- ✅ Email notifications for transactions
- ✅ Low balance alerts (below ₹250)
- ✅ Updated base URL to port 5000

### Version 1.2.0 (November 23, 2025)

- ✅ Added delete user functionality for admins
- ✅ Transaction management with balance tracking
- ✅ Wallet summary with statistics

### Version 1.1.0 (November 22, 2025)

- ✅ Implemented complaint service
- ✅ Fixed registration roles

### Version 1.0.0 (November 21, 2025)

- Initial API documentation release
