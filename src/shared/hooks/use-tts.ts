// ──────────────────────────────────────────────
// Hook: TTS Config & Voices
// ──────────────────────────────────────────────
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invokeTauri } from "../api/tauri-client";
import type { TTSConfig, TTSVoicesResponse, TTSSource } from "../../engine/contracts/types/tts";
import { TTS_API_KEY_MASK } from "../../engine/contracts/types/tts";

const KEYS = {
  config: ["tts", "config"] as const,
  voices: (source: TTSSource, baseUrl: string) => ["tts", "voices", source, baseUrl] as const,
};

// ── Config ───────────────────────────────────────

export function useTTSConfig() {
  return useQuery({
    queryKey: KEYS.config,
    queryFn: () => invokeTauri<TTSConfig>("tts_config"),
    staleTime: 60_000,
  });
}

export function useUpdateTTSConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (config: TTSConfig) => invokeTauri<void>("tts_update_config", { config }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.config });
      qc.invalidateQueries({ queryKey: ["tts", "voices"] });
    },
  });
}

// ── Voices ───────────────────────────────────────

export function useTTSVoices(source: TTSSource, baseUrl: string, enabled: boolean) {
  return useQuery({
    queryKey: KEYS.voices(source, baseUrl),
    queryFn: () => invokeTauri<TTSVoicesResponse>("tts_voices"),
    enabled: enabled && Boolean(baseUrl),
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

// ── Speak (fire-and-forget mutation used by tts-service) ─────────────────

export { TTS_API_KEY_MASK };
