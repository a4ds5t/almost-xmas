# Changelog

All notable changes to this project are documented here.

## 0.2.6

- **Public repo links point at almost-xmas.** Changelog / release-notes URLs now use `https://github.com/a4ds5t/almost-xmas` (successor to `Xmas-Countdown`).
- **Version number hidden on the page.** The copyright/credit line is a subtle control; activating it reveals `v{version}`, the build timestamp, and a link to release notes. The old always-visible `v0.2.x` footer tag is gone.
- `style.css?v=13`, `script.js?v=17`, `version-tag.css?v=1`, and `version-tag.js?v=1` bumped in `index.html`.

## 0.2.5

- **Google Fonts load tightened.** The default stylesheet is Fraunces (`wght` 400..600) + Jost only. Noto Serif SC (`500;700`) is injected only when the page language is Chinese (`zh`), so EN/NL/ES no longer download ~200 unused CJK `@font-face` rules.
- `script.js?v=16` bumped in `index.html`.

## 0.2.4

Audit fixes from `docs/public-repo-audit.md`. No visual or behavioural change to the page itself — the only user-visible difference is the `build-info.js` timestamp, so `style.css`, `script.js`, `countdown.js`, `version-tag.css` and `version-tag.js` keep their `?v=` values.

- **Preview URLs disabled.** `wrangler.jsonc` now sets `"workers_dev": false` and `"preview_urls": false`. Wrangler's defaults are `true` / *preview URLs on*, which meant every `wrangler versions upload` published a world-readable `<version>-xmas-countdown.<subdomain>.workers.dev` URL that survived the PR. Now only the custom domain `xmas.soholocal.nl` serves the site, and new version uploads are not routable.
- **Analytics site tag removed from the docs.** `docs/Development.md` records the Web Analytics site tag as `YOUR_SITE_TAG` (`$CF_WEB_ANALYTICS_SITE_TAG`) with a pointer to the dashboard instead of the literal tag, and no longer describes the standing automation token's permission boundary.
- **`.assetsignore` reconciled with `.gitignore`.** `assets.directory` is the repo root, so a file missing from `.assetsignore` is served publicly. It previously covered `.dev.vars` but not `.env`, `.env.*`, `*.pem` or `*.key`; it now mirrors every secret pattern in `.gitignore` (including `*.p12`, `*.pfx`, `secrets.*`). Both files carry a "keep in sync" note and a new `test/ignore-files.test.mjs` fails if they drift. Verified no tracked file became ignored: the uploaded asset set is unchanged at 12 files.
- **Preview exposure documented** in `docs/Development.md`: previews are off, and if re-enabled they are public URLs — never upload a version carrying unreleased secrets or personal data.

## 0.2.3

- **Web analytics documented.** Cloudflare Web Analytics (cookieless RUM) was already live for `xmas.soholocal.nl` via zone auto-install — this release documents it in `docs/Development.md` and adds a comment in `index.html` explaining why the beacon is **not** inlined (hand-adding it would double-count pageviews). No beacon code changed, so `style.css` / `script.js` keep their `?v=` values.
- Privacy note: Web Analytics sets no cookies and does no fingerprinting, so no cookie banner is needed.

## 0.2.2

- **Date line is now a quiet eyebrow on every viewport.** The date sits above the headline at 10px, muted cream, with wide 0.26em tracking and an 18px gap, so it reads as a caption instead of competing with "Bijna Kerst".
- **Removed the mobile/desktop reorder split.** `.eyebrow { order: 1 }` under 600px and `.title-group { flex-direction: column-reverse }` above 600px are gone; the markup is date-then-headline in a single stacked group, which is simpler and cannot disagree with itself.
- Narrow phones keep the caption on one line (tracking drops to 0.16em under 400px) and short phones reclaim space from the sleigh band rather than from text, so 360×640 still fits without scrolling.
- `style.css?v=12` / `script.js?v=13` bumped in `index.html`. New `test/layout.test.mjs` pins the eyebrow contract and the cache-busting refs.

## 0.2.1

- **Mobile date line moved.** On portrait/narrow viewports the date line ("Vandaag is het …") now sits under the "Bijna Kerst" headline and directly above the "Nog … weken" line, instead of crowding the language pill ~6px below it. Desktop keeps the date line as an eyebrow above the headline, unchanged.
- Short phones (≤480px wide, ≤720px tall) reclaim the two-line date line from the surrounding rhythm and the sleigh band so nothing scrolls on a 360×640 screen.
- `style.css?v=11` / `script.js?v=12` bumped in `index.html` so returning visitors with cached assets actually receive this change. Documented the bump rule in `docs/Development.md`.

## 0.2.0

- **Kerst hero page removed.** `kerst/` (page, CSS, photo asset, specs and credit) is no longer part of this repository, and it is out of `sitemap.xml`, `robots.txt`, `readme.md` and `docs/`. Old `/kerst/` URLs 301 to `/`. The page is intentionally parked outside the codebase and returns later as a light funnel page once the related Almost product ships.
- **Root page recentred, footer anchored.** The content block (eyebrow, headline, week line, tiles) is vertically centred, with a reserved band underneath for the Santa sleigh animation. The credit line and version tag now sit at the bottom edge of the viewport, below that band, and stay reachable on short laptop (~700px) and mobile portrait viewports. Footer text contrast raised to ~5:1.
- **Christmas state on 25 December only.** "Het is zover. Fijne feestdagen!" / "Fijne Kerst" shows only on 25 December, local time; from 00:00 on 26 December the page is back to the countdown to next year. Second Christmas day is deliberately not treated as Christmas, because countries differ on it.
- **No hard-coded years.** The countdown target is computed from the current date everywhere, so the site rolls over every year with no annual edit.
- **Shared `countdown.js`.** Generic `nextOccurrence(month, day, now)` primitive plus `getOccurrenceYear`, `isOccurrenceDay`, `getRemainingFor` and `getRemainingUntil`, with the Christmas helpers expressed on top of it. Moveable feasts (Easter, Pentecost) can plug in the same way. Covered by `test/countdown.test.mjs`.

## 0.1.5

- Security hygiene: conservative security headers on Worker responses, extended `.gitignore` / `.assetsignore`, production docs for `xmas.soholocal.nl`, dependency updates.

## 0.1.4

- Compact version panel: date and changelog on one line.

## 0.1.3

- Clickable version tag in the footer with build time and changelog link.
- Version tag sits on the copyright line.

## 0.1.2

- Move public site to `xmas.soholocal.nl` with a 301 redirect from `almost-xmas.soholocal.nl`.

## 0.1.1

- Add `twitter:creator` meta tag.
