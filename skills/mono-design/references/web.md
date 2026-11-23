# 웹페이지와 웹 도구

클래스 이름은 모두 `assets/mono.css`에 있는 그대로다. 없는 클래스를 지어내지 말고, 새 부품이 필요하면 아래 부품의 줄, 회색, 직각 규칙을 그대로 따라 만든다.

## 1. 시작하기

### 방법 A: 템플릿 복사 (새 페이지)

`assets/web-template.html`을 복사한다. mono.css 내용이 `<style>` 안에 이미 들어 있는 한 파일이다. 그다음 바꿀 것:

1. `<title>`, `<meta name="description">`, `lang="ko"` 확인
2. `data-tone` 기본값(`mono`, `navy`, `blue`)
3. 헤더 `.m-brand__name`(사이트 이름), `.m-brand__sub`(부제), 메뉴 글자. 헤더, 옆 메뉴 줄, 서랍 세 곳의 메뉴를 같게 맞춘다
4. `<main>` 안 예시 구역을 실제 내용으로 바꾸고 안 쓰는 구역은 지운다
5. 푸터 이름, 링크, 연락처 칸
6. `data-check-contrast` 속성은 저장소 검증용이다. 지워도 되고 남겨도 된다

### 방법 B: 이미 있는 페이지에 입히기

1. `<head>`에 글꼴과 mono.css를 넣는다. mono.css 파일을 옆에 두고 링크하거나, 한 파일로 끝내야 하면 내용을 `<style>`에 붙인다(맨 위 `@import`는 아래 링크가 있으면 빼도 된다).

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link rel="stylesheet" href="mono.css">
```

2. `<html lang="ko" data-tone="mono">`
3. 원래 있던 색, 그림자, 둥근 모서리, 그라데이션 규칙을 지운다. 남겨 두면 mono.css를 덮어쓴다
4. 부품을 아래 클래스로 바꾼다. 기능(이벤트, 데이터)은 건드리지 않는다

### 테마와 다크 모드 스크립트

`<head>` 안, CSS보다 앞에 둔다. 주소 `?tone=` `?theme=`, 저장한 선택, 기기 설정 순서로 정한다.

```html
<script>
  (function () {
    var root = document.documentElement, q = new URLSearchParams(location.search), saved = {};
    try { saved.tone = localStorage.getItem('mono-tone'); saved.theme = localStorage.getItem('mono-theme'); } catch (e) {}
    var tone = q.get('tone') || saved.tone, theme = q.get('theme') || saved.theme;
    if (/^(mono|navy|blue)$/.test(tone || '')) root.setAttribute('data-tone', tone);
    if (/^(light|dark)$/.test(theme || '')) root.setAttribute('data-theme', theme);
  })();
</script>
```

밝게 어둡게 버튼(헤더 `.m-header__tools` 안):

```html
<button type="button" class="m-iconbtn m-theme-toggle" aria-label="밝게 어둡게 바꾸기">
  <svg class="m-icon i-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>
  <svg class="m-icon i-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
</button>
<script>
  document.querySelectorAll('.m-theme-toggle').forEach(function (b) {
    b.addEventListener('click', function () {
      var root = document.documentElement, t = root.getAttribute('data-theme');
      var dark = t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
      var next = dark ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('mono-theme', next); } catch (e) {}
    });
  });
