// Serenity prototype QA: screenshots of every screen at 1440, 768 and 390 in Light and Dark, an axe-core scan
// against WCAG 2.2 AA, a keyboard pass (every Tab stop shows a focus ring) and a reduced-motion pass.
// Run after a build: npm run build && npm run qa   (SCREENS=sign-in,home picks the screens; default: every id in src/App.jsx)
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';

const ids = [...readFileSync('src/App.jsx', 'utf8').matchAll(/^\s+'?([a-z0-9-]+)'?: \(\{ go \}\) =>/gm)].map((m) => m[1]);
const SCREENS = (process.env.SCREENS ? process.env.SCREENS.split(',') : ids);
const WIDTHS = [1440, 768, 390];
const PORT = 4173;
const OUT = 'qa/report';
mkdirSync(OUT, { recursive: true });

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 3000));
const url = (s, theme = 'light') => `http://localhost:${PORT}/?screen=${s}&theme=${theme}`;
const findings = [];
const browser = await chromium.launch();
try {
  for (const theme of ['light', 'dark']) for (const width of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await ctx.newPage();
    for (const s of SCREENS) {
      await page.goto(url(s, theme));
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: `${OUT}/${s}-${width}-${theme}.png`, fullPage: true });
      if (width === 1440 || width === 390) {
        const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
        for (const v of r.violations) findings.push({ screen: s, width, theme, rule: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map((n) => n.target.join(' ')).slice(0, 5) });
      }
    }
    await ctx.close();
  }
  const kb = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  for (const s of SCREENS) {
    await kb.goto(url(s));
    for (let i = 0; i < 8; i++) {
      await kb.keyboard.press('Tab');
      const r = await kb.evaluate(() => { const a = document.activeElement; if (!a || a === document.body) return null; const st = getComputedStyle(a); return { el: a.outerHTML.slice(0, 80), ring: st.boxShadow !== 'none' || (st.outlineStyle !== 'none' && st.outlineWidth !== '0px') }; });
      if (r && !r.ring) findings.push({ screen: s, rule: 'focus-visible', help: 'A focused element shows no focus ring (WCAG 2.2 SC 2.4.7 Focus Visible (AA))', nodes: [r.el] });
    }
  }
  const rm = await (await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })).newPage();
  for (const s of SCREENS) { await rm.goto(url(s)); await rm.screenshot({ path: `${OUT}/${s}-390-reduced-motion.png` }); }
} finally {
  await browser.close();
  server.kill();
}
writeFileSync(`${OUT}/findings.json`, JSON.stringify(findings, null, 2) + '\n');
console.log(findings.length ? `${findings.length} findings: ${OUT}/findings.json` : `No findings. Screenshots in ${OUT}/`);
process.exit(findings.length ? 1 : 0);
