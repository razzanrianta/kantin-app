/*
  Warnings:

  - The values [PENDING] on the enum `MerchantApplicationStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MerchantApplicationStatus_new" AS ENUM ('UNDER_REVIEW', 'APPROVED', 'REJECTED');
ALTER TABLE "public"."MerchantApplication" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "MerchantApplication" ALTER COLUMN "status" TYPE "MerchantApplicationStatus_new" USING ("status"::text::"MerchantApplicationStatus_new");
ALTER TYPE "MerchantApplicationStatus" RENAME TO "MerchantApplicationStatus_old";
ALTER TYPE "MerchantApplicationStatus_new" RENAME TO "MerchantApplicationStatus";
DROP TYPE "public"."MerchantApplicationStatus_old";
ALTER TABLE "MerchantApplication" ALTER COLUMN "status" SET DEFAULT 'UNDER_REVIEW';
COMMIT;

-- AlterTable
ALTER TABLE "MerchantApplication" ALTER COLUMN "status" SET DEFAULT 'UNDER_REVIEW';
