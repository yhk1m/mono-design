// © 2026 김용현
/* =========================================================
   mono-viz.js  모노 디자인 그래프와 지도
   라이브러리 없이 SVG 로 그린다. 색은 모두 CSS 변수라 테마, 다크 모드, 인쇄가 저절로 맞는다.
   그래프: MonoViz.bar, hbar, line, scatter, share, climate, pyramid
   지도:   MonoViz.map(el, { geo, type: 'choropleth' | 'symbol' | 'flow' | 'locator', ... })
   모든 함수는 (요소 또는 선택자, 옵션)을 받고 { update(옵션) } 을 돌려준다.
   요소 너비가 바뀌면 다시 그린다. .slide 안이면 슬라이드 크기(글자 20px)로 그린다.
   색 코드는 var() 대비값에만 쓴다. 새 색을 만들지 않는다.
   ========================================================= */
(function (G) {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';

  var CSS = [
    '.mv{--mv-fg:var(--fg,var(--k,#000));--mv-bg:var(--bg,var(--w,#fff));--mv-ramp:var(--mv-fg);--mv-pos:var(--c-6,#90533f);--mv-neg:var(--c-4,#455371);--mv-f:13px;position:relative;min-width:0}',
    ':root[data-tone="navy"] .mv,:root[data-tone="blue"] .mv{--mv-ramp:var(--accent);--mv-pos:var(--accent-2);--mv-neg:var(--accent)}',
    '.mv.mv--slide{--mv-f:20px}',
    '.mv svg{display:block;max-width:100%;overflow:visible}',
    '.mv text{font-family:inherit;font-size:var(--mv-f);font-variant-numeric:tabular-nums;letter-spacing:0}',
    '.mv-head{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:6px 20px;margin-bottom:10px;font-size:var(--mv-f);line-height:1.4}',
    '.mv-unit{color:var(--g5)}',
    '.mv-legend{display:flex;flex-wrap:wrap;align-items:center;gap:6px 16px;margin-left:auto;color:var(--g6)}',
    '.mv-legend>span{display:inline-flex;align-items:center;gap:6px}',
    '.mv-legend i{display:inline-block;width:12px;height:12px;background:var(--c)}',
    '.mv--slide .mv-legend i{width:18px;height:18px}',
    '.mv-legend i.ln{height:2px;width:18px}',
    '.mv--slide .mv-legend i.ln{height:3px;width:28px}',
    '.mv-legend svg{display:inline-block;overflow:visible}',
    '.mv-steps{display:inline-flex;flex-wrap:wrap;gap:0}',
    '.mv-steps>span{display:flex;flex-direction:column;gap:4px;min-width:44px;color:var(--g6)}',
    '.mv-steps em{font-style:normal;padding-right:10px;white-space:nowrap}',
    '.mv--slide .mv-steps>span{min-width:80px}',
    '.mv .mv-steps>span i{width:100%;height:12px}',
    '.mv--slide .mv-steps>span i{width:100%;height:20px}',
    '.mv-src{margin-top:10px;font-size:var(--mv-f);color:var(--g5)}',
    '.mv .ax{fill:var(--g5)}',
    '.mv .lab{fill:var(--g6)}',
    '.mv .val{fill:var(--mv-fg);font-weight:600}',
    '.mv .nm{fill:var(--mv-fg);font-weight:500}',
    '.mv .halo{paint-order:stroke;stroke:var(--mv-bg);stroke-width:3px;stroke-linejoin:round}',
    '.mv--slide .halo{stroke-width:5px}',
    '.mv .grid{stroke:var(--g2);stroke-width:1;shape-rendering:crispEdges}',
    '.mv .base{stroke:var(--mv-fg);stroke-width:1;shape-rendering:crispEdges}',
    '.mv .rg{stroke:var(--mv-bg);stroke-width:1;stroke-linejoin:round}',
    '.mv .rg:hover{stroke:var(--mv-fg)}',
    '.mv .frame{fill:var(--mv-bg);stroke:var(--mv-fg);stroke-width:1;shape-rendering:crispEdges}',
    '.mv .ink{fill:var(--mv-fg);stroke:var(--mv-fg)}'
  ].join('\n');

  /* 계열 색: 셋까지는 흑백, 넷 이상은 분류 색 */
  var GRAY = ['var(--mv-fg)', 'var(--g5)', 'var(--g3)'];
  var CAT = ['var(--c-1,#927037)', 'var(--c-2,#4b6256)', 'var(--c-3,#645169)', 'var(--c-4,#455371)', 'var(--c-5,#5e3939)', 'var(--c-6,#90533f)', 'var(--c-7,#3f3f46)'];
  function scol(i, n) { return n <= 3 ? GRAY[i] : CAT[i % CAT.length]; }
  var ACC = 'var(--accent)';
  /* 단계 색은 육지 색(--g1)과 섞는다. 다크 모드에서도 가장 옅은 칸이 바다(바탕)와 구별된다 */
  function mix(base, p) { return 'color-mix(in srgb, ' + base + ' ' + p + '%, var(--g1))'; }

  /* ---------- 공통 도구 ---------- */
  function css() {
    if (document.getElementById('mono-viz-css')) return;
    var s = document.createElement('style'); s.id = 'mono-viz-css'; s.textContent = CSS;
    document.head.appendChild(s);
  }
  function E(tag, at, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in at) if (at[k] != null) e.setAttribute(k, at[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function T(txt, x, y, cls, anchor, parent, extra) {
    var t = E('text', Object.assign({ x: r1(x), y: r1(y), 'class': cls, 'text-anchor': anchor || 'start', 'dominant-baseline': 'middle' }, extra || {}), parent);
    t.textContent = txt; return t;
  }
  function tip(node, txt) { E('title', {}, node).textContent = txt; return node; }
  function r1(v) { return Math.round(v * 10) / 10; }
  var mctx;
  function tw(s, f, w) {
    mctx = mctx || document.createElement('canvas').getContext('2d');
    mctx.font = (w || 400) + ' ' + f + 'px "Pretendard Variable", Pretendard, sans-serif';
    return mctx.measureText(String(s)).width * 1.08;
  }
  function maxw(arr, f, w) { var m = 0; arr.forEach(function (s) { m = Math.max(m, tw(s, f, w)); }); return m; }
  function fmt(v, o) {
    if (o && o.format) return o.format(v);
    return Number(v).toLocaleString('ko-KR', { maximumFractionDigits: 1 });
  }
  function niceStep(raw) {
    var p = Math.pow(10, Math.floor(Math.log10(raw))), e = raw / p;
    return (e >= 7.5 ? 10 : e >= 3.5 ? 5 : e >= 1.5 ? 2 : 1) * p;
  }
  function ticks(min, max, count) {
    if (min === max) { max = min + 1; }
    var step = niceStep((max - min) / (count || 4));
    var lo = Math.floor(min / step + 1e-9) * step, hi = Math.ceil(max / step - 1e-9) * step, t = [];
    for (var v = lo; v <= hi + step / 2; v += step) t.push(+v.toFixed(10));
    return t;
  }
  function lin(d0, d1, r0, r1_) { return function (v) { return r0 + (v - d0) / (d1 - d0 || 1) * (r1_ - r0); }; }
  function swatch(c, kind) { return '<i class="' + (kind || '') + '" style="--c:' + c + '"></i>'; }
  function legend(ctx, items) {
    ctx.legend.innerHTML = items.map(function (it) { return '<span>' + swatch(it.c, it.kind) + it.t + '</span>'; }).join('');
  }

  /* 요소 하나에 그래프를 붙이고, 너비가 바뀌면 다시 그린다 */
  function mount(el, o, draw) {
    css();
    if (typeof el === 'string') el = document.querySelector(el);
    if (!el) throw new Error('MonoViz: 요소를 찾지 못함');
    var lastW = -1;
    function run() {
      var W = Math.floor(el.clientWidth);
      lastW = W;
      el.classList.add('mv');
      var slide = !!el.closest('.slide');
      el.classList.toggle('mv--slide', slide);
      el.innerHTML = '';
      if (!W) return;
      var head = document.createElement('div'); head.className = 'mv-head';
      var unit = document.createElement('span'); unit.className = 'mv-unit'; unit.textContent = o.unit || '';
      var lg = document.createElement('div'); lg.className = 'mv-legend';
      head.appendChild(unit); head.appendChild(lg); el.appendChild(head);
      var f = slide ? 20 : 13;
      var H = o.height || (slide ? 500 : Math.round(Math.max(240, Math.min(420, W * 0.5))));
      var svg = E('svg', { width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': o.title || o.unit || '' }, el);
      var ctx = { el: el, svg: svg, legend: lg, unit: unit, slide: slide, f: f, W: W, H: H, o: o };
      draw(ctx);
      svg.setAttribute('height', ctx.H); svg.setAttribute('viewBox', '0 0 ' + ctx.W + ' ' + ctx.H);
      if (ctx.W !== W) svg.setAttribute('width', ctx.W);
      if (!lg.childNodes.length && !o.unit) head.remove();
      if (o.source) { var s = document.createElement('p'); s.className = 'mv-src'; s.textContent = o.source; el.appendChild(s); }
    }
    run();
    if (G.ResizeObserver) new ResizeObserver(function () { if (Math.floor(el.clientWidth) !== lastW) run(); }).observe(el);
    return { update: function (n) { o = n; run(); } };
  }

  /* 세로 값 축(눈금선 + 왼쪽 눈금 글자)을 그리고 y 변환을 돌려준다 */
  function yAxis(ctx, g, min, max, x0, x1, top, bot, side) {
    var t = ticks(Math.min(0, min), Math.max(0, max), ctx.slide ? 5 : 4);
    var y = lin(t[0], t[t.length - 1], bot, top);
    t.forEach(function (v) {
      if (v !== 0) E('line', { x1: x0, x2: x1, y1: r1(y(v)) + .5, y2: r1(y(v)) + .5, 'class': 'grid' }, g);
      T(fmt(v, ctx.o), side === 'right' ? x1 + 8 : x0 - 8, y(v), 'ax', side === 'right' ? 'start' : 'end', g);
    });
    return { y: y, t: t };
  }
  function tickWidth(ctx, min, max) {
    return maxw(ticks(Math.min(0, min), Math.max(0, max), ctx.slide ? 5 : 4).map(function (v) { return fmt(v, ctx.o); }), ctx.f) + 10;
  }
  function series(o) {
    if (o.series) return o.series;
    return [{ name: o.name || '', values: o.values }];
  }
  function hi(o) {
    if (o.highlight == null) return null;
    return typeof o.highlight === 'number' ? { series: 0, index: o.highlight } : o.highlight;
  }

  /* ---------- 1. 세로 막대 (묶음, 누적) ---------- */
  function bar(el, o) {
    return mount(el, o, function (c) {
      var S = series(o), n = o.labels.length, m = S.length, f = c.f, h = hi(o);
      if (m > 1) legend(c, S.map(function (s, j) { return { c: scol(j, m), t: s.name }; }));
      var vals = [];
      for (var i = 0; i < n; i++) {
        if (o.stacked) { var p = 0, q = 0; S.forEach(function (s) { var v = s.values[i] || 0; if (v >= 0) p += v; else q += v; }); vals.push(p, q); }
        else S.forEach(function (s) { vals.push(s.values[i] || 0); });
      }
      var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals);
      var L = tickWidth(c, mn, mx), top = f * 1.4, bot = c.H - f * 2.2, R = c.W - 2;
      var ax = yAxis(c, c.svg, mn, mx, L, R, top, bot), y = ax.y;
      var band = (R - L) / n, gw = band * (m === 1 ? 0.62 : 0.72), bw = o.stacked ? gw : gw / m;
      var showVal = !o.stacked && n * m <= 12 && o.values !== false;
      for (i = 0; i < n; i++) {
        var gx = L + band * i + (band - gw) / 2, up = 0, dn = 0;
        S.forEach(function (s, j) {
          var v = s.values[i] || 0, col = scol(j, m);
          if (h && h.series === j) col = h.index === i ? ACC : 'var(--g3)';
          var x = o.stacked ? gx : gx + bw * j, y0, y1;
          if (o.stacked) { if (v >= 0) { y0 = y(up); up += v; y1 = y(up); } else { y0 = y(dn); dn += v; y1 = y(dn); } }
          else { y0 = y(0); y1 = y(v); }
          tip(E('rect', { x: r1(x), y: r1(Math.min(y0, y1)), width: r1(Math.max(1, bw - (m > 1 && !o.stacked ? 2 : 0))), height: r1(Math.abs(y1 - y0)), fill: col }, c.svg), o.labels[i] + ' ' + (s.name || '') + ' ' + fmt(v, o));
          if (showVal) T(fmt(v, o), x + bw / 2, v >= 0 ? y1 - f * 0.7 : y1 + f * 0.7, 'val', 'middle', c.svg, h && h.series === j && h.index === i ? { style: 'fill:var(--accent)' } : null);
        });
        T(o.labels[i], L + band * i + band / 2, bot + f * 1.2, 'ax', 'middle', c.svg);
      }
      E('line', { x1: L, x2: R, y1: r1(y(0)) + .5, y2: r1(y(0)) + .5, 'class': 'base' }, c.svg);
    });
  }

  /* ---------- 2. 가로 막대 ---------- */
  function hbar(el, o) {
    var S = series(o), m = S.length;
    var bh = function (slide) { return (slide ? 28 : 16) * (m > 1 ? 0.8 : 1); };
    var rowH = function (slide) { return bh(slide) * m + (slide ? 22 : 14); };
    if (!o.height) o = Object.assign({}, o, { _auto: true });
    return mount(el, o, function (c) {
      var f = c.f, h = hi(o), n = o.labels.length;
      c.H = o._auto ? Math.ceil(rowH(c.slide) * n + 4) : c.H;
      if (m > 1) legend(c, S.map(function (s, j) { return { c: scol(j, m), t: s.name }; }));
      var all = []; S.forEach(function (s) { all = all.concat(s.values); });
      var mx = Math.max.apply(null, all.concat([0]));
      var L = maxw(o.labels, f) + 16, R = c.W - maxw(all.map(function (v) { return fmt(v, o); }), f, 600) - 12;
      var x = lin(0, mx, L, R), rh = (c.H - 4) / n, b = bh(c.slide);
      for (var i = 0; i < n; i++) {
        var top = 2 + rh * i + (rh - b * m) / 2;
        T(o.labels[i], 0, 2 + rh * i + rh / 2, 'lab', 'start', c.svg);
        S.forEach(function (s, j) {
          var v = s.values[i] || 0, col = scol(j, m), on = h && h.series === j && h.index === i;
          if (h && h.series === j) col = on ? ACC : 'var(--g3)';
          var yy = top + b * j;
          tip(E('rect', { x: L, y: r1(yy), width: r1(Math.max(0, x(v) - L)), height: r1(b - (m > 1 ? 2 : 0)), fill: col }, c.svg), o.labels[i] + ' ' + fmt(v, o));
          T(fmt(v, o), x(v) + 8, yy + b / 2, 'val', 'start', c.svg, on ? { style: 'fill:var(--accent)' } : null);
        });
      }
      E('line', { x1: L + .5, x2: L + .5, y1: 0, y2: c.H, 'class': 'base' }, c.svg);
    });
  }

  /* ---------- 3. 꺾은선 ---------- */
  function line(el, o) {
    return mount(el, o, function (c) {
      var S = series(o), n = o.labels.length, f = c.f, h = o.highlight;
      var all = []; S.forEach(function (s) { all = all.concat(s.values.filter(function (v) { return v != null; })); });
      var mn = Math.min.apply(null, all), mx = Math.max.apply(null, all);
      if (!o.zero) { var pad = (mx - mn) * 0.08; mn = mn - pad; mx = mx + pad; } else { mn = Math.min(0, mn); }
      var t = ticks(mn, mx, c.slide ? 5 : 4);
      var L = maxw(t.map(function (v) { return fmt(v, o); }), f) + 10;
      var R = c.W - maxw(S.map(function (s) { return s.name; }), f, 500) - 16;
      var top = f, bot = c.H - f * 2.2, y = lin(t[0], t[t.length - 1], bot, top);
      t.forEach(function (v) {
        if (v !== t[0]) E('line', { x1: L, x2: c.W - 2, y1: r1(y(v)) + .5, y2: r1(y(v)) + .5, 'class': 'grid' }, c.svg);
        T(fmt(v, o), L - 8, y(v), 'ax', 'end', c.svg);
      });
      E('line', { x1: L, x2: c.W - 2, y1: r1(bot) + .5, y2: r1(bot) + .5, 'class': 'base' }, c.svg);
      var x = function (i) { return n === 1 ? (L + R) / 2 : L + 6 + (R - L - 12) * i / (n - 1); };
      var lw = maxw(o.labels, f) + 12, every = Math.max(1, Math.ceil(n / Math.max(1, Math.floor((R - L) / lw))));
      o.labels.forEach(function (lb, i) { if (i % every === 0 || i === n - 1) T(lb, x(i), bot + f * 1.2, 'ax', 'middle', c.svg); });
      var sw = c.slide ? 3 : 2, ends = [];
      var order = S.map(function (s, j) { return j; }).sort(function (a, b) { return (a === h) - (b === h); });
      order.forEach(function (j) {
        var s = S[j], col = h != null ? (j === h ? ACC : 'var(--g4)') : scol(j, S.length);
        var d = '', last = -1;
        s.values.forEach(function (v, i) { if (v == null) return; d += (last === i - 1 && d ? 'L' : 'M') + r1(x(i)) + ',' + r1(y(v)); last = i; });
        tip(E('path', { d: d, fill: 'none', stroke: col, 'stroke-width': sw, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, c.svg), s.name);
        s.values.forEach(function (v, i) {
          if (v == null || !(o.dots || i === last)) return;
          tip(E('circle', { cx: r1(x(i)), cy: r1(y(v)), r: sw + 1.5, fill: col }, c.svg), s.name + ' ' + o.labels[i] + ' ' + fmt(v, o));
        });
        ends.push({ y: y(s.values[last]), t: s.name, cls: h != null && j === h ? 'val' : j === 0 && h == null ? 'nm' : 'lab', acc: h === j });
      });
      ends.sort(function (a, b) { return a.y - b.y; });
      for (var k = 1; k < ends.length; k++) if (ends[k].y - ends[k - 1].y < f * 1.2) ends[k].y = ends[k - 1].y + f * 1.2;
      ends.forEach(function (e) { T(e.t, R + 10, e.y, e.cls, 'start', c.svg, e.acc ? { style: 'fill:var(--accent)' } : null); });
    });
  }

  /* ---------- 4. 산점도 ---------- */
  function scatter(el, o) {
    return mount(el, o, function (c) {
      var P = o.points, f = c.f;
      var xs = P.map(function (p) { return p.x; }), ys = P.map(function (p) { return p.y; });
      var tx = ticks(Math.min.apply(null, xs), Math.max.apply(null, xs), c.slide ? 6 : 5);
      var ty = ticks(Math.min.apply(null, ys), Math.max.apply(null, ys), c.slide ? 5 : 4);
      var L = maxw(ty.map(function (v) { return fmt(v, o); }), f) + 10, R = c.W - 8, top = f, bot = c.H - f * 2.6;
      var x = lin(tx[0], tx[tx.length - 1], L + 6, R), y = lin(ty[0], ty[ty.length - 1], bot, top);
      ty.forEach(function (v) {
        if (v !== ty[0]) E('line', { x1: L, x2: R, y1: r1(y(v)) + .5, y2: r1(y(v)) + .5, 'class': 'grid' }, c.svg);
        T(fmt(v, o), L - 8, y(v), 'ax', 'end', c.svg);
      });
      tx.forEach(function (v) { T(fmt(v, o), x(v), bot + f * 1.2, 'ax', 'middle', c.svg); });
      E('line', { x1: L, x2: R, y1: r1(bot) + .5, y2: r1(bot) + .5, 'class': 'base' }, c.svg);
      if (o.xTitle) T(o.xTitle, R, bot + f * 2.4, 'ax', 'end', c.svg);
      if (o.trend) {
        var nn = P.length, mx_ = xs.reduce(function (a, b) { return a + b; }, 0) / nn, my = ys.reduce(function (a, b) { return a + b; }, 0) / nn, sxy = 0, sxx = 0;
        P.forEach(function (p) { sxy += (p.x - mx_) * (p.y - my); sxx += (p.x - mx_) * (p.x - mx_); });
        var b1 = sxy / (sxx || 1), b0 = my - b1 * mx_, xa = tx[0], xb = tx[tx.length - 1];
        E('line', { x1: x(xa), y1: y(b0 + b1 * xa), x2: x(xb), y2: y(b0 + b1 * xb), stroke: 'var(--g4)', 'stroke-width': 1 }, c.svg);
      }
      var r = c.slide ? 7 : 4;
      P.slice().sort(function (a, b) { return !!a.highlight - !!b.highlight; }).forEach(function (p) {
        tip(E('circle', { cx: r1(x(p.x)), cy: r1(y(p.y)), r: p.highlight ? r + 1 : r, fill: p.highlight ? ACC : 'var(--mv-fg)', 'fill-opacity': p.highlight ? 1 : 0.55 }, c.svg), (p.label ? p.label + ' ' : '') + fmt(p.x, o) + ', ' + fmt(p.y, o));
        if (p.label) {
          var right = x(p.x) + r + 5 + tw(p.label, f, 600) > c.W;   /* 오른쪽 끝 점은 이름을 왼쪽에 */
          T(p.label, right ? x(p.x) - r - 5 : x(p.x) + r + 5, y(p.y), (p.highlight ? 'val' : 'lab') + ' halo', right ? 'end' : 'start', c.svg, p.highlight ? { style: 'fill:var(--accent)' } : null);
        }
      });
    });
  }

  /* ---------- 5. 100% 띠 (원 그래프 대신) ---------- */
  var SHARE = ['var(--mv-fg)', 'var(--g6)', 'var(--g4)', 'var(--g2b,#e1e1e1)'];
  var SHARE_TXT = ['var(--mv-bg)', 'var(--mv-bg)', 'var(--mv-fg)', 'var(--mv-fg)'];
  function share(el, o) {
    if (!o.height) o = Object.assign({}, o, { _auto: true });
    return mount(el, o, function (c) {
      var f = c.f, n = o.rows.length, p = o.parts.length, bh = c.slide ? 56 : 32, gap = c.slide ? 20 : 12;
      var col = function (j) { return p <= 4 ? SHARE[j] : CAT[j % CAT.length]; };
      var txt = function (j) { return p <= 4 ? SHARE_TXT[j] : 'var(--w,#fff)'; };
      legend(c, o.parts.map(function (nm, j) { return { c: col(j), t: nm }; }));
      if (o._auto) c.H = n * (bh + gap);
      var L = maxw(o.rows.map(function (r) { return r.label; }), f) + 16, R = c.W;
      o.rows.forEach(function (row, i) {
        var sum = row.values.reduce(function (a, b) { return a + b; }, 0) || 1, acc = 0, yy = i * (bh + gap) + gap / 2;
        T(row.label, 0, yy + bh / 2, 'lab', 'start', c.svg);
        row.values.forEach(function (v, j) {
          var x0 = L + (R - L) * acc / sum, w = (R - L) * v / sum; acc += v;
          tip(E('rect', { x: r1(x0), y: r1(yy), width: r1(Math.max(0, w - 1)), height: bh, fill: col(j) }, c.svg), row.label + ' ' + o.parts[j] + ' ' + fmt(v / sum * 100) + '%');
          var s = fmt(v / sum * 100) + '%';
          if (w > tw(s, f, 600) + 12) T(s, x0 + 8, yy + bh / 2, 'val', 'start', c.svg, { style: 'fill:' + txt(j) });
        });
      });
    });
  }

  /* ---------- 6. 기후 그래프 (강수 막대 + 기온 선) ---------- */
  function climate(el, o) {
    return mount(el, o, function (c) {
      var f = c.f, T12 = o.temp, P12 = o.rain;
      legend(c, [{ c: 'var(--mv-fg)', t: '기온', kind: 'ln' }, { c: 'var(--g3)', t: '강수량' }]);
      var tt = ticks(Math.min(0, Math.min.apply(null, T12)), Math.max.apply(null, T12), c.slide ? 5 : 4), k = tt.length - 1;
      var rstep = niceStep(Math.max.apply(null, P12) / k); while (rstep * k < Math.max.apply(null, P12)) rstep = niceStep(rstep * 1.5);
      var rt = []; for (var i = 0; i <= k; i++) rt.push(rstep * i);
      var L = maxw(tt.map(String), f) + 10, R = c.W - maxw(rt.map(function (v) { return fmt(v); }), f) - 10, top = f * 2, bot = c.H - f * 2.2;
      var y = lin(tt[0], tt[k], bot, top), yr = lin(0, rt[k], bot, top);
      tt.forEach(function (v, i) {
        if (i) E('line', { x1: L, x2: R, y1: r1(y(v)) + .5, y2: r1(y(v)) + .5, 'class': 'grid' }, c.svg);
        T(fmt(v), L - 8, y(v), 'ax', 'end', c.svg);
        T(fmt(rt[i]), R + 8, y(v), 'ax', 'start', c.svg);
      });
      T('(℃)', L - 8, top - f * 1.3, 'ax', 'end', c.svg);
      T('(mm)', R + 8, top - f * 1.3, 'ax', 'start', c.svg);
      var band = (R - L) / 12, bw = band * 0.6;
      P12.forEach(function (v, i) { tip(E('rect', { x: r1(L + band * i + (band - bw) / 2), y: r1(yr(v)), width: r1(bw), height: r1(bot - yr(v)), fill: 'var(--g3)' }, c.svg), (i + 1) + '월 강수량 ' + fmt(v) + 'mm'); });
      if (tt[0] < 0) E('line', { x1: L, x2: R, y1: r1(y(0)) + .5, y2: r1(y(0)) + .5, stroke: 'var(--g4)', 'stroke-width': 1 }, c.svg);
      E('line', { x1: L, x2: R, y1: r1(bot) + .5, y2: r1(bot) + .5, 'class': 'base' }, c.svg);
      var cx = function (i) { return L + band * i + band / 2; }, sw = c.slide ? 3 : 2;
      E('path', { d: T12.map(function (v, i) { return (i ? 'L' : 'M') + r1(cx(i)) + ',' + r1(y(v)); }).join(''), fill: 'none', stroke: 'var(--mv-fg)', 'stroke-width': sw, 'stroke-linejoin': 'round' }, c.svg);
      T12.forEach(function (v, i) { tip(E('circle', { cx: r1(cx(i)), cy: r1(y(v)), r: sw + 1.5, fill: 'var(--mv-fg)' }, c.svg), (i + 1) + '월 기온 ' + fmt(v) + '℃'); });
      for (i = 0; i < 12; i++) T(String(i + 1), cx(i), bot + f * 1.2, 'ax', 'middle', c.svg);
      if (!o.unit) {
        var avg = T12.reduce(function (a, b) { return a + b; }, 0) / 12, sum = P12.reduce(function (a, b) { return a + b; }, 0);
        c.unit.textContent = (o.name ? o.name + '  ' : '') + '연평균 ' + fmt(avg) + '℃, 연 강수량 ' + fmt(Math.round(sum)) + 'mm';
      }
    });
  }

  /* ---------- 7. 인구 피라미드 ---------- */
  function pyramid(el, o) {
    return mount(el, o, function (c) {
      var f = c.f, n = o.ages.length, names = o.names || ['남자', '여자'];
      legend(c, [{ c: 'var(--mv-fg)', t: names[0] }, { c: 'var(--g4)', t: names[1] }]);
      var mx = Math.max.apply(null, o.male.concat(o.female)), t = ticks(0, mx, c.slide ? 3 : 2);
      var mid = maxw(o.ages, f) + 20, cx = c.W / 2, bot = c.H - f * 2.2, half = (c.W - mid) / 2 - 4;
      var x = lin(0, t[t.length - 1], 0, half), rh = bot / n, bh = Math.max(1, rh * 0.82);
      var every = Math.ceil(n / Math.floor(bot / (f * 1.3)));
      for (var i = 0; i < n; i++) {
        var yy = bot - rh * (i + 1) + (rh - bh) / 2;   /* 첫 연령대가 맨 아래 */
        tip(E('rect', { x: r1(cx - mid / 2 - x(o.male[i])), y: r1(yy), width: r1(x(o.male[i])), height: r1(bh), fill: 'var(--mv-fg)' }, c.svg), o.ages[i] + ' ' + names[0] + ' ' + fmt(o.male[i], o));
        tip(E('rect', { x: r1(cx + mid / 2), y: r1(yy), width: r1(x(o.female[i])), height: r1(bh), fill: 'var(--g4)' }, c.svg), o.ages[i] + ' ' + names[1] + ' ' + fmt(o.female[i], o));
        if (i % every === 0) T(o.ages[i], cx, yy + bh / 2, 'ax', 'middle', c.svg);
      }
      E('line', { x1: 0, x2: cx - mid / 2, y1: r1(bot) + .5, y2: r1(bot) + .5, 'class': 'base' }, c.svg);
      E('line', { x1: cx + mid / 2, x2: c.W, y1: r1(bot) + .5, y2: r1(bot) + .5, 'class': 'base' }, c.svg);
      t.forEach(function (v) {
        T(fmt(v, o), cx - mid / 2 - x(v), bot + f * 1.2, 'ax', v ? 'middle' : 'end', c.svg);
        T(fmt(v, o), cx + mid / 2 + x(v), bot + f * 1.2, 'ax', v ? 'middle' : 'start', c.svg);
      });
    });
  }

  /* ---------- 지도: 투영 ---------- */
  var RAD = Math.PI / 180;
  function equalEarth(lon, lat) {
    var A1 = 1.340264, A2 = -0.081106, A3 = 0.000893, A4 = 0.003796, M = Math.sqrt(3) / 2;
    var t = Math.asin(M * Math.sin(lat * RAD)), t2 = t * t, t6 = t2 * t2 * t2;
    return [lon * RAD * Math.cos(t) / (M * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2))) / RAD, -t * (A1 + A2 * t2 + t6 * (A3 + A4 * t2)) / RAD];
  }
  function eachCoord(geo, fn) {
    geo.features.forEach(function (ft) {
      var g = ft.geometry; if (!g) return;
      var polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
      polys.forEach(function (p) { p.forEach(function (ring) { ring.forEach(fn); }); });
    });
  }
  function projection(geo, kind) {
    var b = [180, 90, -180, -90];
    eachCoord(geo, function (c) { b[0] = Math.min(b[0], c[0]); b[1] = Math.min(b[1], c[1]); b[2] = Math.max(b[2], c[0]); b[3] = Math.max(b[3], c[1]); });
    if (!kind || kind === 'auto') kind = b[2] - b[0] > 90 ? 'equalearth' : 'equirect';
    var k = Math.cos((b[1] + b[3]) / 2 * RAD);
    var p = kind === 'equalearth' ? equalEarth : function (lon, lat) { return [lon * k, -lat]; };
    p.kind = kind; p.bbox = b;
    return p;
  }
  /* 투영한 좌표를 상자에 맞춘다 */
  function fitter(geo, p, x0, y0, w, h) {
    var b = [Infinity, Infinity, -Infinity, -Infinity];
    eachCoord(geo, function (c) { var q = p(c[0], c[1]); b[0] = Math.min(b[0], q[0]); b[1] = Math.min(b[1], q[1]); b[2] = Math.max(b[2], q[0]); b[3] = Math.max(b[3], q[1]); });
    var s = Math.min(w / (b[2] - b[0]), h / (b[3] - b[1]));
    var ox = x0 + (w - (b[2] - b[0]) * s) / 2 - b[0] * s, oy = y0 + (h - (b[3] - b[1]) * s) / 2 - b[1] * s;
    var f = function (lon, lat) { var q = p(lon, lat); return [q[0] * s + ox, q[1] * s + oy]; };
    f.s = s; f.w = (b[2] - b[0]) * s; f.h = (b[3] - b[1]) * s;
    return f;
  }
  function aspect(geo, p) {
    var b = [Infinity, Infinity, -Infinity, -Infinity];
    eachCoord(geo, function (c) { var q = p(c[0], c[1]); b[0] = Math.min(b[0], q[0]); b[1] = Math.min(b[1], q[1]); b[2] = Math.max(b[2], q[0]); b[3] = Math.max(b[3], q[1]); });
    return (b[3] - b[1]) / (b[2] - b[0]);
  }
  function pathOf(g, f) {
    var polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
    var d = '';
    polys.forEach(function (poly) {
      poly.forEach(function (ring) {
        ring.forEach(function (c, i) { var q = f(c[0], c[1]); d += (i ? 'L' : 'M') + r1(q[0]) + ',' + r1(q[1]); });
        d += 'Z';
      });
    });
    return d;
  }
  /* 가장 큰 고리의 넓이 중심 */
  function centroid(g, f) {
    var polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates, best = null, bestA = 0;
    polys.forEach(function (poly) {
      var pts = poly[0].map(function (c) { return f(c[0], c[1]); }), a = 0, cx = 0, cy = 0;
      for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        var cr = pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1];
        a += cr; cx += (pts[j][0] + pts[i][0]) * cr; cy += (pts[j][1] + pts[i][1]) * cr;
      }
      if (Math.abs(a) > bestA) { bestA = Math.abs(a); best = [cx / (3 * a), cy / (3 * a)]; }
    });
    best = best || [0, 0]; best.area = bestA / 2;
    return best;
  }
  function featById(geo) { var m = {}; geo.features.forEach(function (ft) { m[ft.properties.id] = ft; }); return m; }
  function breaksOf(vals, n) {
    var s = vals.slice().sort(function (a, b) { return a - b; }), out = [];
    for (var i = 1; i < n; i++) {
      var v = s[Math.floor(s.length * i / n)], step = niceStep(Math.abs(v) / 10 || 1);
      out.push(Math.round(v / step) * step);
    }
    return out.filter(function (v, i, a) { return !i || v > a[i - 1]; });
  }

  /* ---------- 지도 ---------- */
  function map(el, o) {
    return mount(el, o, function (c) {
      var geo = o.geo, f = c.f, p = projection(geo, o.projection), byId = featById(geo);
      var maxH = o.height || (c.slide ? 580 : Math.min(620, Math.max(300, c.W * 0.9)));
      var pad = c.slide ? 16 : 8;
      var asp = aspect(geo, p), W = Math.min(c.W, Math.round((maxH - pad * 2) / asp + pad * 2));
      c.W = c.W; c.H = Math.round(Math.min(maxH, (W - pad * 2) * asp + pad * 2));
      var fit = fitter(geo, p, (c.W - W) / 2 + pad, pad, W - pad * 2, c.H - pad * 2);
      var type = o.type || 'locator', vals = o.values || {}, names = {};
      geo.features.forEach(function (ft) { names[ft.properties.id] = ft.properties.name; });
      var g = E('g', {}, c.svg);
      var fillOf = function () { return 'var(--g1)'; };

      if (type === 'choropleth') {
        var list = Object.keys(vals).map(function (k) { return vals[k]; }).filter(function (v) { return v != null && !isNaN(v); });
        var br = o.breaks || breaksOf(list, o.steps || 5), nc = br.length + 1;
        var cls = function (v) { var i = 0; while (i < br.length && v >= br[i]) i++; return i; };
        var colors = [];
        if (o.center != null) {
          var ci = cls(o.center), nNeg = ci, nPos = nc - ci;
          for (var i = 0; i < nc; i++) {
            colors.push(i < ci ? mix('var(--mv-neg)', Math.round(20 + 60 * (ci - i - 1) / Math.max(1, nNeg - 1)))
                               : mix('var(--mv-pos)', Math.round(20 + 60 * (i - ci) / Math.max(1, nPos - 1))));
          }
        } else {
          for (i = 0; i < nc; i++) colors.push(mix('var(--mv-ramp)', Math.round(12 + 68 * i / Math.max(1, nc - 1))));
        }
        fillOf = function (id) { var v = vals[id]; return v == null || isNaN(v) ? 'var(--g1)' : colors[cls(v)]; };
        var lab = function (i) { var a = br[i - 1], b = br[i]; return i === 0 ? '~' + fmt(b, o) : i === nc - 1 ? fmt(a, o) + '~' : fmt(a, o) + '~' + fmt(b, o); };
        var missing = geo.features.some(function (ft) { return vals[ft.properties.id] == null; });
        c.legend.innerHTML = '<div class="mv-steps">' + colors.map(function (col, i) { return '<span><i style="background:' + col + '"></i><em>' + lab(i) + '</em></span>'; }).join('') +
          (missing && o.missing !== false ? '<span><i style="background:var(--g1);outline:1px solid var(--g3);outline-offset:-1px"></i><em>자료 없음</em></span>' : '') + '</div>';
      }
      if (type === 'locator') {
        var focus = [].concat(o.focus || []);
        fillOf = function (id) { return focus.indexOf(id) >= 0 ? (o.accent ? ACC : 'var(--mv-fg)') : 'var(--g2b,#e1e1e1)'; };
      }

      var cents = {};
      geo.features.forEach(function (ft) {
        if (!ft.geometry) return;
        var id = ft.properties.id, v = vals[id];
        tip(E('path', { d: pathOf(ft.geometry, fit), fill: fillOf(id), 'class': 'rg' }, g), (ft.properties.name || id) + (v != null ? ' ' + fmt(v, o) : ''));
        cents[id] = centroid(ft.geometry, fit);
      });
      var at = function (ref) {
        if (Array.isArray(ref)) return fit(ref[0], ref[1]);
        if (o.centers && o.centers[ref]) return fit(o.centers[ref][0], o.centers[ref][1]);
        return cents[ref];
      };

      if (type === 'symbol') {
        var pts = (o.points || Object.keys(vals).map(function (k) { return { at: k, value: vals[k] }; })).filter(function (q) { return q.value > 0 && at(q.at); });
        var vmax = Math.max.apply(null, pts.map(function (q) { return q.value; })), rMax = o.rMax || (c.slide ? 56 : Math.max(14, Math.min(34, c.W / 20)));
        var rad = function (v) { return rMax * Math.sqrt(v / vmax); };
        pts.sort(function (a, b) { return b.value - a.value; }).forEach(function (q) {
          var xy = at(q.at);
          tip(E('circle', { cx: r1(xy[0]), cy: r1(xy[1]), r: r1(Math.max(2, rad(q.value))), fill: q.highlight ? ACC : 'var(--mv-fg)', 'fill-opacity': q.highlight ? 0.85 : 0.38, stroke: 'var(--mv-bg)', 'stroke-width': 1 }, c.svg), (q.label || names[q.at] || '') + ' ' + fmt(q.value, o));
        });
        var lv = [vmax, vmax / 4, vmax / 16].map(function (v) { var s = niceStep(v); return Math.max(s, Math.floor(v / s) * s); });
        /* 겹친 원 범례: 글자는 겹치지 않게 위아래로 벌린다 */
        var R0 = rad(lv[0]), lw = R0 * 2 + 14 + maxw(lv.map(function (v) { return fmt(v, o); }), f) + 8, ly = [], top0 = f * 0.6;
        lv.forEach(function (v, i) { var yy = top0 + R0 * 2 - 2 * rad(v); ly.push(i ? Math.max(yy, ly[i - 1] + f * 1.15) : yy); });
        var lh = Math.max(top0 + R0 * 2 + 1, ly[ly.length - 1] + f * 0.7);
        c.legend.innerHTML = '<span><svg width="' + r1(lw) + '" height="' + r1(lh) + '">' + lv.map(function (v, i) {
          var r = rad(v), cy = top0 + R0 * 2 - r;
          return '<circle cx="' + r1(R0) + '" cy="' + r1(cy) + '" r="' + r1(r) + '" fill="none" stroke="var(--g5)" stroke-width="1"/>' +
            '<path d="M' + r1(R0) + ',' + r1(cy - r) + 'H' + r1(R0 * 2 + 4) + 'L' + r1(R0 * 2 + 10) + ',' + r1(ly[i]) + '" fill="none" stroke="var(--g4)" stroke-width="1"/>' +
            '<text x="' + r1(R0 * 2 + 13) + '" y="' + r1(ly[i]) + '" dominant-baseline="middle" class="ax">' + fmt(v, o) + '</text>';
        }).join('') + '</svg></span>';
      }

      if (type === 'flow') {
        var fl = (o.flows || []).filter(function (q) { return at(q.from) && at(q.to); });
        var fmax = Math.max.apply(null, fl.map(function (q) { return q.value; })), wMax = o.wMax || (c.slide ? 16 : 9), wMin = c.slide ? 2 : 1.2;
        var wid = function (v) { return wMin + (wMax - wMin) * v / fmax; };
        fl.sort(function (a, b) { return b.value - a.value; }).forEach(function (q) {
          var A = at(q.from), B = at(q.to), w = wid(q.value), dx = B[0] - A[0], dy = B[1] - A[1], len = Math.hypot(dx, dy) || 1;
          var C = [(A[0] + B[0]) / 2 - dy * 0.18, (A[1] + B[1]) / 2 + dx * 0.18];
          /* 여러 줄이 한 곳으로 모이면 화살촉이 겹치므로 도착점을 들어오는 방향으로 조금 물린다 */
          var gap = o.gap != null ? o.gap : (c.slide ? 16 : 10), bx = C[0] - B[0], by = C[1] - B[1], bl = Math.hypot(bx, by) || 1;
          B = [B[0] + bx / bl * gap, B[1] + by / bl * gap];
          var tx_ = B[0] - C[0], ty_ = B[1] - C[1], tl = Math.hypot(tx_, ty_) || 1; tx_ /= tl; ty_ /= tl;
          var hl = 5 + w * 1.6, hw = 3 + w * 1.1, Bs = [B[0] - tx_ * hl * 0.9, B[1] - ty_ * hl * 0.9];
          var col = q.highlight ? ACC : 'var(--mv-fg)', op = q.highlight ? 1 : 0.72;
          var gg = tip(E('g', { opacity: op }, c.svg), (names[q.from] || q.label || '') + ' → ' + (names[q.to] || '') + ' ' + fmt(q.value, o));
          E('path', { d: 'M' + r1(A[0]) + ',' + r1(A[1]) + 'Q' + r1(C[0]) + ',' + r1(C[1]) + ' ' + r1(Bs[0]) + ',' + r1(Bs[1]), fill: 'none', stroke: col, 'stroke-width': r1(w), 'stroke-linecap': 'butt' }, gg);
          E('path', { d: 'M' + r1(B[0]) + ',' + r1(B[1]) + 'L' + r1(B[0] - tx_ * hl - ty_ * hw) + ',' + r1(B[1] - ty_ * hl + tx_ * hw) + 'L' + r1(B[0] - tx_ * hl + ty_ * hw) + ',' + r1(B[1] - ty_ * hl - tx_ * hw) + 'Z', fill: col }, gg);
          E('circle', { cx: r1(A[0]), cy: r1(A[1]), r: c.slide ? 5 : 3, fill: 'var(--mv-fg)' }, c.svg);
        });
        var fv = [fmax, fmax / 2, fmax / 6].map(function (v) { var s = niceStep(v); return Math.max(s, Math.round(v / s) * s); });
        c.legend.innerHTML = fv.map(function (v) { return '<span><i style="--c:var(--mv-fg);width:' + (c.slide ? 36 : 24) + 'px;height:' + r1(Math.min(wMax, wid(v))) + 'px"></i>' + fmt(v, o) + '</span>'; }).join('');
      }

      /* 위치 안내도: 작은 지역은 동그라미로 짚고, 확대 상자를 붙인다 */
      if (type === 'locator') {
        [].concat(o.focus || []).forEach(function (id) {
          var cc = cents[id]; if (!cc) return;
          if (cc.area < 40) E('circle', { cx: r1(cc[0]), cy: r1(cc[1]), r: c.slide ? 14 : 9, fill: 'none', stroke: o.accent ? ACC : 'var(--mv-fg)', 'stroke-width': c.slide ? 2.5 : 1.5 }, c.svg);
        });
        if (o.inset && o.inset.geo) {
          var ig = o.inset.geo, ip = projection(ig, o.inset.projection), ia = aspect(ig, ip), iw = Math.round(c.W * (o.inset.size || 0.3)), ih = Math.round(iw * ia);
          var corner = o.inset.corner || 'tr', ix = corner[1] === 'r' ? c.W - iw - 1 : 1, iy = corner[0] === 'b' ? c.H - ih - 1 : 1;
          E('rect', { x: ix + .5, y: iy + .5, width: iw - 1, height: ih - 1, 'class': 'frame' }, c.svg);
          var ifit = fitter(ig, ip, ix + 6, iy + 6, iw - 12, ih - 12), ifocus = [].concat(o.inset.focus || []), ib = featById(ig);
          ig.features.forEach(function (ft) {
            if (!ft.geometry) return;
            E('path', { d: pathOf(ft.geometry, ifit), fill: ifocus.indexOf(ft.properties.id) >= 0 ? 'var(--mv-fg)' : 'var(--g2b,#e1e1e1)', stroke: 'var(--mv-bg)', 'stroke-width': .5 }, c.svg);
          });
          ifocus.forEach(function (id) { if (!ib[id]) return; var cc = centroid(ib[id].geometry, ifit); if (cc.area < 40) E('circle', { cx: r1(cc[0]), cy: r1(cc[1]), r: c.slide ? 10 : 6, fill: 'none', stroke: 'var(--mv-fg)', 'stroke-width': 1.5 }, c.svg); });
        }
      }

      /* 지명: 넓은 지역부터, 겹치면 건너뛴다 */
      if (o.labels) {
        var want = o.labels === true ? geo.features.map(function (ft) { return ft.properties.id; }) : o.labels, boxes = [];
        want.map(function (id) { return { id: id, c: cents[id] }; }).filter(function (q) { return q.c; })
          .sort(function (a, b) { return b.c.area - a.c.area; }).forEach(function (q) {
            var t = (o.names && o.names[q.id]) || names[q.id] || q.id, w = tw(t, f, 500), bx = [q.c[0] - w / 2 - 2, q.c[1] - f * 0.6, q.c[0] + w / 2 + 2, q.c[1] + f * 0.6];
            if (boxes.some(function (b) { return bx[0] < b[2] && bx[2] > b[0] && bx[1] < b[3] && bx[3] > b[1]; })) return;
            boxes.push(bx); T(t, q.c[0], q.c[1], 'nm halo', 'middle', c.svg);
          });
      }

      /* 축척 막대와 방위표: 지역 지도에만 */
      if (p.kind === 'equirect' && o.scale !== false) {
        var kmPx = 111.32 / fit.s, want_ = c.W * 0.14 * kmPx, km = niceStep(want_), px = km / kmPx, sy = c.H - pad - 2;
        /* 기본은 오른쪽 아래(섬과 겹치지 않게). 확대 상자가 오른쪽 아래면 왼쪽 아래 */
        var leftSide = type === 'locator' && o.inset && (o.inset.corner || 'tr') === 'br', kmT = fmt(km) + ' km';
        var sx = leftSide ? (c.W - W) / 2 + pad : c.W - (c.W - W) / 2 - pad - px;
        var sb = E('g', { 'class': 'ink', 'stroke-width': 1 }, c.svg);
        E('path', { d: 'M' + r1(sx) + ',' + r1(sy - 5) + 'V' + r1(sy) + 'H' + r1(sx + px) + 'V' + r1(sy - 5), fill: 'none' }, sb);
        T(kmT, leftSide ? sx + px + 6 : sx - 6, sy - 2, 'ax', leftSide ? 'start' : 'end', c.svg);
      }
      if (p.kind === 'equirect' && o.north !== false) {
        var nx = c.W - (c.W - W) / 2 - pad - 8, ny = pad + f * 1.2, nl = c.slide ? 40 : 24;
        if (type === 'locator' && o.inset && (o.inset.corner || 'tr') === 'tr') nx = (c.W - W) / 2 + pad + 8;
        T('N', nx, ny - f * 0.2, 'ax', 'middle', c.svg, { style: 'fill:var(--mv-fg);font-weight:600' });
        E('path', { d: 'M' + nx + ',' + r1(ny + f * 0.6) + 'v' + nl, stroke: 'var(--mv-fg)', 'stroke-width': 1 }, c.svg);
        E('path', { d: 'M' + nx + ',' + r1(ny + f * 0.6) + 'l-4,9h8z', fill: 'var(--mv-fg)' }, c.svg);
      }
    });
  }

  G.MonoViz = { bar: bar, hbar: hbar, line: line, scatter: scatter, share: share, climate: climate, pyramid: pyramid, map: map, ticks: ticks };
})(window);
