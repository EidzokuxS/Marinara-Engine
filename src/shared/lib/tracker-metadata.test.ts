import { describe, expect, it } from "vitest";
import { getCharacterLookupAliases, getCharacterLookupTexts } from "./character-display";
import { addAliasLookups, addExactNameLookups } from "./tracker-metadata";

describe("character lookup metadata", () => {
  it("extracts title and explicit alias candidates without using title suffixes as aliases", () => {
    const aliases = getCharacterLookupAliases({
      name: "Rina",
      comment: "Archivist - The Violet Scribe aka Raven / Night Fox (Nocturne); Bookkeeper",
    });

    expect(aliases).toEqual(
      expect.arrayContaining([
        "Archivist",
        "Archivist - The Violet Scribe",
        "Raven",
        "Night Fox (Nocturne)",
        "Night Fox",
        "Bookkeeper",
        "Nocturne",
      ]),
    );
    expect(aliases).not.toContain("The Violet Scribe");
    expect(aliases).not.toContain("Raven / Night Fox (Nocturne); Bookkeeper");
  });

  it("splits list separators only inside explicit alias payloads", () => {
    const aliases = getCharacterLookupAliases({
      name: "Rina",
      comment: "Aliases: Raven / Night Fox",
    });

    expect(aliases).toEqual(expect.arrayContaining(["Raven", "Night Fox"]));
    expect(aliases).not.toContain("Aliases: Raven / Night Fox");
  });

  it("includes the character name before aliases and ignores empty comment values", () => {
    expect(getCharacterLookupTexts({ name: "  Rina  ", comment: "   " })).toEqual(["Rina"]);
    expect(getCharacterLookupAliases(null)).toEqual([]);
  });

  it("keeps exact name matches ahead of later alias collisions", () => {
    const idByLookupText = new Map<string, string>();
    const rows = [
      { character: { id: "char-alias" }, display: { name: "Alyx", comment: "aka Ace" } },
      { character: { id: "char-exact" }, display: { name: "Ace", comment: "aka Ghost" } },
    ];

    addExactNameLookups(rows, idByLookupText);
    addAliasLookups(rows, idByLookupText);

    expect(idByLookupText.get("alyx")).toBe("char-alias");
    expect(idByLookupText.get("ace")).toBe("char-exact");
    expect(idByLookupText.get("ghost")).toBe("char-exact");
  });

  it("keeps shared title suffixes out of character lookup aliases", () => {
    const idByLookupText = new Map<string, string>();
    const rows = [
      { character: { id: "char-hikaru" }, display: { name: "Card One", comment: "Hikaru - GOMG" } },
      { character: { id: "char-saya" }, display: { name: "Card Two", comment: "Saya - GOMG" } },
    ];

    addExactNameLookups(rows, idByLookupText);
    addAliasLookups(rows, idByLookupText);

    expect(idByLookupText.get("hikaru")).toBe("char-hikaru");
    expect(idByLookupText.get("saya")).toBe("char-saya");
    expect(idByLookupText.has("gomg")).toBe(false);
  });

  it("does not add ambiguous aliases contributed by multiple characters in the same tier", () => {
    const idByLookupText = new Map<string, string>();
    const rows = [
      { character: { id: "char-hikaru" }, display: { name: "Hikaru", comment: "aka GOMG" } },
      { character: { id: "char-saya" }, display: { name: "Saya", comment: "aka GOMG" } },
    ];

    addExactNameLookups(rows, idByLookupText);
    addAliasLookups(rows, idByLookupText);

    expect(idByLookupText.get("hikaru")).toBe("char-hikaru");
    expect(idByLookupText.get("saya")).toBe("char-saya");
    expect(idByLookupText.has("gomg")).toBe(false);
  });
});