</script>
```

달과 해 아이콘은 CSS가 모드에 맞춰 하나만 보인다. 테마 고르기(`.m-tone`)와 서랍, 팝업, 탭 동작 스크립트는 web-template.html 맨 아래 `<script>`를 그대로 가져온다.

## 2. 헤더, 메뉴 줄, 서랍

| 너비 | 헤더 | 메뉴 | 테마 고르기 |
|---|---|---|---|
| 1280 이상 | 104px, 이름 + 구분선 + 부제, 오른쪽 메뉴 18px `--g5` | `.m-nav` | 헤더 안 |
| 1024~1279 | 같음 + 햄버거 버튼 | `.m-nav` + 서랍 | 헤더 안 |
| 768~1023 | 104px | 헤더 아래 옆으로 밀리는 `.m-subnav` 줄(44px, 15px) + 서랍 | 헤더 안 |
| 767 이하 | 64px, 부제 숨김 | `.m-subnav` 줄 + 서랍(전체 화면) | 서랍 아래(`.m-hide-sm`으로 헤더에서 숨김) |

- 헤더 바탕은 `--bg`, 고정하지 않는다. 강조색 쓰지 않는다.
- 현재 메뉴는 `aria-current="page"`: 검정, 굵기 600. 밑줄, 알약, 색 막대 없다.
- 헤더에 메뉴를 다섯 개보다 많이 두지 않는다. 나머지는 서랍에만 둔다.

```html
<header class="m-header">
  <div class="wrap m-header__row">
    <a class="m-brand" href="/">
      <span class="m-brand__name">사이트 이름</span>
      <span class="m-brand__div" aria-hidden="true"></span>
      <span class="m-brand__sub">부제</span>
    </a>
    <nav class="m-nav" aria-label="주 메뉴">
      <a href="#" aria-current="page">수업 안내</a>
      <a href="#">공지사항</a>
    </nav>
    <div class="m-header__tools">
      <div class="m-tone m-hide-sm" role="group" aria-label="색 테마">
        <button type="button" data-tone-btn="mono">흑백</button>
        <button type="button" data-tone-btn="navy">남색</button>
        <button type="button" data-tone-btn="blue">파랑</button>
      </div>
      <!-- 밝게 어둡게 버튼 -->
      <button type="button" class="m-iconbtn m-menu-btn" aria-label="전체 메뉴 열기" aria-controls="drawer" aria-expanded="false">
        <svg class="m-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
      </button>
    </div>
  </div>
  <nav class="m-subnav" aria-label="주 메뉴">
    <div class="wrap m-subnav__row">
      <a href="#" aria-current="page">수업 안내</a>
      <a href="#">공지사항</a>
    </div>
  </nav>
</header>

<div class="m-scrim" data-close-drawer></div>
<aside class="m-drawer" id="drawer" aria-label="전체 메뉴" aria-hidden="true">
  <div class="m-drawer__head">
    <span class="m-brand__name">전체 메뉴</span>
    <button type="button" class="m-iconbtn" data-close-drawer aria-label="메뉴 닫기">
      <svg class="m-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>
    </button>
  </div>
  <div class="m-drawer__body">
    <nav class="m-drawer__list" aria-label="전체 메뉴">
      <a href="#" aria-current="page">수업 안내</a>
      <a href="#">공지사항</a>
    </nav>
  </div>
  <div class="m-drawer__foot">
    <span>색 테마</span>
    <div class="m-tone" role="group" aria-label="색 테마"><!-- 헤더와 같은 버튼 세 개 --></div>
  </div>
