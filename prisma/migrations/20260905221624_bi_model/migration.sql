-- CreateEnum
CREATE TYPE "business_document_status" AS ENUM ('DRAFT', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "loan_status" AS ENUM ('ACTIVE', 'PAID', 'DEFAULTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "refund_status" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "sale" (
    "id_sale" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_customer" UUID NOT NULL,
    "date" TIMESTAMP(6) NOT NULL,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "tax" DECIMAL(15,2) NOT NULL,
    "total" DECIMAL(15,2) NOT NULL,
    "status" "business_document_status" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "sale_pkey" PRIMARY KEY ("id_sale")
);

-- CreateTable
CREATE TABLE "sale_item" (
    "id_sale_item" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_sale" UUID NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "sale_item_pkey" PRIMARY KEY ("id_sale_item")
);

-- CreateTable
CREATE TABLE "purchase" (
    "id_purchase" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_supplier" UUID NOT NULL,
    "date" TIMESTAMP(6) NOT NULL,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "tax" DECIMAL(15,2) NOT NULL,
    "total" DECIMAL(15,2) NOT NULL,
    "status" "business_document_status" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "purchase_pkey" PRIMARY KEY ("id_purchase")
);

-- CreateTable
CREATE TABLE "purchase_item" (
    "id_purchase_item" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_purchase" UUID NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "purchase_item_pkey" PRIMARY KEY ("id_purchase_item")
);

-- CreateTable
CREATE TABLE "expense" (
    "id_expense" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_party" UUID,
    "date" TIMESTAMP(6) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "status" "business_document_status" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "expense_pkey" PRIMARY KEY ("id_expense")
);

-- CreateTable
CREATE TABLE "loan" (
    "id_loan" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_lender" UUID NOT NULL,
    "principal" DECIMAL(15,2) NOT NULL,
    "interest_rate" DECIMAL(8,4) NOT NULL,
    "start_date" DATE NOT NULL,
    "maturity_date" DATE NOT NULL,
    "status" "loan_status" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "loan_pkey" PRIMARY KEY ("id_loan")
);

-- CreateTable
CREATE TABLE "loan_payment" (
    "id_loan_payment" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_loan" UUID NOT NULL,
    "date" TIMESTAMP(6) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "principal_amount" DECIMAL(15,2) NOT NULL,
    "interest_amount" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "loan_payment_pkey" PRIMARY KEY ("id_loan_payment")
);

-- CreateTable
CREATE TABLE "capital_contribution" (
    "id_contribution" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_owner" UUID NOT NULL,
    "date" TIMESTAMP(6) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "capital_contribution_pkey" PRIMARY KEY ("id_contribution")
);

-- CreateTable
CREATE TABLE "owner_withdrawal" (
    "id_withdrawal" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_owner" UUID NOT NULL,
    "date" TIMESTAMP(6) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "reason" VARCHAR(500),

    CONSTRAINT "owner_withdrawal_pkey" PRIMARY KEY ("id_withdrawal")
);

-- CreateTable
CREATE TABLE "refund" (
    "id_refund" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_sale" UUID NOT NULL,
    "date" TIMESTAMP(6) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "status" "refund_status" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "refund_pkey" PRIMARY KEY ("id_refund")
);

-- CreateIndex
CREATE INDEX "sale_id_customer_idx" ON "sale"("id_customer");

-- CreateIndex
CREATE INDEX "sale_date_idx" ON "sale"("date");

-- CreateIndex
CREATE INDEX "sale_item_id_sale_idx" ON "sale_item"("id_sale");

-- CreateIndex
CREATE INDEX "purchase_id_supplier_idx" ON "purchase"("id_supplier");

-- CreateIndex
CREATE INDEX "purchase_date_idx" ON "purchase"("date");

-- CreateIndex
CREATE INDEX "purchase_item_id_purchase_idx" ON "purchase_item"("id_purchase");

-- CreateIndex
CREATE INDEX "expense_id_party_idx" ON "expense"("id_party");

-- CreateIndex
CREATE INDEX "expense_date_idx" ON "expense"("date");

-- CreateIndex
CREATE INDEX "loan_id_lender_idx" ON "loan"("id_lender");

-- CreateIndex
CREATE INDEX "loan_payment_id_loan_idx" ON "loan_payment"("id_loan");

-- CreateIndex
CREATE INDEX "loan_payment_date_idx" ON "loan_payment"("date");

-- CreateIndex
CREATE INDEX "capital_contribution_id_owner_idx" ON "capital_contribution"("id_owner");

-- CreateIndex
CREATE INDEX "capital_contribution_date_idx" ON "capital_contribution"("date");

-- CreateIndex
CREATE INDEX "owner_withdrawal_id_owner_idx" ON "owner_withdrawal"("id_owner");

-- CreateIndex
CREATE INDEX "owner_withdrawal_date_idx" ON "owner_withdrawal"("date");

-- CreateIndex
CREATE INDEX "refund_id_sale_idx" ON "refund"("id_sale");

-- CreateIndex
CREATE INDEX "refund_date_idx" ON "refund"("date");

-- AddForeignKey
ALTER TABLE "sale_item" ADD CONSTRAINT "sale_item_id_sale_fkey" FOREIGN KEY ("id_sale") REFERENCES "sale"("id_sale") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_item" ADD CONSTRAINT "purchase_item_id_purchase_fkey" FOREIGN KEY ("id_purchase") REFERENCES "purchase"("id_purchase") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_payment" ADD CONSTRAINT "loan_payment_id_loan_fkey" FOREIGN KEY ("id_loan") REFERENCES "loan"("id_loan") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund" ADD CONSTRAINT "refund_id_sale_fkey" FOREIGN KEY ("id_sale") REFERENCES "sale"("id_sale") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Business rule checks
ALTER TABLE "sale" ADD CONSTRAINT "sale_amounts_check" CHECK ("subtotal" >= 0 AND "tax" >= 0 AND "total" = "subtotal" + "tax");
ALTER TABLE "sale_item" ADD CONSTRAINT "sale_item_amounts_check" CHECK ("quantity" > 0 AND "unit_price" >= 0);
ALTER TABLE "purchase" ADD CONSTRAINT "purchase_amounts_check" CHECK ("subtotal" >= 0 AND "tax" >= 0 AND "total" = "subtotal" + "tax");
ALTER TABLE "purchase_item" ADD CONSTRAINT "purchase_item_amounts_check" CHECK ("quantity" > 0 AND "unit_price" >= 0);
ALTER TABLE "expense" ADD CONSTRAINT "expense_amount_check" CHECK ("amount" > 0);
ALTER TABLE "loan" ADD CONSTRAINT "loan_amounts_check" CHECK ("principal" > 0 AND "interest_rate" >= 0 AND "maturity_date" >= "start_date");
ALTER TABLE "loan_payment" ADD CONSTRAINT "loan_payment_amounts_check" CHECK ("amount" > 0 AND "principal_amount" >= 0 AND "interest_amount" >= 0 AND "amount" = "principal_amount" + "interest_amount");
ALTER TABLE "capital_contribution" ADD CONSTRAINT "capital_contribution_amount_check" CHECK ("amount" > 0);
ALTER TABLE "owner_withdrawal" ADD CONSTRAINT "owner_withdrawal_amount_check" CHECK ("amount" > 0);
ALTER TABLE "refund" ADD CONSTRAINT "refund_amount_check" CHECK ("amount" > 0);
