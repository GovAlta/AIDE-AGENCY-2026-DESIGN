import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--enable-webgl'] });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
p.on('console', m => { if (m.type()==='error') console.log('ERR', m.text().slice(0,200)); });
await p.goto('http://localhost:3111/', { waitUntil: 'networkidle', timeout: 120000 });
await p.waitForTimeout(8000);
await p.screenshot({ path: 'shots/real-layers.png' });
const tabs = await p.$$eval('[role=tab]', els => els.map(e => e.textContent.trim()));
console.log(tabs);
for (const t of tabs.slice(1)) {
  await p.getByRole('tab', { name: t }).click(); await p.waitForTimeout(2500);
  await p.screenshot({ path: `shots/real-${t.toLowerCase().replace(/\W+/g,'-')}.png` });
}
await b.close();
