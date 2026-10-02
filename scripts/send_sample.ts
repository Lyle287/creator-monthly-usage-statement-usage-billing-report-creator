export {};

const response = await fetch("http://localhost:3000/statements/monthly", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    statement_id: "creator-1042-2026-08",
    period: "2026-08",
    customer: { name: "North Pier Prints", email: "owner@example.com" },
    digital_asset_deliveries: 184,
    subscriber_updates: 37,
    content_processing_jobs: 22,
  }),
});

console.log(JSON.stringify(await response.json(), null, 2));
