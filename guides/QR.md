# QR codes

Agency QR codes are drawn as clean SVG in the brand colours by `scripts/qr.mjs`, and every code is decoded by `scripts/qr-verify.mjs`
before it ships.

```bash
node scripts/qr.mjs "https://www.alberta.ca/technology-and-innovation" --out out/qr/ti.svg --png
node scripts/qr.mjs "https://www.alberta.ca/technology-and-innovation" --out out/qr/ti-dots.svg --png --style dots --badge a
node scripts/qr-verify.mjs out/qr/*.png --expect "https://www.alberta.ca/technology-and-innovation"
```

In a template, a `{ "type": "qr", "url": "…", "title": "…" }` block draws the same code with its caption.

## Styles

| Option | Values | Notes |
|---|---|---|
| `--style` | `rounded` (default), `dots`, `square` | `square` is the most robust; use it for small prints and screens seen from far away |
| `--accent` | any spectrum name (default `blue`) | Colours the centre of the three finder eyes. The modules are always navy |
| `--badge` | `a` (navy A) or up to 4 characters (the chip badge is retired; `chip` now gives `a`) | A centre badge clears the middle of the code, so it forces error correction H |
| `--size` | pixels for the PNG (default 1200) | The SVG scales to any size |

## Rules

- **Dark on light only.** Navy modules on a white or paper ground. Do not invert a code onto night or navy; place a white panel under it.
- **Quiet zone.** Keep a clear margin of 4 modules on every side. The generator includes it; do not crop it or let art run into it.
- **Size.** At least 2 cm (0.8 in) printed, and larger the further away it is read: about 1 cm of code for every 10 cm of reading
  distance. On a banner read from 3 m, the code is at least 30 cm.
- **Test every code.** Run `qr-verify.mjs` (it decodes each PNG at full, half and quarter size), then scan the printed proof with two
  phones, one iPhone and one Android, before the print run.
- **Caption every code** with the URL in plain text under or beside it, so a reader without a camera can type it.

## URL hygiene

- Use `https://` and an official Government of Alberta address (alberta.ca or an approved service domain).
- Prefer a short, stable page. A long URL makes a dense code that scans badly at small sizes.
- Point at a page the owner controls and will keep live after the event, or note the end date on the piece.
- No tracking parameters on Protected or internal material. On public material, use them only with the communications lead's approval.
- Never encode credentials, personal data, internal hostnames or file shares.