</aside>
```

서랍: 너비 460px(휴대폰 100%), 오른쪽에서 0.4초. 열면 `.is-open`을 서랍과 막에 붙이고 `body`에 `.m-drawer-open`(스크롤 잠금), 첫 버튼에 초점, Esc로 닫기, 닫으면 햄버거 버튼으로 초점을 돌린다. 현재 항목 왼쪽에 4x24px 직각 검은 막대가 자동으로 붙는다.

## 3. 레이아웃

| 클래스 | 하는 일 |
|---|---|
| `.wrap` | 가운데 정렬, 최대 1200px + 양옆 `--gutter` |
| `.wrap--wide` / `.wrap--read` | 1312px / 1080px |
| `.hero` | 첫 화면 구역(위 120, 아래 240) |
| `.section` | 구역(위아래 120). 이어지는 구역은 위 여백 0 |
| `.section--line` | 구역 위 `--g2` 줄 |
| `.section--deep` | `--deep` 바탕, 흰 글씨. 페이지에 하나만 |
| `.m-sec-head` | 구역 제목 줄. 왼쪽 제목, 오른쪽 거르기나 작은 버튼 |
| `.m-grid-2` / `.m-grid-3` | 두 칸 / 세 칸 격자, 사이 40. 767 / 1023 이하에서 한 칸 |

```html
<main id="main">
  <section class="hero">
    <div class="wrap">
      <span class="m-eyebrow">2026학년도 2학기</span>
      <h1 class="m-hero-title">세계를 읽는<br>지리 수업</h1>
      <p class="m-lead">한두 문장 설명.</p>
      <div class="m-btns">
        <a class="m-btn" href="#">주요 행동</a>
        <a class="m-btn m-btn--line" href="#">보조 행동</a>
      </div>
    </div>
  </section>
  <section class="section">
    <div class="wrap">
      <div class="m-sec-head"><h2 class="m-sec-title">구역 제목</h2></div>
      <!-- 부품 -->
    </div>
  </section>
</main>
```

속 페이지는 `.m-hero-title` 대신 `.m-title`(44px, 굵기 200)을 쓴다. 본문 바로가기 `<a class="sr-only" href="#main">본문 바로가기</a>`를 `<body>` 맨 앞에 둔다.

## 4. 글자 클래스

| 클래스 | 규격 |
|---|---|
| `.m-eyebrow` | 14px, 600, `--g5`, 제목 위 머리말 |
| `.m-hero-title` | 72px, 400 (휴대폰 32px) |
| `.m-title` | 44px, 200 (휴대폰 28px, 300) |
| `.m-sec-title` | 32px, 300 (휴대폰 24px) |
| `.m-lead` | 18px, `--g6`, 최대 640px |
| `.m-label` | 18px, 600 |
| `.t-24` `.t-20` `.t-18` `.t-14` `.t-13` | 크기만 바꾸기 |
| `.t-sub` | `--g5` 글자 |
| `.t-long` | 줄 간격 1.8 |
| `.m-source` | 13px, `--g5`. 출처, 기준일 |

## 5. 부품

### 버튼 `.m-btn`

| 변형 | 높이 | 모서리 | 바탕 / 글자 | 쓰임 |
|---|---|---|---|---|
| `.m-btn` | 44 | 2px | `--fg` / `--bg`, 600 | 주요 행동. 한 구역에 하나 |
| `.m-btn--line` | 44 | 2px | 투명, `--g3` 테두리, 500 | 보조 행동 |
| `.m-btn--lg` | 58 | 3px | 가득 너비(최대 460) | 양식 제출, 휴대폰 하단 행동 |
| `.m-btn--sm` | 36 (휴대폰 44) | 2px | 14px | 구역 제목 옆 작은 행동 |
| `:disabled` | | | `--g3` / `--g6` | |

안쪽 여백 8px 20px, 최소 너비 100px. 호버는 투명도 0.8(테두리 버튼은 `--hover` 바탕). 버튼에 강조색을 칠하지 않는다.

```html
<div class="m-btns">
  <button type="button" class="m-btn">저장</button>
  <button type="button" class="m-btn m-btn--line">취소</button>
</div>
```

### 아이콘 버튼 `.m-iconbtn`

40x40(휴대폰 44x44), `--g5`, 호버 `--fg`. 안에 `.m-icon` 선 SVG, `aria-label` 필수.

### 폴더 탭 `.m-tabs`

높이 56, 최소 너비 120, 비활성은 `--g1` 바탕 `--g3` 테두리 `--g6` 글자, 선택은 `--bg` 바탕 검은 글자 600에 아래 테두리 없음. 좁으면 `.m-tabs-scroll`이 옆으로 밀린다.

```html
<div class="m-tabs-scroll">
  <div class="m-tabs" role="tablist" aria-label="게시판">
    <button type="button" class="m-tab" role="tab" aria-selected="true">공지사항</button>
    <button type="button" class="m-tab" role="tab" aria-selected="false">과제</button>
  </div>
