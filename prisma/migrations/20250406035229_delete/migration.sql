/*
  Warnings:

  - You are about to drop the `EventUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "EventUser" DROP CONSTRAINT "EventUser_eventId_fkey";

-- DropForeignKey
ALTER TABLE "EventUser" DROP CONSTRAINT "EventUser_registrationId_fkey";

-- DropTable
DROP TABLE "EventUser";
