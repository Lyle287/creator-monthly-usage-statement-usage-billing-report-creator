import { z } from "zod";

export const statementRequestSchema = z.object({
  statement_id: z.string().min(1),
  period: z.string().regex(/^\d{4}-\d{2}$/),
  customer: z.object({
    name: z.string().min(1),
    email: z.string().email(),
  }),
  digital_asset_deliveries: z.number().int().nonnegative(),
  subscriber_updates: z.number().int().nonnegative(),
  content_processing_jobs: z.number().int().nonnegative(),
});

export type StatementRequest = z.infer<typeof statementRequestSchema>;

export function shouldSendStatement(input: StatementRequest): boolean {
  return (
    input.digital_asset_deliveries +
      input.subscriber_updates +
      input.content_processing_jobs >
    0
  );
}

export function statementMarkdown(input: StatementRequest, accountUsage: unknown): string {
  return [
    `# Monthly usage statement: ${input.period}`,
    "",
    `Customer: ${input.customer.name}`,
    `Statement ID: ${input.statement_id}`,
    "",
    "| Store activity | Count |",
    "| --- | ---: |",
    `| Digital-asset deliveries | ${input.digital_asset_deliveries} |`,
    `| Subscriber updates | ${input.subscriber_updates} |`,
    `| Content-processing jobs | ${input.content_processing_jobs} |`,
    "",
    "## Account metering record",
    "",
    "```json",
    JSON.stringify(accountUsage, null, 2),
    "```",
  ].join("\n");
}
