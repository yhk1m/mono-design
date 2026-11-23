// 사용: node scripts/verify.mjs [web|slides|strings|all] [검사할 html 경로]
// 경로를 주면 템플릿 대신 그 파일을 검사한다 (web 또는 slides 와 함께)
import { spawn, execSync } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = resolve(import.meta.dirname, '..');
const OUT = resolve(ROOT, 'verify-out'); mkdirSync(OUT, { recursive: true });
const A = resolve(ROOT, 'skills/mono-design/assets');
const mode = process.argv[2] || 'all';
const target = process.argv[3] ? resolve(process.argv[3]) : null;
const fails = [];
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function chrome() {
  const port = 9300 + Math.floor(Math.random() * 500);
  const ud = `C:/Users/Public/mono-verify/ud${Date.now()}`;
  const ch = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--disable-extensions', '--allow-file-access-from-files', `--remote-debugging-port=${port}`, `--user-data-dir=${ud}`, 'about:blank'], { stdio: 'ignore' });
  let tabs; for (let i = 0; i < 80; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (tabs.find(t => t.type === 'page')) break; } catch {} await sleep(250); }
  const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 0; const pend = new Map(); const errors = [];
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map(a => a.value).join(' '));
  };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
  const ev = async expr => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.result?.value;
  const shot = async file => { const s = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(file, Buffer.from(s.result.data, 'base64')); };
  return { send, ev, shot, errors, close: () => { ws.close(); ch.kill(); } };
}

// [data-check-contrast] 요소마다 글자색과 실제 바탕색의 대비를 계산한다
const CONTRAST = `(() => {
  const lum = c => { const [r,g,b] = c.map(v => { v/=255; return v <= .03928 ? v/12.92 : ((v+.055)/1.055)**2.4; }); return .2126*r + .7152*g + .0722*b; };
  const rgb = s => (s.match(/[\\d.]+/g) || []).map(Number);
  const bgOf = el => { for (let e = el; e; e = e.parentElement) { const c = rgb(getComputedStyle(e).backgroundColor); if (c.length === 3 || c[3] > 0.9) return c.slice(0,3); } const r = rgb(getComputedStyle(document.documentElement).backgroundColor); return r.length >= 3 && (r.length === 3 || r[3] > 0.9) ? r.slice(0,3) : [255,255,255]; };
  return [...document.querySelectorAll('[data-check-contrast]')].filter(el => el.offsetParent !== null).map(el => {
    const cs = getComputedStyle(el); const f = rgb(cs.color).slice(0,3), b = bgOf(el);
    const L1 = lum(f), L2 = lum(b), ratio = (Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05);
    const size = parseFloat(cs.fontSize), w = +cs.fontWeight; const need = (size >= 24 || (size >= 18.66 && w >= 600)) ? 3 : 4.5;
    return { sel: el.dataset.checkContrast, ratio: +ratio.toFixed(2), need };
  }).filter(r => r.ratio < r.need);
})()`;

async function web() {
  const file = target || resolve(A, 'web-template.html');
  if (!existsSync(file)) { fails.push('web-template.html 없음'); return; }
  const c = await chrome();
  for (const tone of ['mono', 'navy', 'blue']) for (const theme of ['light', 'dark']) for (const w of [1440, 390]) {
    await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: w < 800 ? 844 : 900, deviceScaleFactor: 1, mobile: w < 800 });
    c.errors.length = 0;
    await c.send('Page.navigate', { url: pathToFileURL(file).href + `?tone=${tone}&theme=${theme}` }); await sleep(1500);
    await c.ev(`document.documentElement.dataset.tone = '${tone}'; document.documentElement.dataset.theme = '${theme}'`); await sleep(300);
    const tag = `web ${tone}/${theme}/${w}`;
    const over = await c.ev('document.documentElement.scrollWidth - innerWidth');
    if (over > 0) fails.push(`${tag}: 가로 넘침 ${over}px`);
    const low = await c.ev(CONTRAST);
    for (const l of low || []) fails.push(`${tag}: 대비 ${l.sel} ${l.ratio} < ${l.need}`);
    for (const e of c.errors) fails.push(`${tag}: 오류 ${e}`);
    await c.shot(resolve(OUT, `web_${tone}_${theme}_${w}.png`));
  }
  c.close();
}

