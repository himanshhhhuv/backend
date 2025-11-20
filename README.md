# Hostel Management System - Backend

Express.js backend for the Hostel Management System with PostgreSQL + Prisma.

## Features

- **Authentication**: JWT-based auth with access & refresh tokens
- **Role-based Access**: Student, Warden, Admin roles
- **Student Module**: Profile, attendance, canteen balance, leaves, complaints
- **Warden Module**: Approve/reject leaves, mark attendance, manage complaints
- **Admin Module**: User management, room allocation, reports

## Tech Stack

- **Node.js** + **Express.js**
- **PostgreSQL** + **Prisma ORM**
- **JWT** for authentication
- **Zod** for validation
- **Cloudinary** for file uploads
- **Nodemailer** for emails

## Setup

### 1. Install Dependencies

```bash
pnpm install
# or
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and update:

```bash
cp .env.example .env
```

**Required variables:**

```env
DATABASE_URL="postgresql://user:password@localhost:5432/hostel_db"
JWT_ACCESS_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
```

### 3. Database Setup

Make sure PostgreSQL is running, then:

```bash
# Create database (if not exists)
createdb hostel_db

# Generate Prisma Client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev --name init
```

### 4. Run Development Server

```bash
pnpm dev
```

Server will start on `http://localhost:5000`

Test health endpoint: `GET http://localhost:5000/health`

## Project Structure

```
src/
├── app.js              # Express app setup
├── index.js            # Server entry point
├── config/             # Environment config
├── prisma/             # Prisma client
├── routes/             # API routes
├── controllers/        # Request handlers
├── services/           # Business logic
├── middleware/         # Auth, validation, error handling
├── utils/              # Helpers
└── validations/        # Zod schemas
```

## API Endpoints

### Auth (`/api/auth`)

- `POST /register` - Register new user
- `POST /login` - Login
- `POST /refresh-token` - Refresh access token
- `POST /logout` - Logout

### Student (`/api/student`)

- `GET /me` - Get profile
- `PUT /me` - Update profile
- `GET /attendance` - View attendance
- `GET /canteen` - Canteen balance & transactions
- `GET /leaves` - Leave history
- `POST /leaves` - Apply for leave
- `GET /complaints` - View complaints
- `POST /complaints` - Create complaint

### Warden (`/api/warden`)

- `GET /leaves/pending` - Pending leaves
- `PATCH /leaves/:id/approve` - Approve leave
- `PATCH /leaves/:id/reject` - Reject leave
- `POST /attendance/mark` - Mark attendance
- `GET /complaints` - All complaints
- `PATCH /complaints/:id` - Update complaint status

### Admin (`/api/admin`)

- `POST /users` - Create user
- `GET /users` - List users
- `POST /rooms` - Create room
- `PATCH /rooms/:id/assign` - Assign student to room
- `GET /reports/summary` - Dashboard summary
- `POST /canteen/transactions` - Add canteen transaction

## Scripts

```bash
pnpm dev              # Development with nodemon
pnpm start            # Production
pnpm prisma generate  # Generate Prisma Client
pnpm prisma migrate dev  # Run migrations
pnpm prisma studio    # Open Prisma Studio
```

## Next Steps

1. **Implement real service logic** with Prisma queries
2. **Add password hashing** with bcrypt in authService
3. **Test endpoints** with Postman/Insomnia
4. **Add file upload** for student photos & complaint images
5. **Integrate email** notifications
6. **Add payment gateway** (Razorpay/Stripe)

## License

MIT

