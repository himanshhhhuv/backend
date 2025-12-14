import TelegramBot from "node-telegram-bot-api";
import prisma from "../prisma/client.js";
import { getStudentAttendance } from "./attendanceService.js";
import { listLeaves } from "./leaveService.js";
import { listComplaints } from "./complaintService.js";
import { getAvailableMenu } from "./menuService.js";

/**
 * =========================================
 * TELEGRAM BOT SERVICE
 * =========================================
 *
 * This service handles all Telegram bot interactions:
 * - Account linking (connecting Telegram to hostel account)
 * - Commands: /attendance, /leave, /balance, /menu, /complaints
 * - Proactive notifications (leave status, complaint updates, etc.)
 *
 * SETUP INSTRUCTIONS:
 * 1. Create bot via @BotFather on Telegram
 * 2. Get bot token and add to .env: TELEGRAM_BOT_TOKEN=your_token
 * 3. Set TELEGRAM_BOT_ENABLED=true in .env
 *
 * Bot will automatically start when server starts.
 */

// Bot instance (initialized later)
let bot = null;

/**
 * Check if bot is enabled and token is configured
 */
const isBotEnabled = () => {
  return (
    process.env.TELEGRAM_BOT_ENABLED === "true" &&
    process.env.TELEGRAM_BOT_TOKEN
  );
};

/**
 * Format date in Indian locale
 */
const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

/**
 * Format date with time
 */
