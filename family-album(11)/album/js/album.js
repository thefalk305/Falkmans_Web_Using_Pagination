/* ==========================================================================
   Flip-book engine. You normally don't need to edit this file.
   Content comes from album-data.js, or from the in-page editor
   (the "Edit album" button), which saves in your browser.
   ========================================================================== */
(() => {
  'use strict';

  /* ---------------- settings ---------------- */
  const RATIO = 1.32;                       // page height / page width
  const MIN_PER_PAGE = 3, MAX_PER_PAGE = 5; // photos per page
  const PAGE_CAPACITY = 6;                  // "room" on a page...
  const COST = { small: 1, medium: 1.5, large: 2 }; // ...and what each size uses
  const RANK = { small: 1, medium: 2, large: 3 };
  const FLIP_MS = 1000;                     // one full page turn
  const STAGGER_MS = 110;                   // delay between pages on multi-page jumps
  const CONTROLS_H = 56;
  const LB_MAX = 10;                        // maximum zoom in the photo viewer
  const CURL_LIFT = 0.3;                    // how high the bottom corner rises mid-turn (x page width)
  const CURL_MAX = 3;                       // pages that may curl at the same time
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- helpers ---------------- */
  const $ = id => document.getElementById(id);
  const el = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  const SHIELD =
    '<svg class="crest-ph" viewBox="0 0 100 120" aria-hidden="true">' +
    '<path d="M50 4 L92 18 V58 C92 88 70 106 50 116 C30 106 8 88 8 58 V18 Z" fill="none" ' +
    'stroke="currentColor" stroke-width="3" stroke-dasharray="6 4"/>' +
    '<text x="50" y="64" text-anchor="middle" font-size="11" fill="currentColor" ' +
    'font-family="Georgia,serif" letter-spacing="1">YOUR CREST</text></svg>';
  // leather spine with raised bands, along the hinge edge of both covers
  const SPINE = '<div class="spine" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>';
  const crestHTML = src => src
    ? `<img src="${esc(src)}" alt="Family crest" draggable="false">`
    : SHIELD;

  /* ---------------- DOM ---------------- */
  const book = $('book');
  const stage = $('stage');
  const info = $('pageInfo');
  const btnPrev = $('btnPrev');
  const btnNext = $('btnNext');
  const btnSound = $('btnSound');
  const lightbox = $('lightbox');
  const lbImg = $('lbImg');
  const lbCap = $('lbCap');
  const lbZoomLbl = $('lbZoomLbl');
  const lbPrev = $('lbPrev');
  const lbNext = $('lbNext');

  /* ---------------- state ---------------- */
  let DATA = null;
  let pages = [], branchStart = [], itemPage = {}, photoList = [], N = 0;
  let leaves = [], frontShade = [], backShade = [], tabs = [], bookShadow = null;
  let angle = [], anim = [], target = [];
  let casts = [];
  let curl = [], leafTabs = [];         // per-leaf curl rigs and the tabs that ride on them
  let cur = 0;                          // number of leaves turned
  let raf = 0;
  const metrics = { pw: 400, ph: 528 };

  /* ---------------- photo pagination (3-5 per page, by size) ---------------- */
  function paginate(photos) {
    const out = [];
    let group = [], cost = 0;
    for (const p of photos) {
      const c = COST[p.size] || COST.medium;
      const full = group.length >= MAX_PER_PAGE ||
                   (group.length >= MIN_PER_PAGE && cost + c > PAGE_CAPACITY);
      if (full) { out.push(group); group = []; cost = 0; }
      group.push(p); cost += c;
    }
    if (group.length) out.push(group);
    // never leave a short last page (fewer than MIN_PER_PAGE photos)
    if (out.length > 1 && out[out.length - 1].length < MIN_PER_PAGE) {
      const last = out.pop(), prevPg = out.pop();
      const all = prevPg.concat(last);
      if (all.length <= MAX_PER_PAGE) out.push(all);
      else {
        const half = Math.ceil(all.length / 2);
        out.push(all.slice(0, half), all.slice(half));
      }
    }
    return out;
  }

  // A branch is a list of photos and "story" pages. A story page (type:'note')
  // or a photo with newPage:true ends the current run, so every run is paginated on its own.
  function layoutBranch(items) {
    const result = [];
    let seg = [];
    const flush = () => {
      if (seg.length) paginate(seg).forEach(g => result.push({ kind: 'photos', photos: g }));
      seg = [];
    };
    for (const it of items) {
      if (it.type === 'note') { flush(); result.push({ kind: 'note', note: it }); }
      else { if (it.newPage) flush(); seg.push(it); }
    }
    flush();
    return result;
  }

  /* ---------------- build the list of pages ---------------- */
  function buildPages() {
    pages = []; branchStart = []; itemPage = {};
    pages.push({ type: 'cover' });          // 0  (right)
    pages.push({ type: 'inside-front' });   // 1  (left)
    pages.push({ type: 'index' });          // 2  (right)

    (DATA.branches || []).forEach((b, bi) => {
      if (pages.length % 2 === 0) pages.push({ type: 'blank' });   // title pages open on the left
      branchStart[bi] = pages.length;
      pages.push({ type: 'branch', branch: b, bi, color: b.color });
      layoutBranch(b.photos || []).forEach(pg => {
        if (pg.kind === 'note') {
          itemPage[pg.note.id] = pages.length;
          pages.push({ type: 'note', branch: b, bi, color: b.color, note: pg.note });
        } else {
          pg.photos.sort((x, y) => RANK[y.size || 'medium'] - RANK[x.size || 'medium']); // biggest photo gets biggest slot
          pg.photos.forEach(p => { itemPage[p.id] = pages.length; });
          pages.push({ type: 'photos', branch: b, bi, color: b.color, photos: pg.photos });
        }
      });
    });
    while (pages.length % 2 !== 0) pages.push({ type: 'blank' });
    pages.push({ type: 'inside-back' });
    pages.push({ type: 'back-cover' });
    N = pages.length / 2;   // number of leaves (each leaf = 2 pages)
  }

  /* ---------------- render one page face ---------------- */
  function renderFace(pg, idx) {
    const side = idx % 2 === 0 ? 'right' : 'left';
    const face = el('div', `face ${side} t-${pg.type}`);
    face.style.setProperty('--accent', pg.color || '#8a6d3b');
    let html = '';

    switch (pg.type) {
      case 'cover':
        html = `${SPINE}<div class="cover-frame">
          ${DATA.eyebrow ? `<p class="eyebrow">${esc(DATA.eyebrow)}</p>` : ''}
          <div class="crest crest-lg">${crestHTML(DATA.crest)}</div>
          <h1>${esc(DATA.title)}</h1>
          <p class="cover-sub">${esc(DATA.subtitle)}</p></div>`;
        break;

      case 'back-cover':
        html = `${SPINE}<div class="cover-frame">
          <div class="crest crest-sm">${crestHTML(DATA.backCrest || DATA.crest)}</div>
          <p class="cover-sub">${esc(DATA.backText)}</p></div>`;
        break;

      case 'inside-front':
        html = DATA.dedication ? `<div class="dedication">${esc(DATA.dedication)}</div>` : '';
        break;

      case 'inside-back':
        break;

      case 'index':
        html = `<div class="page-body">
          <h2 class="page-title">Contents</h2><div class="rule"></div>
          <ol class="idx-list${DATA.branches.length > 8 ? ' dense' : ''}">${DATA.branches.map((b, bi) => `
            <li><a href="#" class="idx-link" data-goto="${branchStart[bi]}">
              <span class="dot" style="background:${esc(b.color)}"></span>
              <span class="idx-name">${esc(b.name)}</span>
              <span class="idx-leader"></span>
              <span class="idx-page">${branchStart[bi]}</span></a></li>`).join('')}
          </ol></div><div class="folio">${idx}</div>`;
        break;

      case 'branch':
        html = `<div class="page-body branch-body">
          <div class="crest crest-md">${crestHTML(pg.branch.crest)}</div>
          <h2 class="branch-name">${esc(pg.branch.name)}</h2>
          <div class="accent-rule"></div>
          <p class="blurb">${esc(pg.branch.blurb || '')}</p></div>`;
        break;

      case 'note':
        html = `<div class="page-body">
          <header class="page-head">${esc(pg.branch.name)}</header>
          <h3 class="note-title">${esc(pg.note.title || '')}</h3>
          <div class="accent-rule left"></div>
          <div class="note-text">${esc(pg.note.text || '')}</div></div>
          <div class="folio">${idx}</div>`;
        break;

      case 'photos': {
        const figs = pg.photos.map(p => {
          const n = photoList.push(p) - 1;
          return `<figure class="ph${p.fit === 'contain' ? ' contain' : ''}" data-n="${n}">
            <div class="frame"><img src="${esc(p.src)}" alt="${esc(p.caption || '')}" draggable="false" decoding="async"></div>
            <figcaption><span class="cap">${esc(p.caption || '')}</span>${p.date ? `<span class="date">${esc(p.date)}</span>` : ''}</figcaption>
          </figure>`;
        }).join('');
        html = `<div class="page-body">
          <header class="page-head">${esc(pg.branch.name)}</header>
          <div class="photos n${pg.photos.length}">${figs}</div></div>
          <div class="folio">${idx}</div>`;
        break;
      }

      default:
        html = '<div class="ornament">&#10086;</div>';
    }

    face.innerHTML = html;
    const shade = el('div', 'shade');
    face.appendChild(shade);
    return { face, shade };
  }

  /* ---------------- build the book ---------------- */
  function buildBook() {
    cancelAnimationFrame(raf); raf = 0;
    book.textContent = '';
    photoList = []; leaves = []; frontShade = []; backShade = []; tabs = [];
    curl = new Array(N).fill(null); leafTabs = [];
    cur = clamp(cur, 0, N);

    book.style.setProperty('--n', Math.max(1, DATA.branches.length));
    bookShadow = el('div', 'book-shadow');
    book.appendChild(bookShadow);
    casts = [];
    for (let i = 0; i < N; i++) { const c = el('div', 'cast'); book.appendChild(c); casts.push(c); }

    for (let i = 0; i < N; i++) {
      const leaf = el('div', 'leaf');
      if (i === 0 || i === N - 1) leaf.classList.add('board');

      const f = renderFace(pages[2 * i], 2 * i);
      const b = renderFace(pages[2 * i + 1], 2 * i + 1);
      f.face.classList.add('front');
      b.face.classList.add('back');
      leaf.append(f.face, b.face);
      frontShade[i] = f.shade;
      backShade[i] = b.shade;

      // branch tab: lives on the leaf whose back side is the branch title page
      const bi = branchStart.indexOf(2 * i + 1);
      if (bi >= 0) {
        const br = DATA.branches[bi];
        const make = cls => {
          const t = el('button', `tab ${cls}`);
          t.type = 'button';
          const label = br.tabLabel || br.name;
          t.innerHTML = `<span class="tab-txt">${esc(label)}</span>`;
          t.dataset.label = label;
          t.title = br.name;
          t.style.setProperty('--tab', br.color || '#8a6d3b');
          t.style.setProperty('--i', bi);
          t.dataset.goto = 2 * i + 1;
          t.dataset.bi = bi;
          t.setAttribute('aria-label', 'Go to ' + br.name);
          return t;
        };
        const tf = make('tab-front'), tb = make('tab-back');
        leaf.append(tf, tb);
        tabs[bi] = [tf, tb];
        leafTabs[i] = [tf, tb];
      }

      book.appendChild(leaf);
      leaves.push(leaf);
    }

    angle = Array.from({ length: N }, (_, i) => (i < cur ? 180 : 0));
    target = angle.slice();
    anim = new Array(N).fill(null);
  }

  // Shrink long story-page text until it fits its page.
  function fitNotes() {
    book.querySelectorAll('.note-text').forEach(t => {
      t.style.fontSize = '';
      let f = 1, n = 0;
      while (t.scrollHeight > t.clientHeight + 1 && n < 12) {
        f *= 0.92; t.style.fontSize = (0.9 * f) + 'em'; n++;
      }
    });
  }

  // Shrink each tab's name until it fits the tab (tabs get shorter as families are added).
  // When a name is too long to fit on one line at a readable size, it is allowed to break
  // across lines with a hyphen (never leaving fewer than 3 letters on a line).
  const TAB_FONT = 0.72, TAB_MIN_FONT = 0.44;    // em, as set on .tab in style.css
  const TAB_ONE_LINE_MIN = 0.5;                  // keep a name on one line if it fits at this size or more
  // Mark where a name may break between syllables (roughly: ba-na-na, hen-der-son, kowal-ski).
  const ONSETS = /^(bl|br|ch|cl|cr|dr|fl|fr|gl|gr|ph|pl|pr|sc|sh|sk|sl|sm|sn|sp|st|sw|th|tr|tw|wh)$/;
  const isV = ch => /[aeiouyàáâäãåèéêëìíîïòóôöõøùúûü]/i.test(ch || '');
  const isL = ch => /\p{L}/u.test(ch || '');
  function softHyphens(s) {
    return s.split(' ').map(w => {
      if (w.length < 7) return w;
      let out = w[0];
      for (let k = 1; k < w.length; k++) {
        const p2 = w[k - 2], p = w[k - 1], c = w[k], n = w[k + 1], n2 = w[k + 2];
        const ok = k >= 3 && k <= w.length - 3 && isL(p) && isL(c) && isL(n) && isL(p2) && !isV(c) && (
          (isV(p) && isV(n) && !ONSETS.test(p + c)) ||                        // ba-na
          (isV(p) && ONSETS.test((c + n).toLowerCase()) && isV(n2)) ||         // ga-tho
          (!isV(p) && isV(p2) && isV(n) && !ONSETS.test((p + c).toLowerCase())) ||   // hen-der
          (!isV(p) && isV(p2) && ONSETS.test((c + n).toLowerCase()) && isV(n2))      // kowal-ski
        );
        out += (ok ? '\u00AD' : '') + c;
      }
      return out;
    }).join(' ');
  }

  function fitTab(pair, text) {
    const t = pair[0];
    pair.forEach(x => {
      x.firstChild.textContent = text;
      x.style.fontSize = ''; x.style.letterSpacing = ''; x.classList.remove('clip');
    });
    const fits = () => t.scrollHeight <= t.clientHeight + 1 && t.scrollWidth <= t.clientWidth + 1;
    let f = TAB_FONT;
    while (!fits() && f > TAB_MIN_FONT) {
      f = Math.max(TAB_MIN_FONT, f * 0.92);
      t.style.fontSize = f.toFixed(3) + 'em';
      if (f < 0.6) t.style.letterSpacing = '.05em';
    }
    return { f, clip: !fits() };
  }

  function fitTabs() {
    tabs.forEach(pair => {
      if (!pair) return;
      const label = pair[0].dataset.label;
      let best = fitTab(pair, label), text = label;
      if (best.clip || best.f < TAB_ONE_LINE_MIN) {     // too small on one line: try breaking it
        const hy = softHyphens(label);
        if (hy !== label) {
          const r = fitTab(pair, hy);
          if ((!r.clip && best.clip) || (r.clip === best.clip && r.f > best.f * 1.08)) { best = r; text = hy; }
        }
        if (best.clip) {                          // last resort: break anywhere, 3+ letters per line
          const any = label.split(' ').map(w => w.length < 6 ? w :
            [...w].map((ch, k) => (k >= 3 && k <= w.length - 3 ? '\u00AD' : '') + ch).join('')).join(' ');
          const r = fitTab(pair, any);
          if (!r.clip || r.f > best.f) { best = r; text = any; }
        }
      }
      fitTab(pair, text);
      pair.forEach(x => x.classList.toggle('clip', best.clip));   // still too long: cut short with "…"
    });
  }

  /* ---------------- page curl ----------------
   While a paper page turns, it lies flat and its bottom outer corner is folded
   over along a diagonal crease that sweeps across the spread. The part of the
   page past the crease is hidden (the page underneath shows through) and the
   back of the page is drawn, reflected, on the near side of the crease.
   The hard covers don't fold; they swing over as before. */
  let curlOn = !REDUCED;
  // Reduced-motion only sets the starting value; the button can always override it.
  try { const v = localStorage.getItem('album-curl'); if (v != null) curlOn = v === '1'; } catch (_) { /* ignore */ }

  function prepClone(node) {
    node.classList.remove('front', 'back');
    node.style.transform = 'none';
    const sh = node.querySelector && node.querySelector('.shade');
    if (sh) sh.style.opacity = '0';
    return node;
  }

  function ensureCurl(i) {
    if (!curlOn || curl[i] || curl.filter(Boolean).length >= CURL_MAX) return;
    const leaf = leaves[i];
    if (leaf.classList.contains('board')) return;
    const root = el('div', 'curl');

    // shadow on the page underneath, just past the crease
    const under = el('div', 'peel-under'), underGrad = el('div', 'peel-grad');
    under.appendChild(underGrad);

    // the part of the front that is still flat
    const front = el('div', 'peel-clip');
    front.appendChild(prepClone(leaf.querySelector('.face.front').cloneNode(true)));

    // the folded-over flap: the back of the page, reflected across the crease
    const flap = el('div', 'peel-flap'), back = el('div', 'peel-clip');
    const sheet = el('div', 'peel-sheet'), sheetTab = el('div', 'peel-sheet tabs');
    const flapGrad = el('div', 'peel-grad');
    sheet.append(prepClone(leaf.querySelector('.face.back').cloneNode(true)), flapGrad);
    back.append(sheet, sheetTab);
    flap.appendChild(back);

    if (leafTabs[i]) {                  // the leaf's tab folds with it
      front.appendChild(prepClone(leafTabs[i][0].cloneNode(true)));
      sheetTab.appendChild(prepClone(leafTabs[i][1].cloneNode(true)));
    }
    root.append(under, front, flap);
    leaf.appendChild(root);
    curl[i] = { root, under, underGrad, front, back, sheet, sheetTab, flapGrad, active: false };
  }

  function activateCurl(i) {
    curl[i].active = true;
    leaves[i].classList.add('curling');
  }

  function destroyCurl(i) {
    const c = curl[i];
    if (!c) return;
    leaves[i].classList.remove('curling');
    c.root.remove();
    curl[i] = null;
  }

  function destroyAllCurls() { curl.forEach((c, i) => { if (c) destroyCurl(i); }); }

  // place a shading band whose left edge lies on the crease, running in direction (vx, vy)
  function band(node, mx, my, vx, vy, w, len) {
    node.style.width = w.toFixed(1) + 'px';
    node.style.height = (2 * len).toFixed(1) + 'px';
    node.style.transform = `translate(${mx.toFixed(1)}px, ${my.toFixed(1)}px) ` +
      `rotate(${Math.atan2(vy, vx).toFixed(4)}rad) translate(0, ${(-len).toFixed(1)}px)`;
  }

  function updateCurl(i, a) {
    const c = curl[i], pw = metrics.pw, ph = metrics.ph;
    const t = a * Math.PI / 180, co = Math.cos(t), si = Math.sin(t);
    // where the bottom outer corner is now (x measured from the spine)
    const cx = pw * co, cy = ph - CURL_LIFT * pw * si * si;
    // the crease is the perpendicular bisector of the corner's rest point and its position now
    let dx = pw - cx, dy = ph - cy, d = Math.hypot(dx, dy), mx = (pw + cx) / 2, my = (ph + cy) / 2;
    if (d < 0.5) { dx = 0.86; dy = 0.5; d = 1; mx = pw; my = ph; }
    const nx = dx / d, ny = dy / d;          // unit normal, pointing toward the folded-away side
    const ux = -ny, uy = nx, B = 4 * (pw + ph);
    const P = (s, k) => `${(mx + ux * s - nx * k).toFixed(1)}px ${(my + uy * s - ny * k).toFixed(1)}px`;
    const near = `polygon(${P(B, 0)}, ${P(-B, 0)}, ${P(-B, B)}, ${P(B, B)})`;
    const far = `polygon(${P(B, 0)}, ${P(-B, 0)}, ${P(-B, -B)}, ${P(B, -B)})`;

    c.front.style.clipPath = near;
    c.back.style.clipPath = near;
    c.under.style.clipPath = far;

    // back face -> mirrored onto the front's coordinates -> reflected across the crease
    const r11 = 1 - 2 * nx * nx, r12 = -2 * nx * ny, r22 = 1 - 2 * ny * ny, md = 2 * (mx * nx + my * ny);
    c.sheet.style.transform = c.sheetTab.style.transform = `matrix(${(-r11).toFixed(5)}, ${(-r12).toFixed(5)}, ${r12.toFixed(5)}, ` +
      `${r22.toFixed(5)}, ${(r11 * pw + md * nx).toFixed(2)}, ${(r12 * pw + md * ny).toFixed(2)})`;

    const fold = d / 2;                       // distance from the crease to the corner's tip
    // (the flap's shading lives in the back face's own coordinates, so it stays on the flap)
    band(c.flapGrad, pw - mx, my, -nx, ny, Math.max(1, fold), B);
    c.flapGrad.style.opacity = Math.sqrt(si).toFixed(3);
    band(c.underGrad, mx, my, nx, ny, Math.max(1, fold * 0.55 + pw * 0.04), B);
    c.underGrad.style.opacity = Math.min(1, si * 3).toFixed(3);
  }

  const btnCurl = $('btnCurl');
  function paintCurlBtn() {
    if (!btnCurl) return;
    btnCurl.textContent = curlOn ? '↻ Curl on' : '↻ Curl off';
    btnCurl.setAttribute('aria-pressed', String(curlOn));
    btnCurl.classList.toggle('off', !curlOn);
  }
  if (btnCurl) {
    btnCurl.addEventListener('click', () => {
      curlOn = !curlOn;
      try { localStorage.setItem('album-curl', curlOn ? '1' : '0'); } catch (_) { /* ignore */ }
      if (!curlOn) { destroyAllCurls(); render(); }
      paintCurlBtn();
      btnCurl.blur();
    });
    paintCurlBtn();
  }

  /* ---------------- rendering ---------------- */
  function render() {
    const fs = new Array(N).fill(0), bs = new Array(N).fill(0);
    const peeling = i => curl[i] && angle[i] > 0.05 && angle[i] < 179.95;

    for (let i = 0; i < N; i++) {
      const a = angle[i];
      const s = Math.sin(a * Math.PI / 180);
      leaves[i].style.transform = `rotateY(${-a}deg)`;
      leaves[i].style.zIndex = a < 90 ? N - i : i;
      if (peeling(i)) continue;           // a folding page casts its own shadows

      if (a < 90) {                       // page lifting off the right-hand stack
        fs[i] = Math.max(fs[i], 0.30 * s);
        if (i + 1 < N) fs[i + 1] = Math.max(fs[i + 1], 0.15 * s);   // shadow cast on page below
      } else {                            // page settling onto the left-hand stack
        bs[i] = Math.max(bs[i], 0.30 * s);
        if (i - 1 >= 0) bs[i - 1] = Math.max(bs[i - 1], 0.15 * s);
      }
    }
    for (let i = 0; i < N; i++) {
      frontShade[i].style.opacity = fs[i].toFixed(3);
      backShade[i].style.opacity = bs[i].toFixed(3);
    }

    // fold the corners of the pages that are in motion
    for (let i = 0; i < N; i++) {
      const c = curl[i];
      if (!c) continue;
      const a = angle[i];
      if (peeling(i)) {
        if (!c.active) activateCurl(i);
        leaves[i].style.transform = 'none';        // the page lies flat while its corner folds
        leaves[i].style.zIndex = 2 * N + (a < 90 ? N - i : i);
        updateCurl(i, a);
      } else if (c.active || (!anim[i] && !(drag && drag.i === i))) {
        destroyCurl(i);                  // done, or built for a turn that never happened
      }
    }

    // soft shadow the turning page throws on the page beneath it
    for (let i = 0; i < N; i++) {
      const a = angle[i], cs = casts[i];
      if (!(a > 0.05 && a < 179.95) || peeling(i)) { cs.style.display = 'none'; continue; }
      const rad = a * Math.PI / 180, sn = Math.sin(rad);
      const edge = Math.abs(metrics.pw * Math.cos(rad));
      const reach = metrics.pw * (0.08 + 0.2 * sn);
      const alpha = (0.4 * Math.pow(sn, 0.8)).toFixed(3);
      const right = a < 90, col = 'rgba(28,16,6,';
      cs.style.display = 'block';
      cs.style.left = (right ? metrics.pw : 0) + 'px';
      cs.style.zIndex = leaves[i].style.zIndex;
      cs.style.background = `linear-gradient(${right ? 'to right' : 'to left'}, ${col}${alpha}) 0, ` +
        `${col}${alpha}) ${edge.toFixed(1)}px, ${col}0) ${(edge + reach).toFixed(1)}px)`;
    }

    // slide the book so a closed cover sits centred
    const pw = metrics.pw;
    const a0 = angle[0], aL = angle[N - 1];
    const shift = -pw / 2 * (1 - a0 / 180) + pw / 2 * (aL / 180);
    book.style.transform = `translateX(${shift.toFixed(2)}px)`;

    // desk shadow only under what is visible
    const left = pw * (1 - a0 / 180);
    const right = pw * (1 + (1 - aL / 180));
    bookShadow.style.left = left + 'px';
    bookShadow.style.width = Math.max(0, right - left) + 'px';

    // tabs fade out when the book is closed
    const o = clamp((a0 - 90) / 60, 0, 1) * clamp((150 - aL) / 60, 0, 1);
    book.style.setProperty('--tabs', o.toFixed(3));
    book.classList.toggle('no-tabs', o < 0.05);
  }

  function tick(now) {
    let active = false;
    for (let i = 0; i < N; i++) {
      const a = anim[i];
      if (!a) continue;
      const t = (now - a.start) / a.dur;
      if (t < 0) { active = true; continue; }
      if (t >= 1) { angle[i] = a.to; anim[i] = null; }
      else { angle[i] = a.from + (a.to - a.from) * ease(t); active = true; }
    }
    render();
    raf = active ? requestAnimationFrame(tick) : 0;
  }

  function flipLeaf(i, to, delay = 0, ms = FLIP_MS, sound = true, fold = true) {
    if (fold) ensureCurl(i);             // build the folding rig before the clock starts
    target[i] = to;
    const from = angle[i];
    const instant = REDUCED && !curlOn;  // reduce-motion snaps pages, unless curl was switched on
    const dur = instant ? 1 : Math.max(280, ms * Math.abs(to - from) / 180);
    anim[i] = { from, to, start: performance.now() + (instant ? 0 : delay), dur };
    if (sound && Math.abs(to - from) > 20) flipSound(delay, dur);
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function recount() { cur = target.reduce((s, t) => s + (t === 180 ? 1 : 0), 0); }

  /* ---------------- optional page-turn sound (synthesised, no files) ---------------- */
  let soundOn = true;
  try { const v = localStorage.getItem('album-sound'); if (v != null) soundOn = v === '1'; } catch (_) { /* ignore */ }
  let actx = null, noiseBuf = null;

  // A page turn in three parts: a flap of paper, an airy swoosh that rises and
  // falls with the page's speed, and a soft settle as it lands.
  function flipSound(delayMs = 0, durMs = FLIP_MS) {
    if (!soundOn) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      if (!noiseBuf) {
        noiseBuf = actx.createBuffer(1, actx.sampleRate * 3, actx.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      const t0 = actx.currentTime + delayMs / 1000;
      const dur = clamp(durMs / 1000, 0.3, 1.1);
      const master = actx.createGain(); master.gain.value = 0.9; master.connect(actx.destination);

      const burst = (start, len, type, freq, q, peak, attack) => {
        const src = actx.createBufferSource(); src.buffer = noiseBuf;
        const f = actx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
        const g = actx.createGain();
        g.gain.setValueAtTime(0.0001, start);
        g.gain.exponentialRampToValueAtTime(peak, start + attack);
        g.gain.exponentialRampToValueAtTime(0.0001, start + len);
        src.connect(f); f.connect(g); g.connect(master);
        src.start(start, Math.random() * 1.5, len + 0.05);
        return f;
      };

      // 1. flap: the page leaves the stack
      burst(t0, 0.07, 'highpass', 2600, 0.7, 0.16, 0.008);

      // 2. swoosh: band of air sweeping up while the page speeds up, down as it slows
      const sw = burst(t0 + 0.02, dur * 0.95, 'bandpass', 700, 1.0, 0.34, dur * 0.34);
      sw.frequency.setValueAtTime(600, t0);
      sw.frequency.exponentialRampToValueAtTime(2800, t0 + dur * 0.4);
      sw.frequency.exponentialRampToValueAtTime(900, t0 + dur);
      // a thin, quieter high layer gives the "paper" edge
      const hi = burst(t0 + 0.04, dur * 0.8, 'bandpass', 4200, 2.2, 0.07, dur * 0.3);
      hi.frequency.setValueAtTime(3200, t0);
      hi.frequency.exponentialRampToValueAtTime(5200, t0 + dur * 0.45);

      // 3. settle: the page lands
      burst(t0 + dur * 0.9, 0.16, 'lowpass', 520, 0.8, 0.2, 0.012);
    } catch (err) { console.warn('Page-turn sound unavailable:', err); }
  }

  function paintSoundBtn() {
    if (!btnSound) return;
    btnSound.textContent = soundOn ? '♪ Sound on' : '♪ Sound off';
    btnSound.setAttribute('aria-pressed', String(soundOn));
    btnSound.classList.toggle('off', !soundOn);
  }
  if (btnSound) {
    btnSound.addEventListener('click', () => {
      soundOn = !soundOn;
      try { localStorage.setItem('album-sound', soundOn ? '1' : '0'); } catch (_) { /* ignore */ }
      paintSoundBtn();
      if (soundOn) flipSound(0, 800);
      btnSound.blur();
    });
    paintSoundBtn();
  }

  /* ---------------- navigation ---------------- */
  function updateUI() {
    if (cur === 0) info.textContent = 'Front cover';
    else if (cur === N) info.textContent = 'Back cover';
    else info.textContent = `Pages ${2 * cur - 1} – ${2 * cur}`;
    btnPrev.disabled = cur === 0;
    btnNext.disabled = cur === N;

    const ref = cur === 0 ? -1 : (cur === N ? 2 * cur - 1 : 2 * cur);
    let active = -1;
    branchStart.forEach((p, bi) => { if (p <= ref) active = bi; });
    tabs.forEach((pair, bi) => pair.forEach(t => t.classList.toggle('active', bi === active)));
  }

  function next() { if (cur < N) { flipLeaf(cur, 180); cur++; updateUI(); } }
  function prev() { if (cur > 0) { cur--; flipLeaf(cur, 0); updateUI(); } }

  function goTo(k) {
    k = clamp(k, 0, N);
    if (k === cur) return;
    const n = Math.abs(k - cur);
    const gap = Math.min(STAGGER_MS, 900 / n);
    const ms = n > 1 ? 800 : FLIP_MS;
    let d = 0, c = 0;
    if (k > cur) { for (let i = cur; i < k; i++, d += gap, c++) flipLeaf(i, 180, d, ms, c < 5, n === 1); }
    else         { for (let i = cur - 1; i >= k; i--, d += gap, c++) flipLeaf(i, 0, d, ms, c < 5, n === 1); }
    cur = k;
    updateUI();
  }
  const goToPage = p => goTo(Math.ceil(p / 2));

  btnNext.addEventListener('click', next);
  btnPrev.addEventListener('click', prev);

  const typing = e => {
    const t = e.target;
    return t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
  };

  document.addEventListener('keydown', e => {
    if (!lightbox.hidden) { lbKey(e); return; }
    if (typing(e) || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    else if (e.key === 'Home') goTo(0);
    else if (e.key === 'End') goTo(N);
  });

  // index links and tabs
  book.addEventListener('click', e => {
    const t = e.target.closest('[data-goto]');
    if (!t) return;
    e.preventDefault();
    goToPage(+t.dataset.goto);
  });

  /* ---------------- mouse / touch dragging ---------------- */
  let drag = null;

  stage.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.target.closest('[data-goto]')) return;
    const r = book.getBoundingClientRect();
    const spineX = r.left + r.width / 2;
    const fwd = e.clientX >= spineX;
    const i = fwd ? cur : cur - 1;
    if (i < 0 || i >= N) return;
    drag = {
      i, fwd, spineX,
      startX: e.clientX, startY: e.clientY,
      r0: clamp(Math.abs(e.clientX - spineX) / metrics.pw, 0.3, 1),
      moved: false, target: e.target,
      pts: [{ x: e.clientX, t: performance.now() }]
    };
    anim[i] = null;
    ensureCurl(i);
    stage.setPointerCapture(e.pointerId);
  });

  stage.addEventListener('pointermove', e => {
    if (!drag) return;
    if (!drag.moved &&
        Math.abs(e.clientX - drag.startX) < 5 && Math.abs(e.clientY - drag.startY) < 5) return;
    drag.moved = true;
    stage.classList.add('dragging');
    // the page edge follows the pointer: x = spine + r0 * pw * cos(angle)
    const c = clamp((e.clientX - drag.spineX) / (drag.r0 * metrics.pw), -1, 1);
    angle[drag.i] = Math.acos(c) * 180 / Math.PI;
    drag.pts.push({ x: e.clientX, t: performance.now() });
    if (drag.pts.length > 6) drag.pts.shift();
    render();
  });

  function endDrag(e) {
    if (!drag) return;
    const d = drag; drag = null;
    stage.classList.remove('dragging');
    try { stage.releasePointerCapture(e.pointerId); } catch (_) { /* ignore */ }

    if (!d.moved) {                              // a plain click
      const fig = d.target.closest && d.target.closest('.ph');
      if (fig) openLightbox(+fig.dataset.n);
      else if (d.fwd) next(); else prev();
      return;
    }
    const first = d.pts[0], last = d.pts[d.pts.length - 1];
    const v = (last.x - first.x) / Math.max(1, last.t - first.t);   // px per ms
    let to = angle[d.i] > 90 ? 180 : 0;
    if (v < -0.45) to = 180;       // quick flick to the left
    else if (v > 0.45) to = 0;     // quick flick to the right
    flipLeaf(d.i, to);
    recount();
    updateUI();
  }
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);

  /* ---------------- photo viewer: zoom, pan, pinch, next/previous ---------------- */
  const lb = { n: -1, scale: 1, x: 0, y: 0 };

  function lbApply() {
    lbImg.style.transform = `translate(${lb.x}px, ${lb.y}px) scale(${lb.scale})`;
    lbZoomLbl.textContent = Math.round(lb.scale * 100) + '%';
    lightbox.classList.toggle('zoomed', lb.scale > 1.001);
  }

  function lbCenter() {
    return { x: lbImg.offsetLeft + lbImg.offsetWidth / 2, y: lbImg.offsetTop + lbImg.offsetHeight / 2 };
  }

  function lbClampPan() {
    const w = lbImg.offsetWidth * lb.scale, h = lbImg.offsetHeight * lb.scale;
    const mx = w > window.innerWidth ? (w - window.innerWidth) / 2 + 60 : 0;
    const my = h > window.innerHeight ? (h - window.innerHeight) / 2 + 60 : 0;
    lb.x = clamp(lb.x, -mx, mx);
    lb.y = clamp(lb.y, -my, my);
  }

  // zoom to scale s, keeping the point under (px, py) fixed
  function lbSetScale(s, px, py) {
    s = clamp(s, 1, LB_MAX);
    const c = lbCenter();
    if (px == null) { px = c.x; py = c.y; }
    const k = s / lb.scale;
    lb.x = (px - c.x) - (px - c.x - lb.x) * k;
    lb.y = (py - c.y) - (py - c.y - lb.y) * k;
    lb.scale = s;
    if (s === 1) { lb.x = 0; lb.y = 0; }
    lbClampPan();
    lbApply();
  }

  function lbActual() {                         // jump to 1:1 pixels
    const k = lbImg.naturalWidth / Math.max(1, lbImg.offsetWidth);
    lbSetScale(k > 1.05 ? k : 2);
  }

  function openLightbox(n) {
    const p = photoList[n];
    if (!p) return;
    lb.n = n; lb.scale = 1; lb.x = 0; lb.y = 0;
    lbImg.src = p.src;
    lbCap.textContent = [p.caption, p.date].filter(Boolean).join(' — ');
    lbPrev.disabled = n <= 0;
    lbNext.disabled = n >= photoList.length - 1;
    lightbox.hidden = false;
    lbApply();
  }
  function closeLightbox() { lightbox.hidden = true; lbImg.removeAttribute('src'); }
  const lbStep = d => { if (photoList[lb.n + d]) openLightbox(lb.n + d); };

  function lbKey(e) {
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowRight') { e.preventDefault(); lbStep(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); lbStep(-1); }
    else if (e.key === '+' || e.key === '=') lbSetScale(lb.scale * 1.4);
    else if (e.key === '-' || e.key === '_') lbSetScale(lb.scale / 1.4);
    else if (e.key === '0') lbSetScale(1);
    else if (e.key === '1') lbActual();
  }

  $('lbIn').addEventListener('click', () => lbSetScale(lb.scale * 1.4));
  $('lbOut').addEventListener('click', () => lbSetScale(lb.scale / 1.4));
  $('lbFit').addEventListener('click', () => lbSetScale(1));
  $('lbActual').addEventListener('click', lbActual);
  $('lbClose').addEventListener('click', closeLightbox);
  lbPrev.addEventListener('click', () => lbStep(-1));
  lbNext.addEventListener('click', () => lbStep(1));

  lightbox.addEventListener('wheel', e => {
    e.preventDefault();
    lbSetScale(lb.scale * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.002)), e.clientX, e.clientY);
  }, { passive: false });

  lbImg.addEventListener('dblclick', e => {
    if (lb.scale > 1.05) lbSetScale(1);
    else lbSetScale(2.5, e.clientX, e.clientY);
  });

  const lbPtr = new Map();
  let lbPinch = 0, lbMoved = false;

  lightbox.addEventListener('pointerdown', e => {
    if (e.target.closest('button, .lb-bar')) return;
    lbPtr.set(e.pointerId, { x: e.clientX, y: e.clientY });
    lightbox.setPointerCapture(e.pointerId);
    lbMoved = false;
    if (lbPtr.size === 2) {
      const [a, b] = [...lbPtr.values()];
      lbPinch = Math.hypot(a.x - b.x, a.y - b.y);
    }
  });

  lightbox.addEventListener('pointermove', e => {
    const p = lbPtr.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    if (lbPtr.size === 2) {
      p.x = e.clientX; p.y = e.clientY;
      const [a, b] = [...lbPtr.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (lbPinch) lbSetScale(lb.scale * dist / lbPinch, (a.x + b.x) / 2, (a.y + b.y) / 2);
      lbPinch = dist; lbMoved = true;
    } else if (lb.scale > 1.001) {
      p.x = e.clientX; p.y = e.clientY;
      if (Math.abs(dx) + Math.abs(dy) > 0) lbMoved = true;
      lb.x += dx; lb.y += dy;
      lbClampPan(); lbApply();
    }
  });

  function lbPointerEnd(e) {
    if (!lbPtr.has(e.pointerId)) return;
    lbPtr.delete(e.pointerId);
    lbPinch = 0;
    if (!lbMoved && lbPtr.size === 0 && e.type === 'pointerup' && e.target === lightbox) closeLightbox();
  }
  lightbox.addEventListener('pointerup', lbPointerEnd);
  lightbox.addEventListener('pointercancel', lbPointerEnd);

  /* ---------------- sizing ---------------- */
  function layout() {
    const availH = stage.clientHeight - 36;
    const availW = stage.clientWidth * 0.97;
    const pw = Math.max(160, Math.floor(Math.min(availH / RATIO, availW / 2.2)));
    destroyAllCurls();                   // slices are sized for the old page width
    metrics.pw = pw;
    metrics.ph = Math.round(pw * RATIO);
    book.style.setProperty('--pw', pw + 'px');
    book.style.setProperty('--ph', metrics.ph + 'px');
    book.style.fontSize = (pw / 24) + 'px';
    if (DATA) { render(); fitTabs(); }
  }
  if (window.ResizeObserver) new ResizeObserver(layout).observe(stage);
  else window.addEventListener('resize', layout);

  /* ---------------- (re)build ---------------- */
  // data : the album object (same shape as window.ALBUM)
  // opts : { focus: itemId } | { focusBranch: index } | { page: pageIndex } -- which page to show
  function rebuild(data, opts = {}) {
    if (data) DATA = data;
    buildPages();
    let page = null;
    if (opts.focus != null && itemPage[opts.focus] != null) page = itemPage[opts.focus];
    else if (opts.focusBranch != null && branchStart[opts.focusBranch] != null) page = branchStart[opts.focusBranch];
    else if (opts.page != null) page = opts.page;
    if (page != null) cur = Math.ceil(page / 2);
    buildBook();
    layout();
    updateUI();
    fitNotes();
    if (!lightbox.hidden) closeLightbox();
  }

  window.AlbumEngine = {
    rebuild,
    showItem: id => { if (itemPage[id] != null) goToPage(itemPage[id]); },
    goToPage,
    pageOf: id => (itemPage[id] != null ? itemPage[id] : null)
  };

  /* ---------------- start ---------------- */
  const loader = window.ALBUM_LOADER ? window.ALBUM_LOADER() : window.ALBUM;
  Promise.resolve(loader)
    .catch(err => { console.error('Could not load saved album, using album-data.js', err); return window.ALBUM; })
    .then(data => {
      if (!data) { console.error('album-data.js did not load.'); return; }
      rebuild(data);
    });
})();
