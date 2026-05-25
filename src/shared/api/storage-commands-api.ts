import { invokeTauri } from "./tauri-client";

export const storageCommandsApi = {
  duplicate: <T = unknown>(entity: string, id: string) => invokeTauri<T>("storage_duplicate", { entity, id }),
};
