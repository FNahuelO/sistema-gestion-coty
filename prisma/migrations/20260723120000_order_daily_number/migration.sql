-- AlterTable
ALTER TABLE "Order" ADD COLUMN "dailyNumber" INTEGER;
ALTER TABLE "Order" ADD COLUMN "serviceDate" DATE;

-- CreateTable
CREATE TABLE "DailyOrderCounter" (
    "serviceDate" DATE NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DailyOrderCounter_pkey" PRIMARY KEY ("serviceDate")
);

-- CreateIndex
CREATE INDEX "Order_serviceDate_dailyNumber_idx" ON "Order"("serviceDate", "dailyNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Order_serviceDate_dailyNumber_key" ON "Order"("serviceDate", "dailyNumber");