async function slides() {
  const file = target || resolve(A, 'slides-template.html');
  if (!existsSync(file)) { fails.push('slides-template.html 없음'); return; }
  const c = await chrome();
  await c.send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
  await c.send('Page.navigate', { url: pathToFileURL(file).href }); await sleep(2500);
  const n = await c.ev(`document.querySelectorAll('.slide').length`);
  if (!n) fails.push('slides: .slide 없음');
  // 장마다 보이게 한 뒤 슬라이드 경계를 넘는 요소를 찾는다
  for (let i = 1; i <= n; i++) {
    await c.ev(`location.hash = '#${i}'`); await sleep(250);
    await c.ev(`document.querySelectorAll('.slide')[${i - 1}].querySelectorAll('.frag').forEach(f => f.classList.add('show'))`); await sleep(700);
    const over = await c.ev(`(() => { const s = document.querySelectorAll('.slide')[${i - 1}]; const r = s.getBoundingClientRect(); const k = r.width / 1920;
      return [...s.querySelectorAll('*')].filter(e => !e.closest('.qrc,.ctl') && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden')
        .filter(e => { const b = e.getBoundingClientRect(); return b.width && (b.right > r.right + 2*k || b.bottom > r.bottom + 2*k); })
        .slice(0, 2).map(e => e.tagName + '.' + e.className); })()`);
    for (const o of over || []) fails.push(`slides ${i}장 넘침 ${o}`);
    await c.shot(resolve(OUT, `slide_${String(i).padStart(2, '0')}.png`));
  }
  await c.ev(`location.hash = '#3'`); await sleep(400);
  const cur = await c.ev(`[...document.querySelectorAll('.slide')].findIndex(s => s.classList.contains('on')) + 1`);
  if (cur !== 3) fails.push(`slides #3 이동 실패 (현재 ${cur})`);
  await c.send('Page.reload'); await sleep(2000);
  await c.ev(`location.hash = '#1'`); await sleep(300);
  for (const type of ['keyDown', 'keyUp']) await c.send('Input.dispatchKeyEvent', { type, key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
  await sleep(300);
  const after = await c.ev(`[...document.querySelectorAll('.slide')].findIndex(s => s.classList.contains('on')) + 1`);
  const fragShown = await c.ev(`document.querySelectorAll('.slide')[0].querySelectorAll('.frag.show').length`);
  if (after === 1 && !fragShown) fails.push('slides: → 키로 넘어가지 않음');
  for (const e of c.errors) fails.push(`slides 오류 ${e}`);
  c.close();
}

function strings() {
  const files = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(f => f && !f.endsWith('.png'));
  const fw = resolve(ROOT, '.local/forbidden.txt');
  if (!existsSync(fw)) fails.push('.local/forbidden.txt 없음');
  const words = existsSync(fw) ? readFileSync(fw, 'utf8').split(/\r?\n/).map(s => s.trim()).filter(Boolean) : [];
  for (const f of files) {
    const t = readFileSync(resolve(ROOT, f), 'utf8').toLowerCase();
    for (const w of words) if (t.includes(w.toLowerCase())) fails.push(`금지 문자열 ${f}: ${w}`);
  }
  for (const f of ['web-template.html', 'slides-template.html']) {
    const p = resolve(A, f); if (!existsSync(p)) continue;
    const text = readFileSync(p, 'utf8').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->|<[^>]+>/g, ' ');
    if (/[·—]/.test(text)) fails.push(`${f}: 보이는 글에 가운데 점 또는 긴 대시`);
  }
}

if (mode === 'web' || mode === 'all') await web();
if (mode === 'slides' || mode === 'all') await slides();
if (mode === 'strings' || mode === 'all') strings();
console.log(fails.length ? 'FAIL\n' + fails.join('\n') : 'PASS');
process.exit(fails.length ? 1 : 0);
