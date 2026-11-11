# Icons

Agency 2026 uses one icon set: **Lucide**, the same set and version as the MVAI video kit (`lucide-static` 1.58.0, ISC licence). The
2,160 icons are bundled in `brand/icons/lucide/`, so print, slides, digital and video draw the same pictures.

## Use

In any content file, tiles, flow steps and list items take an optional `icon` field with a Lucide name:

```json
{ "type": "tiles", "items": [ { "icon": "calendar-days", "value": "3", "label": "days of programming" } ] }
{ "type": "flow", "steps": [ { "icon": "search", "title": "Search", "text": "Published sources only" } ] }
{ "type": "dots", "items": [ { "icon": "qr-code", "text": "Scan a QR code to save a demo" }, "A plain item keeps its dot" ] }
```

In a template, `icon(name, { size, accent })` from `templates/lib/components.mjs` returns inline SVG (`size` is in template units).
An unknown name stops the build with an error, so a typo never ships as a blank square. In MVAI video specs, use the same names in the
scene's `icon` fields. `samples/print/charts-sample.json` (page 2) shows all three uses.

## Rules

1. One set only. Never mix Lucide with other icon sets, emoji or clip art.
2. One style: outline, stroke 2 at 24 px, round caps and joins (the files' own settings). No fills, no duotone, no recolouring parts.
3. Icons take the ink colour of their ground (navy on light, white on dark). Colour comes from the tile or step accent beside them.
4. Words carry the meaning. An icon always sits next to a label that says the same thing, so the page reads the same without it.
5. One icon per item, and only when every item in the group has one.
6. Use the plain, literal icon (a calendar for a date) over a clever one.
7. Never use an icon as a logo. The Alberta logo and the Agency wordmark are in `brand/logos/`.

## Recommended icons

These names cover most Agency topics. Search `brand/icons/lucide/tags.json` for anything else.

| Topic | Icons |
|---|---|
| AI and agents | `bot`, `brain-circuit`, `cpu`, `sparkles`, `message-square-text`, `messages-square`, `workflow` |
| Voice and search | `mic`, `volume-2`, `phone-call`, `search`, `file-search`, `scan-search` |
| Data and systems | `database`, `server`, `cloud`, `network`, `route`, `git-branch` |
| Trust and security | `shield-check`, `lock`, `key-round`, `fingerprint`, `eye`, `accessibility` |
| Government and law | `landmark`, `building-2`, `scale`, `gavel`, `stamp`, `id-card` |
| Documents and forms | `file-text`, `file-check`, `clipboard-check`, `list-checks`, `form-input` |
| Money | `wallet`, `receipt`, `banknote` |
| Results and measures | `chart-column`, `chart-line`, `chart-pie`, `gauge`, `target`, `trending-up`, `timer` |
| Time and place | `clock`, `calendar-days`, `calendar-check`, `map-pin`, `map`, `navigation`, `globe` |
| People | `users`, `user-round`, `user-check`, `handshake`, `heart-handshake`, `graduation-cap` |
| Event and demos | `presentation`, `monitor-play`, `qr-code`, `smartphone`, `laptop`, `mail`, `lightbulb`, `rocket`, `flag` |
| Services | `hospital`, `school`, `car`, `leaf`, `flame`, `mountain-snow` |
| Status | `circle-check`, `circle-x`, `triangle-alert`, `info`, `circle-help`, `arrow-right` |

## Licence

Lucide is ISC licensed; the licence is in `brand/icons/lucide/LICENSE`. Keep it with any copy of the icons.
