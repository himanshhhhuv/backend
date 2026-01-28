import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const STAFF_SEEDS = [
  {
    email: "admin@xyz.com",
    password: "admin123",
    role: "ADMIN",
    name: "Admin User",
    rollNo: "ADMIN001",
    phone: "9999999999",
    course: "Staff",
    year: 1,
  },
  {
    email: "canteen@xyz.com",
    password: "canteen123",
    role: "CANTEEN_MANAGER",
    name: "Canteen Manager",
    rollNo: "CANTEEN001",
    phone: "9999999998",
    course: "Staff",
    year: 1,
  },
  {
    email: "caretaker@xyz.com",
    password: "caretaker123",
    role: "CARETAKER",
    name: "Caretaker",
    rollNo: "CARETAKER001",
    phone: "9999999997",
    course: "Staff",
    year: 1,
  },
  {
    email: "warden@xyz.com",
    password: "warden123",
    role: "WARDEN",
    name: "Warden",
    rollNo: "WARDEN001",
    phone: "9999999996",
    course: "Staff",
    year: 1,
  },
];

async function main() {
  console.log("🌱 Seeding staff users...");

  for (const data of STAFF_SEEDS) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      console.log(`  ⏭️  ${data.email} already exists, skipping`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const { password: _p, ...profileData } = data;

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          role: data.role,
          isEmailVerified: true,
        },
      });
      await tx.profile.create({
        data: {
          userId: user.id,
          name: profileData.name,
          rollNo: profileData.rollNo,
          phone: profileData.phone,
          course: profileData.course,
          year: profileData.year,
        },
      });
    });
    console.log(`  ✅ Created ${data.email} (${data.role})`);
  }

  console.log("🌱 Seed finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
