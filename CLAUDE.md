# AIDE-AGENCY-2026-DESIGN

Read `AGENTS.md` first. It holds the rules, the "which template for which piece" table and the workflow.

The key rules, repeated:

- Use only the facts you were given. Never invent names, numbers, dates, quotes or results. Record each figure's source in a `NOTES.md`.
- Conclusions, lessons, asks, credit, closing lines and the classification come from the content owner.
- `brand/tokens/tokens.json` is the only source of colour, type and size. Run `node scripts/build-tokens.mjs` after changing it.
- Never hand-edit generated files (`styles/tokens.css`, `brand/tokens/tokens.js`, `out/`).
- Before delivering: `node scripts/make.mjs <file> --check`, `python3 scripts/lint/lint.py <file>`, `node scripts/qr-verify.mjs` for QR
  codes, `python3 scripts/mvai/mvai.py check` for videos. Then look at every PNG.
- Narrated videos are made by MVAI (`guides/VIDEO.md`). Motion graphics pieces (`motion/library`, MG-01 to MG-05, AN-01, AN-02) render here
  with `node scripts/motion-render.mjs <code>`; see `motion/README.md`.
- Writing follows `guides/WRITING.md`; narration follows `guides/reference/VIDEO-STYLE-GUIDE.md`.
