-- AlterTable
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "dailyNumber" INTEGER;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "serviceDate" DATE;

-- CreateTable
CREATE TABLE IF NOT EXISTS "DailyOrderCounter" (
    "serviceDate" DATE NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DailyOrderCounter_pkey" PRIMARY KEY ("serviceDate")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Order_serviceDate_dailyNumber_idx" ON "Order"("serviceDate", "dailyNumber");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Order_serviceDate_dailyNumber_key" ON "Order"("serviceDate", "dailyNumber");
