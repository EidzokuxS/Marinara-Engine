import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { HudWidget } from "@marinara-engine/shared";
import { applyChariotWidgetUpdates, normalizeChariotWidgetUpdates } from "../tarot/chariot-widgets.js";

function widgets(): HudWidget[] {
  return [
    {
      id: "threat",
      type: "progress_bar",
      label: "Threat",
      position: "hud_left",
      config: { value: 30, max: 100 },
    },
    {
      id: "keys",
      type: "counter",
      label: "Keys",
      position: "hud_left",
      config: { count: 1 },
    },
    {
      id: "party",
      type: "stat_block",
      label: "Party",
      position: "hud_right",
      config: { stats: [{ name: "Ari", value: "wary" }] },
    },
    {
      id: "clues",
      type: "list",
      label: "Clues",
      position: "hud_right",
      config: { items: ["old ash"] },
    },
    {
      id: "timer",
      type: "timer",
      label: "Alarm",
      position: "hud_right",
      config: { running: false, seconds: 0 },
    },
  ];
}

describe("Chariot widget deltas", () => {
  it("normalizes only updates targeting active HUD widgets", () => {
    const updates = normalizeChariotWidgetUpdates(
      {
        updates: [
          { widgetId: "threat", value: 78 },
          { widgetId: "missing", value: 10 },
          { widgetId: "keys", count: "2" },
          { id: "timer", running: "true", seconds: "45" },
        ],
      },
      widgets(),
    );

    assert.deepEqual(updates, [
      { widgetId: "threat", changes: { value: 78 } },
      { widgetId: "keys", changes: { count: 2 } },
      { widgetId: "timer", changes: { running: true, seconds: 45 } },
    ]);
  });

  it("applies type-appropriate widget changes and clamps bar values", () => {
    const updates = normalizeChariotWidgetUpdates(
      {
        updates: [
          { widgetId: "threat", value: 120 },
          { widgetId: "keys", count: 3 },
          { widgetId: "party", stat: "Ari", value: "loyal" },
          { widgetId: "clues", add: "fresh blood", remove: "old ash" },
          { widgetId: "timer", running: true, seconds: 30 },
        ],
      },
      widgets(),
    );

    const result = applyChariotWidgetUpdates(widgets(), updates);

    assert.equal(result.changed, true);
    assert.deepEqual(result.widgets.map((widget) => widget.config), [
      { value: 100, max: 100 },
      { count: 3 },
      { stats: [{ name: "Ari", value: "loyal" }] },
      { items: ["fresh blood"] },
      { running: true, seconds: 30 },
    ]);
  });

  it("keeps unchanged widgets stable when deltas do not fit their type", () => {
    const source = widgets();
    const updates = normalizeChariotWidgetUpdates(
      {
        updates: [
          { widgetId: "keys", value: 99 },
          { widgetId: "party", stat: "Missing", value: "ignored" },
        ],
      },
      source,
    );

    const result = applyChariotWidgetUpdates(source, updates);

    assert.equal(result.changed, false);
    assert.deepEqual(result.widgets, source);
  });
});
