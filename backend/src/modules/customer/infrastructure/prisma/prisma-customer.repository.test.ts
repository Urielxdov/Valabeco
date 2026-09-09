import "reflect-metadata";
import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaCustomerRepository } from "./prisma-customer.repository";
import { PrismaBusinessIntelligenceRepository } from "../../../business-intelligence/infrastructure/prisma/prisma-business-intelligence.repository";
import { Money } from "../../../../shared/domain/money";

test("customer persistence, migrations, audit and concurrent sales", { skip: !process.env.TEST_DATABASE_URL }, async t => {
  const connectionString = process.env.TEST_DATABASE_URL!;
  const schema = `customer_test_${randomUUID().replaceAll("-", "")}`;
  const admin = new Client({ connectionString });
  await admin.connect();
  try {
    await admin.query(`CREATE SCHEMA "${schema}"`);
    await admin.query(`SET search_path TO "${schema}"`);
    const root = join(process.cwd(), "prisma", "migrations");
    for (const directory of readdirSync(root, { withFileTypes: true }).filter(entry => entry.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
      await admin.query(readFileSync(join(root, directory.name, "migration.sql"), "utf8"));
    }
    const scopedUrl = new URL(connectionString);
    scopedUrl.searchParams.set("options", `-c search_path=${schema}`);
    const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: scopedUrl.toString() }, { schema }) });
    try {
      const repo = new PrismaCustomerRepository(prisma);
      const sales = new PrismaBusinessIntelligenceRepository(prisma);
      const actor = await prisma.user.create({ data: { email: "customer-actor@example.com", passwordHash: "test-only", name: "Actor" } });
      const actorId = actor.idUser;
      const makeCustomer = (displayName: string) => repo.create({ customerType: "COMPANY", displayName }, actorId);
      const makeSale = (idCustomer: string) => sales.createSale({
        idCustomer, date: new Date(), subtotal: Money.fromDecimal("100.00"), tax: Money.zero(),
        total: Money.fromDecimal("100.00"), status: "DRAFT",
        items: [{ description: "Servicio", quantity: "1", unitPrice: Money.fromDecimal("100.00") }],
      });
      const tax = { rfc: "ABC010101AAA", legalName: "Empresa", taxRegime: "601", taxZipCode: "01000" };
      const address = { addressType: "FISCAL" as const, street: "Principal", city: "Ciudad", state: "Estado", country: "México", postalCode: "01000" };
      const customer = await makeCustomer("Cliente principal");
      const id = customer.idCustomer;

      await t.test("create without RFC and capture it after an existing sale", async () => {
        assert.equal((await repo.get(id)).taxProfile, null);
        await makeSale(id);
        const result = await repo.saveTaxProfile(id, tax, actorId);
        assert.equal(result.taxProfile?.rfc, tax.rfc);
        assert.equal(result.hasTransactions, true);
        await assert.rejects(() => repo.saveTaxProfile(id, { ...tax, rfc: "ABC010101BBB", reason: "Corrección" }, actorId));
        assert.equal((await repo.get(id)).taxProfile?.rfc, tax.rfc);
      });

      await t.test("RFC uniqueness and audit rollback", async () => {
        const other = await makeCustomer("Otro cliente");
        const before = await prisma.auditEvent.count();
        await assert.rejects(() => repo.saveTaxProfile(other.idCustomer, tax, actorId));
        assert.equal((await repo.get(other.idCustomer)).taxProfile, null);
        assert.equal(await prisma.auditEvent.count(), before);
        await assert.rejects(() => repo.create({ customerType: "PERSON", displayName: "Rollback" }, randomUUID()));
        assert.equal(await prisma.customer.count({ where: { displayName: "Rollback" } }), 0);
      });

      await t.test("correction without sales requires a reason and stores the previous RFC", async () => {
        const other = await makeCustomer("Corregible");
        await repo.saveTaxProfile(other.idCustomer, { ...tax, rfc: "COR010101AAA" }, actorId);
        await assert.rejects(() => repo.saveTaxProfile(other.idCustomer, { ...tax, rfc: "COR010101BBB" }, actorId));
        const result = await repo.saveTaxProfile(other.idCustomer, { ...tax, rfc: "COR010101BBB", reason: "Error de captura" }, actorId);
        const audit = await prisma.auditEvent.findFirstOrThrow({ where: { idRecord: result.taxProfile!.idCustomerTaxProfile, action: "SAVE_CUSTOMER_TAX_PROFILE", after: { path: ["reason"], equals: "Error de captura" } } });
        assert.equal((audit.before as { rfc: string }).rfc, "COR010101AAA");
        assert.equal((audit.after as { reason: string }).reason, "Error de captura");
        assert.equal(audit.idActor, actorId);
      });

      await t.test("fiscal replacement and postal synchronization retain history", async () => {
        await repo.addAddress(id, address, actorId);
        await repo.addAddress(id, { ...address, street: "Segunda" }, actorId);
        let detail = await repo.get(id);
        assert.equal(detail.addresses.filter(row => row.status === "ACTIVE").length, 1);
        assert.equal(detail.addresses.length, 2);
        await repo.saveTaxProfile(id, { ...tax, taxZipCode: "02000" }, actorId);
        detail = await repo.get(id);
        assert.equal(detail.addresses.find(row => row.status === "ACTIVE")?.postalCode, "02000");
        assert.equal(detail.addresses.length, 3);
        const historic = detail.addresses.find(row => row.status === "INACTIVE")!;
        await assert.rejects(() => repo.updateAddress(id, historic.idCustomerAddress, { ...address, street: "Alterada" }, actorId));
        await assert.rejects(() => repo.setAddressStatus(id, historic.idCustomerAddress, "ACTIVE", actorId));
        await assert.rejects(() => prisma.customerAddress.create({ data: { ...address, idCustomer: id } }));
      });

      await t.test("concurrent fiscal additions still leave one active address; deliveries are unrestricted", async () => {
        const results = await Promise.allSettled([
          repo.addAddress(id, { ...address, postalCode: "02000", street: "Concurrente A" }, actorId),
          repo.addAddress(id, { ...address, postalCode: "02000", street: "Concurrente B" }, actorId),
        ]);
        assert.equal(results.filter(row => row.status === "fulfilled").length, 2);
        const detail = await repo.get(id);
        assert.equal(detail.addresses.filter(row => row.addressType === "FISCAL" && row.status === "ACTIVE").length, 1);
        await repo.addAddress(id, { ...address, addressType: "SHIPPING" }, actorId);
        await repo.addAddress(id, { ...address, addressType: "SHIPPING" }, actorId);
        assert.equal((await repo.get(id)).addresses.filter(row => row.addressType === "SHIPPING" && row.status === "ACTIVE").length, 2);
      });

      await t.test("child IDs are scoped to their owner and contacts can be deactivated", async () => {
        const other = await makeCustomer("Sin acceso a hijos");
        const detail = await repo.addContact(id, { name: "Compras", email: "compras@example.com" }, actorId);
        const contact = detail.contacts[0];
        await assert.rejects(() => repo.updateContact(other.idCustomer, contact.idCustomerContact, { name: "Intruso" }, actorId));
        await assert.rejects(() => repo.setAddressStatus(other.idCustomer, detail.addresses[0].idCustomerAddress, "INACTIVE", actorId));
        const updated = await repo.updateContact(id, contact.idCustomerContact, { name: "Compras", status: "INACTIVE", email: null }, actorId);
        assert.equal(updated.contacts[0].email, null);
        assert.equal(updated.contacts[0].status, "INACTIVE");
      });

      await t.test("deactivation preserves sales and prevents new sales", async () => {
        const count = await prisma.sale.count({ where: { idCustomer: id } });
        await repo.update(id, { status: "INACTIVE" }, actorId);
        await assert.rejects(() => makeSale(id));
        await assert.rejects(() => makeSale(randomUUID()));
        assert.equal(await prisma.sale.count({ where: { idCustomer: id } }), count);
        await assert.rejects(() => prisma.customer.delete({ where: { idCustomer: id } }));
        await repo.update(id, { status: "ACTIVE" }, actorId);
        await makeSale(id);
      });

      await t.test("a correction waiting for a sale commit sees the newly recorded sale", async () => {
        const other = await makeCustomer("Carrera RFC");
        await repo.saveTaxProfile(other.idCustomer, { ...tax, rfc: "RAC010101AAA" }, actorId);
        let release!: () => void;
        let locked!: () => void;
        const held = new Promise<void>(resolve => { release = resolve; });
        const ready = new Promise<void>(resolve => { locked = resolve; });
        const sale = prisma.$transaction(async tx => {
          await tx.$queryRaw`SELECT id_customer FROM customer WHERE id_customer = ${other.idCustomer}::uuid FOR UPDATE`;
          await tx.sale.create({ data: { idCustomer: other.idCustomer, date: new Date(), subtotal: 100, tax: 0, total: 100 } });
          locked();
          await held;
        });
        await ready;
        const correction = repo.saveTaxProfile(other.idCustomer, { ...tax, rfc: "RAC010101BBB", reason: "Corrección" }, actorId);
        release();
        await sale;
        await assert.rejects(() => correction);
        assert.equal((await repo.get(other.idCustomer)).taxProfile?.rfc, "RAC010101AAA");
      });

      await t.test("generic customer is unique and protected; list search and pagination are bounded", async () => {
        const generic = await prisma.customer.findFirstOrThrow({ where: { isGeneric: true } });
        await assert.rejects(() => repo.update(generic.idCustomer, { displayName: "Otra identidad" }, actorId));
        await assert.rejects(() => repo.saveTaxProfile(generic.idCustomer, tax, actorId));
        await assert.rejects(() => prisma.customer.create({ data: { displayName: "Duplicado", customerType: "PERSON", isGeneric: true } }));
        const page = await repo.list({ search: "abc010101", page: 1, pageSize: 1 });
        assert.equal(page.total, 1);
        assert.equal(page.items[0].idCustomer, id);
        assert.equal("addresses" in page.items[0], false);
      });
    } finally { await prisma.$disconnect(); }
  } finally {
    await admin.query("ROLLBACK");
    await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await admin.end();
  }
});
