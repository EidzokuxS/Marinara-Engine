import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildMissingAssetRecoveryModule,
  isClientAssetRequest,
  isMissingModuleScriptRequest,
} from "../../../app.js";

describe("client static fallback", () => {
  it("classifies missing hashed JS assets as module recovery, not SPA HTML", () => {
    assert.equal(isMissingModuleScriptRequest("/assets/index-deadbeef.js"), true);
    assert.equal(isMissingModuleScriptRequest("/assets/GameSurface-deadbeef.js?v=old"), true);
    assert.equal(isMissingModuleScriptRequest("/assets/index-deadbeef.css"), false);
    assert.equal(isMissingModuleScriptRequest("/chat/abc"), false);
  });

  it("keeps non-JS client assets out of the SPA HTML fallback", () => {
    assert.equal(isClientAssetRequest("/assets/index-deadbeef.css"), true);
    assert.equal(isClientAssetRequest("/sprites/character.png"), true);
    assert.equal(isClientAssetRequest("/api/chats"), false);
    assert.equal(isClientAssetRequest("/chat/abc"), false);
  });

  it("returns a JavaScript recovery module for stale module requests", () => {
    const moduleText = buildMissingAssetRecoveryModule();

    assert.match(moduleText, /serviceWorker/);
    assert.match(moduleText, /caches\.keys/);
    assert.match(moduleText, /location\.replace/);
    assert.match(moduleText, /export \{\};/);
    assert.doesNotMatch(moduleText, /<!doctype html>/i);
  });
});