</div>
<div class="m-tabs-panel" role="tabpanel">...</div>
```

### 거르기 알약 `.m-pill`

높이 38(휴대폰 44), 2px, `--g3` 테두리. 선택(`aria-pressed="true"`)은 `--accent` 바탕. 한 묶음에서 하나만 선택.

```html
<div class="m-pills" role="group" aria-label="과목 거르기">
  <button type="button" class="m-pill" aria-pressed="true">전체</button>
  <button type="button" class="m-pill" aria-pressed="false">세계지리</button>
</div>
```

### 칩 `.m-chip`

높이 32(휴대폰 44), 완전히 둥근 유일한 부품. 여러 개 켜는 거르기나 낱말 표시. 켜짐은 `--fg` 바탕.

```html
<button type="button" class="m-chip" aria-pressed="false">기후</button>
```

### 가는 줄 목록 `.m-list`

위 검은 1px, 행 사이 `--g2`, 행 위아래 24. 제목 18px 500, 설명과 날짜 14px `--g5`. 휴대폰에서는 날짜가 위로, 제목이 한 줄 전체로.

```html
<ul class="m-list">
  <li>
    <span class="m-tag c-1">세계지리</span>
    <div class="m-list__main">
      <a class="m-list__title" href="#">3단원 기후: 쾨펜 기후 구분</a>
      <span class="m-list__desc">기후 그래프 읽기</span>
    </div>
    <span class="m-list__meta">11월 24일 월</span>
  </li>
</ul>
```

### 공지 표 `.m-table`

위 검은 1px, 머리 56px `--g1` 바탕 14px 600, 행 68px `--g2` 줄, 가운데 정렬, 제목 칸만 왼쪽(`.m-table__title`, 16px 600 검정). 공지 행은 번호 칸에 `.m-badge`. 휴대폰에서는 머리 줄을 숨기고 행마다 한 덩어리(이름표, 날짜 한 줄 + 제목 한 줄)로 바뀐다. 일반 번호 칸은 `.is-plain`을 붙이면 휴대폰에서 숨는다. 날짜 칸은 `.m-table__date`.

```html
<table class="m-table">
  <thead><tr><th scope="col" style="width:96px">번호</th><th scope="col">제목</th><th scope="col" style="width:140px">작성일</th></tr></thead>
  <tbody>
    <tr>
      <td class="m-table__num"><span class="m-badge">공지</span></td>
      <td class="m-table__title"><a href="#">수행평가 기준과 제출 기한</a></td>
      <td class="m-table__date">2026-11-20</td>
    </tr>
    <tr>
      <td class="m-table__num is-plain">12</td>
      <td class="m-table__title"><a href="#">하천 지형 사진 자료</a></td>
      <td class="m-table__date">2026-11-14</td>
    </tr>
  </tbody>
</table>
```

수치가 많은 자료 표는 휴대폰에서 카드로 바꾸지 말고 `<div style="overflow-x:auto">`로 감싸 표 안에서만 옆으로 밀리게 한다. 페이지 전체는 넘치지 않아야 한다.

### 이름표

| 클래스 | 규격 | 쓰임 |
|---|---|---|
| `.m-badge` | 20px 높이, 1px `--fg` 테두리, 11px 600 | "공지", "새 글" 같은 상태 |
| `.m-badge--fill` | 검은 바탕 | 더 강한 상태 하나 |
| `.m-tag.c-1`~`.c-7` | 22px 높이, 분류 색 바탕, 흰 12px 600, 직각 | 과목, 단원, 갈래 |

```html
<span class="m-badge">공지</span>
<span class="m-tag c-2">한국지리</span>
```

### 쪽 번호 `.m-pager`

34px 정사각(휴대폰 44), 2px, `--g2b` 테두리. 현재 쪽 `aria-current="page"`는 검은 테두리 600.

```html
<nav class="m-pager" aria-label="쪽 번호">
  <a href="#" aria-label="이전 쪽"><svg class="m-icon m-icon--sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg></a>
  <a href="#" aria-current="page">1</a>
  <a href="#">2</a>
  <a href="#" aria-label="다음 쪽"><svg class="m-icon m-icon--sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></a>
