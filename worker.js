/**
 * Thin Worker for Almost Christmas: retired-path 301 + structured logs + ASSETS passthrough.
 *
 * Both xmas.soholocal.nl and almost-xmas.soholocal.nl are custom domains on this
 * Worker and serve the same assets. Canonical URLs in HTML/sitemap stay on xmas;
 * almost-xmas is not 301'd so document TTFB stays a single edge fetch on either host.
 *
 * Static CSS/JS/fonts/images skip this script via selective run_worker_first in
 * wrangler.jsonc (served from ASSETS + _headers). Only HTML navigations, retired
 * /kerst paths, and unmatched routes hit the Worker.
 */
const CANONICAL_ORIGIN = "https://xmas.soholocal.nl";

// The NL baubles hero used to live at /kerst/ and has been parked outside this repo,
// so old links and search results get a permanent redirect to the countdown instead
// of a dead end. Kept as a path prefix so /kerst/?panel=1 and asset URLs also land.
const RETIRED_PATHS = ["/kerst"];

function applySecurityHeaders(headers) {
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "SAMEORIGIN");
  headers.set("Content-Security-Policy", "frame-ancestors 'self'");
}

function applyDocumentCacheHeaders(headers) {
  // Short browser freshness + edge revalidation. Deployments change the asset
  // ETag, so returning visitors pick up new HTML without a long stale window.
  headers.set("Cache-Control", "public, max-age=0, must-revalidate");
}

function withResponseHeaders(response, { document = false } = {}) {
  const headers = new Headers(response.headers);
  applySecurityHeaders(headers);
  if (document) applyDocumentCacheHeaders(headers);
  return new Response(response.body, { status: response.status, headers });
}

function assetRequestFor(request) {
  const url = new URL(request.url);
  const { pathname } = url;
  if (pathname === "/" || pathname === "") {
    return new Request(new URL("/index.html", url), request);
  }
  if (pathname.endsWith("/")) {
    return new Request(new URL(`${pathname}index.html`, url), request);
  }
  return request;
}

function isRetiredPath(pathname) {
  var lower = pathname.toLowerCase();
  return RETIRED_PATHS.some(function (prefix) {
    return lower === prefix || lower.indexOf(prefix + "/") === 0;
  });
}

function isHtmlDocument(pathname) {
  return pathname === "/" || pathname === "" || pathname.endsWith(".html") || pathname.endsWith("/");
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const started = Date.now();

    if (isRetiredPath(url.pathname)) {
      return withResponseHeaders(Response.redirect(`${CANONICAL_ORIGIN}/`, 301));
    }

    const response = await env.ASSETS.fetch(assetRequestFor(request));
    const secured = withResponseHeaders(response, { document: isHtmlDocument(url.pathname) });

    console.log(
      JSON.stringify({
        method: request.method,
        path: url.pathname,
        host: url.hostname,
        search: url.search.length > 1 ? url.search : undefined,
        status: response.status,
        duration_ms: Date.now() - started,
      }),
    );

    return secured;
  },
};
