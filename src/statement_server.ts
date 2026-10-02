import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { InfraiClient, InfraiError } from "./infrai_client.js";
import {
  shouldSendStatement,
  statementMarkdown,
  statementRequestSchema,
  type StatementRequest,
} from "./usage_statement.js";

type StatementResult = { statement_id: string; message_id: string; pdf: unknown };
const completed = new Map<string, StatementResult>();

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function reply(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}

export async function sendMonthlyStatement(
  input: StatementRequest,
  client: InfraiClient,
): Promise<StatementResult> {
  const previous = completed.get(input.statement_id);
  if (previous) return previous;
  if (!shouldSendStatement(input)) {
    throw new RangeError("A statement needs at least one recorded activity");
  }

  const usage = await client.getAccountUsage(input.period);
  const pdf = await client.generatePdf(statementMarkdown(input, usage));
  const email = await client.sendEmail(
    input.customer.email,
    `Usage statement for ${input.period}`,
    `Your monthly usage statement is ready.\n\nPDF record:\n${JSON.stringify(pdf, null, 2)}`,
  );
  const result = { statement_id: input.statement_id, message_id: email.message_id, pdf };
  completed.set(input.statement_id, result);
  return result;
}

export function startServer(): void {
  const apiKey = process.env.INFRAI_API_KEY;
  if (!apiKey) throw new Error("Set INFRAI_API_KEY before starting the service");
  const client = new InfraiClient(apiKey);

  const server = createServer(async (request, response) => {
    if (request.method !== "POST" || request.url !== "/statements/monthly") {
      reply(response, 404, { error: "Route not found" });
      return;
    }
    try {
      const input = statementRequestSchema.parse(await readJson(request));
      reply(response, 201, await sendMonthlyStatement(input, client));
    } catch (error) {
      if (error instanceof InfraiError) {
        reply(response, error.status >= 400 && error.status < 500 ? error.status : 502, {
          error: error.code,
          message: error.message,
        });
      } else if (error instanceof SyntaxError || error instanceof RangeError) {
        reply(response, 400, { error: error.message });
      } else {
        const issues = error instanceof Error && "issues" in error ? (error as { issues: unknown }).issues : undefined;
        reply(response, issues ? 400 : 500, issues ? { error: "Invalid request", issues } : { error: "Statement failed" });
      }
    }
  });

  const port = Number(process.env.PORT ?? 3000);
  server.listen(port, () => console.log(`Statement service listening on http://localhost:${port}`));
}

if (import.meta.url === `file://${process.argv[1]}`) startServer();
