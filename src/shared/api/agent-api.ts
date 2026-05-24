import { invokeTauri } from "./tauri-client";

export const agentApi = {
  clearRunsForChat: (chatId: string) => invokeTauri<void>("agent_runs_clear_for_chat", { chatId }),
};
