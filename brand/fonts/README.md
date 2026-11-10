# Fonts

| Family | Files | Licence | Source |
|---|---|---|---|
| Inter | `Inter-Regular.otf` (400), `Inter-Medium.otf` (500), `Inter-SemiBold.otf` (600), `Inter-Bold.otf` (700), `Inter-ExtraBold.otf` (800) | SIL Open Font License 1.1 (`OFL-Inter.txt`) | rsms.me/inter, the copy used by the Contact Alberta handout |
| Geist Mono | `GeistMono-Regular.ttf` (400), `GeistMono-Medium.ttf` (500), `GeistMono-SemiBold.ttf` (600), `GeistMono-Bold.ttf` (700) | SIL Open Font License 1.1 (`OFL-GeistMono.txt`) | Vercel, npm package `geist` 1.3.1 |

The OFL allows anyone to use, bundle and redistribute these fonts with the media and software in this repo. It does not allow selling the
fonts on their own, and a modified font must be renamed. Keep the licence files next to the fonts.

## HTML and PDF

`styles/tokens.css` declares every weight with `@font-face` and loads the files from this folder. Every template in this repo uses it, so a
PDF made on any machine embeds the same fonts. `scripts/make.mjs --check` reports a fault if a bundled font did not load.

## PowerPoint and Word

A `.pptx` or `.docx` file names its fonts and does not carry them. The reader sees Inter only when Inter is installed on their machine.
Without it, PowerPoint substitutes a font of its own, and line breaks change.

- **Install the fonts** before you edit or present: open each `.otf` and `.ttf` file here and choose Install (Windows) or Install Font
  (macOS). A Government of Alberta machine may need the service desk to approve the install.
- **Fallbacks.** The deck builder writes Arial as the fallback for Inter and Consolas for Geist Mono, so a deck still reads on a machine
  without them.
- **Sending a deck outside the team.** Send the PDF made from it as well. The PDF carries the fonts.
