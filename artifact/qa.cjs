const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const errs = [];
  for (const scheme of ['light', 'dark']) {
    const ctx = await b.newContext({ ...devices['iPhone 13'], colorScheme: scheme });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(scheme + ': ' + e.message));
    p.on('console', m => { if (m.type() === 'error') errs.push(scheme + ' console: ' + m.text()); });
    await p.route('**fonts.g*/**', r => r.abort());
    await p.setContent('<!doctype html><meta name=viewport content="width=device-width, initial-scale=1">' + require('fs').readFileSync('artifact/out/solve-copilot.html','utf8'));
    await p.waitForTimeout(500);
    await p.screenshot({ path: `artifact/out/${scheme}-1-start.png` });
    await p.locator('textarea').fill('Does fasting lower blood pressure?');
    await p.getByRole('button', { name: 'Send' }).tap();
    await p.waitForTimeout(1200);
    await p.screenshot({ path: `artifact/out/${scheme}-2-thinking.png` });
    await p.waitForTimeout(6000);
    await p.screenshot({ path: `artifact/out/${scheme}-3-answer.png` });
    const trig = p.locator('.srn-activity-trigger').first();
    if (await trig.count()) { await trig.tap(); await p.waitForTimeout(500); await p.screenshot({ path: `artifact/out/${scheme}-4-activity.png` }); }
    await p.locator('.srn-model-trigger').tap(); await p.waitForTimeout(400);
    await p.screenshot({ path: `artifact/out/${scheme}-5-menu.png` });
    await p.getByRole('menuitemradio').nth(1).tap(); await p.waitForTimeout(400);
    const lbl = await p.locator('.srn-model-trigger').getAttribute('aria-label');
    const nav = p.getByRole('button', { name: /sidebar|menu|chats/i }).first();
    await nav.tap(); await p.waitForTimeout(600);
    await p.screenshot({ path: `artifact/out/${scheme}-6-sheet.png` });
    console.log(scheme, 'model:', lbl, 'sheet:', await p.locator('.srn-sheet').count());
    await ctx.close();
  }
  const real = errs.filter(e => !/ERR_FAILED/.test(e));
  console.log('errors', real);
  if (real.length) process.exitCode = 1;
  await b.close();
})();
