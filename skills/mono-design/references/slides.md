# HTML 슬라이드 (1920x1080)

원본은 `assets/slides-template.html` 한 파일이다. CSS, 엔진, 예시 장 19개가 모두 들어 있다. 각 예시 장 바로 위 주석 `<!-- 번호. 이름 | 쓰는 클래스 -->`가 부품 목록이다. 새 장은 비슷한 예시 장을 복사해서 글만 바꾼다.

## 1. 무대

- 무대 `#stage`는 1920x1080 고정. 창 크기에 맞춰 비율을 지키며 줄어들고(`fit()`), 바깥은 `#1a1a1a`.
- 모든 크기는 무대 px로 쓴다. `vw`, `vh`, `rem`, `%` 글자 크기 쓰지 않는다.
- 슬라이드는 라이트 전용이다. 다크 모드 없음. 검은 바탕은 장 구분(`.slide.dark`)과 핵심 상자(`.inv`)뿐이다.
- 장 구조: `<section class="slide">` 안에 `<div class="hd"></div>`(헤더 120px, 엔진이 채움)와 `<div class="bd">`(본문, 위 60 아래 100). 양옆 140px.
- `.bd.mid`: 세로 가운데. `.bd.fill`: 위 40 아래 56, 큰 그림이나 iframe 장.
- `.src`: 장 왼쪽 아래(140, 40) 출처 줄. `.bd` 밖, `section` 바로 안에 둔다.
- 장 밖으로 넘치면 잘린다(`overflow: hidden`). 글이 많으면 줄이거나 장을 나눈다.

## 2. CONFIG

`<script>` 맨 위:

```js
const CONFIG = { title: '자료 제목', sub: '2026.11.23. 장소', qr: '' };
```

| 키 | 하는 일 |
|---|---|
| `title` | 헤더 왼쪽 자료 제목(20px 600) |
| `sub` | 그 옆 회색 글(날짜와 장소). 구분선이 자동으로 들어간다 |
| `qr` | 자료 주소 QR을 SVG 문자열로. 넣으면 첫 장, 마지막 장, 장 구분을 뺀 모든 장 오른쪽 위에 150px로 붙는다. 빈 문자열이면 끔. QR 라이브러리를 부르지 말고 미리 만든 SVG를 붙인다 |

`<title>`과 표지 `h1`, `.cdate`, `.who`, `.place`도 함께 바꾼다.

## 3. 엔진 API

| 무엇 | 쓰는 법 | 동작 |
|---|---|---|
| 장 이름 | `<section class="slide" data-sec="장 이름">` | 헤더 오른쪽 장 목록을 자동으로 만든다. 현재 장 이름은 검정 |
| 장 이름 없는 장 | `data-intro` 또는 속성 없음 | 목록에 안 들어간다(소개, 목차) |
| 헤더 없는 장 | 첫 장, 마지막 장 | 자동. `.hd`는 비워 둔다 |
| 하나씩 보이기 | 요소에 `class="frag"` | 다음 키마다 하나씩 `.show`가 붙는다. 이전 키는 거꾸로 숨긴다 |
| 장 이동 링크 | `data-go="장 이름"` | 누르면 그 장의 첫 슬라이드로. 헤더 장 목록도 이것을 쓴다 |
| 주소 | `#n` (1부터) | n번째 장을 연다. 넘길 때마다 주소가 바뀐다 |
| 다음 | → ↓ PageDown Space Enter | 남은 `.frag`부터 보이고, 다 보이면 다음 장 |
| 이전 | ← ↑ PageUp Backspace | |
| 처음 / 끝 | Home / End | |
| 전체 화면 | F, 리모컨 F5 | |
| PDF | P 또는 모서리 PDF 버튼 | 인쇄 창을 연다. 대상에서 「PDF로 저장」 |
| 모서리 버튼 | `.ctl`(이전, 쪽 번호, 다음, 전체 화면, PDF) | 오른쪽 아래, 평소 흐리게, 올리면 진하게 |
| 진행 막대 | `.progress` | 아래 3px `--g5` |
| iframe 키 전달 | iframe 안 페이지에서 `parent.postMessage({ slideKey: e.key }, '*')` | 데모를 눌러 초점이 iframe에 있어도 슬라이드가 넘어간다 |
| 테마 | `<html data-tone="navy">` 또는 주소 `?tone=navy` | 강조색만 바뀐다 |

