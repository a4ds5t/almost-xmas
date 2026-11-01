import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../style.css", import.meta.url), "utf8");

// Guards the 0.2.2 eyebrow contract: the date reads as a quiet caption above the
// headline on every viewport, with one shared rule set instead of a mobile/desktop
// media-query split.

describe("hero markup", () => {
  it("puts the date before the headline in the title group", () => {
    const group = html.match(/<div class="title-group">([\s\S]*?)<\/div>/);
    assert.ok(group, "title-group not found");
    const dateAt = group[1].indexOf('id="current_date"');
    const h1At = group[1].indexOf('id="headline"');
    assert.ok(dateAt !== -1, "current_date missing from title-group");
    assert.ok(h1At !== -1, "headline missing from title-group");
    assert.ok(dateAt < h1At, "date should come before the headline");
  });

  it("keeps the id and class script.js writes into", () => {
    assert.match(html, /<p id="current_date" class="eyebrow"><\/p>/);
  });

  it("keeps exactly one h1", () => {
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
  });
});

describe("eyebrow styling", () => {
  it("is a caption: 10px, wide-tracked, muted", () => {
    const block = css.match(/\.eyebrow \{([^}]*)\}/);
    assert.ok(block, ".eyebrow rule missing");
    const body = block[1];
    assert.match(body, /font-size:\s*10px/, "eyebrow should be 10px");
    assert.match(body, /letter-spacing:\s*0\.26em/, "eyebrow should be wide-tracked");
    // Muted, not the gold accent — it must not read as a peer of the headline.
    assert.doesNotMatch(body, /var\(--gold\)/, "eyebrow should not use the gold accent");
    assert.match(body, /color:\s*rgba\(246,\s*239,\s*224,\s*0\.5\)/);
  });

  it("leaves breathing room between date and headline", () => {
    const block = css.match(/\.title-group \{([^}]*)\}/);
    assert.ok(block, ".title-group rule missing");
    assert.match(block[1], /gap:\s*18px/, "desktop gap should be 18px");
  });

  it("has no mobile/desktop reorder split left behind", () => {
    assert.doesNotMatch(css, /column-reverse\s*;\s*\}/, "stale column-reverse left behind");
    assert.doesNotMatch(css, /\.eyebrow\s*\{\s*order:/, "stale .eyebrow order rule left behind");
    assert.doesNotMatch(
      css,
      /\.title-group\s*>\s*#current_date\s*\{\s*order:/,
      "stale current_date order rule left behind"
    );
  });

  it("keeps the headline far larger than the eyebrow", () => {
    const h1 = css.match(/^h1 \{([^}]*)\}/m);
    assert.ok(h1, "h1 rule missing");
    assert.match(h1[1], /font-size:\s*clamp\(48px,\s*8\.5vw,\s*112px\)/);
  });
});

describe("cache-busting", () => {
  it("references bumped style.css, script.js, and version-tag assets", () => {
    assert.match(html, /style\.css\?v=13/, "style.css query not bumped");
    assert.match(html, /script\.js\?v=17/, "script.js query not bumped");
    assert.match(html, /version-tag\.css\?v=1/, "version-tag.css query missing");
    assert.match(html, /version-tag\.js\?v=1/, "version-tag.js query missing");
  });

  it("carries no stale pre-0.2.6 query strings", () => {
    assert.doesNotMatch(html, /style\.css\?v=1[12]/);
    assert.doesNotMatch(html, /script\.js\?v=(13|14|15|16)/);
  });
});

describe("footer version UX", () => {
  it("mounts the copyright control without a visible version span", () => {
    assert.match(html, /<small id="app-version-root" class="copyright"><\/small>/);
    assert.doesNotMatch(html, /footer-version/);
    assert.doesNotMatch(html, /footer-sep/);
    assert.doesNotMatch(html, /id="copyright"/);
  });
});

describe("google fonts", () => {
  it("loads Fraunces 400..600 + Jost by default, without Noto", () => {
    assert.match(
      html,
      /id="fonts-latin"/,
      "default fonts link should be tagged fonts-latin"
    );
    assert.match(
      html,
      /Fraunces:ital,opsz,wght,SOFT,WONK@0,9\.\.144,400\.\.600,100,0;1,9\.\.144,400\.\.600,100,1/
    );
    assert.match(html, /family=Jost:wght@400;500;600/);
    assert.doesNotMatch(
      html,
      /Noto\+Serif\+SC/,
      "Noto must not ship in the default render-blocking fonts link"
    );
  });
});

describe("web analytics", () => {
  it("does not inline the RUM beacon (zone auto-install injects it)", () => {
    // Inlining while auto_install is on would double-count every pageview.
    // Only real <script> elements count — the explanatory comment quotes the snippet.
    const scriptTags = html.match(/<script\b[^>]*>/g) || [];
    const beaconScripts = scriptTags.filter((t) => /cloudflareinsights/.test(t));
    assert.deepEqual(beaconScripts, [], "beacon must not be inlined in index.html");
  });

  it("records why the beacon is absent", () => {
    assert.match(html, /Cloudflare Web Analytics/);
    assert.match(html, /auto_install/);
  });
});
