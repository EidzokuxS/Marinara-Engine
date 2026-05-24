import { describe, expect, it } from "vitest";
import { isManualTrackerCharacterId, preserveTrackerCharacterUiFields } from "./generate-route-utils";

describe("preserveTrackerCharacterUiFields", () => {
  it("carries avatar and portrait fields forward for stable character ids", () => {
    const nextCharacters: Array<Record<string, unknown>> = [
      {
        characterId: "char-1",
        name: "Rina",
        portraitFocusX: 80,
      },
    ];

    preserveTrackerCharacterUiFields(nextCharacters, [
      {
        characterId: "char-1",
        name: "Rina",
        avatarPath: "asset://rina.png",
        portraitFocusX: 25,
        portraitFocusY: 40,
        portraitZoom: 1.4,
      },
    ]);

    expect(nextCharacters[0]).toMatchObject({
      avatarPath: "asset://rina.png",
      portraitFocusX: 80,
      portraitFocusY: 40,
      portraitZoom: 1.4,
    });
  });

  it("uses the unique manual-name fallback when generated tracker output only has a name id", () => {
    const nextCharacters: Array<Record<string, unknown>> = [{ characterId: "Rina", name: "Rina" }];

    preserveTrackerCharacterUiFields(nextCharacters, [
      {
        characterId: "manual-123",
        name: "Rina",
        avatarPath: "asset://manual-rina.png",
        portraitFocusX: 30,
      },
    ]);

    expect(nextCharacters[0]).toMatchObject({
      avatarPath: "asset://manual-rina.png",
      portraitFocusX: 30,
    });
  });

  it("does not copy manual fields when the previous name is ambiguous", () => {
    const nextCharacters: Array<Record<string, unknown>> = [{ characterId: "Rina", name: "Rina" }];

    preserveTrackerCharacterUiFields(nextCharacters, [
      {
        characterId: "manual-1",
        name: "Rina",
        avatarPath: "asset://first.png",
        portraitFocusX: 30,
      },
      {
        characterId: "manual-2",
        name: "Rina",
        avatarPath: "asset://second.png",
        portraitFocusX: 70,
      },
    ]);

    expect(nextCharacters[0]).toEqual({ characterId: "Rina", name: "Rina" });
  });

  it("recognizes trimmed manual tracker ids", () => {
    expect(isManualTrackerCharacterId("  manual-abc  ")).toBe(true);
    expect(isManualTrackerCharacterId("party-npc:abc")).toBe(false);
  });
});
