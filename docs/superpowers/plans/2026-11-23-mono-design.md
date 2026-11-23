# mono-design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 흑백 에디토리얼 디자인 스킬 `mono-design`(웹 + 1920×1080 HTML 슬라이드)을 만들어 GitHub 공개 플러그인과 로컬 스킬로 설치한다.

**Architecture:** 규칙은 `SKILL.md` + `references/*.md`에, 바로 쓰는 코드는 `assets/`(mono.css, 웹 템플릿, 슬라이드 템플릿)에 둔다. `scripts/verify.mjs`가 헤드리스 Chrome(raw CDP, 의존성 없음)으로 템플릿을 띄워 넘침, 대비, 콘솔 오류, 금지 문자열을 검사한다. 설계 근거는 `docs/superpowers/specs/2026-11-23-mono-design-design.md`.

**Tech Stack:** 순수 HTML/CSS/JS, Pretendard CDN, Node 24(내장 fetch, WebSocket), Chrome headless.

**Source material (scratchpad, 공개 저장소에 넣지 않음):**
- `S = C:\Users\김용현\AppData\Local\Temp\claude\4cda1ab0ca69f9b9\91552f42-e5a9-4e39-83ea-065051c7d364\scratchpad`
- `S\sites\REPORT.md` 사이트 측정값, `S\sites\shots\*.png` 캡처
- `S\deck-REPORT.md` 발표자료 분석, `S\deck-skeleton.html` 슬라이드 뼈대, `S\deck50-clean.html` 원본(base64 제거)

**공통 규칙 (모든 작업):**
- 공개 파일 어디에도 원래 학원 이름, 도메인, 사이트 이름 금지. 금지어 목록은 git에서 빠지는 `.local/forbidden.txt`(한 줄에 하나)에만 둔다.
- 보이는 글에 가운데 점(·)과 긴 대시(—) 금지, 이모지 금지, 아이콘은 선 SVG.
- 전역 훅이 Write 시 © 헤더를 넣는다. 지우지 않는다.
- `git add -A` 금지. 파일을 이름으로 add.
- 헤드리스 Chrome은 `--disable-gpu`, 매번 새 user-data-dir(`C:/Users/Public/mono-verify/ud<시간>`).

## File Structure

```
mono-design/
  .claude-plugin/plugin.json        플러그인 정보
  .claude-plugin/marketplace.json   마켓플레이스 정보
  LICENSE, .gitignore, README.md
  skills/mono-design/SKILL.md       진입점: 언제 쓰나, 핵심 규칙, 금지, 작업 순서
  skills/mono-design/references/tokens.md     색, 다크, 테마, 분류 색, 글자, 간격, 모양, 움직임
  skills/mono-design/references/web.md        웹 레이아웃과 부품 규격 + HTML 예
  skills/mono-design/references/slides.md     슬라이드 무대, 엔진 API, 부품 목록 + HTML 예, 문구 규칙
  skills/mono-design/references/checklist.md  완성 전 점검표
  skills/mono-design/assets/mono.css          토큰 + 웹 부품 (라이트/다크, 3테마)
  skills/mono-design/assets/web-template.html 예시 페이지 (mono.css 인라인 복사본 포함, 단일 파일)
  skills/mono-design/assets/slides-template.html 엔진 + 부품 예시 장 (단일 파일)
  scripts/verify.mjs                검증기
  examples/*.png                    README 캡처
```

---

### Task 1: 저장소 뼈대

