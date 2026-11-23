# 모노 디자인 그래프와 지도 (mono-viz) 설계

2026-11-23, 사용자 승인: 직접 SVG + 규칙, 지도 네 종류 모두.

## 목표

모노 디자인 웹과 슬라이드에서 같은 모양의 그래프 7종, 지도 4종을 라이브러리 없이 그린다. 색은 모두 토큰(CSS 변수)이라 테마, 다크 모드, 인쇄가 따로 손대지 않아도 맞는다.

## 파일

- `skills/mono-design/assets/mono-viz.js`: 그리기 파일. 의존성 없음. `MonoViz.bar/hbar/line/scatter/share/climate/pyramid/map`. 자기 CSS를 `<style id="mono-viz-css">`로 한 번 넣는다.
- `skills/mono-design/assets/geo/korea-sido.json`, `world.json`: Natural Earth(퍼블릭 도메인) 10m 시도, 110m 국가를 mapshaper로 줄인 것. 속성은 `id`, `name`만.
- `skills/mono-design/assets/viz-template.html`: 생성물. `scripts/viz-template.src.html`에 mono.css, mono-viz.js, 지도 자료를 넣어 `scripts/build-template.mjs`가 만든다.
- `skills/mono-design/references/charts.md`, `maps.md`: 규칙과 사용 예.
- 슬라이드 템플릿: 그래프 장, 지도 장 추가.

## 그래프 규칙

- 색 순서 `--fg`, `--g5`, `--g3`. 넷 이상은 `--c-1`~`--c-7`. 강조(`highlight`)를 쓰면 같은 계열의 나머지는 `--g3`, 짚는 값만 `--accent`.
- 아래 기준선 1px `--fg`, 가로 눈금선 1px `--g2`, 세로 눈금선과 눈금 표시 없음.
- 축 글자 `--g5`, 숫자 tabular-nums. 웹 13px, 슬라이드 20px.
- 단위는 그래프 왼쪽 위, 출처는 왼쪽 아래(HTML). 범례는 위 오른쪽, 꺾은선은 범례 대신 선 끝 이름.
- 꺾은선 웹 2px, 슬라이드 3px. 막대 사이 간격 30%. 값 글자는 막대 12개 이하일 때만.
- 원 그래프 금지, 대신 100% 띠(`share`).

## 지도 규칙

- 바다는 `--bg`, 육지 `--g1`, 경계 `--bg` 1px, 경위선 없음. 지명은 `--bg` 테두리(paint-order).
- 투영: 지역은 등장방형(중심 위도 보정), 세계는 Equal Earth.
- 단계 구분도: `color-mix`로 바탕과 섞은 5단계. mono는 `--fg`, navy와 blue는 `--accent`. 가장 짙은 칸 80%(잉크). 갈라지는 값은 양쪽 색.
- 도형 표현도: 원 넓이 비례, 반투명 `--fg`, 테두리 `--bg`, 큰 원부터 그린다. 범례는 겹친 원.
- 유선도: 굵기 비례 곡선, 작은 화살촉.
- 위치 안내도: 전체 `--g2b`, 짚는 곳 `--fg` 또는 `--accent`, 확대 상자 1px 테두리.
- 축척 막대와 방위표는 지역 지도에만, 가는 선.

## 인쇄와 검증

- 그래프와 지도는 자료라 인쇄 색 유지. 검은 면 검사는 SVG 칠을 보지 않는다.
- `verify.mjs viz`: viz-template을 3테마 x 2모드 x 2너비로 넘침, 대비, 오류, SVG 그려짐 검사. `strings`는 mono-viz.js에 `var()` 대비값 밖 색 코드가 없는지 본다.
