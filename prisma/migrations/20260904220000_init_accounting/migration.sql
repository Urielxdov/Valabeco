CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "account_type" AS ENUM (
  'ASSET',
  'LIABILITY',
  'EQUITY',
  'REVENUE',
  'EXPENSE'
);

CREATE TYPE "transaction_status" AS ENUM (
  'DRAFT',
  'POSTED',
  'VOIDED'
);

CREATE TYPE "entry_type" AS ENUM (
  'DEBIT',
  'CREDIT'
);

CREATE TABLE "account" (
  "id_account" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "type" "account_type" NOT NULL,
  "balance" DECIMAL(15, 2) NOT NULL DEFAULT 0.00,

  CONSTRAINT "account_pkey" PRIMARY KEY ("id_account")
);

CREATE TABLE "transaction" (
  "id_transaction" UUID NOT NULL DEFAULT gen_random_uuid(),
  "date" TIMESTAMP(6) NOT NULL,
  "description" VARCHAR(500) NOT NULL,
  "status" "transaction_status" NOT NULL DEFAULT 'DRAFT',

  CONSTRAINT "transaction_pkey" PRIMARY KEY ("id_transaction")
);

CREATE TABLE "transaction_entry" (
  "id_transaction_entry" UUID NOT NULL DEFAULT gen_random_uuid(),
  "id_transaction" UUID NOT NULL,
  "id_account" UUID NOT NULL,
  "amount" DECIMAL(15, 2) NOT NULL,
  "type" "entry_type" NOT NULL,

  CONSTRAINT "transaction_entry_pkey" PRIMARY KEY ("id_transaction_entry"),
  CONSTRAINT "transaction_entry_amount_positive_check" CHECK ("amount" > 0)
);

CREATE INDEX "transaction_entry_id_transaction_idx"
  ON "transaction_entry"("id_transaction");

CREATE INDEX "transaction_entry_id_account_idx"
  ON "transaction_entry"("id_account");

ALTER TABLE "transaction_entry"
  ADD CONSTRAINT "transaction_entry_id_transaction_fkey"
  FOREIGN KEY ("id_transaction")
  REFERENCES "transaction"("id_transaction")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

ALTER TABLE "transaction_entry"
  ADD CONSTRAINT "transaction_entry_id_account_fkey"
  FOREIGN KEY ("id_account")
  REFERENCES "account"("id_account")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;
