# Development

How this site is built, run locally, and released.

## Production hosting

The live site runs on a **Cloudflare Worker** with static assets via the `ASSETS` binding, on the custom domain **https://xmas.soholocal.nl**. Deploy with Wrangler when Infra routes are in place. Requests to the legacy hostname `almost-xmas.soholocal.nl` get a **301** to the same path and query on `xmas.soholocal.nl` (see `worker.js`).

Repo-only files (Worker, tests, scripts, docs, npm metadata) stay out of the asset upload via `.assetsignore`.

`.gitignore` (never commit a secret) and `.assetsignore` (never *upload* one as a public asset) are
kept in sync: both cover `.dev.vars`, `.env`, `.env.*`, `*.pem`, `*.key`, `*.p12`, `*.pfx` and
`secrets.*`. Because `assets.directory` is the repo root, a file missing from `.assetsignore` would be
served at its path, so `test/ignore-files.test.mjs` fails if the two files drift apart.

## Local development

Requires Node.js >= 22.

```bash
npm install
npm run check   # wrangler deploy --dry-run — packages Worker + assets, does not publish
npm run dev     # http://127.0.0.1:8787
```

`npm run check` runs `scripts/generate-build-info.js` and refreshes `build-info.js` with a UTC build timestamp.

## Preview exposure

Only the custom domain **https://xmas.soholocal.nl** serves this site. `wrangler.jsonc` sets
`"workers_dev": false` and `"preview_urls": false`, so neither `<name>.<account-subdomain>.workers.dev`
nor the per-upload `<version>-<name>.<account-subdomain>.workers.dev` URLs are routable. Before
0.2.4 the defaults did the opposite: every `wrangler versions upload` silently published a
world-readable URL, and some stayed live long after the PR merged.

If they are ever re-enabled (`wrangler versions upload` during review is the usual reason), treat
those URLs as **public** — no authentication, no `robots.txt`, no `X-Robots-Tag`, indexed by anyone
who learns them. Never upload a version that carries unreleased secrets, personal data, or
draft copy you would not put on the live domain, because the upload itself makes it readable.

## Layout

Static files live at the repository root (`index.html`, `script.js`, `style.css`, …). Wrangler `assets.directory` points at the repo root; `run_worker_first` sends every request through the Worker first.

The root page is a single column grid on `main` with three rows: the hero block centred in the
free space, a reserved sleigh band, and the footer (closing line + copyright) anchored to the
bottom of the viewport. The band height is `--santa-band` (`clamp(120px, 17vh, 160px)`); the Santa
sleigh animation flies across it, so nothing else goes there. Short viewports (≤780px and ≤620px
tall) tighten the gaps instead of letting the footer overlap the hero or the band.

### Hero hierarchy

The hero is intentionally ordered **date → headline → weeks → tiles**. The date is a caption, not a
peer: `10px`, `letter-spacing: 0.26em`, muted cream (`rgba(246,239,224,0.5)`), with an `18px` gap to
the headline. There is a single rule set for all viewports — do not reintroduce an
`order` / `column-reverse` split to move the date, because a media-query split is exactly what
shipped as a bug in 0.2.1. Narrow phones (≤400px) drop the tracking to `0.16em` so the date stays
on one line instead of wrapping and costing a whole extra row of height.
`test/layout.test.mjs` pins this contract.

## Asset cache-busting (required before every deploy)

`style.css` and `script.js` are referenced from `index.html` with a `?v=N` query. Cloudflare serves
static assets with caching, and the HTML is what busts it, so **every change to a `.css` or `.js`
asset must ship with a bumped `?v=` in `index.html`** in the same commit (`style.css?v=11` →
`?v=12`). Without the bump, returning visitors keep the cached old file and the change is invisible
to them — exactly the audience a countdown site has. Bump only assets whose content actually
changed; `countdown.js`, `version-tag.js` and `version-tag.css` carry no query string today and
should get one if they start changing often. `build-info.js` is generated per deploy and must not
be versioned.

