import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getDefaultAgentPrompt, type AgentContext } from "@marinara-engine/shared";
import { buildStandardAgentMessagesForTest, type AgentExecConfig } from "../agent-executor.js";

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
});
