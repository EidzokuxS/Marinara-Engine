import assert from "node:assert/strict";
import { createServer, type AddressInfo } from "node:http";
import { test } from "node:test";

const PNG_1X1_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/w8AAwMCAO+/p9sAAAAASUVORK5CYII=";

const WORKFLOW_JSON = JSON.stringify({
  "3": {
    class_type: "KSampler",
    inputs: { seed: 42, steps: 5, cfg: 1, sampler_name: "euler", scheduler: "normal", denoise: 1 },
  },
  "268": {
    class_type: "CLIPTextEncode",
    inputs: { text: "a cat", clip: ["39", 0] },
  },
});

const { generateRunPodComfyUI } = await import("../src/services/image/runpod-comfyui.service.js");

test("RunPod — rejects missing workflow", async () => {
  await assert.rejects(
    () => generateRunPodComfyUI("http://localhost:9999", "ep-id", "key", { prompt: "test" }),
    /requires a workflow/,
  );
});

test("RunPod — rejects invalid workflow JSON", async () => {
  await assert.rejects(
    () =>
      generateRunPodComfyUI("http://localhost:9999", "ep-id", "key", {
        prompt: "test",
        comfyWorkflow: "not-json{{{",
      }),
    /Invalid ComfyUI workflow JSON/,
  );
});

test("RunPod — rejects endpoint IDs with path characters", async () => {
  await assert.rejects(
    () =>
      generateRunPodComfyUI("https://api.runpod.ai/v2", "../metadata", "key", {
        prompt: "test",
        comfyWorkflow: WORKFLOW_JSON,
      }),
    /endpoint ID/i,
  );
});

test("RunPod — substitutes ComfyUI workflow placeholders safely", async () => {
  const endpointId = "ep-placeholders";
  const jobId = "job-placeholders";
  let submittedWorkflow: Record<string, any> | null = null;

  const workflowJson = JSON.stringify({
    "3": {
      class_type: "KSampler",
      inputs: {
        seed: "%seed%",
        steps: "%steps%",
        cfg: "%cfg%",
        sampler_name: "%sampler%",
        scheduler: "%scheduler%",
        denoise: "%denoise%",
        clip_skip: "%clip_skip%",
      },
    },
    "268": {
      class_type: "CLIPTextEncode",
      inputs: {
        text: "%prompt%",
        negative: "%negative_prompt%",
        model: "%model%",
        ref: "%reference_image%",
      },
    },
  });

  const server = createServer((req, res) => {
    if (req.method === "POST" && req.url === `/v2/${endpointId}/run`) {
      const chunks: Buffer[] = [];
      req.on("data", (chunk: Buffer) => chunks.push(chunk));
      req.on("end", () => {
        submittedWorkflow = JSON.parse(Buffer.concat(chunks).toString("utf8")).input.workflow;
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ id: jobId }));
      });
      return;
    }
    if (req.method === "GET" && req.url === `/v2/${endpointId}/status/${jobId}`) {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(
        JSON.stringify({
          id: jobId,
          status: "COMPLETED",
          output: { images: [{ data: PNG_1X1_BASE64, filename: "img.png", type: "base64" }] },
        }),
      );
      return;
    }
    res.writeHead(404);
    res.end("{}");
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;

  process.env.RUNPOD_POLL_INTERVAL_MS = "10";
  await generateRunPodComfyUI(`http://127.0.0.1:${port}/v2`, endpointId, "key", {
    prompt: "line one\nline two",
    negativePrompt: "low quality",
    model: "sdxl.safetensors",
    referenceImage: "data:image/png;base64,abc123",
    comfyWorkflow: workflowJson,
    imageDefaults: {
      version: 1,
      service: "comfyui",
      seed: 123,
      comfyui: {
        promptPrefix: "cinematic",
        negativePromptPrefix: "blurry",
        sampler: "euler",
        scheduler: "karras",
        steps: 9,
        cfgScale: 4.5,
        denoisingStrength: 0.7,
        clipSkip: 2,
      },
    },
  });
  delete process.env.RUNPOD_POLL_INTERVAL_MS;
  server.close();

  assert.equal(submittedWorkflow?.["268"]?.inputs?.text, "cinematic, line one\nline two");
  assert.equal(submittedWorkflow?.["268"]?.inputs?.negative, "blurry, low quality");
  assert.equal(submittedWorkflow?.["268"]?.inputs?.model, "sdxl.safetensors");
  assert.equal(submittedWorkflow?.["268"]?.inputs?.ref, "data:image/png;base64,abc123");
  assert.equal(submittedWorkflow?.["3"]?.inputs?.seed, "123");
  assert.equal(submittedWorkflow?.["3"]?.inputs?.steps, "9");
  assert.equal(submittedWorkflow?.["3"]?.inputs?.cfg, "4.5");
  assert.equal(submittedWorkflow?.["3"]?.inputs?.sampler_name, "euler");
  assert.equal(submittedWorkflow?.["3"]?.inputs?.scheduler, "karras");
  assert.equal(submittedWorkflow?.["3"]?.inputs?.denoise, "0.7");
  assert.equal(submittedWorkflow?.["3"]?.inputs?.clip_skip, "2");
});

