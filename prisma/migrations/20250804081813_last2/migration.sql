-- AlterTable
ALTER TABLE "public"."Debt" ALTER COLUMN "amount" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "public"."Payment" ALTER COLUMN "amount" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "public"."PaymentHistory" ALTER COLUMN "amount" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "public"."Seller" ALTER COLUMN "wallet" SET DATA TYPE BIGINT;