const formatDateTime = (date) => {
  return new Date(date).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Get user by Telegram chat ID
 */
const getUserByChatId = async (chatId) => {
  const profile = await prisma.profile.findUnique({
    where: { telegramChatId: String(chatId) },
    include: {
      user: {
        include: {
          room: true,
        },
      },
    },
  });
  return profile?.user || null;
};

/**
 * Get user by roll number (for linking)
 */
const getUserByRollNo = async (rollNo) => {
  const profile = await prisma.profile.findUnique({
    where: { rollNo: rollNo.toUpperCase() },
    include: {
      user: true,
    },
  });
  return profile || null;
};

/**
 * Calculate canteen balance for a student
 */
const getStudentBalance = async (studentId) => {
  const transactions = await prisma.transaction.findMany({
    where: { studentId },
  });

  let balance = 0;
  for (const txn of transactions) {
    if (txn.type === "CREDIT") {
      balance += txn.amount;
    } else {
      balance -= txn.amount;
    }
  }
  return balance;
};

/**
 * Initialize the Telegram bot
 */
export const initializeTelegramBot = () => {
  if (!isBotEnabled()) {
    console.log("ℹ️ Telegram bot is disabled or token not configured");
    return null;
  }

  try {
    bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
    console.log("🤖 Telegram bot started successfully!");

    // Register command handlers
    registerCommandHandlers();

    // Handle errors
    bot.on("polling_error", (error) => {
      console.error("Telegram polling error:", error.message);
    });

    return bot;
  } catch (error) {
    console.error("Failed to initialize Telegram bot:", error);
    return null;
  }
};

/**
 * Register all command handlers
 */
const registerCommandHandlers = () => {
  // ==========================================
  // /start - Welcome message and instructions
  // ==========================================
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || "there";

    // Check if already linked
    const existingUser = await getUserByChatId(chatId);

    if (existingUser) {
      const profile = await prisma.profile.findUnique({
        where: { userId: existingUser.id },
      });

      await bot.sendMessage(
        chatId,
        `👋 Welcome back, *${profile?.name || firstName}*!\n\n` +
          `Your account is already linked.\n\n` +
          `📋 *Available Commands:*\n` +
          `/attendance - Check your attendance\n` +
          `/leave - View leave requests\n` +
          `/balance - Check canteen balance\n` +
          `/menu - View today's menu\n` +
          `/complaints - View your complaints\n` +
          `/unlink - Unlink your account\n` +
          `/help - Show all commands`,
        { parse_mode: "Markdown" }
      );
    } else {
      await bot.sendMessage(
        chatId,
        `👋 Hello ${firstName}! Welcome to *CDAC Hostel Bot*!\n\n` +
          `🔗 To get started, link your hostel account:\n\n` +
          `\`/link YOUR_ROLL_NUMBER\`\n\n` +
          `Example: \`/link 240340120001\`\n\n` +
          `Once linked, you can:\n` +
          `📊 Check attendance\n` +
          `📋 View leave status\n` +
          `💰 Check canteen balance\n` +
          `🍽️ View today's menu\n` +
          `🔧 Track complaints`,
        { parse_mode: "Markdown" }
      );
    }
  });

  // ==========================================
  // /link - Link Telegram to hostel account
  // ==========================================
  bot.onText(/\/link\s+(.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const rollNo = match[1].trim().toUpperCase();

    try {
      // Check if this Telegram is already linked
      const existingLink = await getUserByChatId(chatId);
      if (existingLink) {
        await bot.sendMessage(
          chatId,
          `⚠️ Your Telegram is already linked to roll number: *${existingLink.profile?.rollNo}*\n\n` +
            `Use /unlink first if you want to link a different account.`,
          { parse_mode: "Markdown" }
        );
        return;
      }

      // Find user by roll number
      const profile = await getUserByRollNo(rollNo);
      if (!profile) {
        await bot.sendMessage(
          chatId,
          `❌ No account found with roll number: *${rollNo}*\n\n` +
            `Please check your roll number and try again.\n` +
            `Make sure you're registered on the hostel portal first.`,
          { parse_mode: "Markdown" }
        );
        return;
      }

      // Check if this roll number is already linked to another Telegram
      if (profile.telegramChatId) {
        await bot.sendMessage(
          chatId,
          `⚠️ This roll number is already linked to another Telegram account.\n\n` +
            `If this is your account, please contact the hostel office.`,
          { parse_mode: "Markdown" }
        );
        return;
      }

      // Link the account
      await prisma.profile.update({
        where: { id: profile.id },
        data: {
          telegramChatId: String(chatId),
          telegramLinkedAt: new Date(),
        },
      });

      await bot.sendMessage(
        chatId,
        `✅ *Account Linked Successfully!*\n\n` +
          `👤 Name: ${profile.name}\n` +
          `🎓 Roll No: ${profile.rollNo}\n` +
          `📚 Course: ${profile.course} (Year ${profile.year})\n\n` +
          `You'll now receive notifications for:\n` +
          `• Leave approvals/rejections\n` +
          `• Complaint updates\n` +
          `• Low balance alerts\n\n` +
          `Type /help to see all commands.`,
        { parse_mode: "Markdown" }
      );

      console.log(
        `📱 Telegram linked: ${profile.rollNo} -> Chat ID: ${chatId}`
      );
    } catch (error) {
      console.error("Error linking Telegram:", error);
      await bot.sendMessage(
        chatId,
        `❌ Something went wrong. Please try again later.`
      );
    }
  });

  // ==========================================
  // /unlink - Unlink Telegram account
  // ==========================================
  bot.onText(/\/unlink/, async (msg) => {
    const chatId = msg.chat.id;

    try {
      const user = await getUserByChatId(chatId);
      if (!user) {
        await bot.sendMessage(
          chatId,
          `ℹ️ Your Telegram is not linked to any account.`
        );
        return;
      }

      await prisma.profile.update({
        where: { userId: user.id },
        data: {
          telegramChatId: null,
          telegramLinkedAt: null,
        },
      });

      await bot.sendMessage(
        chatId,
        `✅ Account unlinked successfully.\n\n` +
          `You will no longer receive notifications.\n` +
          `Use /link to connect again.`
      );
    } catch (error) {
      console.error("Error unlinking Telegram:", error);
      await bot.sendMessage(
        chatId,
        `❌ Something went wrong. Please try again.`
      );
    }
  });

  // ==========================================
  // /attendance - Check attendance
  // ==========================================
  bot.onText(/\/attendance/, async (msg) => {
    const chatId = msg.chat.id;

    try {
      const user = await getUserByChatId(chatId);
      if (!user) {
        await bot.sendMessage(
          chatId,
          `🔗 Please link your account first:\n\`/link YOUR_ROLL_NUMBER\``,
          { parse_mode: "Markdown" }
        );
        return;
      }

      const attendance = await getStudentAttendance(user.id);

      if (!attendance || attendance.length === 0) {
        await bot.sendMessage(chatId, `📊 No attendance records found.`);
        return;
      }

      // Calculate stats
      const total = attendance.length;
      const present = attendance.filter((a) => a.status === "PRESENT").length;
      const absent = attendance.filter((a) => a.status === "ABSENT").length;
      const late = attendance.filter((a) => a.status === "LATE").length;
      const percentage = ((present / total) * 100).toFixed(1);

      // Get last 5 records
      const recentRecords = attendance.slice(0, 5);
      let recentText = recentRecords
        .map((a) => {
          const statusEmoji =
            a.status === "PRESENT" ? "✅" : a.status === "ABSENT" ? "❌" : "⚠️";
          return `${statusEmoji} ${formatDate(a.date)} - ${a.status}`;
        })
        .join("\n");

      const warningText =
        parseFloat(percentage) < 75
          ? `\n\n⚠️ *Warning:* Your attendance is below 75%!`
          : "";

      await bot.sendMessage(
        chatId,
        `📊 *Your Attendance Summary*\n\n` +
          `✅ Present: ${present} days\n` +
          `❌ Absent: ${absent} days\n` +
          `⚠️ Late: ${late} days\n` +
          `📈 *Percentage: ${percentage}%*${warningText}\n\n` +
          `📅 *Recent Records:*\n${recentText}`,
        { parse_mode: "Markdown" }
      );
    } catch (error) {
      console.error("Error fetching attendance:", error);
      await bot.sendMessage(
        chatId,
        `❌ Failed to fetch attendance. Try again.`
      );
    }
  });

  // ==========================================
  // /leave - Check leave status
  // ==========================================
  bot.onText(/\/leave/, async (msg) => {
    const chatId = msg.chat.id;

    try {
      const user = await getUserByChatId(chatId);
      if (!user) {
        await bot.sendMessage(
          chatId,
          `🔗 Please link your account first:\n\`/link YOUR_ROLL_NUMBER\``,
          { parse_mode: "Markdown" }
        );
        return;
      }

      const leaves = await listLeaves(user.id);

      if (!leaves || leaves.length === 0) {
        await bot.sendMessage(
          chatId,
          `📋 *Leave Requests*\n\n` +
            `┌─────────────────────────────┐\n` +
            `│  No leave requests found.   │\n` +
            `└─────────────────────────────┘\n\n` +
            `💡 Apply for leave through the web portal.`,
          { parse_mode: "Markdown" }
        );
        return;
      }

      // Calculate stats
      const total = leaves.length;
      const pending = leaves.filter((l) => l.status === "PENDING").length;
      const approved = leaves.filter((l) => l.status === "APPROVED").length;
      const rejected = leaves.filter((l) => l.status === "REJECTED").length;

      // Create progress bar for approval rate
      const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;
      const filledBlocks = Math.round(approvalRate / 10);
      const progressBar =
        "█".repeat(filledBlocks) + "░".repeat(10 - filledBlocks);

      // Build stats table
      let statsTable =
        `\`\`\`\n` +
        `╔═══════════════════════════════╗\n` +
        `║     📋 LEAVE SUMMARY          ║\n` +
        `╠═══════════════════════════════╣\n` +
        `║  ⏳ Pending    │    ${String(pending).padStart(3)}        ║\n` +
        `║  ✅ Approved   │    ${String(approved).padStart(3)}        ║\n` +
        `║  ❌ Rejected   │    ${String(rejected).padStart(3)}        ║\n` +
        `╠═══════════════════════════════╣\n` +
        `║  📊 Total      │    ${String(total).padStart(3)}        ║\n` +
        `╚═══════════════════════════════╝\n` +
        `\`\`\``;

      // Approval rate visual
      let approvalRateText =
        `\n*Approval Rate:* ${approvalRate}%\n` + `\`[${progressBar}]\`\n`;

      // Get recent leaves (last 5)
      const recentLeaves = leaves.slice(0, 5);

      // Build leaves table
      let leavesTable = `\n📅 *Recent Leave Requests:*\n\n`;

      recentLeaves.forEach((l, index) => {
        const statusEmoji =
          l.status === "APPROVED"
            ? "✅"
            : l.status === "REJECTED"
            ? "❌"
            : "⏳";

        const fromDate = formatDate(l.fromDate);
        const toDate = formatDate(l.toDate);

        // Calculate duration
        const diffTime = Math.abs(new Date(l.toDate) - new Date(l.fromDate));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        const durationText = diffDays === 1 ? "1 day" : `${diffDays} days`;

        const statusText = l.status.charAt(0) + l.status.slice(1).toLowerCase();
        const reason =
          l.reason.length > 25 ? l.reason.substring(0, 25) + "..." : l.reason;

        leavesTable +=
          `${statusEmoji} *#${index + 1}* — _${statusText}_\n` +
          `┌ 📆 \`${fromDate}\` → \`${toDate}\`\n` +
          `├ ⏱️ Duration: ${durationText}\n` +
          `└ 📝 ${reason}\n\n`;
      });

      // Add tip for pending leaves
      const tipText =
        pending > 0
          ? `\n💡 _You have ${pending} pending request(s). Check the portal for updates._`
          : "";

      await bot.sendMessage(
        chatId,
        `📋 *Your Leave Requests*\n` +
          statsTable +
          approvalRateText +
          leavesTable +
          tipText,
        { parse_mode: "Markdown" }
      );
    } catch (error) {
      console.error("Error fetching leaves:", error);
      await bot.sendMessage(chatId, `❌ Failed to fetch leaves. Try again.`);
    }
  });

  // ==========================================
  // /balance - Check canteen balance
  // ==========================================
  bot.onText(/\/balance/, async (msg) => {
    const chatId = msg.chat.id;

    try {
      const user = await getUserByChatId(chatId);
      if (!user) {
        await bot.sendMessage(
          chatId,
          `🔗 Please link your account first:\n\`/link YOUR_ROLL_NUMBER\``,
          { parse_mode: "Markdown" }
        );
        return;
      }

      const balance = await getStudentBalance(user.id);

      // Get recent transactions
      const transactions = await prisma.transaction.findMany({
        where: { studentId: user.id },
        orderBy: { date: "desc" },
        take: 5,
      });

      let txnText = "";
      if (transactions.length > 0) {
        txnText = transactions
          .map((t) => {
            const emoji = t.type === "CREDIT" ? "💵" : "🛒";
            const sign = t.type === "CREDIT" ? "+" : "-";
            return `${emoji} ${sign}₹${t.amount.toFixed(
              2
            )} - ${t.description.substring(0, 20)}`;
          })
          .join("\n");
      }

      const warningText =
        balance < 250 ? `\n\n⚠️ *Low balance!* Please recharge soon.` : "";

      await bot.sendMessage(
        chatId,
        `💰 *Canteen Balance*\n\n` +
          `💳 Current Balance: *₹${balance.toFixed(2)}*${warningText}\n\n` +
          (txnText
            ? `📜 *Recent Transactions:*\n${txnText}`
            : `No transactions yet.`),
        { parse_mode: "Markdown" }
      );
    } catch (error) {
      console.error("Error fetching balance:", error);
      await bot.sendMessage(chatId, `❌ Failed to fetch balance. Try again.`);
    }
  });

  // ==========================================
  // /menu - View today's menu
  // ==========================================
  bot.onText(/\/menu/, async (msg) => {
    const chatId = msg.chat.id;

    try {
      const { grouped } = await getAvailableMenu();

      if (!grouped || Object.keys(grouped).length === 0) {
        await bot.sendMessage(chatId, `🍽️ No menu items available today.`);
        return;
      }

      let menuText = "";
      const categoryEmojis = {
        BREAKFAST: "🍳",
        LUNCH: "🍛",
        DINNER: "🍽️",
        SNACKS: "🍿",
        BEVERAGES: "☕",
        FRUITS: "🍎",
        EXTRAS: "🧁",
      };

      for (const [category, items] of Object.entries(grouped)) {
        if (items && items.length > 0) {
          const emoji = categoryEmojis[category] || "🍴";
          menuText += `\n${emoji} *${category}*\n`;
          menuText += items
            .map((i) => `   • ${i.name} - ₹${i.price}`)
            .join("\n");
          menuText += "\n";
        }
      }

      await bot.sendMessage(chatId, `🍽️ *Today's Menu*\n` + menuText, {
        parse_mode: "Markdown",
      });
    } catch (error) {
      console.error("Error fetching menu:", error);
      await bot.sendMessage(chatId, `❌ Failed to fetch menu. Try again.`);
    }
  });

  // ==========================================
  // /complaints - View complaints
  // ==========================================
  bot.onText(/\/complaints/, async (msg) => {
    const chatId = msg.chat.id;

    try {
      const user = await getUserByChatId(chatId);
      if (!user) {
        await bot.sendMessage(
          chatId,
          `🔗 Please link your account first:\n\`/link YOUR_ROLL_NUMBER\``,
          { parse_mode: "Markdown" }
        );
        return;
      }

      const complaints = await listComplaints({ studentId: user.id });

      if (!complaints || complaints.length === 0) {
        await bot.sendMessage(
          chatId,
          `🔧 *Complaints*\n\n` +
            `┌─────────────────────────────┐\n` +
            `│   No complaints found.      │\n` +
            `└─────────────────────────────┘\n\n` +
            `💡 Register complaints through the web portal.`,
          { parse_mode: "Markdown" }
        );
        return;
      }

      // Calculate stats
      const total = complaints.length;
      const pending = complaints.filter((c) => c.status === "PENDING").length;
      const inProgress = complaints.filter(
        (c) => c.status === "IN_PROGRESS"
      ).length;
      const resolved = complaints.filter((c) => c.status === "RESOLVED").length;

      // Create resolution rate progress bar
      const resolutionRate =
        total > 0 ? Math.round((resolved / total) * 100) : 0;
      const filledBlocks = Math.round(resolutionRate / 10);
      const progressBar =
        "█".repeat(filledBlocks) + "░".repeat(10 - filledBlocks);

      // Build stats table
      let statsTable =
        `\`\`\`\n` +
        `╔═══════════════════════════════╗\n` +
        `║     🔧 COMPLAINTS SUMMARY     ║\n` +
        `╠═══════════════════════════════╣\n` +
        `║  ⏳ Pending     │    ${String(pending).padStart(3)}       ║\n` +
        `║  🔄 In Progress │    ${String(inProgress).padStart(3)}       ║\n` +
        `║  ✅ Resolved    │    ${String(resolved).padStart(3)}       ║\n` +
        `╠═══════════════════════════════╣\n` +
        `║  📊 Total       │    ${String(total).padStart(3)}       ║\n` +
        `╚═══════════════════════════════╝\n` +
        `\`\`\``;

      // Resolution rate visual
      let resolutionRateText =
        `\n*Resolution Rate:* ${resolutionRate}%\n` + `\`[${progressBar}]\`\n`;

      // Get recent complaints (last 5)
      const recentComplaints = complaints.slice(0, 5);

      // Build complaints list with categories
      let complaintsTable = `\n📋 *Recent Complaints:*\n\n`;

      recentComplaints.forEach((c, index) => {
        const statusEmoji =
          c.status === "RESOLVED"
            ? "✅"
            : c.status === "IN_PROGRESS"
            ? "🔄"
            : "⏳";

        // Status with visual indicator
        const statusBar =
          c.status === "RESOLVED"
            ? "████████"
            : c.status === "IN_PROGRESS"
            ? "████░░░░"
            : "██░░░░░░";

        const statusText = c.status.replace("_", " ");
        const title =
          c.title.length > 22 ? c.title.substring(0, 22) + "..." : c.title;
        const category = c.category || "General";
        const createdDate = formatDate(c.createdAt);

        // Category emoji
        const categoryEmojis = {
          ELECTRICAL: "⚡",
          PLUMBING: "🚿",
          FURNITURE: "🪑",
          CLEANING: "🧹",
          FOOD: "🍽️",
          NETWORK: "📶",
          OTHER: "📌",
          GENERAL: "📌",
        };
        const categoryEmoji = categoryEmojis[category.toUpperCase()] || "📌";

        complaintsTable +=
          `${statusEmoji} *#${index + 1}* — ${title}\n` +
          `┌ ${categoryEmoji} Category: _${category}_\n` +
          `├ 📅 Filed: ${createdDate}\n` +
          `├ 📊 Status: \`${statusText}\`\n` +
          `└ Progress: \`[${statusBar}]\`\n\n`;
      });

      // Add tips based on status
      let tipText = "";
      if (pending > 0) {
        tipText = `\n⏳ _${pending} complaint(s) awaiting review._`;
      }
      if (inProgress > 0) {
        tipText += `\n🔄 _${inProgress} complaint(s) being worked on._`;
      }

      await bot.sendMessage(
        chatId,
        `🔧 *Your Complaints*\n` +
          statsTable +
          resolutionRateText +
          complaintsTable +
          tipText,
        { parse_mode: "Markdown" }
      );
    } catch (error) {
      console.error("Error fetching complaints:", error);
      await bot.sendMessage(
        chatId,
        `❌ Failed to fetch complaints. Try again.`
      );
    }
  });

  // ==========================================
  // /help - Show all commands
  // ==========================================
  bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;

    await bot.sendMessage(
      chatId,
      `📚 *CDAC Hostel Bot Commands*\n\n` +
        `🔗 *Account*\n` +
        `/start - Start the bot\n` +
        `/link [roll\\_no] - Link your account\n` +
        `/unlink - Unlink your account\n\n` +
        `📊 *Information*\n` +
        `/attendance - Check your attendance\n` +
        `/leave - View leave requests\n` +
        `/balance - Check canteen balance\n` +
        `/menu - View today's menu\n` +
        `/complaints - View your complaints\n\n` +
        `❓ *Support*\n` +
        `/help - Show this help message\n\n` +
        `💡 *Tip:* You'll automatically receive notifications for leave approvals, complaint updates, and low balance alerts!`,
      { parse_mode: "Markdown" }
    );
  });

  // ==========================================
  // Handle unknown commands
  // ==========================================
  bot.on("message", async (msg) => {
    // Ignore if it's a command we've handled
    if (msg.text && msg.text.startsWith("/")) {
      const knownCommands = [
        "/start",
        "/link",
        "/unlink",
        "/attendance",
        "/leave",
        "/balance",
        "/menu",
        "/complaints",
        "/help",
      ];
      const command = msg.text.split(" ")[0].toLowerCase();
      if (!knownCommands.includes(command)) {
        await bot.sendMessage(
          msg.chat.id,
          `❓ Unknown command. Type /help to see available commands.`
        );
      }
    }
  });
};

