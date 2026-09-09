BEGIN;

-- Las ventas históricas requieren identificar a sus clientes antes de añadir la FK.
-- No reasignar silenciosamente esas ventas a PUBLICO GENERAL.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM sale) THEN
    RAISE EXCEPTION 'Existing sales require an explicit customer mapping before the customer migration. No sales were reassigned.';
  END IF;
END $$;

-- CreateEnum
CREATE TYPE "customer_type" AS ENUM ('PERSON', 'COMPANY');

-- CreateEnum
CREATE TYPE "customer_status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "customer_address_type" AS ENUM ('FISCAL', 'BILLING', 'SHIPPING', 'OTHER');

-- CreateTable
CREATE TABLE "customer" (
    "id_customer" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_type" "customer_type" NOT NULL,
    "display_name" VARCHAR(255) NOT NULL,
    "trade_name" VARCHAR(255),
    "is_generic" BOOLEAN NOT NULL DEFAULT false,
    "status" "customer_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "customer_pkey" PRIMARY KEY ("id_customer")
);

-- CreateTable
CREATE TABLE "customer_tax_profile" (
    "id_customer_tax_profile" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_customer" UUID NOT NULL,
    "rfc" VARCHAR(13) NOT NULL,
    "legal_name" VARCHAR(255) NOT NULL,
    "tax_regime" VARCHAR(3) NOT NULL,
    "tax_zip_code" VARCHAR(5) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "customer_tax_profile_pkey" PRIMARY KEY ("id_customer_tax_profile")
);

-- CreateTable
CREATE TABLE "customer_address" (
    "id_customer_address" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_customer" UUID NOT NULL,
    "address_type" "customer_address_type" NOT NULL,
    "street" VARCHAR(255) NOT NULL,
    "external_number" VARCHAR(50),
    "internal_number" VARCHAR(50),
    "neighborhood" VARCHAR(150),
    "city" VARCHAR(150) NOT NULL,
    "municipality" VARCHAR(150),
    "state" VARCHAR(150) NOT NULL,
    "country" VARCHAR(100) NOT NULL,
    "postal_code" VARCHAR(20) NOT NULL,
    "status" "customer_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "customer_address_pkey" PRIMARY KEY ("id_customer_address")
);

-- CreateTable
CREATE TABLE "customer_contact" (
    "id_customer_contact" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_customer" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "last_name" VARCHAR(150),
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "position" VARCHAR(150),
    "status" "customer_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "customer_contact_pkey" PRIMARY KEY ("id_customer_contact")
);

-- CreateIndex
CREATE INDEX "customer_status_display_name_idx" ON "customer"("status", "display_name");

-- CreateIndex
CREATE UNIQUE INDEX "customer_tax_profile_id_customer_key" ON "customer_tax_profile"("id_customer");

-- CreateIndex
CREATE UNIQUE INDEX "customer_tax_profile_rfc_key" ON "customer_tax_profile"("rfc");

-- CreateIndex
CREATE INDEX "customer_address_id_customer_status_idx" ON "customer_address"("id_customer", "status");

-- CreateIndex
CREATE INDEX "customer_contact_id_customer_status_idx" ON "customer_contact"("id_customer", "status");

-- AddForeignKey
ALTER TABLE "sale" ADD CONSTRAINT "sale_id_customer_fkey" FOREIGN KEY ("id_customer") REFERENCES "customer"("id_customer") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_tax_profile" ADD CONSTRAINT "customer_tax_profile_id_customer_fkey" FOREIGN KEY ("id_customer") REFERENCES "customer"("id_customer") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_address" ADD CONSTRAINT "customer_address_id_customer_fkey" FOREIGN KEY ("id_customer") REFERENCES "customer"("id_customer") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_contact" ADD CONSTRAINT "customer_contact_id_customer_fkey" FOREIGN KEY ("id_customer") REFERENCES "customer"("id_customer") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Restricciones parciales conservadas explícitamente en SQL.
CREATE UNIQUE INDEX "uq_customer_fiscal_active"
ON "customer_address" ("id_customer") WHERE "address_type" = 'FISCAL' AND "status" = 'ACTIVE';

CREATE UNIQUE INDEX "uq_customer_generic"
ON "customer" ("is_generic") WHERE "is_generic" = true;

ALTER TABLE "customer" ADD CONSTRAINT "customer_display_name_nonempty" CHECK (length(btrim("display_name")) > 0);
ALTER TABLE "customer" ADD CONSTRAINT "customer_generic_active" CHECK (NOT "is_generic" OR "status" = 'ACTIVE');
ALTER TABLE "customer_tax_profile" ADD CONSTRAINT "customer_rfc_normalized"
CHECK ("rfc" = upper(btrim("rfc")) AND "rfc" ~ '^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$');
ALTER TABLE "customer_tax_profile" ADD CONSTRAINT "customer_tax_required_fields"
CHECK (length(btrim("legal_name")) > 0 AND "tax_regime" ~ '^[0-9]{3}$' AND "tax_zip_code" ~ '^[0-9]{5}$');

INSERT INTO "customer" ("customer_type", "display_name", "is_generic", "updated_at")
VALUES ('PERSON', 'PUBLICO GENERAL', true, CURRENT_TIMESTAMP);

COMMIT;
