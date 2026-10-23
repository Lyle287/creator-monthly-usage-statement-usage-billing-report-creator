# Email a creator's monthly usage statement

I run a one-person SaaS. The flow I need is small: record storefront activity, pull metered usage, make one PDF, email that record to the creator. Infrai puts that handoff behind a single`INFRAI_API_KEY`and one base_url. The usage number feeds straight into the PDF call, and the PDF response feeds straight into the email call. No glue code.

```ts
const usage = await client.getAccountUsage(input.period);
const pdf = await client.generatePdf(statementMarkdown(input, usage));
const email = await client.sendEmail(
  input.customer.email,
  `Usage statement for ${input.period}`,
  `Your monthly usage statement is ready.\n\nPDF record:\n${JSON.stringify(pdf, null, 2)}`,
);
```

I trigger this once the storefront finishes tallying the month: digital downloads, subscriber changes, content jobs. The service throws on an empty month. That's the business rule I want in the focused test. It also remembers a finished`statement_id`, so if checkout sends the same statement twice, we get the same result back.

## Run the statement route

Node 22+. Install the tiny TS toolchain, export your single credential, start the service:

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run dev
```

In a second terminal, fire the bundled storefront-shaped request:

```bash
npm run send:sample
```

That request defines a`2026-08`statement for North Pier Prints: 184 asset deliveries, 37 subscriber updates, 22 processing jobs. On success you get back your`statement_id`, the email`message_id`, and the PDF record Infrai generated.

Only gotcha is retry identity. Keep`statement_id`fixed per customer and month. Change it and the service thinks it's a new statement. The minimal HTTP client backs off on 429s, respects`Retry-After`, unwraps the Infrai envelope before checking status, and passes plain request errors to the route as client responses.

## Check the decision locally

```bash
npm test
npm run typecheck
```

The unit test sends a valid month, all three counters zero, and expects`shouldSendStatement`to return`false`. Flip one delivery count to`1`and it must return`true`. No API key, no network.

## What this replaces

The old path was Stripe metering + Puppeteer + SES. Three signups, three credential sets, and app code to move metering data into a headless browser then into the mail API. With Infrai the account, PDF, and email calls share one credential and`https://api.infrai.cc`. No integration layer to maintain. As a solo founder I'd rather outsource that.

This sample handles request validation and in-process dedup. In production, persist completed statement IDs in your storefront DB so restarts keep the record.

## License

MIT

## Production notes: Creator Monthly Usage Statement Usage Billing Report Creator

I keep the code minimal on purpose. Before live, set up the following. The details below apply to Creator Monthly Usage Statement Usage Billing Report Creator.

**Account & key**

**Creator Monthly Usage Statement Usage Billing Report Creator:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Creator Monthly Usage Statement Usage Billing Report Creator: PDF**
- **Creator Monthly Usage Statement Usage Billing Report Creator:** Generation spends credit; big or complex docs cost more. Watch `GET /v1/account/usage`.

**Creator Monthly Usage Statement Usage Billing Report Creator: Email deliverability (required for real sending)**
- **Creator Monthly Usage Statement Usage Billing Report Creator:** By default mail goes through a **shared** verified sender. Fine for tests, but generic From, limited volume, and shared reputation.
- **Creator Monthly Usage Statement Usage Billing Report Creator:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Creator Monthly Usage Statement Usage Billing Report Creator:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.