// =============================================
// PROACTIVE NOTIFICATION FUNCTIONS
// =============================================
// These functions are called from other services
// to send notifications to students via Telegram

/**
 * Send leave status notification to student
 * @param {string} studentId - Student user ID
 * @param {string} status - Leave status (APPROVED/REJECTED)
 * @param {Object} leaveDetails - Leave details (fromDate, toDate, reason)
 */
export const sendLeaveNotification = async (
  studentId,
  status,
  leaveDetails
) => {
  if (!bot) return;

  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: studentId },
    });

    if (!profile?.telegramChatId) return;

    const emoji = status === "APPROVED" ? "✅" : "❌";
    const statusText = status === "APPROVED" ? "Approved" : "Rejected";

    await bot.sendMessage(
      profile.telegramChatId,
      `${emoji} *Leave ${statusText}*\n\n` +
        `📅 From: ${formatDate(leaveDetails.fromDate)}\n` +
        `📅 To: ${formatDate(leaveDetails.toDate)}\n` +
        `📝 Reason: ${leaveDetails.reason}\n\n` +
        `${
          status === "APPROVED"
            ? "Have a safe trip! 👋"
            : "Please contact the warden for more details."
        }`,
      { parse_mode: "Markdown" }
    );

    console.log(`📱 Leave notification sent to ${profile.rollNo}`);
  } catch (error) {
    console.error("Failed to send leave notification:", error);
  }
};

