// Runs capture steps against a Playwright page. A step is one of:
//   { goto: url } { click: sel } { dblclick: sel } { hover: sel } { fill: [sel, text] } { type: [sel, text, delayMs] }
//   { press: 'Enter' } { wait: ms | sel } { scroll: [sel, y] } { mouse: [x, y] } { eval: 'js' } { viewport: [w, h] }
// Selectors are Playwright selectors (css, text=, role=…[name=…]).
export async function runSteps(page, steps = [], log = () => {}) {
  for (const s of steps) {
    const [k, v] = Object.entries(s)[0]; log(k, v);
    if (k === 'goto') await page.goto(v, { waitUntil: 'load' });
    else if (k === 'click') await page.locator(v).first().click();
    else if (k === 'dblclick') await page.locator(v).first().dblclick();
    else if (k === 'hover') await page.locator(v).first().hover();
    else if (k === 'fill') await page.locator(v[0]).first().fill(v[1]);
    else if (k === 'type') await page.locator(v[0]).first().pressSequentially(v[1], { delay: v[2] ?? 60 });
    else if (k === 'press') await page.keyboard.press(v);
    else if (k === 'wait') { if (typeof v === 'number') await page.waitForTimeout(v); else await page.locator(v).first().waitFor({ timeout: 60000 }); }
    else if (k === 'scroll') await page.locator(v[0]).first().evaluate((el, y) => { el.scrollTop = y; }, v[1]);
    else if (k === 'mouse') await page.mouse.move(v[0], v[1], { steps: 12 });
    else if (k === 'eval') await page.evaluate(v);
    else if (k === 'viewport') await page.setViewportSize({ width: v[0], height: v[1] });
    else throw new Error('unknown step ' + k);
  }
}
// boxes of named elements in page px: { key: { x, y, w, h } } (null when the element is not on the page)
export async function measure(page, marks = {}) {
  const out = {};
  for (const [k, sel] of Object.entries(marks)) { const b = await page.locator(sel).first().boundingBox().catch(() => null); out[k] = b && { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }; }
  return out;
}
