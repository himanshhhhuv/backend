-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "telegramChatId" TEXT,
ADD COLUMN     "telegramLinkedAt" TIMESTAMP(3);

-- CreateUniqueIndex
CREATE UNIQUE INDEX "Profile_telegramChatId_key" ON "Profile"("telegramChatId");