/**
 * Send complaint status update notification
 * @param {string} studentId - Student user ID
 * @param {Object} complaint - Complaint details
 */
export const sendComplaintNotification = async (studentId, complaint) => {
  if (!bot) return;

  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: studentId },
    });

    if (!profile?.telegramChatId) return;

    const emoji =
      complaint.status === "RESOLVED"
        ? "✅"
        : complaint.status === "IN_PROGRESS"
        ? "🔄"
        : "📝";
    const statusText = complaint.status.replace("_", " ");

    await bot.sendMessage(
      profile.telegramChatId,
      `${emoji} *Complaint Update*\n\n` +
        `📋 Title: ${complaint.title}\n` +
        `📊 Status: *${statusText}*\n\n` +
        `${
          complaint.status === "RESOLVED"
            ? "Your complaint has been resolved! 🎉"
            : complaint.status === "IN_PROGRESS"
            ? "Someone is working on your complaint."
            : ""
        }`,
      { parse_mode: "Markdown" }
    );

    console.log(`📱 Complaint notification sent to ${profile.rollNo}`);
  } catch (error) {
    console.error("Failed to send complaint notification:", error);
  }
};

/**
 * Send low balance warning
 * @param {string} studentId - Student user ID
 * @param {number} balance - Current balance
 */
