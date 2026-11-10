// digital/lower-third: 1920x1080 overlay for video editors (Premiere, Resolve, Clipchamp, Camtasia): a name and role bar in the MVAI
// caption style (navy bar, spectrum rule), bottom-left, inside the title-safe area. The page is transparent; only the bar is painted.
// Content: { "template": "digital/lower-third", "name": "...", "person": "Full name", "role": "Role, organisation", "label": "optional mono tag" }
// Use names and roles only as the person gave them. Transparency needs htmlToPng omitBackground (see the repo notes).
import { CSS, md, esc } from './lib/digital.mjs';
export const meta = { kind: 'png', width: 1920, height: 1080, transparent: true, about: 'Name/role lower third for video, transparent PNG',
  css: CSS + 'html, body, .page.dg { background: transparent !important; }' };
export function render(d) {
  return `<div class="page dg" style="width:1920px;height:1080px;--fs:24px;background:transparent">
    <div class="safe" style="left:120px;bottom:120px;display:flex;flex-direction:column;align-items:flex-start">
      ${d.label ? `<div style="font-family:var(--font-mono);font-size:0.8em;letter-spacing:0.18em;text-transform:uppercase;color:#fff;background:var(--purple);padding:0.4em 1em;border-radius:0.35em 0.35em 0 0">${esc(d.label)}</div>` : ''}
      <div style="position:relative;background:rgba(2,44,76,0.94);border-radius:0 0.5em 0.5em ${d.label ? '0' : '0.5em'};padding:0.75em 1.4em 0.85em 1.1em;border-left:0.35em solid var(--yellow);min-width:14em">
        <div style="font-weight:800;font-size:2.1em;color:#fff;letter-spacing:-0.01em;line-height:1.05;white-space:nowrap">${md(d.person ?? 'Name Surname')}</div>
        <div style="font-weight:500;font-size:1.25em;color:#C9D6E2;margin-top:0.25em;white-space:nowrap">${md(d.role ?? '')}</div>
        <div style="position:absolute;left:0;right:0;bottom:0;height:0.22em;background:var(--spectrum);border-radius:0 0 0.5em 0"></div>
      </div>
    </div></div>`;
}
