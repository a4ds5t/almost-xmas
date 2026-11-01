# Countdown to Xmas

Simple Javascript program that **counts down** to the next Christmass!

Ongoing work continues here; this public tree replaces [a4ds5t/Xmas-Countdown](https://github.com/a4ds5t/Xmas-Countdown) as the source of truth.

This repository holds the static site and thin Cloudflare Worker for **Almost Christmas**. Production is **https://xmas.soholocal.nl** (Worker + custom domain). See [docs/Development.md](docs/Development.md) for local run, tests, and release notes.

## Layout

The site stays at the repository root (`index.html`, `script.js`, `style.css`, `og-image.png`). Wrangler uploads that tree via `assets.directory`. `.assetsignore` keeps Worker config, tests, scripts, docs, npm metadata, and repo markdown out of the public asset bundle.

## Run locally

Requires Node.js >= 22.

```bash
npm install
npm run check   # wrangler deploy --dry-run — packages the Worker, does not publish
npm run dev     # http://127.0.0.1:8787
```

`npm run dev` and `npm run check` do not publish to production. Use your normal release path for deploys to `xmas.soholocal.nl`.

## License

Noncommercial use only, under the PolyForm Noncommercial License 1.0.0 (SPDX: `PolyForm-Noncommercial-1.0.0`). See [LICENSE](LICENSE) and [NOTICE](NOTICE). Commercial use needs a separate paid license. Trademarks and domain names stay with [a4ds5t](https://github.com/a4ds5t).

## Canonical hostname

`index.html`, `sitemap.xml`, and `robots.txt` use `https://xmas.soholocal.nl/`. The Worker returns a 301 to the same path and query on `xmas.soholocal.nl` when the request `Host` is `almost-xmas.soholocal.nl` (see `worker.js`).