export const sendLowBalanceNotification = async (studentId, balance) => {
  if (!bot) return;

  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: studentId },
    });

    if (!profile?.telegramChatId) return;

    await bot.sendMessage(
      profile.telegramChatId,
      `⚠️ *Low Balance Alert*\n\n` +
        `💰 Your current balance: *₹${balance.toFixed(2)}*\n\n` +
        `Please recharge soon to avoid service interruptions.\n\n` +
        `💡 Type /balance to check your transaction history.`,
      { parse_mode: "Markdown" }
    );

    console.log(`📱 Low balance alert sent to ${profile.rollNo}`);
  } catch (error) {
    console.error("Failed to send low balance notification:", error);
  }
};

/**
 * Send transaction notification
 * @param {string} studentId - Student user ID
 * @param {Object} transaction - Transaction details
 * @param {number} newBalance - New balance after transaction
 */
export const sendTransactionNotification = async (
  studentId,
  transaction,
  newBalance
) => {
  if (!bot) return;

  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: studentId },
    });

    if (!profile?.telegramChatId) return;

    const isCredit = transaction.type === "CREDIT";
    const emoji = isCredit ? "💵" : "🛒";
    const sign = isCredit ? "+" : "-";

    await bot.sendMessage(
      profile.telegramChatId,
      `${emoji} *Transaction Alert*\n\n` +
        `${sign}₹${transaction.amount.toFixed(2)}\n` +
        `📝 ${transaction.description}\n\n` +
        `💳 New Balance: *₹${newBalance.toFixed(2)}*`,
      { parse_mode: "Markdown" }
    );
  } catch (error) {
    console.error("Failed to send transaction notification:", error);
  }
};

