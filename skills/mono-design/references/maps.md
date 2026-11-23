# 지도

지도는 `assets/mono-viz.js`의 `MonoViz.map`으로 그린다. GeoJSON을 받아 SVG로 바꾸고, 색은 모두 CSS 변수다. 붙이는 법과 공통 옵션(`unit`, `source`, `height`, `format`)은 `charts.md` 1~2절과 같다. 예시는 `assets/viz-template.html`.

## 1. 경계 자료

| 파일 | 내용 | `id` |
|---|---|---|
| `assets/geo/korea-sido.json` | 한국 17개 시도 | 행정 코드 두 자리(`'11'` 서울, `'26'` 부산, `'27'` 대구, `'28'` 인천, `'29'` 광주, `'30'` 대전, `'31'` 울산, `'50'` 세종, `'41'` 경기, `'42'` 강원, `'43'` 충북, `'44'` 충남, `'45'` 전북, `'46'` 전남, `'47'` 경북, `'48'` 경남, `'49'` 제주) |
| `assets/geo/world.json` | 세계 국가(남극 제외) | ISO 세 글자(`'KOR'`, `'JPN'`, `'USA'`) |

- 둘 다 Natural Earth(퍼블릭 도메인)를 줄인 것이다. 속성은 `id`, `name`(한국어 이름)만. 출처 줄에 "경계: Natural Earth"를 쓴다.
- 파일 하나로 끝내야 하면 JSON을 `<script>`에 `var MONO_GEO = { korea: {...} }`로 붙인다. 아니면 `fetch('geo/korea-sido.json')`.
- 다른 경계를 쓸 때는 각 지역 `properties.id`와 `properties.name`을 맞춰 준다. 너무 자세한 경계는 mapshaper로 줄인다(파일 하나에 100KB 이하).

## 2. 네 가지

```js
// 1. 단계 구분도: values 는 { id: 값 }. breaks 를 주지 않으면 사분위로 5단계
MonoViz.map('#a', { geo: KOR, type: 'choropleth', values: { '11': 935, '41': 1369 },
  breaks: [100, 150, 250, 500], labels: ['41', '42'], unit: '시도별 인구 (단위: 만 명)' });
// 증감처럼 가운데가 있는 값: center: 0, breaks 는 가운데를 끼게 [-1, 0, 1, 2]

// 2. 도형 표현도: 원 넓이가 값에 비례. points 로 경위도 지점도 된다
MonoViz.map('#b', { geo: KOR, type: 'symbol', values: { '11': 935, '26': 327 } });
//   points: [{ at: [126.98, 37.57], value: 935, label: '서울', highlight: true }]

// 3. 유선도: from, to 는 지역 id 또는 [경도, 위도]
MonoViz.map('#c', { geo: KOR, type: 'flow', flows: [{ from: '26', to: '41', value: 18, highlight: true }] });

// 4. 위치 안내도: focus 지역만 검게(accent: true 면 강조색). inset 은 확대 상자
MonoViz.map('#d', { geo: KOR, type: 'locator', focus: '42', labels: ['42'],
  inset: { geo: WORLD, focus: 'KOR', corner: 'br', size: 0.34 } });
```

지도 옵션

| 옵션 | 뜻 |
|---|---|
| `labels` | `true`(모두) 또는 id 배열. 넓은 지역부터 붙이고 겹치면 건너뛴다. 작은 광역시가 빠지면 배열로 고른다 |
| `names` | `{ id: '보일 이름' }`로 지명 바꾸기 |
| `centers` | `{ id: [경도, 위도] }`. 원, 화살표가 닿는 곳을 바꾼다(기본은 가장 큰 땅의 넓이 중심) |
| `projection` | `'auto'`(기본: 경도 폭 90도 넘으면 Equal Earth, 아니면 등장방형), `'equalearth'`, `'equirect'` |
| `scale`, `north` | `false`면 축척 막대, 방위표를 뺀다(지역 지도에만 그린다) |
| `missing` | `false`면 "자료 없음" 범례를 뺀다 |
| `rMax`, `wMax`, `gap` | 가장 큰 원 반지름, 가장 굵은 화살표 굵기, 화살촉을 도착점에서 물리는 거리(px) |

## 3. 규칙

1. **바탕.** 바다는 바탕색(파란 바다 금지), 육지는 `--g1`, 경계는 바탕색 1px. 경위선, 지형 음영, 바탕 타일을 깔지 않는다.
2. **단계 구분도 색.** 값이 클수록 짙게, 육지 색(`--g1`)과 섞은 5단계(12~80%). mono는 검정, navy와 blue는 테마 강조색 계열. 가장 짙은 칸도 80%라 인쇄 잉크가 덜 든다. 단계는 7개를 넘기지 않는다. 증감은 `center`로 양쪽 색(navy 남색과 자주, blue 파랑과 빨강, mono 남회색과 적갈색).
3. **범례는 계단 막대.** 칸마다 `~100`, `100~150`, `500~`처럼 범위를 적는다. 값이 없는 지역은 `--g1`, 범례에 "자료 없음".
4. **원과 화살표는 검정 반투명.** 짚을 하나만 `highlight`로 강조색. 원은 큰 것부터 그려 작은 원이 위에 온다. 원 범례는 겹친 원 세 개.
5. **지명.** 진한 글씨에 바탕색 테두리를 둘러 어떤 칸 위에서도 읽히게 한다. 모든 지역에 다 붙이지 말고 읽을 곳만.
6. **축척 막대와 방위표는 가는 선.** 지역 지도에만, 세계 지도에는 그리지 않는다.
7. **도법.** 세계 지도는 넓이가 맞는 Equal Earth. 메르카토르로 단계 구분도를 그리지 않는다(높은 위도가 부풀어 짙은 칸이 과장된다).
8. **인쇄.** 지도는 자료라 인쇄해도 색을 그대로 둔다.
9. **웹 지도(확대, 이동)가 필요할 때**는 Leaflet이나 MapLibre를 쓰되 바탕 타일은 회색 무채색(예: CARTO Positron, 다크 모드는 Dark Matter), 위 색 규칙과 범례 모양을 그대로 맞춘다.

## 4. 슬라이드에 넣기

슬라이드 템플릿의 "15-2. 지도" 장을 복사한다. 지도는 세로로 길어 `.two`의 왼쪽 칸을 `900px`로 넓히고 오른쪽에 설명이나 두 번째 지도를 둔다. 템플릿에는 한국 시도 경계만 들어 있다. 세계 지도가 필요하면 `world.json`을 `MONO_GEO.world`로 더 붙인다.
