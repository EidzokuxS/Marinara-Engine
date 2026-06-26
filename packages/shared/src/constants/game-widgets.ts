import type { HudWidget, HudWidgetType, WidgetRollLogEntry } from "../types/game.js";

export const MAX_GAME_HUD_WIDGETS = 8;
export const MAX_ROLL_LOG_ENTRIES = 5;

export const GAMEPLAY_WIDGET_ROLES = [
  "health",
  "condition",
  "currency",
  "resource",
  "roll_log",
  "pressure_clock",
  "relationship",
  "faction",
  "objective",
  "inventory",
  "custom",
] as const;

export const HUD_WIDGET_TYPES: readonly HudWidgetType[] = [
  "progress_bar",
  "gauge",
  "relationship_meter",
  "counter",
  "stat_block",
  "list",
  "inventory_grid",
  "roll_log",
  "timer",
] as const;

export function isHudWidgetType(value: unknown): value is HudWidgetType {
  return (HUD_WIDGET_TYPES as readonly unknown[]).includes(value);
}

export function cloneHudWidget(widget: HudWidget): HudWidget {
  return {
    ...widget,
    affects: widget.affects ? [...widget.affects] : undefined,
    thresholds: widget.thresholds ? widget.thresholds.map((threshold) => ({ ...threshold })) : undefined,
    styleHints: widget.styleHints ? { ...widget.styleHints } : undefined,
    config: {
      ...widget.config,
      milestones: widget.config.milestones?.map((milestone) => ({ ...milestone })),
      stats: widget.config.stats?.map((stat) => ({ ...stat })),
      items: widget.config.items ? [...widget.config.items] : undefined,
      categories: widget.config.categories ? [...widget.config.categories] : undefined,
      contents: widget.config.contents?.map((item) => ({ ...item })),
      rollEntries: widget.config.rollEntries?.map((entry) => ({ ...entry })),
      valueHints: widget.config.valueHints ? { ...widget.config.valueHints } : undefined,
    },
  };
}

export function getDefaultGameplayHudWidgets(): HudWidget[] {
  const widgets: HudWidget[] = [
    {
      id: "player_condition",
      type: "progress_bar",
      role: "health",
      sourceOfTruth: true,
      authority: "chariot",
      stateKey: "player.condition",
      affects: ["dc", "scene_pressure"],
      label: "Condition",
      icon: "+",
      position: "hud_left",
      accent: "#ef4444",
      thresholds: [
        { at: 25, label: "Critical", effect: "Justice may raise physical DCs and Emperor should surface danger." },
        { at: 50, label: "Hurt", effect: "Emperor should respect fatigue, pain, and recovery pressure." },
      ],
      config: { startingValue: 100, value: 100, max: 100, dangerBelow: 25 },
    },
    {
      id: "player_funds",
      type: "counter",
      role: "currency",
      sourceOfTruth: true,
      authority: "chariot",
      stateKey: "player.currency",
      affects: ["choice", "reward"],
      label: "Funds",
      icon: "$",
      position: "hud_left",
      accent: "#f59e0b",
      config: { count: 0 },
    },
    {
      id: "justice_rolls",
      type: "roll_log",
      role: "roll_log",
      sourceOfTruth: true,
      authority: "justice",
      stateKey: "system.rolls",
      affects: ["roll", "narrative"],
      label: "Checks",
      icon: "d20",
      position: "hud_right",
      accent: "#38bdf8",
      config: { rollEntries: [], maxEntries: MAX_ROLL_LOG_ENTRIES },
    },
    {
      id: "scene_pressure",
      type: "progress_bar",
      role: "pressure_clock",
      sourceOfTruth: true,
      authority: "chariot",
      stateKey: "world.pressure",
      affects: ["dc", "encounter", "scene_pressure"],
      label: "Pressure",
      icon: "!",
      position: "hud_right",
      accent: "#fb7185",
      thresholds: [
        { at: 50, label: "Alert", effect: "Emperor should make opposition observably more active." },
        { at: 80, label: "Crisis", effect: "Justice may increase risky DCs and Emperor should force a hard consequence." },
      ],
      config: {
        startingValue: 0,
        value: 0,
        max: 100,
        milestones: [
          { at: 50, label: "Alert" },
          { at: 80, label: "Crisis" },
        ],
      },
    },
    {
      id: "key_stances",
      type: "stat_block",
      role: "relationship",
      sourceOfTruth: true,
      authority: "chariot",
      stateKey: "social.stances",
      affects: ["dc", "choice", "scene_pressure"],
      label: "Stances",
      icon: "rel",
      position: "hud_right",
      accent: "#a78bfa",
      config: {
        stats: [{ name: "Local mood", value: "neutral" }],
        valueHints: { "Local mood": "hostile | wary | neutral | warm | loyal" },
      },
    },
  ];
  return widgets.map(cloneHudWidget);
}

export function ensureDefaultGameplayHudWidgets(widgets: readonly HudWidget[]): HudWidget[] {
  const existing = widgets.map(cloneHudWidget);
  const usedIds = new Set(existing.map((widget) => widget.id));
  const usedRoles = new Set(existing.map((widget) => widget.role).filter(Boolean));

  for (const widget of getDefaultGameplayHudWidgets()) {
    if (existing.length >= MAX_GAME_HUD_WIDGETS) break;
    if (usedIds.has(widget.id) || (widget.role && usedRoles.has(widget.role))) continue;
    existing.push(widget);
    usedIds.add(widget.id);
    if (widget.role) usedRoles.add(widget.role);
  }

  return existing.slice(0, MAX_GAME_HUD_WIDGETS);
}

export function appendRollToHudWidgets(
  widgets: readonly HudWidget[],
  roll: Omit<WidgetRollLogEntry, "id"> & { id?: string },
): { widgets: HudWidget[]; changed: boolean } {
  const nextWidgets = ensureDefaultGameplayHudWidgets(widgets);
  let changed = false;
  const next = nextWidgets.map((widget) => {
    if (widget.role !== "roll_log" && widget.type !== "roll_log") return widget;
    const maxEntries = Math.max(1, Math.min(10, widget.config.maxEntries ?? MAX_ROLL_LOG_ENTRIES));
    const entry: WidgetRollLogEntry = {
      id: roll.id ?? `roll_${Date.now().toString(36)}`,
      check: roll.check,
      notation: roll.notation,
      rolled: roll.rolled,
      dc: roll.dc,
      total: roll.total,
      margin: roll.margin,
      success: roll.success,
      outcome: roll.outcome,
    };
    const entries = [entry, ...(widget.config.rollEntries ?? [])].slice(0, maxEntries);
    changed = true;
    return { ...widget, config: { ...widget.config, rollEntries: entries, maxEntries } };
  });
  return { widgets: next, changed };
}
