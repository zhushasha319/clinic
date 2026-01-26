-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "paymentChargeId" TEXT,
ADD COLUMN     "paymentCompletedAt" TIMESTAMP(3),
ADD COLUMN     "paymentOrderNo" TEXT,
ADD COLUMN     "paymentStatus" TEXT DEFAULT 'PENDING',
ADD COLUMN     "paymentTransactionId" TEXT;
