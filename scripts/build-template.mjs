// mono.css 를 scripts/web-template.src.html 의 /*MONO_CSS*/ 자리에 넣어 assets/web-template.html 을 만든다
// 사용: node scripts/build-template.mjs   (mono.css 나 원본을 고친 뒤 꼭 실행)
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const A = resolve(ROOT, 'skills/mono-design/assets');
let css = readFileSync(resolve(A, 'mono.css'), 'utf8').replace(/\r\n/g, '\n');
css = css.replace(/^\/\* © [^\n]*\*\/\n/, '').replace(/@import url\([^)]*\);\n\n?/, '');
const html = readFileSync(resolve(import.meta.dirname, 'web-template.src.html'), 'utf8')
  .replace(/\r\n/g, '\n')
  .replace('/*MONO_CSS*/', () => css.trimEnd());
writeFileSync(resolve(A, 'web-template.html'), html);
console.log('ok', html.length);