</nav>
```

### 카드와 큰 숫자 `.m-card` `.m-num`

카드는 상자가 아니라 위 3px 검은 줄 + 위 여백 24. 큰 숫자는 56px 굵기 200, `--accent` 색. 두 번째 숫자는 `.m-num--2`(`--accent-2`). 단위는 `<small>`.

```html
<div class="m-grid-3">
  <article class="m-card">
    <p class="m-num">128<small>개</small></p>
    <h3 class="m-card__title">올린 수업 자료</h3>
    <p class="m-card__desc">활동지, 발표 자료 포함</p>
  </article>
</div>
<p class="m-source" style="margin-top:32px">기준일 2026년 11월 20일</p>
```

### 안내 상자 `.m-note`

`--g1` 바탕, 안쪽 32 40, 글자 `--g6` 1.8. 제목은 `.m-note__title`. 이 상자 안에는 `--g5` 작은 글자나 강조색 글자를 넣지 않는다.

```html
<div class="m-note"><strong class="m-note__title">수행평가 안내</strong>보고서 1편, A4 한 쪽.</div>
```

### 핵심 상자 `.m-key`

검은 바탕 흰 글자 24px 300, 안쪽 40. `.m-key--accent`는 강조색 바탕. 한 화면에 하나, 문장 한두 줄.

```html
<div class="m-key m-key--accent">
  <span class="m-key__label">이번 단원 핵심</span>
  기후 그래프는 강수 막대를 먼저 읽는다.
</div>
```

### 입력 `.m-field`, 검색 `.m-search`

입력칸 44px, 직각, `--g3` 테두리, 초점 시 검은 테두리. 이름표 14px 600, 도움말 13px `--g5`, placeholder `--g5`. 두 칸 배치는 `.m-form-row`(휴대폰 한 칸). 검색칸은 테두리 없이 밑줄 하나, 32px 300(휴대폰 24px), placeholder `--g4`(큰 글자라 장식으로 본다).

```html
<div class="m-form-row">
  <div class="m-field">
    <label for="sid">학번</label>
    <div class="m-field__row">
      <input id="sid" type="text" inputmode="numeric" placeholder="예: 20315">
      <button type="button" class="m-btn">조회</button>
    </div>
    <span class="m-field__help">학번 다섯 자리</span>
  </div>
  <form class="m-search" role="search">
    <label for="q" class="sr-only">자료 검색</label>
    <input id="q" type="search" placeholder="자료 검색">
    <button type="submit" aria-label="검색"><svg class="m-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21"/></svg></button>
  </form>
</div>
```

### 팝업 `.m-popup`

가운데, 너비 420(좁으면 화면 - 32), `--g1` 바탕, `--g2b` 테두리, 그림자 없음. 아래 58px 버튼 줄(`--bg` 바탕, 칸 사이 `--g2b` 줄). 오른쪽 위 닫기 44px. 뒤에 `.m-scrim`.

```html
<div class="m-scrim" data-popup-scrim></div>
<div class="m-popup" id="deadline" role="dialog" aria-modal="true" aria-labelledby="deadline-title" hidden>
  <button type="button" class="m-popup__x" data-close-popup aria-label="닫기"><svg class="m-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg></button>
  <div class="m-popup__body">
    <h2 class="m-popup__title" id="deadline-title">제출 기한 안내</h2>
    <p class="m-popup__text">12월 5일 금요일 오후 6시까지 올립니다.</p>
  </div>
  <div class="m-popup__foot">
    <button type="button" data-close-popup>오늘 다시 보지 않기</button>
    <button type="button" data-close-popup>닫기</button>
  </div>
