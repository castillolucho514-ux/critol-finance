import assert from "node:assert/strict";
import test from "node:test";
import { findQuote } from "./quotes.js";

test("findQuote supports case-insensitive symbols", () => {
  assert.equal(findQuote("aapl")?.symbol, "AAPL");
  assert.equal(findQuote("unknown"), undefined);
});
