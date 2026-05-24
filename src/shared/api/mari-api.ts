import type { MariEntryRequest, MariEntryResponse } from "../../engine/mari/mari-entry";
import { invokeTauri } from "./tauri-client";

export const mariApi = {
  prompt: (request: MariEntryRequest) =>
    invokeTauri<MariEntryResponse>("professor_mari_prompt", {
      request,
    }),
};
