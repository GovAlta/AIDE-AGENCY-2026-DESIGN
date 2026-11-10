# Digital media: banners, social cards, screens

Digital pieces are HTML templates rendered to PNG at their exact pixel size, from a JSON content file.

```bash
node scripts/make.mjs samples/digital/<name>.json             # -> out/digital/<name>.png
node scripts/make.mjs --all --check                           # every sample, with the fit and font checks
python3 scripts/lint/lint.py samples/digital/<name>.json
```

## Templates

| Template | Size | Use it for | Samples |
|---|---|---|---|
| `digital/countdown` | 1080x1080 PNG | Countdown tile "N days to go" | `countdown-night.json`, `countdown.json` |
| `digital/email-header` | 600x200 PNG | Email header 600x200 (PNG at 2x) | `email-header-night.json`, `email-header.json` |
| `digital/lower-third` | 1920x1080 PNG | Name/role lower third for video, transparent PNG | `lower-third.json` |
| `digital/qr-poster` | 1080x1350 PNG | Portrait 4:5 post with a QR code | `qr-poster.json` |
| `digital/rollup-banner` | 33x80 in roll-up | Roll-up banner 33x80 in (PDF, trim size) | `rollup-banner.json` |
| `digital/signage` | 1920x1080 PNG | Lobby screen "Today" card with QR (landscape or portrait) | `signage-landscape-day1.json`, `signage-portrait-day3.json` |
| `digital/social-landscape` | 1200x627 PNG | Landscape social card: LinkedIn 1200x627 or X 1600x900 ("size") | `social-landscape-linkedin-cfd-night.json`, `social-landscape-linkedin-event.json`, `social-landscape-x-day3.json` |
| `digital/social-square` | 1080x1080 PNG | Square social post in the invite layout (event, each day, call for demos) | `social-square-cfd.json`, `social-square-day1-navy.json`, `social-square-day1.json`, `social-square-day2.json`, `social-square-day3.json`, `social-square-event-night.json`, `social-square-event.json` |
| `digital/story` | 1080x1920 PNG | Vertical story 1080x1920 in the invite layout | `story-day1.json`, `story-event-night.json` |
| `digital/teams-background` | 1920x1080 PNG | Teams/Zoom background: art on the right, centre left clear | `teams-background-board.json`, `teams-background-night.json` |
| `digital/thumbnail` | 1280x720 PNG | Video thumbnail in the MVAI title or splash look | `thumbnail-splash-night.json`, `thumbnail-splash.json`, `thumbnail-title-night.json`, `thumbnail-title.json` |
| `digital/web-hero` | 1920x600 PNG | Web/SharePoint hero 1920x600, text left, art right | `web-hero-day2-navy.json`, `web-hero-event.json` |

## Rules

- **One message per piece.** A headline, one supporting line, the date or the call to action, and the Agency and Alberta marks.
- **Circuit art frames the message** from the edges and stops at the safe box. Text never sits on art.
- **Safe areas.** Keep text inside the central safe box of each format: social platforms crop corners and overlay buttons, and a Teams
  background is covered in the centre by the speaker. Templates encode each platform's safe box.
- **Sizes are exact.** Export at the size the platform asks for; do not let the platform scale a different size.
- **Text in the image is short.** Platforms and screen readers do not read text in an image: put the same words in the post text or the
  `alt` text.
- **QR codes** on screens only where a phone can reach them (a poster, a lobby screen), never in a social post.
- **Look at every PNG** at 100 % and at phone size before delivery.
