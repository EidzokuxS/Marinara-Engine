import { describe, expect, it, vi } from "vitest";
import type { StorageGateway } from "../capabilities/storage";
import { retryGenerationAgents, startGeneration, type GenerationEngineDeps } from "./start-generation";

function depsForChat(chat: Record<string, unknown>) {
  const get = vi.fn(async (entity: string, id: string) => (entity === "chats" && id === "chat-1" ? chat : null));
  const createChatMessage = vi.fn(async () => {
    throw new Error("createChatMessage should not be called");
  });
  const storage = {
    get,
    createChatMessage,
  } as Partial<StorageGateway> as StorageGateway;
  const deps: GenerationEngineDeps = {
    storage,
    llm: {} as GenerationEngineDeps["llm"],
    integrations: {} as GenerationEngineDeps["integrations"],
  };
  return { deps, get, createChatMessage };
}

describe("startGeneration concluded roleplay guard", () => {
  it("rejects concluded roleplay scenes before saving user messages", async () => {
    const { deps, createChatMessage } = depsForChat({
      id: "chat-1",
      mode: "roleplay",
      metadata: { sceneStatus: "concluded" },
    });

    const stream = startGeneration(deps, { chatId: "chat-1", userMessage: "continue" });

    await expect(stream.next()).rejects.toThrow("This scene is concluded.");
    expect(createChatMessage).not.toHaveBeenCalled();
  });

  it("uses legacy chatMode and string metadata when guarding agent retries", async () => {
    const { deps } = depsForChat({
      id: "chat-1",
      chatMode: "roleplay",
      metadata: JSON.stringify({ sceneStatus: "concluded" }),
    });

    await expect(retryGenerationAgents(deps, { chatId: "chat-1" })).rejects.toThrow("This scene is concluded.");
  });

  it("does not block non-roleplay chats that have concluded scene metadata", async () => {
    const { deps } = depsForChat({
      id: "chat-1",
      mode: "conversation",
      metadata: { sceneStatus: "concluded" },
    });

    const stream = startGeneration(deps, { chatId: "chat-1", userMessage: "continue" });

    await expect(stream.next()).resolves.toEqual({
      done: false,
      value: { type: "phase", data: "Saving message..." },
    });
    await stream.return(undefined);
  });
});
