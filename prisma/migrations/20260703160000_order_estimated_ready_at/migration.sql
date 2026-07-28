-- AlterTable
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "estimatedReadyAt" TIMESTAMP(3);
