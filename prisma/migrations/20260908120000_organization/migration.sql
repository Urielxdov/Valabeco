-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "organization_status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "position_assignment_status" AS ENUM ('ACTIVE', 'ENDED', 'CANCELED');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "status" "user_status" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "job_position" (
    "id_job_position" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" VARCHAR(500),
    "max_positions" INTEGER,
    "status" "organization_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "job_position_pkey" PRIMARY KEY ("id_job_position")
);

-- CreateTable
CREATE TABLE "position" (
    "id_position" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_job_position" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "status" "organization_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "position_pkey" PRIMARY KEY ("id_position")
);

-- CreateTable
CREATE TABLE "position_assignment" (
    "id_position_assignment" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_position" UUID NOT NULL,
    "id_user" UUID NOT NULL,
    "start_date" TIMESTAMP(6) NOT NULL,
    "end_date" TIMESTAMP(6),
    "status" "position_assignment_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "position_assignment_pkey" PRIMARY KEY ("id_position_assignment")
);

-- CreateTable
CREATE TABLE "audit_event" (
    "id_audit_event" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_actor" UUID NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "entity" VARCHAR(50) NOT NULL,
    "id_record" UUID NOT NULL,
    "before" JSONB,
    "after" JSONB NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_event_pkey" PRIMARY KEY ("id_audit_event")
);

-- CreateIndex
CREATE UNIQUE INDEX "job_position_code_key" ON "job_position"("code");

-- CreateIndex
CREATE UNIQUE INDEX "position_code_key" ON "position"("code");

-- CreateIndex
CREATE INDEX "position_id_job_position_status_idx" ON "position"("id_job_position", "status");

-- CreateIndex
CREATE INDEX "position_assignment_id_position_start_date_idx" ON "position_assignment"("id_position", "start_date");

-- CreateIndex
CREATE INDEX "position_assignment_id_user_status_idx" ON "position_assignment"("id_user", "status");

-- CreateIndex
CREATE INDEX "audit_event_entity_id_record_created_at_idx" ON "audit_event"("entity", "id_record", "created_at");

-- AddForeignKey
ALTER TABLE "position" ADD CONSTRAINT "position_id_job_position_fkey" FOREIGN KEY ("id_job_position") REFERENCES "job_position"("id_job_position") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "position_assignment" ADD CONSTRAINT "position_assignment_id_position_fkey" FOREIGN KEY ("id_position") REFERENCES "position"("id_position") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "position_assignment" ADD CONSTRAINT "position_assignment_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "user"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_id_actor_fkey" FOREIGN KEY ("id_actor") REFERENCES "user"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Invariants not expressible in the Prisma schema. Keep these in SQL migrations.
ALTER TABLE "job_position" ADD CONSTRAINT "job_position_positive_limit"
CHECK ("max_positions" IS NULL OR "max_positions" > 0);

ALTER TABLE "position_assignment" ADD CONSTRAINT "position_assignment_valid_period"
CHECK ("end_date" IS NULL OR "end_date" >= "start_date");

ALTER TABLE "position_assignment" ADD CONSTRAINT "position_assignment_consistent_status"
CHECK (("status" = 'ACTIVE' AND "end_date" IS NULL)
    OR ("status" IN ('ENDED', 'CANCELED') AND "end_date" IS NOT NULL));

CREATE UNIQUE INDEX "uq_position_assignment_active_position"
ON "position_assignment" ("id_position")
WHERE "status" = 'ACTIVE' AND "end_date" IS NULL;
