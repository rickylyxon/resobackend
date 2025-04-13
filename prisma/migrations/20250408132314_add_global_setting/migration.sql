-- CreateTable
CREATE TABLE "GlobalSetting" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "registrationOpen" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "GlobalSetting_pkey" PRIMARY KEY ("id")
);
