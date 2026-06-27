import assert from "node:assert/strict";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { afterEach, describe, it } from "node:test";

import { OpenAIProvider } from "../openai.provider.js";

let activeServer: ReturnType<typeof createServer> | null = null;

function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(raw) as Record<string, unknown>);
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

async function withCaptureServer(): Promise<{
  baseUrl: string;
  bodies: Record<string, unknown>[];
}> {
  const bodies: Record<string, unknown>[] = [];
  activeServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method !== "POST" || req.url !== "/chat/completions") {
      res.writeHead(404).end();
      return;
    }

    bodies.push(await readBody(req));
    res.writeHead(200, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        choices: [{ message: { content: "ok" }, finish_reason: "stop" }],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      }),
    );
  });

  await new Promise<void>((resolve) => activeServer?.listen(0, "127.0.0.1", resolve));
  const address = activeServer.address();
  assert.ok(address && typeof address === "object");
  return { baseUrl: `http://127.0.0.1:${address.port}`, bodies };
}

afterEach(async () => {
  const server = activeServer;
  activeServer = null;
  if (!server) return;
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

describe("OpenAI-compatible GLM reasoning", () => {
  it("sends enable_thinking for custom GLM chat completions when reasoning effort is active", async () => {
    const { baseUrl, bodies } = await withCaptureServer();
    const provider = new OpenAIProvider(baseUrl, "test-key", undefined, undefined, null, "custom");

    await provider.chatComplete([{ role: "user", content: "Check." }], {
      model: "glm-5.2",
      stream: false,
      reasoningEffort: "high",
      enableThinking: true,
      maxTokens: 32,
    });

    assert.equal(bodies.length, 1);
    assert.equal(bodies[0]?.model, "glm-5.2");
    assert.equal(bodies[0]?.enable_thinking, true);
    assert.equal(bodies[0]?.reasoning_effort, undefined);
  });
});
