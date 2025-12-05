# Email Notification System

## Overview

Mock email notifications are now implemented for all canteen transactions. Whenever money is added (CREDIT) or deducted (DEBIT) from a student's account, an email notification is automatically sent.

## Features

### 1. **Transaction Email Notifications**

- ✅ Automatic email on CREDIT transactions (money added)
- ✅ Automatic email on DEBIT transactions (money deducted)
- ✅ Beautiful HTML formatted emails
- ✅ Plain text fallback
- ✅ Current balance display
- ✅ Transaction details (type, amount, description, date/time)

### 2. **Email Format**

- **For CREDIT**: Green themed email with "💰 Money Added to Your Account"
- **For DEBIT**: Blue themed email with "💳 Payment Successful"
- Includes:
  - Student name
  - Transaction type (Credit/Debit)
  - Amount with +/- indicator
  - Description
  - Date & time (IST)
  - Updated balance

## How It Works

### Automatic Trigger

When a transaction is created through the API:

```bash
POST /api/admin/canteen/transactions
{
  "studentId": "student-id-here",
  "amount": 500,
  "type": "CREDIT",
  "description": "Monthly allowance"  // Optional - defaults to "Money added to account" or "Money deducted from account"
}
```

The system will:

1. Create the transaction in the database
2. Calculate the updated balance
3. Send a formatted email to the student's registered email
4. Log the email details to console (mock)

### Example Console Output

```
================================================================================
📧 MOCK EMAIL SENT
================================================================================
To: student@example.com
Subject: 💰 Money Added to Your Account - ₹500
--------------------------------------------------------------------------------
HTML Content:
[Formatted HTML email with transaction details]
================================================================================
```

## Implementation Details

### Modified Files

1. **`src/services/notificationService.js`**

   - Enhanced `sendEmail()` function with better formatting
   - Added `sendTransactionEmail()` for transaction-specific emails

2. **`src/services/canteenService.js`**
   - Integrated email notification in `addTransaction()`
   - Calculates balance after transaction
   - Handles email errors gracefully (doesn't fail transaction if email fails)

## Testing

### Test CREDIT Transaction (Money Added)

```bash
# With custom description
curl -X POST http://localhost:5000/api/admin/canteen/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "studentId": "STUDENT_ID",
    "amount": 1000,
    "type": "CREDIT",
    "description": "Monthly allowance added"
  }'

# Without description (uses default: "Money added to account")
curl -X POST http://localhost:5000/api/admin/canteen/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "studentId": "STUDENT_ID",
    "amount": 1000,
    "type": "CREDIT"
  }'
```

### Test DEBIT Transaction (Money Deducted)

```bash
# With custom description
curl -X POST http://localhost:5000/api/admin/canteen/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "studentId": "STUDENT_ID",
    "amount": 50,
    "type": "DEBIT",
    "description": "Canteen purchase - Lunch"
  }'

# Without description (uses default: "Money deducted from account")
curl -X POST http://localhost:5000/api/admin/canteen/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "studentId": "STUDENT_ID",
    "amount": 50,
    "type": "DEBIT"
  }'
```

## Future Enhancements

To use real email service (like Gmail, SendGrid, etc.), you can update `sendEmail()` in `notificationService.js`:

```javascript
// Install nodemailer
// npm install nodemailer

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendEmail = async ({ to, subject, text, html }) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
    html,
  });
  return true;
};
```

## Error Handling

- If email sending fails, the transaction still succeeds
- Email errors are logged but don't break the transaction flow
- This ensures system reliability even if email service is down

## Troubleshooting

### Missing Description Error

If you see an error like `Argument 'description' is missing`, the service now automatically provides default descriptions:

- **CREDIT transactions**: "Money added to account"
- **DEBIT transactions**: "Money deducted from account"

You can still provide custom descriptions in your API requests for better clarity.

### Email Not Showing in Console

Make sure:

1. Your server is running and processing the transaction successfully
2. Check the console output for the formatted email (starts with `📧 MOCK EMAIL SENT`)
3. The student record has a valid email address in the database
4. The transaction was created successfully (check for any Prisma errors)

## Notes

- Currently using **mock email** (console.log only)
- All emails are logged to console with formatted output
- No actual emails are sent to real email addresses
- Perfect for development and testing
- Replace with real email service for production
