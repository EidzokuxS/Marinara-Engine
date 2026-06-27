import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getDefaultAgentPrompt, type AgentCallDebugEvent, type AgentContext } from "@marinara-engine/shared";
import { buildStandardAgentMessagesForTest, executeAgent, type AgentExecConfig } from "../agent-executor.js";
import type { BaseLLMProvider, ChatMessage, ChatOptions } from "../../llm/base-provider.js";
import { extractEmperorScenario } from "../tarot/emperor-scenario.js";
import { applyGameTarotReasoningMaxTokens } from "../../generation/agent-resolution.js";

function agentConfig(type: string): AgentExecConfig {
  return {
    id: `${type}-1`,
    type,
    name: type,
    phase: "post_processing",
    promptTemplate: getDefaultAgentPrompt(type),
    connectionId: null,
    settings: { contextSize: 5 },
  };
}

function contextForHermit(): AgentContext {
  return {
    chatId: "chat-1",
    chatMode: "game",
    recentMessages: [
      {
        role: "assistant",
        content: "The corridor narrows.\n\n[choices: \"Go on\"|\"Turn back\"]",
        gameState: {
          location: "Archive",
          recentEvents: ["A seal was found"],
        },
      } as AgentContext["recentMessages"][number],
    ],
    mainResponse: "The corridor narrows.",
    gameState: null,
    characters: [],
    persona: null,
    memory: {},
    activatedLorebookEntries: null,
    writableLorebookIds: null,
    chatSummary: null,
    streaming: false,
    signal: new AbortController().signal,
  };
}

describe("agent message routing", () => {
  it("keeps committed tracker JSON out of Hermit's prose-editing context", () => {
    const messages = buildStandardAgentMessagesForTest(
      agentConfig("hermit"),
      getDefaultAgentPrompt("hermit"),
      contextForHermit(),
    );
    const joined = messages.map((message) => message.content).join("\n\n");

    assert.match(joined, /<assistant_response>\s*The corridor narrows\.\s*<\/assistant_response>/);
    assert.doesNotMatch(joined, /<committed_tracker_state>/);
    assert.doesNotMatch(joined, /recentEvents/);
  });

  it("passes reasoning effort into Tarot agent provider calls and debug events", async () => {
    let seenOptions: ChatOptions | null = null;
    const debugEvents: AgentCallDebugEvent[] = [];
    const provider = {
      maxTokensOverrideValue: null,
      async chatComplete(_messages: ChatMessage[], options: ChatOptions) {
        seenOptions = options;
        return {
          content: '{"revision":"The corridor narrows.","changed":false,"notes":[]}',
          toolCalls: [],
          finishReason: "stop",
          usage: { promptTokens: 10, completionTokens: 4, totalTokens: 14, completionReasoningTokens: 2 },
        };
      },
    } as unknown as BaseLLMProvider;

    const config: AgentExecConfig = {
      ...agentConfig("hermit"),
      reasoningEffort: "high",
    };
    const context: AgentContext = {
      ...contextForHermit(),
      agentDebug: (event) => debugEvents.push(event),
    };

    const result = await executeAgent(config, context, provider, "glm-5.2");

    assert.equal(result.success, true);
    const capturedOptions = seenOptions as ChatOptions | null;
    assert.ok(capturedOptions);
    assert.equal(capturedOptions.reasoningEffort, "high");
    assert.equal(capturedOptions.enableThinking, true);
    const request = debugEvents.find((event) => event.stage === "request");
    const response = debugEvents.find((event) => event.stage === "response");
    assert.equal(request?.reasoningEffort, "high");
    assert.equal(request?.enableThinking, true);
    assert.equal(response?.reasoningTokens, 2);
  });

  it("normalizes Emperor-owned beats into a scenario instead of bypassing Emperor", () => {
    const extracted = extractEmperorScenario({
      beats: ["The handler blocks the aisle.", "The creature keeps its bowl between its paws."],
      commands: ['[choices: "Ask the handler"|"Back away"]'],
    });

    assert.equal(
      extracted.scenario,
      "The handler blocks the aisle.\nThe creature keeps its bowl between its paws.",
    );
    assert.deepEqual(extracted.commands, ['[choices: "Ask the handler"|"Back away"]']);
    assert.equal(extracted.reason, "ok");
  });

  it("routes Emperor repair instructions only into Emperor context", () => {
    const baseContext = contextForHermit();
    const context: AgentContext = {
      ...baseContext,
      memory: {
        ...baseContext.memory,
        _emperorRepairInstruction: "<emperor_repair_request>repair scenario</emperor_repair_request>",
      },
    };

    const emperorMessages = buildStandardAgentMessagesForTest(
      agentConfig("emperor"),
      getDefaultAgentPrompt("emperor"),
      context,
    );
    const hermitMessages = buildStandardAgentMessagesForTest(
      agentConfig("hermit"),
      getDefaultAgentPrompt("hermit"),
      context,
    );

    assert.match(emperorMessages.map((message) => message.content).join("\n\n"), /emperor_repair_request/);
    assert.doesNotMatch(hermitMessages.map((message) => message.content).join("\n\n"), /emperor_repair_request/);
  });

  it("raises Tarot reasoning agent max tokens to the Game generation budget", () => {
    const settings = applyGameTarotReasoningMaxTokens({
      agentType: "emperor",
      settings: { maxTokens: 4096 },
      chatReasoningEffort: "high",
      chatGenerationMaxTokens: 16384,
    });

    assert.equal(settings.maxTokens, 16384);
    assert.equal(
      applyGameTarotReasoningMaxTokens({
        agentType: "background",
        settings: { maxTokens: 4096 },
        chatReasoningEffort: "high",
        chatGenerationMaxTokens: 16384,
      }).maxTokens,
      4096,
    );
  });
});
