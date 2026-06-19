-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('CASHIER', 'RUNNER');

-- CreateEnum
CREATE TYPE "ServiceChannel" AS ENUM ('DELIVERY', 'LOCAL', 'PICKUP');

-- AlterTable
ALTER TABLE "BusinessSettings" ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'America/Argentina/Buenos_Aires';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phone" TEXT,
ADD COLUMN     "pinHash" TEXT,
ADD COLUMN     "staffRole" "StaffRole";

-- CreateTable
CREATE TABLE "ChannelSettings" (
    "channel" "ServiceChannel" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ChannelSettings_pkey" PRIMARY KEY ("channel")
);

-- CreateTable
CREATE TABLE "ChannelSchedule" (
    "id" TEXT NOT NULL,
    "channel" "ServiceChannel" NOT NULL,
    "label" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "daysOfWeek" INTEGER[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChannelSchedule_pkey" PRIMARY KEY ("id")
);
