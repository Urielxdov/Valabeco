import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreateCustomerSchema, UpdateCustomerSchema, SaveCustomerTaxProfileSchema,
  ListCustomersQuerySchema,
} from "../../../../../../packages/contracts/src/customer";

test("commercial identity is sufficient without fiscal data; system and actor fields are rejected", () => {
  assert.equal(CreateCustomerSchema.parse({ customerType: "PERSON", displayName: " Ana " }).displayName, "Ana");
  assert.equal(CreateCustomerSchema.safeParse({ customerType: "PERSON", displayName: "Ana", isGeneric: true }).success, false);
  assert.equal(CreateCustomerSchema.safeParse({ customerType: "PERSON", displayName: "Ana", idActor: "forged" }).success, false);
  assert.equal(UpdateCustomerSchema.safeParse({}).success, false);
  assert.equal(CreateCustomerSchema.safeParse({ customerType: "PERSON", displayName: " " }).success, false);
});

test("fiscal contracts normalize RFC and require a complete profile", () => {
  const input = { rfc: " abc010101aaa ", legalName: "Empresa", taxRegime: "601", taxZipCode: "01000" };
  assert.equal(SaveCustomerTaxProfileSchema.parse(input).rfc, "ABC010101AAA");
  assert.equal(SaveCustomerTaxProfileSchema.safeParse({ ...input, legalName: "" }).success, false);
  assert.equal(SaveCustomerTaxProfileSchema.safeParse({ ...input, taxZipCode: "1000" }).success, false);
  assert.equal(SaveCustomerTaxProfileSchema.safeParse({ ...input, rfc: "RFC" }).success, false);
});

test("list queries reject unbounded, negative and malformed pagination", () => {
  assert.deepEqual(ListCustomersQuerySchema.parse({}), { page: 1, pageSize: 20 });
  for (const query of [{ page: "0" }, { page: "1.5" }, { pageSize: "101" }, { status: "DELETED" }]) {
    assert.equal(ListCustomersQuerySchema.safeParse(query).success, false);
  }
});
