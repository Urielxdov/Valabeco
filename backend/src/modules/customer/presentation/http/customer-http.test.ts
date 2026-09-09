import "reflect-metadata";
import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../../../../app.module";
import { ApiResponseInterceptor } from "../../../../shared/api-response.interceptor";
import { DomainExceptionFilter } from "../../../../shared/domain-exception.filter";
import { AuthResponseSchema } from "../../../../../../packages/contracts/src/identity";
import { CustomerSchema, CustomerDetailSchema, CustomerPageSchema } from "../../../../../../packages/contracts/src/customer";

test("customer HTTP endpoints enforce authentication, contracts and sales integration", { skip: !process.env.TEST_DATABASE_URL }, async () => {
  const connectionString = process.env.TEST_DATABASE_URL!;
  const schema = `customer_http_${randomUUID().replaceAll("-", "")}`;
  const admin = new Client({ connectionString });
  await admin.connect();
  const previousSecret = process.env.AUTH_TOKEN_SECRET;
  const globalPrisma = globalThis as unknown as { sharedPrisma?: PrismaClient };
  const previousPrisma = globalPrisma.sharedPrisma;
  try {
    await admin.query(`CREATE SCHEMA "${schema}"`);
    await admin.query(`SET search_path TO "${schema}"`);
    const root = join(process.cwd(), "prisma", "migrations");
    for (const entry of readdirSync(root, { withFileTypes: true }).filter(row => row.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
      await admin.query(readFileSync(join(root, entry.name, "migration.sql"), "utf8"));
    }
    const scopedUrl = new URL(connectionString);
    scopedUrl.searchParams.set("options", `-c search_path=${schema}`);
    const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: scopedUrl.toString() }, { schema }) });
    // Inyección del cliente aislado mediante el punto de composición compartido.
    globalPrisma.sharedPrisma = prisma;
    process.env.AUTH_TOKEN_SECRET = randomUUID();
    const app = await NestFactory.create(AppModule, { logger: false });
    app.useGlobalInterceptors(new ApiResponseInterceptor());
    app.useGlobalFilters(new DomainExceptionFilter());
    try {
      await app.listen(0, "127.0.0.1");
      const base = await app.getUrl();
      async function request(method: string, path: string, body?: unknown, token?: string) {
        const response = await fetch(base + path, {
          method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        });
        return { status: response.status, body: await response.json() as { success: boolean; data: unknown; error: { code: string; message: string } | null } };
      }
      assert.equal((await request("GET", "/customers")).status, 401);
      const registration = await request("POST", "/auth/register", { email: "http-test@example.com", name: "Actor HTTP", password: randomUUID() });
      assert.equal(registration.status, 201);
      const { token, user } = AuthResponseSchema.parse(registration.body.data);
      const input = { customerType: "COMPANY", displayName: "Empresa HTTP" };
      assert.equal((await request("POST", "/customers", { ...input, isGeneric: true }, token)).status, 400);
      assert.equal((await request("GET", "/customers?pageSize=9999", undefined, token)).status, 400);
      assert.equal((await request("GET", "/customers/invalid", undefined, token)).status, 400);
      assert.equal((await request("GET", `/customers/${randomUUID()}`, undefined, token)).status, 404);
      const created = await request("POST", "/customers", input, token);
      assert.equal(created.status, 201);
      const customer = CustomerSchema.parse(created.body.data);
      const path = `/customers/${customer.idCustomer}`;
      const detail = await request("GET", path, undefined, token);
      assert.equal(CustomerDetailSchema.parse(detail.body.data).taxProfile, null);
      const profile = { rfc: " http010101aa1 ", legalName: "Empresa HTTP", taxRegime: "601", taxZipCode: "01000" };
      const saved = await request("POST", path + "/tax-profile", profile, token);
      assert.equal(saved.status, 201);
      assert.equal(CustomerDetailSchema.parse(saved.body.data).taxProfile?.rfc, "HTTP010101AA1");
      const other = CustomerSchema.parse((await request("POST", "/customers", { ...input, displayName: "Otra" }, token)).body.data);
      assert.equal((await request("POST", `/customers/${other.idCustomer}/tax-profile`, profile, token)).status, 409);
      const sale = { idCustomer: customer.idCustomer, tax: "0.00", items: [{ description: "Servicio", quantity: "1", unitPrice: "100.00" }] };
      assert.equal((await request("POST", "/bi/sales", sale, token)).status, 201);
      assert.equal((await request("POST", path + "/tax-profile", { ...profile, rfc: "HTTP010101AA2", reason: "Corrección" }, token)).status, 422);
      assert.equal((await request("PATCH", path, { status: "INACTIVE" }, token)).status, 200);
      assert.equal((await request("POST", "/bi/sales", sale, token)).status, 422);
      const list = await request("GET", "/customers?status=INACTIVE&search=HTTP", undefined, token);
      assert.equal(CustomerPageSchema.parse(list.body.data).total, 1);
      const audit = await prisma.auditEvent.findFirstOrThrow({ where: { idRecord: customer.idCustomer, action: "CREATE_CUSTOMER" } });
      assert.equal(audit.idActor, user.idUser);
    } finally { await app.close(); await prisma.$disconnect(); }
  } finally {
    globalPrisma.sharedPrisma = previousPrisma;
    if (previousSecret === undefined) delete process.env.AUTH_TOKEN_SECRET;
    else process.env.AUTH_TOKEN_SECRET = previousSecret;
    await admin.query("ROLLBACK");
    await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await admin.end();
  }
});
