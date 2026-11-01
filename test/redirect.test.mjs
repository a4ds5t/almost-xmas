import assert from "node:assert/strict";
import { describe, it } from "node:test";
import worker from "../worker.js";

describe("both custom domains serve content", () => {
  for (const host of ["xmas.soholocal.nl", "almost-xmas.soholocal.nl", "127.0.0.1"]) {
    it(`serves assets for ${host} (no inter-host 301)`, async () => {
      const request = new Request(`http://${host}/`);
      const response = await worker.fetch(request, {
        ASSETS: { fetch: () => new Response("ok", { status: 200 }) },
      });
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("Referrer-Policy"), "strict-origin-when-cross-origin");
      assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
      assert.equal(response.headers.get("X-Frame-Options"), "SAMEORIGIN");
      assert.equal(response.headers.get("Content-Security-Policy"), "frame-ancestors 'self'");
      assert.equal(response.headers.get("Cache-Control"), "public, max-age=0, must-revalidate");
    });
  }

  it("does not 301 almost-xmas to xmas", async () => {
    const request = new Request("http://almost-xmas.soholocal.nl/style.css?a=1");
    const response = await worker.fetch(request, {
      ASSETS: { fetch: () => new Response("css", { status: 200 }) },
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Location"), null);
  });
});

describe("retired /kerst/ path", () => {
  const assets = { fetch: () => new Response("unexpected", { status: 500 }) };

  for (const path of ["/kerst/", "/kerst", "/kerst/index.html", "/kerst/?panel=1", "/KERST/"]) {
    it(`301s ${path} to the countdown`, async () => {
      const response = await worker.fetch(new Request(`http://xmas.soholocal.nl${path}`), { ASSETS: assets });
      assert.equal(response.status, 301);
      assert.equal(response.headers.get("Location"), "https://xmas.soholocal.nl/");
      assert.equal(response.headers.get("X-Frame-Options"), "SAMEORIGIN");
    });
  }

  it("retires /kerst on almost-xmas too", async () => {
    const response = await worker.fetch(new Request("http://almost-xmas.soholocal.nl/kerst/"), {
      ASSETS: assets,
    });
    assert.equal(response.status, 301);
    assert.equal(response.headers.get("Location"), "https://xmas.soholocal.nl/");
  });

  it("does not catch unrelated paths that merely start with the same letters", async () => {
    const response = await worker.fetch(new Request("http://xmas.soholocal.nl/kerstboom/"), {
      ASSETS: { fetch: () => new Response("ok", { status: 200 }) },
    });
    assert.equal(response.status, 200);
  });
});