**Files:** Create `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `LICENSE`(MIT, 2026 김용현), `.gitignore`(`node_modules/`, `verify-out/`, `.local/`), `.local/forbidden.txt`(금지어, 커밋하지 않음)

- [ ] plugin.json:
```json
{
  "name": "mono-design",
  "description": "흑백과 회색 7단계, 가늘고 큰 제목, 직각과 가는 줄로 만드는 에디토리얼 디자인 스킬. 웹페이지와 1920x1080 HTML 발표자료에 같은 디자인을 입힌다.",
  "version": "1.0.0",
  "author": { "name": "양정고등학교 지리교사 김용현", "email": "bgnlkim@gmail.com" },
  "homepage": "https://github.com/yhk1m/mono-design",
  "repository": "https://github.com/yhk1m/mono-design",
  "license": "MIT",
  "keywords": ["design", "ui", "korean", "slides", "editorial", "monochrome"]
}
```
- [ ] marketplace.json: `{"name":"mono-design","owner":{...같은 author},"plugins":[{"name":"mono-design","source":"./","description":"흑백 에디토리얼 웹과 발표자료 디자인 스킬"}]}`
- [ ] Commit `chore: 플러그인 뼈대`

### Task 2: 검증기 (먼저 작성, 템플릿이 없어 실패해야 함)

**Files:** Create `scripts/verify.mjs`

검사 항목:
1. 웹 템플릿: tone ∈ {mono, navy, blue} × theme ∈ {light, dark} × width ∈ {1440, 390}
   - `document.documentElement.scrollWidth <= innerWidth` (가로 넘침 0)
   - 대비: `[data-check-contrast]` 요소마다 글자색과 실제 바탕(조상 따라 올라가며 첫 불투명 바탕) 대비 계산, 글자 24px 이상 또는 19px 이상+600 이상이면 3:1, 아니면 4.5:1
   - 콘솔 오류(Runtime.exceptionThrown, console error) 0
   - 캡처 `verify-out/web_<tone>_<theme>_<w>.png`
2. 슬라이드 템플릿: 1920×1080
   - 각 `.slide`의 자손 중 오른쪽/아래가 슬라이드 경계를 2px 넘는 보이는 요소 0 (`.qrc`, `.ctl` 제외)
   - `location.hash = '#3'` 후 현재 장 번호 3, ArrowRight 키 이벤트 후 장 또는 frag 진행
   - 장마다 캡처 `verify-out/slide_<n>.png`, 오류 0
3. 금지 문자열: 저장소의 추적 파일(`git ls-files`) 전체에서 `.local/forbidden.txt`의 단어 0건(대소문자 무시), 보이는 글(템플릿 텍스트 노드)에 `·` `—` 0건

- [ ] verify.mjs 코드:
```js
// 사용: node scripts/verify.mjs [web|slides|strings|all]
import { spawn, execSync } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const ROOT = resolve(import.meta.dirname, '..');
const OUT = resolve(ROOT, 'verify-out'); mkdirSync(OUT, { recursive: true });
const A = resolve(ROOT, 'skills/mono-design/assets');
const mode = process.argv[2] || 'all';
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
  ws.onmessage = e => { const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map(a => a.value).join(' ')); };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
  const ev = async expr => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.result?.value;
  const shot = async (file, clip) => { const s = await send('Page.captureScreenshot', clip ? { format: 'png', clip: { ...clip, scale: 1 } } : { format: 'png' }); writeFileSync(file, Buffer.from(s.result.data, 'base64')); };
  return { send, ev, shot, errors, close: () => { ws.close(); ch.kill(); } };
}
const CONTRAST = `(() => {
  const lum = c => { const [r,g,b] = c.map(v => { v/=255; return v <= .03928 ? v/12.92 : ((v+.055)/1.055)**2.4; }); return .2126*r + .7152*g + .0722*b; };
  const rgb = s => (s.match(/[\\d.]+/g) || []).map(Number);
  const bgOf = el => { for (let e = el; e; e = e.parentElement) { const c = rgb(getComputedStyle(e).backgroundColor); if (c.length === 3 || c[3] > 0.9) return c.slice(0,3); } return [255,255,255]; };
  return [...document.querySelectorAll('[data-check-contrast]')].map(el => { const cs = getComputedStyle(el); const f = rgb(cs.color).slice(0,3), b = bgOf(el);
    const L1 = lum(f), L2 = lum(b), ratio = (Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05);
    const size = parseFloat(cs.fontSize), w = +cs.fontWeight; const need = (size >= 24 || (size >= 18.66 && w >= 600)) ? 3 : 4.5;
    return { sel: el.dataset.checkContrast, ratio: +ratio.toFixed(2), need }; }).filter(r => r.ratio < r.need);
})()`;
async function web() {
  const file = resolve(A, 'web-template.html'); if (!existsSync(file)) { fails.push('web-template.html 없음'); return; }
  const c = await chrome();
  for (const tone of ['mono', 'navy', 'blue']) for (const theme of ['light', 'dark']) for (const w of [1440, 390]) {
    await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: w < 800 ? 844 : 900, deviceScaleFactor: 1, mobile: w < 800 });
    c.errors.length = 0;
    await c.send('Page.navigate', { url: pathToFileURL(file).href + `?tone=${tone}&theme=${theme}` }); await sleep(1800);
    const over = await c.ev('document.documentElement.scrollWidth - innerWidth');
    if (over > 0) fails.push(`web ${tone}/${theme}/${w}: 가로 넘침 ${over}px`);
    const low = await c.ev(CONTRAST); for (const l of low || []) fails.push(`web ${tone}/${theme}/${w}: 대비 ${l.sel} ${l.ratio} < ${l.need}`);
    for (const e of c.errors) fails.push(`web ${tone}/${theme}/${w}: 오류 ${e}`);
    await c.shot(resolve(OUT, `web_${tone}_${theme}_${w}.png`));
  }
  c.close();
}
async function slides() {
  const file = resolve(A, 'slides-template.html'); if (!existsSync(file)) { fails.push('slides-template.html 없음'); return; }
  const c = await chrome();
  await c.send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
  await c.send('Page.navigate', { url: pathToFileURL(file).href }); await sleep(2500);
  const n = await c.ev(`document.querySelectorAll('.slide').length`);
  if (!n) fails.push('slides: .slide 없음');
  const overflow = await c.ev(`[...document.querySelectorAll('.slide')].flatMap((s, i) => { const r = s.getBoundingClientRect(); return [...s.querySelectorAll('*')].filter(e => !e.closest('.qrc,.ctl') && e.offsetParent !== null).filter(e => { const b = e.getBoundingClientRect(); return b.width && (b.right > r.right + 2 || b.bottom > r.bottom + 2); }).slice(0, 2).map(e => (i+1) + ':' + e.tagName + '.' + e.className); })`);
  for (const o of overflow || []) fails.push(`slides 넘침 ${o}`);
  await c.ev(`location.hash = '#3'`); await sleep(400);
  const cur = await c.ev(`[...document.querySelectorAll('.slide')].findIndex(s => s.classList.contains('on')) + 1`);
  if (cur !== 3) fails.push(`slides #3 이동 실패 (현재 ${cur})`);
  for (let i = 1; i <= n; i++) { await c.ev(`location.hash = '#${i}'`); await sleep(250); await c.ev(`document.querySelectorAll('.slide')[${i-1}].querySelectorAll('.frag').forEach(f => f.classList.add('show'))`); await sleep(100); await c.shot(resolve(OUT, `slide_${String(i).padStart(2,'0')}.png`)); }
  await c.ev(`location.hash = '#1'`); await sleep(300);
  await c.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
  await c.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 }); await sleep(300);
  const after = await c.ev(`location.hash`);
  if (after === '#1' || after === '') fails.push(`slides: → 키로 넘어가지 않음 (${after})`);
  for (const e of c.errors) fails.push(`slides 오류 ${e}`);
  c.close();
}
function strings() {
  const files = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(f => f && !f.endsWith('.png'));
  const fw = resolve(ROOT, '.local/forbidden.txt');
  if (!existsSync(fw)) fails.push('.local/forbidden.txt 없음');
  const words = existsSync(fw) ? readFileSync(fw, 'utf8').split(/\r?\n/).map(s => s.trim()).filter(Boolean) : [];
  for (const f of files) { const t = readFileSync(resolve(ROOT, f), 'utf8').toLowerCase(); for (const w of words) if (t.includes(w.toLowerCase())) fails.push(`금지 문자열 ${f}: ${w}`); }
  for (const f of ['web-template.html', 'slides-template.html']) { const p = resolve(A, f); if (!existsSync(p)) continue;
    const text = readFileSync(p, 'utf8').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->|<[^>]+>/g, ' ');
    if (/[·—]/.test(text)) fails.push(`${f}: 보이는 글에 가운데 점 또는 긴 대시`); }
}
if (mode === 'web' || mode === 'all') await web();
if (mode === 'slides' || mode === 'all') await slides();
if (mode === 'strings' || mode === 'all') strings();
console.log(fails.length ? 'FAIL\n' + fails.join('\n') : 'PASS');
process.exit(fails.length ? 1 : 0);
```
- [ ] Run `node scripts/verify.mjs web` → Expected `FAIL` with `web-template.html 없음`
- [ ] Commit `test: 헤드리스 Chrome 검증기`

### Task 3: mono.css

**Files:** Create `skills/mono-design/assets/mono.css`

내용(명세 `디자인 토큰`, `웹 화면 규칙` 그대로):
- `:root` 토큰: `--k --w --g1 --g2 --g2b --g3 --g4 --g5 --g6 --g7`, `--accent --accent-2 --deep`, `--c-1..--c-7`, `--on-accent`(강조 바탕 위 글자), 글자 단계 `--fs-hero:72px --fs-title:44px --fs-sec:32px --fs-24 --fs-20 --fs-18 --fs-16 --fs-14 --fs-13 --fs-11`, 간격 `--sp-4..--sp-120`, `--wrap:1200px --gutter:100px`, `--ease: cubic-bezier(.4,0,.2,1)`.
- 테마: `[data-tone="navy"]`, `[data-tone="blue"]` 강조색 덮어쓰기.
- 다크: `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {...} }` + `:root[data-theme="dark"] {...}` 같은 값, 테마별 다크 강조색 포함. 다크 강조색 정하는 법: navy와 blue를 HSL 명도만 올려 `#000` 바탕 대비 4.5:1 이상이 되는 가장 어두운 값(구현 시 node 한 줄로 계산해 주석에 비율 기록).
- 기본: Pretendard, 자간 규칙(`body` -0.5px, `.t-sm, small, 14px 이하 클래스` 0), `word-break: keep-all`, 줄 간격 1.6.
- 레이아웃: `.wrap`(max-width var(--wrap), padding 0 var(--gutter)), 미디어 쿼리 1279/767에서 gutter 40/16, `.section`(padding 120px 0), `.hero`(120/240).
- 부품 클래스: `.m-header`(.brand, .brand i 구분선, .brand span 부제, nav a, .menu-btn), `.m-subnav`(휴대폰 옆 스크롤 줄), `.m-drawer` + `.m-scrim`, `.m-h1/.m-title/.m-sec`(가는 제목), `.m-eyebrow`, `.m-btn`(+`.m-btn--line`, `.m-btn--lg`), `.m-tabs`(폴더 탭), `.m-pills`(검은 알약), `.m-chip`(둥근 거르기 칩), `.m-list`(위 검은 줄, 행 --g2), `.m-table`(공지 표) + `.m-badge`(테두리 이름표) + `.m-tag.c-1..c-7`(분류 색 직각 이름표), `.m-pager`, `.m-card`(위 3px 줄), `.m-note`(--g1 안내 상자), `.m-key`(검은 상자 흰 글씨 핵심 한 줄), `.m-num`(강조색 숫자), `.m-popup`, `.m-field`(입력칸), `.m-search`(밑줄 검색칸), `.m-footer`(검정, 2단, 연락처 격자), `.m-theme-toggle`.
- 움직임: `transition: color .15s var(--ease), background-color .15s var(--ease), opacity .15s var(--ease)`, 서랍 .4s, `@media (prefers-reduced-motion: reduce)` 전부 끔.
- [ ] 작성 후 `node -e "require('fs').readFileSync('skills/mono-design/assets/mono.css','utf8')"` 로 존재 확인. 다크 강조색 대비 계산 결과를 주석에 남긴다.
- [ ] Commit `feat: mono.css 토큰과 웹 부품`

