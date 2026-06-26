// ──────────────────────────────────────────────
// Tarot: Chariot Widget Deltas
// ──────────────────────────────────────────────
// Chariot proposes HUD widget deltas; the harness validates widget IDs and
// applies only type-appropriate changes to committed Game widget state.

import type { HudWidget, WidgetUpdate } from "@marinara-engine/shared";

const MAX_LIST_WIDGET_ITEMS = 5;

function toFiniteNumber(value: unknown): number | null {
  const raw = typeof value === "string" && value.trim() ? Number(value.trim()) : value;
  return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
}

function toBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return null;
}

function toCleanString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeListWidgetItem(value: string): string {
  return value
    .trim()
    .replace(/^["']+|["']+$/g, "")
    .replace(/\s+/g, " ")
    .replace(/[.!?;,:]+$/g, "")
    .toLowerCase();
}

function appendListWidgetItem(items: string[], nextItem: string): string[] {
  const cleaned = nextItem.trim();
  if (!cleaned) return items;

  const normalizedNewItem = normalizeListWidgetItem(cleaned);
  const dedupedItems = items.filter((item) => normalizeListWidgetItem(item) !== normalizedNewItem);
  return [...dedupedItems, cleaned].slice(-MAX_LIST_WIDGET_ITEMS);
}

function removeListWidgetItem(items: string[], target: string): string[] {
  const normalizedTarget = normalizeListWidgetItem(target);
  if (!normalizedTarget) return items;

  const exactMatchIndex = items.findIndex((item) => normalizeListWidgetItem(item) === normalizedTarget);
  if (exactMatchIndex >= 0) return items.filter((_, index) => index !== exactMatchIndex);

  const partialMatches = items
    .map((item, index) => ({ index, normalized: normalizeListWidgetItem(item) }))
    .filter(({ normalized }) => normalized.includes(normalizedTarget) || normalizedTarget.includes(normalized));

  if (partialMatches.length !== 1) return items;
  return items.filter((_, index) => index !== partialMatches[0]!.index);
}

export function normalizeChariotWidgetUpdates(data: unknown, widgets: readonly HudWidget[]): WidgetUpdate[] {
  const validIds = new Set(widgets.map((widget) => widget.id));
  const source =
    data && typeof data === "object" && !Array.isArray(data)
      ? ((data as Record<string, unknown>).updates ?? (data as Record<string, unknown>).widgetUpdates)
      : data;
  if (!Array.isArray(source)) return [];

  const updates: WidgetUpdate[] = [];
  for (const raw of source) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const entry = raw as Record<string, unknown>;
    const widgetId = toCleanString(entry.widgetId ?? entry.id);
    if (!widgetId || !validIds.has(widgetId)) continue;

    const statName = toCleanString(entry.stat ?? entry.statName);
    const changes: WidgetUpdate["changes"] = {};
    const numericValue = toFiniteNumber(entry.value);
    if (numericValue !== null) {
      changes.value = numericValue;
    } else if (statName) {
      const stringValue = toCleanString(entry.value);
      if (stringValue) changes.value = stringValue;
    }

    const numericCount = toFiniteNumber(entry.count);
    if (numericCount !== null) changes.count = Math.trunc(numericCount);

    if (statName) changes.statName = statName;

    const add = toCleanString(entry.add);
    if (add) changes.add = add;

    const remove = toCleanString(entry.remove);
    if (remove) changes.remove = remove;

    const running = toBoolean(entry.running);
    if (running !== null) changes.running = running;

    const seconds = toFiniteNumber(entry.seconds);
    if (seconds !== null) changes.seconds = Math.max(0, Math.trunc(seconds));

    if (Object.keys(changes).length > 0) updates.push({ widgetId, changes });
  }
  return updates;
}

export function applyChariotWidgetUpdates(
  widgets: readonly HudWidget[],
  updates: readonly WidgetUpdate[],
): { widgets: HudWidget[]; changed: boolean } {
  if (updates.length === 0) return { widgets: [...widgets], changed: false };

  const updatesByWidget = new Map<string, WidgetUpdate[]>();
  for (const update of updates) {
    updatesByWidget.set(update.widgetId, [...(updatesByWidget.get(update.widgetId) ?? []), update]);
  }

  let changed = false;
  const nextWidgets = widgets.map((widget) => {
    const widgetUpdates = updatesByWidget.get(widget.id);
    if (!widgetUpdates?.length) return widget;

    const config = { ...widget.config };
    for (const update of widgetUpdates) {
      const changes = update.changes;

      if (changes.statName && widget.type === "stat_block" && Array.isArray(config.stats)) {
        const statName = changes.statName;
        const value = changes.value;
        if (value === undefined) continue;
        config.stats = config.stats.map((stat) =>
          stat.name === statName && stat.value !== value ? { ...stat, value } : stat,
        );
        continue;
      }

      if (
        changes.value !== undefined &&
        (widget.type === "progress_bar" || widget.type === "gauge" || widget.type === "relationship_meter")
      ) {
        const numeric = toFiniteNumber(changes.value);
        if (numeric !== null) {
          const max = toFiniteNumber(config.max) ?? 100;
          config.value = Math.max(0, Math.min(max, numeric));
        }
      }

      if (changes.count !== undefined && widget.type === "counter") {
        const numeric = toFiniteNumber(changes.count);
        if (numeric !== null) config.count = Math.trunc(numeric);
      }

      if (widget.type === "list") {
        let items = Array.isArray(config.items) ? [...config.items] : [];
        if (changes.remove) items = removeListWidgetItem(items, changes.remove);
        if (changes.add) items = appendListWidgetItem(items, changes.add);
        config.items = items;
      }

      if (widget.type === "timer") {
        if (changes.running !== undefined) config.running = changes.running;
        if (changes.seconds !== undefined) {
          const numeric = toFiniteNumber(changes.seconds);
          if (numeric !== null) config.seconds = Math.max(0, Math.trunc(numeric));
        }
      }
    }

    if (JSON.stringify(config) === JSON.stringify(widget.config)) return widget;
    changed = true;
    return { ...widget, config };
  });

  return { widgets: nextWidgets, changed };
}
