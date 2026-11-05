const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const { inspectPdf } = require('../helpers');
const { TOP_URL, VIEWER_ORIGIN, topHtml, viewerHtml } = require('./mock');
const out = path.resolve(__dirname, '../out');
let context, profile, page, worker;
const errors = [], workerErrors = [], consoleLines = [], results = [];
const timeout = 120000;
async function check(name, fn) {
  try { await fn(); results.push(`PASS ${name}`); }
  catch (error) {
    results.push(`FAIL ${name}: ${error.stack || error}`);
    if (page && !page.isClosed()) await page.screenshot({ path: path.join(out, `${name}.png`) }).catch(() => {});
    process.exitCode = 1;
  }
  console.log(results.at(-1));
}
async function until(fn, message, ms = timeout) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await fn()) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out: ${message}`);
}
let downloads = [];
function viewer() { return page.frames().find(f => f.url().startsWith(VIEWER_ORIGIN)); }
async function status() { return viewer().evaluate(() => document.documentElement.getAttribute('data-odpdf-status') || ''); }
async function open(query = '') {
  downloads = [];
  await page.goto(TOP_URL + (query ? `&scenario=${query}` : ''));
  await page.locator('#__odpdf_slidesbar').waitFor();
}
async function finished(count) {
  await until(async () => downloads.length >= count && await page.locator('#__odpdf_slidesbar').isVisible(), 'export complete');
  assert.equal(downloads.length, count);
  for (const d of downloads) {
    assert.equal(await d.failure(), null);
    await d.saveAs(path.join(out, `${Date.now()}-${d.suggestedFilename()}`));
  }
}
async function pdfDownload(pages) {
  const download = downloads.find(d => d.suggestedFilename().endsWith('.pdf'));
  assert.ok(download, 'PDF downloaded');
  return inspectPdf(await fs.readFile(await download.path()), pages);
}
async function main() {
  await fs.mkdir(out, { recursive: true });
  try {
    const { chromium } = require('playwright');
    profile = await fs.mkdtemp(path.join(os.tmpdir(), 'odpdf-e2e-'));
    const root = path.resolve(__dirname, '../..');
    context = await chromium.launchPersistentContext(profile, {
      channel: 'chromium', headless: true, viewport: { width: 1280, height: 800 }, acceptDownloads: true,
      args: [`--disable-extensions-except=${root}`, `--load-extension=${root}`],
    });
    context.on('weberror', error => errors.push(String(error.error())));
    await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
    await context.route('**/*', async route => {
      const url = route.request().url();
      if (url.startsWith('chrome-extension://')) return route.continue();
      if (url.startsWith(TOP_URL)) {
        const query = new URL(url).searchParams.get('scenario');
        return route.fulfill({ contentType: 'text/html', body: topHtml(query === 'broken' ? 'broken=4' : '') });
      }
      if (url.startsWith(`${VIEWER_ORIGIN}/p/PowerPointFrame.aspx`)) return route.fulfill({ contentType: 'text/html', body: viewerHtml });
      if (url.startsWith(`${VIEWER_ORIGIN}/images.ashx`)) return route.fulfill({ contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64') });
      // Keep the fixture independent of external services, including update checks.
      return route.fulfill({ status: 404, body: '' });
    });
    worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
    worker.on('console', msg => { if (msg.type() === 'error') workerErrors.push(msg.text()); });
    const cdp = await context.newCDPSession(context.pages()[0] || await context.newPage());
    await cdp.send('Log.enable');
    cdp.on('Log.entryAdded', ({ entry }) => {
      if (entry.source === 'worker' && entry.level === 'error') workerErrors.push(entry.text);
    });
    await worker.evaluate(() => {
      globalThis.__e2eErrors = [];
      addEventListener('error', e => globalThis.__e2eErrors.push(e.message));
      addEventListener('unhandledrejection', e => globalThis.__e2eErrors.push(String(e.reason)));
      return chrome.storage.local.set({ odpdf_lang: 'en' });
    });
    page = context.pages()[0] || await context.newPage();
    page.on('pageerror', e => errors.push(String(e)));
    page.on('console', msg => consoleLines.push(msg.text()));
    page.on('download', download => downloads.push(download));
    await open();
    await check('a-bar', async () => {
      assert.equal(await page.locator('#__odpdf_btn').count(), 0);
      const bar = await page.locator('#__odpdf_slidesbar').boundingBox();
      const bottom = await viewer().locator('#WACStatusBarContainer').boundingBox();
      assert.ok(bar && bottom && bar.y + bar.height <= bottom.y);
    });
    let images;
    await check('b-export', async () => {
      await page.locator('#__odpdf_slidesbtn').click();
      await until(async () => !await page.locator('#__odpdf_slidesbar').isVisible(), 'bar hidden');
      await finished(2);
      assert.deepEqual(downloads.map(d => d.suggestedFilename()).sort(), ['Lesson Deck.pdf', 'Lesson Deck.txt']);
      images = await pdfDownload(5);
      const text = await fs.readFile(await downloads.find(d => d.suggestedFilename().endsWith('.txt')).path(), 'utf8');
      for (let n = 1; n <= 5; n++) assert.ok(text.includes(`--- Slide ${n} ---`));
      assert.ok(text.includes('Text of slide 5'));
    });
    await check('c-overlay', async () => {
      assert.ok(images, 'full export available');
      const pixel = await page.evaluate(async bytes => {
        const bitmap = await createImageBitmap(new Blob([new Uint8Array(bytes)], { type: 'image/jpeg' }));
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const ctx = canvas.getContext('2d'); ctx.drawImage(bitmap, 0, 0);
        return [...ctx.getImageData(Math.floor(bitmap.width * .8), Math.floor(bitmap.height * .8), 1, 1).data];
      }, [...images[3]]);
      // hsl(210,60%,85%) is approximately RGB 194,217,240.
      [194, 217, 240].forEach((v, i) => assert.ok(Math.abs(pixel[i] - v) < 15, `pixel ${pixel}`));
    });
    await check('d-navigation', async () => {
      const state = await viewer().evaluate(() => ({ log: window.__log, dismissed: window.__lightDismissed || window.__toastOk, reload: window.__reloadClicked }));
      assert.equal(state.log.thumbClicks, 0); assert.ok(state.log.keys >= 4);
      assert.ok(state.dismissed); assert.equal(state.reload, undefined);
      assert.ok(await page.locator('#__odpdf_slidesbar').isVisible());
      const line = consoleLines.find(s => s.startsWith('[odpdf] slide export '));
      assert.ok(line); assert.ok(JSON.parse(line.slice('[odpdf] slide export '.length)).timingsMs);
      assert.deepEqual(errors, []);
    });
    await check('e-close', async () => {
      await page.locator('#__odpdf_slidesclose').click();
      assert.equal(await page.locator('#__odpdf_slidesbar').isVisible(), false);
    });
    await check('f-popup', async () => {
      const tab = await worker.evaluate(async url => (await chrome.tabs.query({})).find(t => t.url === url), page.url());
      assert.ok(tab);
      const popup = await context.newPage();
      try {
        await popup.addInitScript(tab => {
          chrome.tabs.query = (_query, callback) => { callback?.([tab]); return Promise.resolve([tab]); };
        }, tab);
        await popup.goto(`chrome-extension://${new URL(worker.url()).host}/popup.html`);
        await popup.locator('#slidesText').waitFor({ state: 'visible' });
        await until(async () => !await popup.locator('#refresh').isVisible() && !await popup.locator('#empty').isVisible(), 'slides mode');
        assert.match(await popup.locator('#helpSteps').textContent(), /PowerPoint for the web/);
        assert.equal(await popup.locator('#helpSteps li').count(), 3);
        downloads = [];
        await page.bringToFront();
        await popup.locator('#slidesText').click();
        await until(async () => (await popup.locator('#slidesNote').innerText()).startsWith('Export started.'), 'started note');
        await until(() => downloads.length === 1, 'text download');
        assert.equal(downloads[0].suggestedFilename(), 'Lesson Deck.txt');
        await downloads[0].saveAs(path.join(out, 'popup.txt'));
      } finally { await popup.close(); }
    });
    await check('g-partial', async () => {
      await open('broken');
      await page.locator('#__odpdf_slidesbtn').click();
      await finished(2);
      assert.deepEqual(downloads.map(d => d.suggestedFilename()).sort(), ['Lesson Deck (1-3 of 5).pdf', 'Lesson Deck (1-3 of 5).txt']);
      await pdfDownload(3);
      assert.match(await status(), /not found on screen/);
      assert.match(await status(), /1–3/);
    });
    await check('h-cancel', async () => {
      await open();
      await page.locator('#__odpdf_slidesbtn').click();
      // The second slide status proves at least one page has been captured.
      await until(async () => /2\s*\/\s*5|2 of 5/.test(await status()), 'second slide');
      await worker.evaluate(async url => {
        const tab = (await chrome.tabs.query({})).find(t => t.url === url);
        // A detach made by the extension fires no onDetach, so do what the
        // onDetach listener does for "canceled_by_user" before detaching.
        cancelledSlideTabs.add(tab.id);
        delete slideExportByTab[tab.id];
        await chrome.debugger.detach({ tabId: tab.id });
      }, page.url());
      await finished(2);
      assert.match(await status(), /^Export cancelled\./);
      const match = /^Lesson Deck \(1-([1-4]) of 5\)\.pdf$/.exec(downloads.find(d => d.suggestedFilename().endsWith('.pdf')).suggestedFilename());
      assert.ok(match); await pdfDownload(Number(match[1]));
      assert.ok(downloads.some(d => d.suggestedFilename() === `Lesson Deck (1-${match[1]} of 5).txt`));
    });
    await check('i-worker-errors', async () => {
      assert.deepEqual(await worker.evaluate(() => globalThis.__e2eErrors), []);
      assert.deepEqual(workerErrors, []); assert.deepEqual(errors, []);
    });
  } catch (error) {
    results.push(`FAIL setup: ${error.stack || error}`); console.error(results.at(-1)); process.exitCode = 1;
  } finally {
    await fs.writeFile(path.join(out, 'results.txt'), results.join('\n') + '\n');
    await fs.writeFile(path.join(out, 'console.txt'), consoleLines.join('\n'));
    if (context) {
      await context.tracing.stop({ path: path.join(out, 'trace.zip') }).catch(() => {});
      await context.close();
    }
    if (profile) await fs.rm(profile, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
