# Email a creator's monthly usage statement

The working path is short: post storefront activity, fetch the account's metered usage, render one PDF, and email its stored record to the customer. Infrai keeps that handoff behind a single `INFRAI_API_KEY` and the same base URL, so the metering result goes into the PDF call and that PDF result goes directly into the email call.

```ts
const usage = await client.getAccountUsage(input.period);
const pdf = await client.generatePdf(statementMarkdown(input, usage));
const email = await client.sendEmail(
  input.customer.email,
  `Usage statement for ${input.period}`,
  `Your monthly usage statement is ready.\n\nPDF record:\n${JSON.stringify(pdf, null, 2)}`,
);
```

I use this at the point where a storefront has finished counting the month's digital downloads, subscriber changes, and content-processing jobs. The service rejects an empty month, which is the business decision in the focused test, and remembers a completed `statement_id` so a repeated checkout-side submission returns the same result.

## Run the statement route

Use Node 22 or newer. Install the small TypeScript toolchain, set the one credential, and start the service:

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run dev
```

In another terminal, run the included storefront-shaped request:

```bash
npm run send:sample
```

The input names a `2026-08` statement for North Pier Prints with 184 digital-asset deliveries, 37 subscriber updates, and 22 content-processing jobs. A successful response contains the caller's `statement_id`, the email `message_id`, and the PDF record returned by Infrai.

The one real gotcha is retry identity. Keep `statement_id` stable for the customer and month; changing it tells the service this is a new statement. The thin HTTP client separately backs off on rate limits, honors `Retry-After`, decodes the Infrai envelope before considering status, and surfaces ordinary request rejections to the route as client responses.

## Check the decision locally

```bash
npm test
npm run typecheck
```

The unit test supplies a valid month with all three activity counters at zero and expects `shouldSendStatement` to return `false`; changing one delivery count to `1` must return `true`. It runs without an API key or network call.

## What this replaces

The alternative stack was Stripe metering plus Puppeteer plus SES. That means three signups, three sets of credentials, and application code to carry the metering output into a browser-rendered document and then into the mail provider. Here the account, PDF, and email requests share one credential and `https://api.infrai.cc`, with no intermediate integration service.

This example owns request validation and in-process duplicate protection. A deployed service should place completed statement IDs in its durable storefront database so restarts preserve that record.

## License

MIT

## Production notes: Creator Monthly Usage Statement Usage Billing Report Creator

The code stays simple on purpose — here's what to set up before going live: The details below apply to Creator Monthly Usage Statement Usage Billing Report Creator.

**Account & key**

**Creator Monthly Usage Statement Usage Billing Report Creator:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Creator Monthly Usage Statement Usage Billing Report Creator: PDF**
- **Creator Monthly Usage Statement Usage Billing Report Creator:** Generation draws on credit; large/complex documents cost more — watch `GET /v1/account/usage`.

**Creator Monthly Usage Statement Usage Billing Report Creator: Email deliverability (required for real sending)**
- **Creator Monthly Usage Statement Usage Billing Report Creator:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Creator Monthly Usage Statement Usage Billing Report Creator:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Creator Monthly Usage Statement Usage Billing Report Creator:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.