test("RunPod — successful, completes on first poll", async () => {
  const endpointId = "ep-pass-1";
  const jobId = "job-001";
  let pollCount = 0;

  const server = createServer((req, res) => {
    if (req.method === "POST" && req.url === `/v2/${endpointId}/run`) {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ id: jobId }));
      return;
    }
    if (req.method === "GET" && req.url === `/v2/${endpointId}/status/${jobId}`) {
      pollCount++;
      res.writeHead(200, { "content-type": "application/json" });
      res.end(
        JSON.stringify({
          id: jobId,
          status: "COMPLETED",
          output: { images: [{ data: PNG_1X1_BASE64, filename: "img.png", type: "base64" }] },
        }),
      );
      return;
    }
    res.writeHead(404);
    res.end("{}");
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;

  process.env.RUNPOD_POLL_INTERVAL_MS = "10";
  const result = await generateRunPodComfyUI(`http://127.0.0.1:${port}/v2`, endpointId, "key", {
    prompt: "a cat",
    comfyWorkflow: WORKFLOW_JSON,
  });

  assert.equal(pollCount, 1);
  assert.ok(result.base64.length > 10); // 1x1 PNG is ~86 chars; any non-empty image passes
  assert.equal(result.mimeType, "image/png");
  assert.equal(result.ext, "png");
  server.close();
  delete process.env.RUNPOD_POLL_INTERVAL_MS;
});

test("RunPod — multiple polls before completion", async () => {
  const endpointId = "ep-poll-2";
  const jobId = "job-002";
  let pollCount = 0;

  const server = createServer((req, res) => {
    if (req.method === "POST" && req.url === `/v2/${endpointId}/run`) {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ id: jobId }));
      return;
    }
    if (req.method === "GET" && req.url === `/v2/${endpointId}/status/${jobId}`) {
      pollCount++;
      const status = pollCount <= 2 ? "IN_PROGRESS" : "COMPLETED";
      const output =
        status === "COMPLETED"
          ? { images: [{ data: PNG_1X1_BASE64, filename: "img.png", type: "base64" }] }
          : undefined;
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ id: jobId, status, output }));
      return;
    }
    res.writeHead(404);
    res.end("{}");
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;

  process.env.RUNPOD_POLL_INTERVAL_MS = "10";
  const result = await generateRunPodComfyUI(`http://127.0.0.1:${port}/v2`, endpointId, "key", {
    prompt: "a cat",
    comfyWorkflow: WORKFLOW_JSON,
  });
  delete process.env.RUNPOD_POLL_INTERVAL_MS;

  assert.equal(pollCount, 3);
  assert.ok(result.base64.length > 10);
  server.close();
});

test("RunPod — rejects FAILED status", async () => {
  const endpointId = "ep-fail-3";
  const jobId = "job-003";

  const server = createServer((req, res) => {
    if (req.method === "POST" && req.url === `/v2/${endpointId}/run`) {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ id: jobId }));
      return;
    }
    if (req.method === "GET" && req.url === `/v2/${endpointId}/status/${jobId}`) {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ id: jobId, status: "FAILED", error: "Out of memory" }));
      return;
    }
    res.writeHead(404);
    res.end("{}");
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;

  process.env.RUNPOD_POLL_INTERVAL_MS = "10";
  await assert.rejects(
    () =>
      generateRunPodComfyUI(`http://127.0.0.1:${port}/v2`, endpointId, "key", {
        prompt: "test",
        comfyWorkflow: WORKFLOW_JSON,
      }),
    /Out of memory/,
  );
  delete process.env.RUNPOD_POLL_INTERVAL_MS;
  server.close();
});

test("RunPod — rejects CANCELLED status", async () => {
  const endpointId = "ep-cancel-4";
  const jobId = "job-004";

  const server = createServer((req, res) => {
    if (req.method === "POST" && req.url === `/v2/${endpointId}/run`) {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ id: jobId }));
      return;
    }
    if (req.method === "GET" && req.url === `/v2/${endpointId}/status/${jobId}`) {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ id: jobId, status: "CANCELLED" }));
      return;
    }
    res.writeHead(404);
    res.end("{}");
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;

  process.env.RUNPOD_POLL_INTERVAL_MS = "10";
  await assert.rejects(
    () =>
      generateRunPodComfyUI(`http://127.0.0.1:${port}/v2`, endpointId, "key", {
        prompt: "test",
        comfyWorkflow: WORKFLOW_JSON,
      }),
    /cancelled/i,
  );
  delete process.env.RUNPOD_POLL_INTERVAL_MS;
  server.close();
});

test("RunPod — rejects HTTP 401 on submit", async () => {
  const endpointId = "ep-401-5";

  const server = createServer((req, res) => {
    if (req.method === "POST" && req.url === `/v2/${endpointId}/run`) {
      res.writeHead(401, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }
    res.writeHead(404);
    res.end("{}");
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;

  await assert.rejects(
    () =>
      generateRunPodComfyUI(`http://127.0.0.1:${port}/v2`, endpointId, "bad-key", {
        prompt: "test",
        comfyWorkflow: WORKFLOW_JSON,
      }),
    /401/,
  );
  server.close();
});

test("RunPod — empty output.images throws clear error", async () => {
  const endpointId = "ep-noimg-6";
  const jobId = "job-006";

  const server = createServer((req, res) => {
    if (req.method === "POST" && req.url === `/v2/${endpointId}/run`) {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ id: jobId }));
      return;
    }
    if (req.method === "GET" && req.url === `/v2/${endpointId}/status/${jobId}`) {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ id: jobId, status: "COMPLETED", output: { images: [] } }));
      return;
    }
    res.writeHead(404);
    res.end("{}");
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;

  process.env.RUNPOD_POLL_INTERVAL_MS = "10";
  await assert.rejects(
    () =>
      generateRunPodComfyUI(`http://127.0.0.1:${port}/v2`, endpointId, "key", {
        prompt: "test",
        comfyWorkflow: WORKFLOW_JSON,
      }),
    /empty or missing/,
  );
  delete process.env.RUNPOD_POLL_INTERVAL_MS;
  server.close();
});