</div>
```

열 때 `hidden`을 지우고 막에 `.is-open`, 닫기 버튼에 초점. Esc와 막 누르기로 닫고 연 버튼으로 초점을 돌린다.

### 푸터 `.m-footer`

두 모드 모두 검은 바탕, 위 1px 줄. 위쪽 두 칸(이름과 설명 / 링크), 연락처 네 칸 격자(휴대폰 두 칸), 저작권 줄. 강조색 쓰지 않는다.

```html
<footer class="m-footer">
  <div class="wrap">
    <div class="m-footer__top">
      <div><p class="m-footer__brand">사이트 이름</p><p class="m-footer__desc">한 줄 설명</p></div>
      <nav class="m-footer__links" aria-label="바닥 메뉴"><a href="#">이용 안내</a><a href="#">문의</a></nav>
    </div>
    <dl class="m-footer__grid">
      <div><dt>교무실</dt><dd>본관 2층</dd></div>
      <div><dt>상담 시간</dt><dd>화, 목 16:30</dd></div>
      <div><dt>수업 시간</dt><dd>주 4시간</dd></div>
      <div><dt>학급</dt><dd>2학년 4개 반</dd></div>
    </dl>
    <p class="m-footer__copy">© 2026 사이트 이름</p>
  </div>
</footer>
```

### 웹 도구 화면

계산기, 지도, 시뮬레이션처럼 쓰는 화면도 같은 부품으로 만든다.

- 조작 패널은 `--g1` 면이나 위 검은 줄로 나누고, 그림자 띄운 카드로 만들지 않는다.
- 값 이름 14px 600, 값은 `.m-num`이나 18px 600.
- 슬라이더, 체크 상자는 `accent-color: var(--fg)`로 검게.
- 휴대폰에서 도구가 화면을 꽉 채워야 하면 아래 탭 막대(높이 56~68, 위 `--g2` 줄, 아이콘 + 12px 글자, 현재 탭 검정)를 써도 된다.

## 6. 휴대폰 규칙

- **가로 넘침 0.** 390px에서 `document.documentElement.scrollWidth - innerWidth`가 0이어야 한다. 넓은 표, 코드, 지도는 자기 상자 안에서만 밀리게 한다.
- **누르는 곳 44px 이상.** mono.css는 767px 이하에서 버튼, 알약, 칩, 쪽 번호, 아이콘 버튼, 테마 고르기를 44px로 키운다. 새 부품도 같게.
- 메뉴 다섯 개 넘으면 서랍으로. 테마 고르기는 서랍 아래에.
- 글자 단계는 mono.css가 줄인다(72 → 32, 44 → 28, 32 → 24). 인라인 `font-size`로 덮지 않는다.
- 여러 칸 격자는 한 칸으로. 인라인 `grid-template-columns`를 썼다면 미디어 쿼리로 같이 풀어 준다.

## 7. 다크 모드 규칙

- `data-theme`이 없으면 기기 설정을 따르고, 버튼을 누르면 `data-theme="light|dark"`가 우선한다.
- 색은 항상 토큰(`--bg`, `--fg`, `--g1`~`--g7`, `--accent`)으로 쓴다. `#000`, `#fff`를 직접 쓰면 다크에서 뒤집히지 않는다. 예외는 검은 푸터와 `.section--deep`의 흰 글씨.
- 검은 버튼은 다크에서 흰 버튼(검은 글자)이 된다. 따로 만들지 않는다.
- 다크 강조색 글자는 `--bg` 위에만. `--g1` 면 위에서는 3.7:1이라 작은 글자가 안 된다.
- 사진과 그림은 그대로 두고, 흰 바탕 PNG 그림은 `--g1` 틀 안에 넣어 경계를 준다.
- 두 모드 모두 확인한다. 한쪽에서만 보고 끝내지 않는다.
