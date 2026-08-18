-- AlterTable
ALTER TABLE "Registration" ADD COLUMN     "branch" TEXT,
ADD COLUMN     "paymentScreenshot" TEXT,
ADD COLUMN     "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedBy" TEXT,
ADD COLUMN     "year" TEXT;
