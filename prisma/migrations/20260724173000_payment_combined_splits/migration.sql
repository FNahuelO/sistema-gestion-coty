-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'COMBINED';

-- CreateTable
CREATE TABLE "OrderPaymentSplit" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderPaymentSplit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderPaymentSplit_orderId_idx" ON "OrderPaymentSplit"("orderId");

-- CreateIndex
CREATE INDEX "OrderPaymentSplit_method_idx" ON "OrderPaymentSplit"("method");

-- AddForeignKey
ALTER TABLE "OrderPaymentSplit" ADD CONSTRAINT "OrderPaymentSplit_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
