// 원본에 mono.css, mono-viz.js, 지도 자료를 넣어 템플릿을 만든다
//   scripts/web-template.src.html  -> assets/web-template.html  (/*MONO_CSS*/)
//   scripts/viz-template.src.html  -> assets/viz-template.html  (/*MONO_CSS*/ /*MONO_VIZ*/ /*MONO_GEO*/)
//   assets/slides-template.html 은 제자리에서 MONO_VIZ:START ~ MONO_VIZ:END, MONO_GEO:START ~ MONO_GEO:END 사이를 바꾼다
// 사용: node scripts/build-template.mjs   (mono.css, mono-viz.js, 원본, 지도 자료를 고친 뒤 꼭 실행)
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const A = resolve(ROOT, 'skills/mono-design/assets');
const read = p => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const stripHead = s => s.replace(/^(\/\* © [^\n]*\*\/|\/\/ © [^\n]*|<!-- © [^\n]*-->)\n/, '');

const css = stripHead(read(resolve(A, 'mono.css'))).replace(/@import url\([^)]*\);\n\n?/, '').trimEnd();
const viz = stripHead(read(resolve(A, 'mono-viz.js'))).trimEnd();
const geoKor = read(resolve(A, 'geo/korea-sido.json')).trim();
const geoWorld = read(resolve(A, 'geo/world.json')).trim();
const geoSgg = read(resolve(A, 'geo/korea-sigungu.json')).trim();
const KR_SRC = '한국: 국가데이터처(옛 통계청) SGIS 행정동 경계(공공누리 제1유형), 가공 vuski/admdongkor(CC BY 4.0), SpaceArchive 2026년 판';
const geoAll = `/* 경계: ${KR_SRC}. 세계: Natural Earth(퍼블릭 도메인) */\nvar MONO_GEO = { korea: ${geoKor}, sigungu: ${geoSgg}, world: ${geoWorld} };`;
const geoKorOnly = `/* 경계: ${KR_SRC} */\nvar MONO_GEO = { korea: ${geoKor} };`;

const web = read(resolve(import.meta.dirname, 'web-template.src.html')).replace('/*MONO_CSS*/', () => css);
writeFileSync(resolve(A, 'web-template.html'), web);
console.log('web-template', web.length);

const vt = stripHead(read(resolve(import.meta.dirname, 'viz-template.src.html')))
  .replace('/*MONO_CSS*/', () => css).replace('/*MONO_VIZ*/', () => viz).replace('/*MONO_GEO*/', () => geoAll);
writeFileSync(resolve(A, 'viz-template.html'), vt);
console.log('viz-template', vt.length);

const sp = resolve(A, 'slides-template.html');
let sl = read(sp);
const swap = (s, tag, body) => {
  const re = new RegExp(`(/\\* ${tag}:START[^\\n]*\\*/\\n)[\\s\\S]*?(/\\* ${tag}:END \\*/)`);
  if (!re.test(s)) throw new Error(`slides-template.html 에 ${tag}:START/END 표시가 없음`);
  return s.replace(re, (m, a, b) => a + body + '\n' + b);
};
sl = swap(swap(sl, 'MONO_VIZ', viz), 'MONO_GEO', geoKorOnly);
writeFileSync(sp, sl);
console.log('slides-template', sl.length);
