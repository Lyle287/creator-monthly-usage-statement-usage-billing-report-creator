import assert from "node:assert/strict";
import test from "node:test";
import { shouldSendStatement, statementRequestSchema } from "../src/usage_statement.js";

test("a quiet storefront does not send an empty monthly statement", () => {
  const input = statementRequestSchema.parse({
    statement_id: "creator-1042-2026-08",
    period: "2026-08",
    customer: { name: "North Pier Prints", email: "owner@example.com" },
    digital_asset_deliveries: 0,
    subscriber_updates: 0,
    content_processing_jobs: 0,
  });

  assert.equal(shouldSendStatement(input), false);
  assert.equal(shouldSendStatement({ ...input, digital_asset_deliveries: 1 }), true);
});
