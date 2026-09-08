-- Identity already existed in schema.prisma but had no migration.
-- Preserve installations where this table was previously provisioned with db push.
CREATE TABLE IF NOT EXISTS "user" (
  "id_user" UUID NOT NULL DEFAULT gen_random_uuid(),
  "email" VARCHAR(255) NOT NULL,
  "password_hash" VARCHAR(255) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_pkey" PRIMARY KEY ("id_user")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_email_key" ON "user"("email");