### Task 4: web-template.html

**Files:** Create `skills/mono-design/assets/web-template.html`

- 단일 파일. `<style>`에 mono.css 내용 전체를 그대로 넣는다(파일 위 주석: "mono.css와 같은 내용. mono.css를 고치면 여기도 고친다").
- 주소 `?tone=navy&theme=dark`를 읽어 `<html data-tone data-theme>` 설정하는 짧은 스크립트(검증기와 미리보기용), 헤더 오른쪽에 테마 전환 버튼(선 SVG 해와 달), 톤 고르기 3개 버튼.
- 구성: 헤더(이름 | 부제, 메뉴 4개, 휴대폰 햄버거 + 서랍), 첫 화면(머리말, 72px 가는 제목, 18px 설명, 버튼 둘), 구역 1 "이번 주 수업"(가는 줄 목록 + 분류 색 이름표), 구역 2 폴더 탭 + 공지 표 + 쪽 번호, 구역 3 위 3px 줄 카드 3개(강조색 숫자 `.m-num`), 구역 4 안내 상자 + 핵심 한 줄, 입력칸과 검색칸, 팝업 예(열기 버튼), 검은 푸터.
- 예시 글은 수업 안내 내용(예: "세계지리 3단원 기후"), 원래 학원 관련 글 금지.
- 대비 검사 표시: 보조 글자, 메뉴, 출처, 이름표, 버튼 글자, 푸터 보조 글자, 강조 숫자에 `data-check-contrast="이름"`.
- [ ] Run `node scripts/verify.mjs web` → Expected `PASS`. 실패 항목은 css를 고쳐 재실행.
- [ ] `verify-out/web_*.png` 몇 장을 열어 눈으로 확인(헤더, 가는 제목, 직각, 줄 구조, 다크에서 강조색).
- [ ] Commit `feat: 웹 템플릿`

