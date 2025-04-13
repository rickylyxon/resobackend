/*
  Warnings:

  - A unique constraint covering the columns `[registrationId]` on the table `Team` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Team_registrationId_key" ON "Team"("registrationId");
