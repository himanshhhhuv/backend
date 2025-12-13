# 🤖 Telegram Bot Integration Guide

This document explains how to set up and use the Telegram Bot for the CDAC Hostel Management System.

## Table of Contents

- [Overview](#overview)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Available Commands](#available-commands)
- [Notification Features](#notification-features)
- [How Students Link Their Account](#how-students-link-their-account)
- [Admin Features](#admin-features)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Telegram Bot provides students with:

- **Quick access** to attendance, leave status, complaints, and canteen balance
- **Real-time notifications** for leave approvals, complaint updates, and transactions
- **Convenient commands** without needing to open the web portal

### Architecture

```
Student's Telegram App
        ↓
Telegram Cloud Servers
        ↓ (Long Polling)
Your Node.js Server (telegramBotService.js)
        ↓
Database (via existing services)
        ↓
Response sent back to student
```

---

## Setup Instructions

### Step 1: Create a Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` command
3. Follow the prompts:
   - Bot name: `CDAC Hostel Bot`
   - Bot username: `cdac_hostel_bot` (must end with `bot`)
4. Save the **Bot Token** provided (looks like: `6123456789:ABCdefGHIjklMNOpqrSTUvwxYZ123456789`)

### Step 2: Configure Environment Variables

Add these to your `.env` file:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_ENABLED=true
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

### Step 3: Install Dependencies

```bash
pnpm install
# or
npm install
```

### Step 4: Update Database Schema

```bash
npx prisma db push
# or
npx prisma migrate dev --name add-telegram-fields
```

### Step 5: Start the Server

```bash
pnpm dev
```

You should see:

```
✅ Connected to database
🤖 Telegram bot started successfully!
🚀 Server running on port 5000
```

### Step 6: Set Bot Commands (Optional but Recommended)

In Telegram, send to `@BotFather`:

```
/setcommands
```

Then select your bot and send:

```
start - Start the bot and link account
help - Show all available commands
attendance - Check your attendance
leave - View leave requests status
balance - Check canteen balance
menu - View today's menu
complaints - View your complaints
link - Link your hostel account
unlink - Unlink your account
```

---

## Environment Variables

| Variable               | Required | Description              | Example             |
| ---------------------- | -------- | ------------------------ | ------------------- |
| `TELEGRAM_BOT_ENABLED` | Yes      | Enable/disable the bot   | `true`              |
| `TELEGRAM_BOT_TOKEN`   | Yes      | Bot token from BotFather | `6123456789:ABC...` |

---

## Available Commands

### For All Users

| Command  | Description                        | Example  |
| -------- | ---------------------------------- | -------- |
| `/start` | Start the bot, see welcome message | `/start` |
| `/help`  | Show all available commands        | `/help`  |

### For Linked Users

| Command       | Description                  | Response                                                |
| ------------- | ---------------------------- | ------------------------------------------------------- |
| `/attendance` | Check attendance summary     | Shows present/absent/late days with percentage          |
| `/leave`      | View leave request status    | Shows pending/approved/rejected count + recent requests |
| `/balance`    | Check canteen balance        | Shows current balance + recent transactions             |
| `/menu`       | View today's canteen menu    | Shows available items by category with prices           |
| `/complaints` | View complaints status       | Shows pending/in-progress/resolved + recent complaints  |
| `/unlink`     | Unlink Telegram from account | Removes the connection                                  |

### Account Linking

| Command               | Description                     | Example              |
| --------------------- | ------------------------------- | -------------------- |
| `/link <roll_number>` | Link Telegram to hostel account | `/link 240340120001` |

---

## Notification Features

Students automatically receive notifications for:

### 1. Leave Status Updates

```
✅ Leave Approved

📅 From: 15 Dec 2024
📅 To: 18 Dec 2024
📝 Reason: Family function
Have a safe trip! 👋
```

### 2. Complaint Updates

```
🔄 Complaint Update

📋 Title: AC not working
📊 Status: IN PROGRESS
Someone is working on your complaint.
```

### 3. Transaction Alerts

```
🛒 Transaction Alert

-₹50.00
📝 Lunch - Dal Rice

💳 New Balance: ₹350.00
```

### 4. Low Balance Warnings

```
⚠️ Low Balance Alert

💰 Your current balance: ₹120.00

Please recharge soon to avoid service interruptions.
```

---

## How Students Link Their Account

1. Student opens Telegram and searches for your bot (e.g., `@cdac_hostel_bot`)
2. Sends `/start` to begin
3. Bot responds with welcome message and linking instructions
4. Student sends `/link 240340120001` (their roll number)
5. Bot verifies the roll number exists in the system
6. Account is linked - student can now use all commands

### Important Notes:

- Roll number must be registered in the hostel system first
- One Telegram account = One hostel account
- Student can unlink anytime with `/unlink`

---

## Admin Features

### Broadcast Message to All Students

From your code, you can use:

```javascript
import { broadcastToAllStudents } from "./services/telegramBotService.js";

// Send announcement to all linked students
await broadcastToAllStudents(
  "📢 *Important Announcement*\n\n" +
    "Hostel gate timing changed to 10 PM from today.\n\n" +
    "- Management"
);
```

### Send Custom Notification

```javascript
import { sendCustomNotification } from "./services/telegramBotService.js";

// Send to specific student
await sendCustomNotification(
  studentId,
  "🎉 Your room has been allocated!\n\n" +
    "Room Number: *A-204*\n" +
    "Floor: 2nd"
);
```

---

## Database Schema Changes

Two new fields added to `Profile` model:

```prisma
model Profile {
  // ... existing fields
  telegramChatId   String?  @unique  // Telegram chat ID
  telegramLinkedAt DateTime?         // When linked
}
```

---

## Troubleshooting

### Bot Not Responding

1. Check if `TELEGRAM_BOT_ENABLED=true` in `.env`
2. Verify `TELEGRAM_BOT_TOKEN` is correct
3. Check server logs for errors
4. Ensure you ran `pnpm install` after adding the package

### "User not found" Error

- Student must be registered in the hostel system first
- Roll number must match exactly (case-insensitive)

### Notifications Not Sending

- Check if student has linked their Telegram account
- Check server logs for errors
- Student might have blocked the bot

### Polling Conflicts

If running multiple instances:

```
Error: ETELEGRAM: 409 Conflict: terminated by other getUpdates request
```

**Solution**: Only run one server instance at a time, or use webhooks for production.

---

## Production Considerations

### Using Webhooks (Recommended for Production)

Instead of polling, use webhooks:

```javascript
// In telegramBotService.js
bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
bot.setWebHook(`${process.env.BACKEND_URL}/api/telegram/webhook`);

// Add route in app.js
app.post("/api/telegram/webhook", (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});
```

### Disabling Bot in Development

Set in `.env`:

```env
TELEGRAM_BOT_ENABLED=false
```

---

## Support

For issues or feature requests, contact the development team.
