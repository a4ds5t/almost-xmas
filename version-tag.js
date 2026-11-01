/**
 * Reusable version reveal: a subtle footer control that opens a compact popover.
 *
 * Drop into another app: include version-tag.css, load build-info.js (or pass buildIso),
 * then call initVersionTag({ root, version, buildIso, changelogUrl, label, strings }).
 *
 * label — visible control text (e.g. the copyright line). Version is not shown until open.
 * strings.updatedLabel — e.g. "Updated" / "Bijgewerkt"
 * strings.changelogLabel — link text (same target as your existing changelog URL)
 * strings.tagAria — include "{v}" for the version number, e.g. "Show version {v} and release notes"
 */
const formatBuildTimeAmsterdam = (iso) => {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  const parts = new Intl.DateTimeFormat('nl-NL', {
    timeZone: 'Europe/Amsterdam',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZoneName: 'short',
  }).formatToParts(date)
  const pick = (type) => parts.find((p) => p.type === type)?.value ?? ''
  const datePart = `${pick('day')}-${pick('month')}-${pick('year')}`
  const timePart = `${pick('hour')}:${pick('minute')} ${pick('timeZoneName')}`.trim()
  return `${datePart} ${timePart}`.trim()
}

const initVersionTag = ({ root, version, buildIso, changelogUrl, label, strings }) => {
  if (!root) return { update () {} }

  root.classList.add('version-tag')
  const panelId = `${root.id || 'version-tag'}-panel`

  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'version-tag-button'
  button.setAttribute('aria-expanded', 'false')
  button.setAttribute('aria-controls', panelId)

  const popover = document.createElement('div')
  popover.className = 'version-tag-popover'
  popover.id = panelId
  popover.hidden = true
  popover.setAttribute('role', 'dialog')
  popover.setAttribute('aria-modal', 'false')

  const meta = document.createElement('div')
  meta.className = 'version-tag-meta'

  const versionEl = document.createElement('span')
  versionEl.className = 'version-tag-version'

  const afterVersion = document.createElement('span')
  afterVersion.className = 'version-tag-tail'
  const sepAfterVersion = document.createElement('span')
  sepAfterVersion.className = 'version-tag-sep'
  sepAfterVersion.setAttribute('aria-hidden', 'true')
  sepAfterVersion.textContent = '·'
  afterVersion.append(document.createTextNode('\u00a0'), sepAfterVersion, document.createTextNode(' '))

  const updatedLine = document.createElement('span')
  updatedLine.className = 'version-tag-updated-line'
  const updatedLabel = document.createElement('span')
  updatedLabel.className = 'version-tag-updated-label'
  const updatedTime = document.createElement('time')
  updatedLine.append(updatedLabel, document.createTextNode(' '), updatedTime)

  const tail = document.createElement('span')
  tail.className = 'version-tag-tail'
  const sep = document.createElement('span')
  sep.className = 'version-tag-sep'
  sep.setAttribute('aria-hidden', 'true')
  sep.textContent = '·'
  const changelog = document.createElement('a')
  changelog.className = 'version-tag-changelog'
  changelog.target = '_blank'
  changelog.rel = 'noopener'

  tail.append(document.createTextNode('\u00a0'), sep, document.createTextNode(' '), changelog)
  meta.append(versionEl, afterVersion, updatedLine, tail)
  popover.append(meta)
  root.append(button, popover)

  let open = false
  const setOpen = (next) => {
    open = next
    popover.hidden = !open
    button.setAttribute('aria-expanded', String(open))
  }
  const close = () => setOpen(false)

  button.addEventListener('click', (e) => {
    e.stopPropagation()
    setOpen(!open)
  })

  document.addEventListener('click', (e) => {
    if (!open) return
    if (e.target.closest('.version-tag') === root) return
    close()
  })

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !open) return
    close()
    button.focus()
    e.stopPropagation()
    e.preventDefault()
  }, true)

  const apply = ({ version: v, buildIso: iso, changelogUrl: url, label: nextLabel, strings: s }) => {
    const ver = v ?? version
    const stamp = iso !== undefined ? iso : buildIso
    const href = url ?? changelogUrl
    const copy = s ?? strings
    const controlLabel = nextLabel !== undefined ? nextLabel : label
    button.textContent = controlLabel || `v${ver}`
    button.setAttribute(
      'aria-label',
      (copy.tagAria || 'Show version {v} and release notes').replace('{v}', ver)
    )
    popover.setAttribute('aria-label', copy.tagAria ? copy.tagAria.replace('{v}', ver) : `v${ver}`)
    versionEl.textContent = `v${ver}`
    updatedLabel.textContent = copy.updatedLabel || 'Updated'
    const formatted = formatBuildTimeAmsterdam(stamp)
    if (formatted) {
      updatedTime.dateTime = stamp
      updatedTime.replaceChildren()
      const spaceIdx = formatted.indexOf(' ')
      if (spaceIdx > 0) {
        updatedTime.append(
          document.createTextNode(formatted.slice(0, spaceIdx)),
          document.createTextNode(' '),
          document.createTextNode(formatted.slice(spaceIdx + 1))
        )
      } else {
        updatedTime.append(document.createTextNode(formatted))
      }
      updatedTime.hidden = false
      updatedLine.hidden = false
      afterVersion.hidden = false
    } else {
      updatedTime.removeAttribute('datetime')
      updatedTime.replaceChildren()
      updatedTime.hidden = true
      updatedLine.hidden = true
      afterVersion.hidden = true
    }
    changelog.href = href
    changelog.textContent = copy.changelogLabel || 'Changelog'
  }

  apply({ version, buildIso, changelogUrl, label, strings })

  return {
    update (opts) {
      apply(opts)
    },
    close,
  }
}
