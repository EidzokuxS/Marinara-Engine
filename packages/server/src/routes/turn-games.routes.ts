// ──────────────────────────────────────────────
// Routes: Turn-Games (UNO and future turn-based games)
// ──────────────────────────────────────────────
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { listTurnGames } from "@marinara-engine/shared";
import {
  applyTurnGameMove,
  getTurnGameView,
  resignTurnGame,
  startTurnGame,
} from "../services/turn-games/turn-game-runner.service.js";

const startSchema = z.object({
  gameType: z.string().min(1),
  config: z.unknown().optional(),
  botCharacterIds: z.array(z.string()).optional(),
  seatOrder: z.array(z.string()).optional(),
  humanFirst: z.boolean().optional(),
  seed: z.number().optional(),
});

const moveSchema = z.object({
  seatId: z.string().optional(),
  move: z.record(z.string(), z.unknown()),
});

export async function turnGamesRoutes(app: FastifyInstance) {
  // Catalog of available games (for the client picker).
  app.get("/catalog", async () => ({ games: listTurnGames() }));

  // Current board view for a chat.
  app.get("/:chatId/state", async (req, reply) => {
    const { chatId } = req.params as { chatId: string };
    const { seatId } = req.query as { seatId?: string };
    const view = await getTurnGameView(app.db, chatId, seatId);
    if (!view) return reply.status(404).send({ error: "No active game in this chat." });
    return { view };
  });

  // Start a game.
  app.post("/:chatId/start", async (req, reply) => {
    const { chatId } = req.params as { chatId: string };
    const parsed = startSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid start payload", details: parsed.error.flatten() });
    }
    const result = await startTurnGame(app.db, chatId, parsed.data);
    if (!result.ok) return reply.status(400).send({ error: result.error });
    return result;
  });

  // Apply a move (human seat by default; an explicit seatId drives any seat — used internally).
  app.post("/:chatId/move", async (req, reply) => {
    const { chatId } = req.params as { chatId: string };
    const parsed = moveSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid move payload", details: parsed.error.flatten() });
    }
    const result = await applyTurnGameMove(app.db, chatId, parsed.data.move, parsed.data.seatId);
    if (!result.ok) return reply.status(409).send(result);
    return result;
  });

  // Resign / end the game.
  app.post("/:chatId/resign", async (req) => {
    const { chatId } = req.params as { chatId: string };
    await resignTurnGame(app.db, chatId);
    return { ok: true };
  });
}
