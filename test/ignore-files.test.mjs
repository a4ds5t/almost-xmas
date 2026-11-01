import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const read = (name) => readFileSync(new URL(`../${name}`, import.meta.url), "utf8");
const gitignore = read(".gitignore");
const assetsignore = read(".assetsignore");
const wrangler = read("wrangler.jsonc");

// `assets.directory` is the repo root, so anything that is not listed in
// `.assetsignore` is uploaded and served publicly. These tests keep that file at
// least as strict as `.gitignore` for secret-shaped paths, so the 0.2.4 gap
// (gitignore covered `.env`/`*.pem`/`*.key`, assetsignore did not) cannot reopen.

const SECRET_PATTERNS = [".env", ".env.*", "*.pem", "*.key"];

const patterns = (file) =>
  file
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

describe("ignore files", () => {
  for (const pattern of SECRET_PATTERNS) {
    it(`.assetsignore covers ${pattern}`, () => {
      assert.ok(
        patterns(assetsignore).includes(pattern),
        `.assetsignore must list ${pattern} — the repo root is uploaded as public assets`
      );
    });

    it(`.gitignore covers ${pattern}`, () => {
      assert.ok(patterns(gitignore).includes(pattern), `.gitignore must list ${pattern}`);
    });
  }

  it("keeps every secret pattern from .gitignore in .assetsignore", () => {
    const secretish = patterns(gitignore).filter((p) =>
      /(^|\/)\.env|\.pem$|\.key$|\.p12$|\.pfx$|^secrets\.|\.dev\.vars$/.test(p)
    );
    assert.ok(secretish.length >= 4, "expected .gitignore to declare secret patterns");
    const missing = secretish.filter((p) => !patterns(assetsignore).includes(p));
    assert.deepEqual(missing, [], `.assetsignore is missing: ${missing.join(", ")}`);
  });

  it("still uploads the real site assets", () => {
    for (const asset of ["index.html", "style.css", "script.js", "countdown.js", "robots.txt", "sitemap.xml"]) {
      assert.ok(
        !patterns(assetsignore).includes(asset),
        `${asset} is a public asset and must not be ignored`
      );
    }
  });
});

describe("preview exposure", () => {
  it("disables the workers.dev route and version preview URLs", () => {
    assert.match(wrangler, /"workers_dev":\s*false/, "workers_dev must be false");
    assert.match(wrangler, /"preview_urls":\s*false/, "preview_urls must be false");
  });
});
