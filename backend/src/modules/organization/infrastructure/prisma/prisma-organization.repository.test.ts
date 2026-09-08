import "reflect-metadata";
import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaOrganizationRepository } from "./prisma-organization.repository";
import { PrismaUserLifecycle } from "../../../identity/infrastructure/prisma/prisma-user-lifecycle";

// Explicit opt-in; each run creates and drops only its own randomly named schema.
test("organization persistence, migration constraints and concurrent workflows", {
  skip: !process.env.TEST_DATABASE_URL,
}, async t => {
  const connectionString = process.env.TEST_DATABASE_URL!;
  const schema = `org_test_${randomUUID().replaceAll("-", "")}`;
  const admin = new Client({ connectionString });
  await admin.connect();
  try {
    await admin.query(`CREATE SCHEMA "${schema}"`);
    await admin.query(`SET search_path TO "${schema}"`);
    const migrations = join(process.cwd(), "prisma", "migrations");
    for (const directory of readdirSync(migrations, { withFileTypes: true }).filter(entry => entry.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
      await admin.query(readFileSync(join(migrations, directory.name, "migration.sql"), "utf8"));
    }
    // Raw lock SQL follows this schema too; Prisma qualifies its generated queries separately.
    const scopedUrl = new URL(connectionString);
    scopedUrl.searchParams.set("options", `-c search_path=${schema}`);
    const scoped = new PrismaClient({ adapter: new PrismaPg({ connectionString: scopedUrl.toString() }, { schema }) });
    try {
      const repo = new PrismaOrganizationRepository(scoped);
      const lifecycle = new PrismaUserLifecycle(scoped);
      const actor = await scoped.user.create({ data: { email: "actor@example.com", passwordHash: "hash", name: "Actor" } });
      const user = await scoped.user.create({ data: { email: "occupant@example.com", passwordHash: "hash", name: "Occupant" } });
      const actorId = actor.idUser;
      const job = await repo.createJob({ code: "SALES", name: "Sales", maxPositions: 2 }, actorId);
      const makePosition = (code: string) => repo.createPosition({ idJobPosition: job.idJobPosition, code, name: code }, actorId);
      const first = await makePosition("NORTH");
      let secondId = "";
      await t.test("concurrent creation cannot exceed capacity, including vacancies", async () => {
        const results = await Promise.allSettled([makePosition("CENTER"), makePosition("SOUTH")]);
        assert.equal(results.filter(result => result.status === "fulfilled").length, 1);
        const success = results.find(result => result.status === "fulfilled");
        assert.ok(success?.status === "fulfilled");
        secondId = success.value.idPosition;
        await assert.rejects(() => repo.updateJob(job.idJobPosition, { maxPositions: 1 }, actorId));
      });
      let assignmentId = "";
      await t.test("concurrent assignments allow only one occupant", async () => {
        const results = await Promise.allSettled([repo.assign(first.idPosition, user.idUser, actorId), repo.assign(first.idPosition, actorId, actorId)]);
        assert.equal(results.filter(result => result.status === "fulfilled").length, 1);
        const success = results.find(result => result.status === "fulfilled");
        assert.ok(success?.status === "fulfilled");
        assignmentId = success.value.idPositionAssignment;
        await assert.rejects(() => repo.updatePosition(first.idPosition, { status: "INACTIVE" }, actorId));
      });
      await t.test("failed transfers roll back the old assignment and audit", async () => {
        const blocking = await repo.assign(secondId, user.idUser, actorId);
        const auditCount = await scoped.auditEvent.count();
        await assert.rejects(() => repo.transfer(assignmentId, secondId, actorId));
        assert.equal((await repo.history(first.idPosition))[0].status, "ACTIVE");
        assert.equal(await scoped.auditEvent.count(), auditCount);
        await repo.close(blocking.idPositionAssignment, "CANCELED", actorId);
      });
      await t.test("transfer preserves history with contiguous timestamps", async () => {
        const next = await repo.transfer(assignmentId, secondId, actorId);
        const previous = (await repo.history(first.idPosition))[0];
        assert.equal(previous.status, "ENDED");
        assert.equal(previous.endDate, next.startDate);
        assert.equal(previous.idUser, next.idUser);
        assert.equal((await repo.listPositions()).find(position => position.idPosition === first.idPosition)?.occupancy, "VACANT");
        await repo.close(next.idPositionAssignment, "ENDED", actorId);
      });
      await t.test("deactivation retains the user and all positions, closing every assignment", async () => {
        await repo.assign(first.idPosition, user.idUser, actorId);
        await repo.assign(secondId, user.idUser, actorId);
        await lifecycle.deactivate(user.idUser, actorId);
        assert.equal((await scoped.user.findUniqueOrThrow({ where: { idUser: user.idUser } })).status, "INACTIVE");
        assert.equal((await repo.userAssignments(user.idUser)).filter(row => row.status === "ACTIVE").length, 0);
        assert.equal((await repo.listPositions()).length, 2);
        await assert.rejects(() => repo.assign(first.idPosition, user.idUser, actorId));
        const audit = await scoped.auditEvent.findFirstOrThrow({ where: { action: "DEACTIVATE_USER" } });
        assert.equal(audit.idActor, actorId);
        assert.equal(audit.idRecord, user.idUser);
        assert.equal(JSON.stringify(audit).includes("passwordHash"), false);
        await assert.rejects(() => scoped.user.delete({ where: { idUser: user.idUser } }));
      });
      await t.test("inactive positions do not count; reactivation still respects the limit", async () => {
        await repo.updatePosition(first.idPosition, { status: "INACTIVE" }, actorId);
        assert.equal((await repo.listPositions()).find(row => row.idPosition === first.idPosition)?.occupancy, null);
        await makePosition("EXTRA");
        await assert.rejects(() => repo.updatePosition(first.idPosition, { status: "ACTIVE" }, actorId));
        await assert.rejects(() => repo.updateJob(job.idJobPosition, { status: "INACTIVE" }, actorId));
      });
      await t.test("database rejects invalid limits, periods, states and duplicate active occupants", async () => {
        await assert.rejects(() => scoped.jobPosition.update({ where: { idJobPosition: job.idJobPosition }, data: { maxPositions: 0 } }));
        const data = { idPosition: secondId, idUser: actorId, startDate: new Date() };
        await assert.rejects(() => scoped.positionAssignment.create({ data: { ...data, status: "ENDED" } }));
        await assert.rejects(() => scoped.positionAssignment.create({ data: { ...data, endDate: new Date(0), status: "ENDED" } }));
        await scoped.positionAssignment.create({ data });
        await assert.rejects(() => scoped.positionAssignment.create({ data }));
      });
      await t.test("assignment racing with user deactivation never leaves an inactive occupant", async () => {
        const racingUser = await scoped.user.create({ data: { email: "race@example.com", passwordHash: "hash", name: "Race" } });
        const racingJob = await repo.createJob({ code: "RACE", name: "Race" }, actorId);
        const position = await repo.createPosition({ idJobPosition: racingJob.idJobPosition, code: "RACE", name: "Race" }, actorId);
        const results = await Promise.allSettled([
          repo.assign(position.idPosition, racingUser.idUser, actorId),
          lifecycle.deactivate(racingUser.idUser, actorId),
        ]);
        assert.equal(results[1].status, "fulfilled");
        assert.equal((await repo.userAssignments(racingUser.idUser)).filter(row => row.status === "ACTIVE").length, 0);
      });
      await t.test("audit failure rolls back the business operation", async () => {
        await assert.rejects(() => repo.createJob({ code: "ROLLBACK", name: "Rollback" }, randomUUID()));
        assert.equal(await scoped.jobPosition.count({ where: { code: "ROLLBACK" } }), 0);
      });
    } finally { await scoped.$disconnect(); }
  } finally {
    await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await admin.end();
  }
});