### Task 5: slides-template.html

**Files:** Create `skills/mono-design/assets/slides-template.html` (근거: `S\deck-skeleton.html`, `S\deck50-clean.html`)

- deck-skeleton.html을 바탕으로: 헤더 브랜드와 부제, QR은 스크립트 맨 위 `CONFIG = { title, sub, qr: '' }` 에서 설정. 50번 엔진 기능 모두 유지(키, frag, data-sec, data-go, #n, 전체 화면, P 인쇄, iframe 키 전달, 진행 막대, 모서리 버튼, 첫 장/마지막 장 헤더 없음).
- `data-tone` 지원: `--accent`, `--accent-2`를 mono.css와 같은 값으로(슬라이드는 라이트 고정, 검은 장 구분만 검정).
- 예시 장 구성(각 장은 부품 사용 예): 표지, 강사 소개, 목차, 검은 장 구분 01, 두 칸 + 줄 목록, 단계, 연표 + 개수, 카드 3, 검은 핵심 상자, 인용, 코드 + 브라우저 틀, 화면 캡처 자리(회색 상자 + 출처 줄), 휴대폰 틀, 막대 + 범례, QR 모음, 검은 장 구분 02, 표(tt), 체크 목록, 마무리. 예시 글은 키워드 중심, 가운데 점과 긴 대시 금지.
- 이미지 자리는 `--g2` 상자(외부 이미지 없음).
- [ ] Run `node scripts/verify.mjs slides` → Expected `PASS`
- [ ] `verify-out/slide_*.png` 전체를 눈으로 확인(넘침, 겹침, 헤더 목차 현재 장)
- [ ] Commit `feat: 슬라이드 템플릿`

### Task 6: references 4종

**Files:** Create `skills/mono-design/references/tokens.md`, `web.md`, `slides.md`, `checklist.md`

- tokens.md: 명세 `디자인 토큰` 전체를 표로, 각 토큰 쓰임새와 "쓰지 말 것"(예: 강조색을 헤더에 쓰지 않기, 그림자 금지) 포함. 다크 강조색 실제 값과 대비.
- web.md: 부품마다 규격 표 + 최소 HTML 예(mono.css 클래스 이름 그대로) + 휴대폰 동작. 레이아웃 너비와 여백, 헤더 구조, 푸터.
- slides.md: 무대와 비율, CONFIG, 엔진 API 표(`data-sec`, `.frag`, `data-go`, `#n`, 키, 인쇄), 부품 목록(클래스 → 용도 → 최소 HTML), 장 순서 권장(표지 → 소개 → 목차 → 장 구분 → 내용 → 마무리), 문구 규칙.
- checklist.md: 완성 전 점검 15~20항목(흑백 + 강조색 하나, 큰 제목 굵기 400 이하, 600은 작은 이름표만, 모서리 0/버튼 2px, 그림자/그라데이션 없음, 구조는 줄, 강조는 검은 상자, 휴대폰 가로 넘침 0, 누르는 곳 44px, 다크 모드 대비, 이모지 없음, 가운데 점과 긴 대시 없음, 출처 줄, 슬라이드 넘침 없음, 인쇄 확인).
- [ ] Run `node scripts/verify.mjs strings` → PASS
- [ ] Commit `docs: 참고 문서`

### Task 7: SKILL.md

**Files:** Create `skills/mono-design/SKILL.md`

- frontmatter `name: mono-design`, `description`: 무엇(흑백 에디토리얼 웹과 1920x1080 HTML 발표자료), 언제(모노 디자인, mono-design, 흑백 발표자료, 강의 슬라이드, 연수 자료, 이 디자인으로 웹페이지 만들기, 이미 만든 화면에 모노 디자인 적용), 안 쓰는 경우(사용자가 다른 디자인 스킬을 지정했을 때).
- 본문(500줄 이하): 결과물 고르기(웹 / 슬라이드) → 시작 방법(템플릿 복사, mono.css 인라인) → 핵심 규칙 10개 → 금지 목록 → 테마와 다크 → 작업 순서 → 완성 전 checklist.md와 검증 → references 안내.
- [ ] Run `node scripts/verify.mjs all` → PASS
- [ ] Commit `feat: SKILL.md`

### Task 8: 실사용 시험 (eval)

- [ ] 새 에이전트 2개에 SKILL.md 경로만 주고 과제: (가) "고2 세계지리 겨울 특강 안내 웹페이지, 휴대폰 대응" (나) "AI와 지리 수업 연수 발표 5장". 결과를 `evals/results/<날짜>/`에 저장.
- [ ] 결과를 checklist.md로 채점하고, 웹 결과는 verify의 넘침과 대비 검사로 확인. 위반 목록 작성.
- [ ] 위반이 SKILL.md 설명 부족 때문이면 고치고 같은 과제로 한 번 더. Commit `test: 실사용 시험과 보완`

### Task 9: README, 캡처, 설치, 공개

- [ ] `examples/`에 웹(라이트 mono, 다크 navy, 휴대폰 blue)과 슬라이드 4장 캡처 묶음 PNG를 verify-out에서 골라 복사.
- [ ] README.md(한국어): 소개, 특징, 설치(`/plugin marketplace add yhk1m/mono-design` → `/plugin install mono-design@mono-design`, 또는 skills 폴더 복사), 쓰는 법, 테마와 다크, 캡처, 라이선스. 원래 학원 언급 금지.
- [ ] `node scripts/verify.mjs all` → PASS
- [ ] 로컬 설치: `skills/mono-design` 폴더를 `C:\Users\김용현\.claude\skills\mono-design`로 복사(한글 경로라 Node 재귀 복사 대신 PowerShell `Copy-Item -Recurse`).
- [ ] `gh repo create yhk1m/mono-design --public --source . --push`, Commit `docs: README`