## Countdown logic
`countdown.js` is the single source of the Christmas rollover. `getChristmasTarget(now)` returns
25 December at 00:00 local time — today's Christmas on 25 Dec, next year's from 26 Dec — and
`getRemaining(now)` splits it into days/hours/minutes/seconds with a DST-safe wall-clock diff.
It is a plain classic script (`window.XmasCountdown`) and also `module.exports` for the Node tests,
which load it before `script.js` in `index.html`.

The Christmas state ("Het is zover. Fijne feestdagen!" / "Fijne Kerst") is shown on **25 December
only**, local time. From 00:00 on 26 December the page is back to the normal countdown to next
year: second Christmas day is not treated as Christmas, because countries differ on it.

## Web analytics

Cloudflare **Web Analytics** (cookieless RUM) is enabled for `xmas.soholocal.nl` through the zone
`soholocal.nl` with `auto_install: true`, so Cloudflare injects the beacon at the edge — it is
**not** in `index.html`, and it must not be added there or pageviews get counted twice.

- Site tag: `YOUR_SITE_TAG` (or the `$CF_WEB_ANALYTICS_SITE_TAG` environment variable). The real
  value is visible only in the Cloudflare dashboard under **Web Analytics**; it is deliberately not
  recorded in this repository. The ruleset is enabled for all hosts and paths.
- What is measured: pageviews, visits, referrers, countries, devices/browsers and Core Web Vitals.
  No cookies, no fingerprinting, no cross-site tracking, so **no cookie banner is required**.
  Free tier, no sampling on this volume.
- Dashboard: Cloudflare → Web Analytics → `xmas.soholocal.nl` (zone `soholocal.nl`).
- API: `GET /accounts/{account_id}/rum/site_info/list` to read the config,
  `POST /accounts/{account_id}/rum/site_info` to create one (needs `account-settings` write). Data
  is queryable with GraphQL `rumPageloadEventsAdaptiveGroups`.

Injection is UA/Accept dependent: a plain `curl` without a browser `Accept: text/html` header gets
the unstamped HTML, so grepping the HTML for `cloudflareinsights` only proves anything when the
request looks like a browser. Verify with a real browser and watch for `beacon.min.js` (200) plus a
`POST /cdn-cgi/rum` (204).

The `workers.dev` hostnames are in a different zone and are **not** covered by the site's ruleset,
so any preview URL would record nothing — that is expected, not a fault. As of 0.2.4 they are not
routable at all; see *Preview exposure* below.

If auto-install is ever switched off, paste the dashboard snippet before `</body>` in `index.html`:

```html
<script defer src="https://static.cloudflareinsights.com/beacon.min.js"
        data-cf-beacon='{"token":"<site_token>","spa":false}'></script>
```

`test/layout.test.mjs` fails if a beacon is inlined while auto-install is on, because that would
double-count pageviews.

## Tests

```bash
npm test
```

`test/redirect.test.mjs` covers the legacy-host 301, the retired `/kerst/` redirect, and basic Worker passthrough.
`test/layout.test.mjs` pins the hero date/headline order, the eyebrow caption styling, the absence of a
reorder media-query split, and the `?v=` refs in `index.html`.
`test/countdown.test.mjs` covers the shared rollover maths in `countdown.js`, including the
24 → 25 → 26 December boundary.

## Versioning

Bump `APP_VERSION` in `script.js`, `version` in `package.json`, and add a section to `CHANGELOG.md`.
Also bump the `?v=` query on any `.css`/`.js` asset you changed (see *Asset cache-busting* above).
See `docs/version-tag.md` for the footer version panel.

## Kerst hero page

The NL baubles hero page that used to live at `/kerst/` has been removed from this repository and is
no longer linked, listed in `sitemap.xml`, or allowed in `robots.txt`. Old `/kerst/` URLs now 301 to
`/` in `worker.js` (see `test/redirect.test.mjs`) so existing links and search results do not dead-end.
The page is parked outside the codebase on purpose and will return as a light funnel page once the
related Almost product ships.
