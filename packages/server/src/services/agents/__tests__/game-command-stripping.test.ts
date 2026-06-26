import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { stripGmCommandTags, stripGmNarrativeCommandTags } from "../../game/segment-edits.js";

describe("Game command stripping", () => {
  it("strips malformed nested choices from Tower prose", () => {
    const prose = `The desk stays still.

[choices: ["Point to the marker"|"Answer the question"|"Ask why there is no name"]]

The candle gutters.`;

    const stripped = stripGmNarrativeCommandTags(prose);

    assert.equal(stripped.includes("[choices:"), false);
    assert.equal(stripped.includes("Point to the marker"), false);
    assert.match(stripped, /The desk stays still\./);
    assert.match(stripped, /The candle gutters\./);
  });

  it("preserves readable tags for segment editing but removes them from narrative-only Tower output", () => {
    const prose = "The ledger opens.\n\n[Note: Folio heading [Covenant Ward], current year.]";

    assert.match(stripGmCommandTags(prose), /\[Note:/);
    assert.equal(stripGmNarrativeCommandTags(prose), "The ledger opens.");
  });

  it("removes unlabeled italic thought lines from narrative-only Tower output", () => {
    const prose = `The figure watches from behind the desk.

*Younger than I expected. Didn't flinch at the dark.*

[???] [thought] [neutral]: *This line is explicitly attributed.*`;

    const stripped = stripGmNarrativeCommandTags(prose);

    assert.equal(stripped.includes("Younger than I expected"), false);
    assert.match(stripped, /\[\?\?\?\] \[thought\] \[neutral\]: \*This line is explicitly attributed\.\*/);
  });

  it("normalizes em dashes from final narrative-only Game prose", () => {
    const prose = "A kid \u2014 five, maybe \u2014 points at your head.";
    const stripped = stripGmNarrativeCommandTags(prose);

    assert.equal(stripped.includes("\u2014"), false);
    assert.equal(stripped, "A kid, five, maybe, points at your head.");
  });

  it("strips donor ZT_STATE HTML comments from visible Game prose", () => {
    const prose = `The corridor smells of wet concrete.

<!-- ZT_STATE: time=21:18 | place=terminal corridor | cast=Ari: angry | offscreen=Rin: driving | threads=alarm, debt | seeds=badge | timers=security | ooc=English -->

The light over the gate keeps blinking.`;

    const stripped = stripGmNarrativeCommandTags(prose);

    assert.equal(stripped.includes("ZT_STATE"), false);
    assert.equal(stripped, "The corridor smells of wet concrete.\n\nThe light over the gate keeps blinking.");
  });
});