iframe 안 페이지에 넣을 코드:

```js
addEventListener('keydown', e => {
  if (['ArrowRight','ArrowLeft','PageDown','PageUp'].includes(e.key)) parent.postMessage({ slideKey: e.key }, '*');
});
```

인쇄와 PDF: `@page`가 1920x1080, 한 장에 한 쪽. 잉크를 아끼려고 검은 면을 없앤다. 검은 장 구분은 흰 바탕 검은 글자, 검은 핵심 상자(`.inv`, `.flow .on-k`)는 회색 면(`--print-fill`, #e1e1e1)에 검은 글씨, 휴대폰 틀(`.shot`)은 연한 회색 테두리로 바뀐다. 검은 면 부품을 새로 만들면 `@media print`에 같은 규칙을 더한다. 모든 `.frag`가 보이고, 모서리 버튼과 진행 막대는 숨는다. 숨은 장도 `visibility: hidden`으로 크기를 유지하니 `display: none`으로 바꾸지 않는다.

## 4. 장 순서 (권장)

1. 표지 (`.cover`)
2. 발표자 소개 (`data-intro`, `.intro`)
3. 목차 (`data-intro`, `.tt.toc`)
4. 장 구분 01 (`.slide.dark.sec`)
5. 내용 장 여러 개 (`data-sec="1장 이름"`)
6. 장 구분 02, 내용 장 ... 장마다 반복
7. 핵심 정리 (`.inv`) 또는 점검표 (`.chk.ico`)
8. 자료 모음 QR (`.qrs.lg`)
9. 마무리 (`.bd.mid`, 헤더 없음)

장 이름은 세 개에서 다섯 개. 헤더 한 줄에 다 들어가야 한다.

**짧은 자료(8장 이하).** 검은 장 구분(`.slide.dark.sec`)을 빼도 되고, 장 이름은 2개여도 된다. 표지, 내용 장, 마무리만으로 짜도 된다.

## 5. 부품 목록

### 장 종류

**표지** `.slide.cover`: 위 `h1`(120px, 두 줄까지), 아래 `.row`에 `.who`(이름, 소속, `.mail`)와 `.place`(행사, 장소). 날짜는 오른쪽 위 `.cdate`.

```html
<section class="slide cover">
  <div class="hd"></div>
  <div class="cdate">2026.11.23.(월)</div>
  <div class="bd">
    <h1>AI와 함께하는<br>지리 수업</h1>
    <div class="row">
      <div class="who">발표자 이름<br>소속<br><a class="mail" href="mailto:name@example.com">name@example.com</a></div>
      <div class="place">교사 연수<br>장소 이름</div>
    </div>
  </div>
</section>
```

**발표자 소개** `.intro`: 두 칸(1 : 1.35). 왼쪽 `.name`, `.career`(`b`로 "현)" "전)"), `.edu`, `.links`(이름 + 주소 줄). 오른쪽 `.lab` + `.plist`(그림 56px, 제목, 설명, 주소).

```html
<section class="slide" data-intro>
  <div class="hd"></div>
  <div class="bd">
    <h2>발표자 소개</h2>
    <div class="intro">
      <div>
        <p class="name">발표자 이름</p>
        <div class="career"><div><b>현)</b> 소속 학교 지리 교사</div></div>
        <div class="links"><a href="#"><span>웹페이지</span>example.com</a></div>
      </div>
      <div>
        <div class="lab">만든 수업 도구</div>
        <div class="plist"><a href="#"><div class="ph">그림</div><div><b>지도 만들기 도구</b><span>학생이 주제도 그리기</span></div><em>map.example.com</em></a></div>
      </div>
    </div>
  </div>
</section>
```

**목차** `.tt.toc`: 번호 + 장 이름 + `small` 부제. 일곱 개 이상이면 `.tt.toc.cols`(네 줄씩 두 칸).

```html
<div class="tt toc">
  <div><span>01</span><div>도구 살펴보기<small>AI 도구 종류</small></div></div>
  <div><span>02</span><div>수업에 적용하기<small>차시 계획, 점검표</small></div></div>
</div>
```

**장 구분** `.slide.dark.sec`: 검은 바탕, 두 자리 번호 `.eyebrow`, `h1`, 선택 `.subt`. 헤더 장 목록에서 현재 장이 흰색.

```html
<section class="slide dark sec" data-sec="도구 살펴보기">
  <div class="hd"></div>
  <div class="bd"><div class="eyebrow">01</div><h1>도구 살펴보기</h1><p class="subt">한 줄 부제</p></div>
</section>
```

**마무리**: 헤더 없음, 가운데.

```html
<section class="slide">
  <div class="hd"></div>
  <div class="bd mid"><h1>감사합니다.</h1><p class="gray" style="margin-top:32px">발표자 이름 | name@example.com</p></div>
</section>
```

### 배치

| 클래스 | 하는 일 |
|---|---|
| `.two` | 두 칸, 사이 80, 위 56. 비율은 `style="grid-template-columns:1fr 1.05fr"`처럼 그 장에서 바꾼다 |
| `.three` | 세 칸, 사이 64 |
| `.hero` + `.lead` + `.details` | 왼쪽 큰 제목, 오른쪽 720px 설명 묶음 |
| `.lane` + `.who` | 왼쪽 180px 이름 칸 + 오른쪽 내용 |

### 가는 줄 목록

공통: 위 `--g3` 1px, 행 사이 `--g2` 1px. 세로줄, 줄무늬, 칸 바탕 없음.

**`.rows`** 표처럼 쓰는 칸 격자. 칸 수는 `style="grid-template-columns:200px 1fr"`. `.k` 열쇠 칸(34px 600), `.s` 보조 칸과 머리 줄(22px `--g6`). `.tight`는 행 높이 줄이기.

```html
<div class="rows tight" style="grid-template-columns:200px 1fr">
  <div class="s">단계</div><div class="s">이전 방식</div>
  <div class="k">자료 찾기</div><div>검색 결과 직접 비교</div>
</div>
```

**`.steps`** 번호 단계. `b` 번호, `.s` 설명 줄.

```html
<div class="steps">
  <div><b>1</b><span>수업 목표 정하기<span class="s">성취기준 한 줄로</span></span></div>
  <div class="frag"><b>2</b><span>요청문 쓰기</span></div>
</div>
```

**`.tt`** 두 칸 이름 표(160px + 나머지, 30px). `.tt.c3`는 세 칸, `.head` 머리 줄, `.rest` 흐린 칸.

```html
<div class="tt c3">
  <div class="head"><span>차시</span><div>활동</div><div>도구</div></div>
  <div><span>1차시</span><div>기후 자료 읽기</div><div class="rest">대화형 도구</div></div>
</div>
```

**`.chk`** 글머리 없는 점검 목록. `h3`(24px 600 `--g5`) 칸 이름, `p` 한 줄씩. `.chk.ico`는 줄 앞에 선 SVG 아이콘(`svg.ic`).

```html
<div class="chk ico">
  <h3>수업 전</h3>
  <p><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 3.5h17v17h-17z"/><path d="M7.5 12.5l3 3 6-7"/></svg>사실과 출처 확인</p>
</div>
```

**`.yr` + `.count`** 연도별 표. `.hd2` 머리 줄, `.y` 연도, `em` 월. 아래 `.count` 한 줄 요약, `b`가 `--accent-2` 강조 숫자.

```html
<div class="yr" style="grid-template-columns:170px repeat(2, 1fr)">
  <div class="hd2"></div><div class="hd2">지도</div><div class="hd2">그래프</div>
  <div class="y">2025</div><div><em>04</em>도시 확장 지도</div><div><em>06</em>인구 피라미드</div>
</div>
<p class="count frag">3년 동안 <b>12개</b> 수업 자료</p>
```

**`.legend` + `.bars`** 가로 막대. 범례는 `span`에 `--c` 색, `em`은 단위. 막대 `i`는 `width:%`와 `--c`. 강조할 막대 하나만 `i.acc`와 `b.acc`. 막대 색은 회색 단계와 검정으로만.

```html
<div class="legend"><span style="--c:var(--g3)">2025</span><span style="--c:#000">2026</span><em>단위 %</em></div>
<div class="bars">
  <div><span>스스로 찾아본다</span><div class="bb"><i style="width:30%;--c:var(--g3)"></i><i class="acc" style="width:64%"></i></div><b class="acc">64</b></div>
</div>
```

### 카드

**`.cards`** 네 칸(`.c3` 세 칸) 위 3px 검은 줄 카드. `.n` 번호, `b` 제목(36px), `p` 줄마다 한 항목. 그림 카드는 `.cards.case3` + 카드 맨 위 `.ph`.

```html
<div class="cards c3">
  <div><span class="n">01</span><b>대화형 도구</b><p>질문과 답</p><p>요약과 정리</p></div>
  <div class="frag"><span class="n">02</span><b>코딩 도구</b><p>웹 활동지</p></div>
</div>
```

### 큰 숫자

**`.stat`** 두 칸(`.stat.c3` 세 칸) 위 3px 검은 줄 카드에 큰 숫자 하나씩. `.lab` 이름(24px `--g5`), `.num` 숫자(200px 굵기 300, 줄 높이 1, 자간 -6px, `.c3`에서는 160px), `small` 단위, `p` 한 줄 설명(24px `--g6`). 강조할 숫자는 `.num.acc`(`--accent`). 비교하는 같은 종류의 숫자 둘은 함께 칠해도 된다. 숫자가 빌려 온 값이면 `.src` 출처 줄, 예시면 "예시 값".

```html
<div class="stat">
  <div><span class="lab">수업 참여율</span><span class="num acc">92<small>%</small></span><p>활동지 질문에 끝까지 답한 학생</p></div>
  <div class="frag"><span class="lab">과제 제출률</span><span class="num acc">87<small>%</small></span><p>기한 안에 활동지를 낸 학생</p></div>
</div>
```

### 1px 검은 상자

**`.ask`** 요청문, 질문 상자. `.lab` 작은 머리말.

```html
<div class="ask"><div class="lab">요청문 틀</div>[고등학교 1학년]이 [세계 기후 지도]를 보고 비교하는 활동지를 만들어 줘.</div>
```

**`.tag`** 줄 안 테두리 이름표. **`.apidef`** 왼쪽 4px 검은 직각 줄 정의 상자(`b` 낱말, `p` 뜻).

```html
<span class="tag">API</span>
<div class="apidef"><p><b>API</b> 프로그램끼리 자료를 주고받는 약속</p></div>
```

**`.flow`** 흐름도. 상자 `div`, 사이 `i > em`(동작 이름, 화살표는 CSS가 그림), 결과 상자 `.on-k`(검은 바탕), 선택 단계 `.opt`(점선).

```html
<div class="flow">
  <div><b>자료</b><span>공공 통계</span></div>
  <i class="frag"><em>불러오기</em></i>
  <div class="frag on-k"><b>지도</b><span>학생 화면</span></div>
</div>
```

### 핵심 한 줄

**`.inv`** 검은 상자 흰 글씨. `.lab` 머리말, `.head` 40px 600 핵심 문장(두 줄까지), `p` 보충 한 줄. **한 장에 하나, 한 상자에 핵심 하나.** 보통 `.hero .details` 안에 둔다.

```html
<div class="hero">
  <div class="lead"><h2>꼭 기억할<br>한 가지</h2></div>
  <div class="details">
    <div class="inv frag"><div class="lab">핵심</div><div class="head">AI 결과는 초안<br>마지막 확인은 교사</div><p>사실과 출처를 직접 점검</p></div>
  </div>
</div>
```

### 인용

**`.quote`** 위 검은 줄 + 52px 300 `blockquote` + `cite`(사람, 책, 해). **`.tweet`** 원문 글 + 번역 카드(`.who`, `.txt`, `.ko`, 굵게 할 곳 `mark`).

```html
<div class="quote">
  <blockquote>좋은 질문을 던지는 힘이<br>오래 남는다</blockquote>
  <cite>인용한 사람, 책 이름 (2025)</cite>
</div>
```

### 코드와 화면 틀

**`pre`** 코드(24px, `--g1` 바탕, `.c` 주석). 글 안 `code`는 작은 회색 면. **`.browser`** 가짜 브라우저 창(`.bar` 주소, `.page` 꾸밈 없는 쪽).

```html
<pre>&lt;h1&gt;세계의 기후&lt;/h1&gt;  <span class="c">&lt;!-- 제목 --&gt;</span></pre>
<div class="browser"><div class="bar"><i></i>example.com/climate.html</div><div class="page"><h1>세계의 기후</h1><p>열대 기후는 덥고 비가 많다.</p></div></div>
```

### 그림, 데모, QR

**`figure`** 화면 캡처 + `figcaption`. 그림이 없을 때 자리 `.ph`. 실제 그림은 `<img>`에 `border:1px solid var(--g3)`.

```html
<section class="slide" data-sec="도구 살펴보기">
  <div class="hd"></div>
  <div class="bd fill">
    <h2>활동 화면</h2>
    <figure style="margin-top:32px"><img src="shot.png" alt="학생이 만든 기후 지도" style="width:100%;border:1px solid var(--g3)"><figcaption>학생이 만든 기후 지도 화면</figcaption></figure>
  </div>
  <div class="src">출처: 수업 활동 결과 (2026)</div>
</section>
```

**`.demo`** 살아 있는 iframe(남은 높이를 채움). `.bd.fill` 장에 둔다.

```html
<iframe class="demo" src="demo.html" title="데모"></iframe>
```

**`.demo2`** 휴대폰 틀(`.shots > .shot`, 실물 모양이라 둥근 모서리 예외) + 오른쪽 설명.

```html
<div class="demo2">
  <div class="shots"><div class="shot"><div class="ph">앱 화면</div></div></div>
  <div><div class="chk"><h3>활동 순서</h3><p>QR로 접속</p></div></div>
</div>
```

**`.qrs` `.qrbox`** QR 모음(`.qrs.lg`는 큰 것). 상자마다 QR, `b` 이름, `span` 주소.

```html
<div class="qrs lg">
  <div class="qrbox"><div class="ph">QR</div><b>발표 자료</b><span>slides.example.com</span></div>
</div>
```

### 글자 도우미

`.eyebrow` 머리말(24px `--g5`), `.gray` 두 번째 글자, `.note` 작은 덧붙임(22px), `.big` 64px 숫자, `.acc` 강조색 글자, `a.lk` 밑줄 링크.

## 6. 문구 규칙

- **키워드 중심.** 한 줄에 한 덩어리 뜻, 길어도 두 줄. 문장 끝 "~하기", "~함" 같은 어색한 명사형 어미를 줄이고, 낱말 덩어리나 짧은 서술로 쓴다. 비유 쓰지 않는다.
- **가운데 점과 긴 대시 금지.** (유니코드 U+00B7, U+2014. 하이픈 `-`과 물결 `~`은 된다) 나열은 쉼표, 이어짐은 줄바꿈이나 `|`(표지, 마무리), 범위는 `~`.
- 이모지 금지. 표시가 필요하면 선 SVG(`svg.ic`).
- **빌려 온 사실, 숫자, 그림에는 출처 줄**(`.src`, "출처: 기관, 자료 이름 (해)"). 예시 값이면 "예시 값"이라고 적는다.
- **검은 상자 하나에 핵심 하나.** `.inv`, `.flow .on-k`, 장 구분을 빼면 검은 면을 늘리지 않는다.
- 강조색은 내용 안에서만, 한 장에 한두 군데(`.count b`, `.bars .acc`, `.stat .num.acc`, `.acc` 숫자). 같은 종류의 숫자 둘은 함께 칠해도 된다. 헤더, 장 구분에는 쓰지 않는다.
- 제목은 72px 한 줄이 기본, 넘으면 두 줄까지. 줄바꿈은 `<br>`로.
- 하나씩 보이기(`.frag`)는 말할 순서가 있을 때만. 한 장에 서너 개까지.

## 7. 흐린 글자 주의

흰 바탕에서 읽어야 하는 작은 글자(출처 `.src`, 카드 번호, 연표 단위, 범례 값, 표의 나머지 칸, 코드 주석)는 모두 `--g5`(#767676, 4.5:1 이상)다. 가장 연한 `--g4`(#9f9f9f, 흰 바탕 2.65:1)는 아이콘, 장식 점, 검은 바탕 위 글자에만 쓴다. 새 부품을 만들 때도 이 규칙을 따른다.

## 8. 확인

1. 브라우저 창을 1920x1080 비율로 두고 모든 장을 넘겨 본다. 장 밖으로 잘리는 글이 없어야 한다.
2. `.frag`를 모두 보인 상태에서도 넘치지 않는지 본다.
3. 주소 끝에 `#5`를 붙여 그 장이 바로 열리는지 본다.
4. P를 눌러 인쇄 미리보기에서 한 장에 한 쪽, 검은 장이 흰 바탕, 검은 핵심 상자가 회색 면으로 나오는지 본다.
5. `?tone=navy`, `?tone=blue`로 강조색이 장마다 한두 군데씩만 바뀌는지 본다.
