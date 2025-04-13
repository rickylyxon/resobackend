/*
  Warnings:

  - You are about to drop the column `userId` on the `EventUser` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "EventUser" DROP CONSTRAINT "EventUser_userId_fkey";

-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "paymentQr" DROP NOT NULL;

-- AlterTable
ALTER TABLE "EventUser" DROP COLUMN "userId";
