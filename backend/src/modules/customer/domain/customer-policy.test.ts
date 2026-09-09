import assert from "node:assert/strict";
import { test } from "node:test";
import { assertCustomerCanBuy, assertFiscalPostalCode, assertIdentifiedCustomer, assertRfcChange } from "./customer-policy";

test("first RFC capture is allowed after sales, but replacing an existing RFC is not", () => {
  assert.doesNotThrow(() => assertRfcChange(null, "ABC010101AAA", true));
  assert.doesNotThrow(() => assertRfcChange("ABC010101AAA", "ABC010101AAA", true));
  assert.throws(() => assertRfcChange("ABC010101AAA", "ABC010101BBB", true, "Corrección"));
  assert.throws(() => assertRfcChange("ABC010101AAA", "ABC010101BBB", false, " "));
  assert.doesNotThrow(() => assertRfcChange("ABC010101AAA", "ABC010101BBB", false, "Error de captura"));
});

test("sales require an existing active customer", () => {
  assert.throws(() => assertCustomerCanBuy(null));
  assert.throws(() => assertCustomerCanBuy({ status: "INACTIVE" }));
  assert.doesNotThrow(() => assertCustomerCanBuy({ status: "ACTIVE" }));
});

test("fiscal postal codes agree when both sources are present", () => {
  assert.doesNotThrow(() => assertFiscalPostalCode(null, "01000"));
  assert.doesNotThrow(() => assertFiscalPostalCode("01000", null));
  assert.doesNotThrow(() => assertFiscalPostalCode("01000", "01000"));
  assert.throws(() => assertFiscalPostalCode("01000", "02000"));
  assert.throws(() => assertIdentifiedCustomer(true));
});
