// ──────────────────────────────────────────────
// Custom Emoji Zod Schemas
// ──────────────────────────────────────────────
import { z } from "zod";

/** Custom emoji names are slugs used in `:name:` tokens — lowercase letters, digits, underscores. */
export const CUSTOM_EMOJI_NAME_PATTERN = /^[a-z0-9_]{1,32}$/;
/** Custom emojis are dimension-gated like gallery-tagged emojis (max 256x256). */
export const CUSTOM_EMOJI_MAX_DIMENSION = 256;

export const customEmojiNameSchema = z
  .string()
  .regex(CUSTOM_EMOJI_NAME_PATTERN, "Name must be 1-32 lowercase letters, numbers, or underscores.");

export const createCustomEmojiSchema = z.object({
  name: customEmojiNameSchema,
  filePath: z.string().min(1),
  width: z.number().int().positive().nullable().default(null),
  height: z.number().int().positive().nullable().default(null),
});

export const updateCustomEmojiSchema = z.object({
  name: customEmojiNameSchema,
});

export type CreateCustomEmojiInput = z.infer<typeof createCustomEmojiSchema>;
export type UpdateCustomEmojiInput = z.infer<typeof updateCustomEmojiSchema>;
