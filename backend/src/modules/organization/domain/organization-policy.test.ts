import assert from "node:assert/strict";
import { test } from "node:test";
import { assertCapacity, assertAssignable, assertCanDeactivate, occupancy } from "./organization-policy";
import { CreateJobPositionSchema, UpdatePositionSchema } from "../../../../../packages/contracts/src/organization";

test("capacity includes vacant active positions and permits unlimited jobs", () => {
  assert.doesNotThrow(() => assertCapacity(null, 10000));
  assert.doesNotThrow(() => assertCapacity(2, 2));
  assert.throws(() => assertCapacity(2, 3));
  assert.throws(() => assertCapacity(0, 0));
});
test("inactive positions are not reported as vacant", () => {
  assert.equal(occupancy("INACTIVE", false), null);
  assert.equal(occupancy("ACTIVE", false), "VACANT");
  assert.equal(occupancy("ACTIVE", true), "OCCUPIED");
});
test("assignments require active entities and a vacant position", () => {
  assert.doesNotThrow(() => assertAssignable("ACTIVE", "ACTIVE", "ACTIVE", false));
  assert.throws(() => assertAssignable("INACTIVE", "ACTIVE", "ACTIVE", false));
  assert.throws(() => assertAssignable("ACTIVE", "INACTIVE", "ACTIVE", false));
  assert.throws(() => assertAssignable("ACTIVE", "ACTIVE", "INACTIVE", false));
  assert.throws(() => assertAssignable("ACTIVE", "ACTIVE", "ACTIVE", true));
  assert.throws(() => assertCanDeactivate(1));
  assert.doesNotThrow(() => assertCanDeactivate(0));
});
test("HTTP contracts reject invalid limits and reparenting positions", () => {
  assert.equal(CreateJobPositionSchema.safeParse({ code: "JOB", name: "Job", maxPositions: 0 }).success, false);
  assert.equal(CreateJobPositionSchema.safeParse({ code: "JOB", name: "Job", maxPositions: 1.5 }).success, false);
  assert.equal(UpdatePositionSchema.safeParse({}).success, false);
  assert.equal(UpdatePositionSchema.safeParse({ idJobPosition: "9d369455-25f0-45fd-ab90-749fbc35ac6b" }).success, false);
});
