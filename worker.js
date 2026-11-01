/**
 * Thin Worker for Almost Christmas: legacy-host 301 + structured logs + ASSETS passthrough.
 */
const LEGACY_HOST = "almost-xmas.soholocal.nl";
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

function withSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  applySecurityHeaders(headers);
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const started = Date.now();

    if (url.hostname === LEGACY_HOST) {
      const destination = new URL(`${url.pathname}${url.search}`, CANONICAL_ORIGIN);
      return Response.redirect(destination.toString(), 301);
    }

    if (isRetiredPath(url.pathname)) {
      return withSecurityHeaders(Response.redirect(`${CANONICAL_ORIGIN}/`, 301));
    }

    const response = await env.ASSETS.fetch(assetRequestFor(request));
    const secured = withSecurityHeaders(response);

    console.log(
      JSON.stringify({
        method: request.method,
        path: url.pathname,
        search: url.search.length > 1 ? url.search : undefined,
        status: response.status,
        duration_ms: Date.now() - started,
      }),
    );

    return secured;
  },
};