/**
 * Send custom notification to a student
 * @param {string} studentId - Student user ID
 * @param {string} message - Message to send (supports Markdown)
 */
export const sendCustomNotification = async (studentId, message) => {
  if (!bot) return;

  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: studentId },
    });

    if (!profile?.telegramChatId) return;

    await bot.sendMessage(profile.telegramChatId, message, {
      parse_mode: "Markdown",
    });
  } catch (error) {
    console.error("Failed to send custom notification:", error);
  }
};

/**
 * Broadcast message to all linked students
 * @param {string} message - Message to broadcast (supports Markdown)
 */
export const broadcastToAllStudents = async (message) => {
  if (!bot) return;

  try {
    const linkedProfiles = await prisma.profile.findMany({
      where: {
        telegramChatId: { not: null },
      },
    });

    let sent = 0;
    for (const profile of linkedProfiles) {
      try {
        await bot.sendMessage(profile.telegramChatId, message, {
          parse_mode: "Markdown",
        });
        sent++;
      } catch (e) {
        // User may have blocked the bot
        console.error(`Failed to send to ${profile.rollNo}:`, e.message);
      }
    }

    console.log(
      `📢 Broadcast sent to ${sent}/${linkedProfiles.length} students`
    );
    return { sent, total: linkedProfiles.length };
  } catch (error) {
    console.error("Failed to broadcast:", error);
    throw error;
  }
};

export default {
  initializeTelegramBot,
  sendLeaveNotification,
  sendComplaintNotification,
  sendLowBalanceNotification,
  sendTransactionNotification,
  sendCustomNotification,
  broadcastToAllStudents,
};
