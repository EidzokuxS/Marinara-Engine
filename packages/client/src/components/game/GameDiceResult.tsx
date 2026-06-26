// ──────────────────────────────────────────────
// Game: Dice Roll Result Display
// ──────────────────────────────────────────────
import { useEffect, useState } from "react";
import type { DiceRollResult } from "@marinara-engine/shared";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

interface GameDiceResultProps {
  result: DiceRollResult;
  onDismiss: () => void;
}

export function GameDiceResult({ result, onDismiss }: GameDiceResultProps) {
  const [animate, setAnimate] = useState(false);
  const isCheck = typeof result.dc === "number" || Boolean(result.check);
  const success =
    typeof result.success === "boolean"
      ? result.success
      : typeof result.dc === "number"
        ? result.total >= result.dc
        : null;
  const resultLabel =
    success === null
      ? null
      : success
        ? result.result === "auto_success"
          ? "AUTO SUCCESS"
          : "SUCCESS"
        : "FAILURE";
  const resultColor = success === null ? "text-white/60" : success ? "text-emerald-300" : "text-red-300";
  const marginText = typeof result.margin === "number" ? `${result.margin >= 0 ? "+" : ""}${result.margin}` : null;

  useEffect(() => {
    setAnimate(false);
    // Trigger animation on next frame so the transition plays
    const raf = requestAnimationFrame(() => setAnimate(true));
    const timer = isCheck ? null : setTimeout(() => onDismiss(), 5000);
    return () => {
      cancelAnimationFrame(raf);
      if (timer) clearTimeout(timer);
    };
    // onDismiss is stable (useCallback with stable deps) — safe to exclude
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, isCheck]);

  return (
    <div
      className={cn(
        "pointer-events-auto mx-auto mb-2 flex w-full max-w-md justify-center transition-all duration-300",
        animate ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
      )}
    >
      <div
        className={cn(
          "relative flex w-full items-center gap-3 rounded-xl bg-black/80 px-4 py-2.5 pr-10 shadow-lg shadow-black/30 backdrop-blur-sm ring-1 sm:px-5 sm:py-3",
          success === false
            ? "ring-red-400/25"
            : success === true
              ? "ring-emerald-400/25"
              : "ring-white/10",
        )}
        title={result.reasoning || result.outcome || undefined}
      >
        <span className="game-dice-animate text-xl sm:text-2xl">🎲</span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-semibold text-white/80">
            {isCheck ? (result.check ?? "Justice check") : result.notation}
          </div>
          <div className="text-[0.6875rem] font-mono uppercase tracking-wide text-white/45">
            {isCheck ? `Justice ${result.notation}${typeof result.dc === "number" ? ` vs DC ${result.dc}` : ""}` : result.notation}
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-xs text-white/40">
              [{result.rolls.join(", ")}]
              {result.modifier !== 0 && ` ${result.modifier > 0 ? "+" : ""}${result.modifier}`}
            </span>
            <span className="text-lg font-bold text-white">= {result.total}</span>
            {marginText && <span className="text-xs font-semibold text-white/45">margin {marginText}</span>}
          </div>
          {resultLabel && <div className={cn("text-xs font-bold", resultColor)}>{resultLabel}</div>}
          {result.outcome && <div className="mt-0.5 line-clamp-2 text-[0.6875rem] leading-snug text-white/55">{result.outcome}</div>}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="absolute right-2 top-2 rounded p-1 text-white/40 transition hover:bg-white/10 hover:text-white"
          aria-label="Dismiss dice roll result"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
