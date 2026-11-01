# Version tag component

The footer copyright/credit line is a subtle clickable control. Activating it opens a compact popover with the version (`v0.2.6`), the build timestamp (Europe/Amsterdam), and a release-notes link to `CHANGELOG.md` on GitHub (`a4ds5t/almost-xmas`). The version number is not shown on the page until the copyright line is opened.

## Files

| File | Role |
|------|------|
| `version-tag.js` | Popover behaviour and Amsterdam timestamp formatting |
| `version-tag.css` | Layout for the control and popover |
| `build-info.js` | Generated `BUILD_TIMESTAMP_ISO` (UTC ISO string), loaded before `script.js` |
| `scripts/generate-build-info.js` | Writes `build-info.js` at build/deploy time |

## Build-time timestamp

Wrangler runs the build command before upload:

```jsonc
"build": { "command": "node scripts/generate-build-info.js" }
```

So `wrangler deploy` and `wrangler deploy --dry-run` refresh `build-info.js` without a manual step. The app reads `BUILD_TIMESTAMP_ISO` and formats it in the browser with `Intl` and `timeZone: 'Europe/Amsterdam'`.

If `build-info.js` is missing (for example opening `index.html` via `file://`), the copyright control still works and the popover shows the version without a timestamp.

`APP_VERSION` in `script.js` is the version source; bump it by hand between releases. Public changelog links use `https://github.com/a4ds5t/almost-xmas/blob/main/CHANGELOG.md`.

## Reusing in another app

1. Copy `version-tag.js`, `version-tag.css`, and `scripts/generate-build-info.js`.
2. Hook the generator into your deploy (Wrangler `[build].command` or a `predeploy` script).
3. Load `build-info.js`, then `version-tag.js`, and call:

```javascript
initVersionTag({
  root: document.getElementById('my-version-root'),
  version: '1.0.0',
  buildIso: typeof BUILD_TIMESTAMP_ISO !== 'undefined' ? BUILD_TIMESTAMP_ISO : null,
  changelogUrl: 'https://github.com/a4ds5t/almost-xmas/blob/main/CHANGELOG.md',
  label: '© 2026 Santa Claus. All rights reserved.',
  strings: {
    updatedLabel: 'Updated',
    changelogLabel: 'Release notes',
    tagAria: 'Show version {v} and release notes',
  },
})
```

4. Pass translated `label` / `strings` when the UI language changes (`update()` on the returned handle).
