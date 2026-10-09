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
  const CURL_STRIPS = 12;                   // slices the turning page is bent into
  const CURL_K = 4.4;                       // degrees of bend per slice at full curl
  const CURL_MAX = 3;                       // pages that may curl at the same time
  const OS_REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let REDUCED = OS_REDUCED;                 // instant page turns; switched off if the person turns Curl on

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

  /* ---------------- crest on inner pages ----------------
     DATA.innerCrest: 'none' | 'header' | 'footer' | 'watermark'
     Uses the branch's own crest if it has one, otherwise the family crest. */
  function innerCrest(pg, mode) {
    const src = (pg.branch && pg.branch.crest) || DATA.crest;
    if (!src || !mode || mode === 'none') return { head: '', foot: '', mark: '' };
    const img = `<img src="${esc(src)}" alt="" draggable="false">`;
    return {
      head: mode === 'header' ? `<span class="mini-crest">${img}</span>` : '',
      foot: mode === 'footer' ? `<span class="foot-crest">${img}</span>` : '',
      mark: mode === 'watermark' ? `<div class="crest-mark">${img}</div>` : ''
    };
  }

  /* ---------------- render one page face ---------------- */
  function renderFace(pg, idx) {
    const side = idx % 2 === 0 ? 'right' : 'left';
    const ic = innerCrest(pg, DATA.innerCrest);
    const face = el('div', `face ${side} t-${pg.type}`);
    face.style.setProperty('--accent', pg.color || '#8a6d3b');
    let html = '';

    switch (pg.type) {
      case 'cover':
        html = `<div class="cover-frame">
          ${DATA.eyebrow ? `<p class="eyebrow">${esc(DATA.eyebrow)}</p>` : ''}
          <div class="crest crest-lg">${crestHTML(DATA.crest)}</div>
          <h1>${esc(DATA.title)}</h1>
          <p class="cover-sub">${esc(DATA.subtitle)}</p></div>`;
        break;

      case 'back-cover':
        html = `<div class="cover-frame">
          <div class="crest crest-sm">${crestHTML(DATA.crest)}</div>
          <p class="cover-sub">${esc(DATA.backText)}</p></div>`;
        break;

      case 'inside-front':
        html = DATA.dedication ? `<div class="dedication">${esc(DATA.dedication)}</div>` : '';
        break;

      case 'inside-back':
        break;

      case 'index':
        html = `${ic.mark}<div class="page-body">
          ${DATA.innerCrest === 'header' && DATA.crest ? `<span class="idx-crest">${crestHTML(DATA.crest)}</span>` : ''}
          <h2 class="page-title">Contents</h2><div class="rule"></div>
          <ol class="idx-list${DATA.branches.length > 8 ? ' dense' : ''}">${DATA.branches.map((b, bi) => `
            <li><a href="#" class="idx-link" data-goto="${branchStart[bi]}">
              <span class="dot" style="background:${esc(b.color)}"></span>
              <span class="idx-name">${esc(b.name)}</span>
              <span class="idx-leader"></span>
              <span class="idx-page">${branchStart[bi]}</span></a></li>`).join('')}
          </ol></div>${ic.foot}<div class="folio">${idx}</div>`;
        break;

      case 'branch':
        html = `<div class="page-body branch-body">
          <div class="crest crest-md">${crestHTML(pg.branch.crest)}</div>
          <h2 class="branch-name">${esc(pg.branch.name)}</h2>
          <div class="accent-rule"></div>
          <p class="blurb">${esc(pg.branch.blurb || '')}</p></div>`;
        break;

      case 'note':
        html = `${ic.mark}<div class="page-body">
          <header class="page-head">${esc(pg.branch.name)}${ic.head}</header>
          <h3 class="note-title">${esc(pg.note.title || '')}</h3>
          <div class="accent-rule left"></div>
          <div class="note-text">${esc(pg.note.text || '')}</div></div>
          ${ic.foot}<div class="folio">${idx}</div>`;
        break;

      case 'photos': {
        const figs = pg.photos.map(p => {
          const n = photoList.push(p) - 1;
          return `<figure class="ph${p.fit === 'contain' ? ' contain' : ''}" data-n="${n}">
            <div class="frame"><img src="${esc(p.src)}" alt="${esc(p.caption || '')}" draggable="false" decoding="async"></div>
            <figcaption><span class="cap">${esc(p.caption || '')}</span>${p.date ? `<span class="date">${esc(p.date)}</span>` : ''}</figcaption>
          </figure>`;
        }).join('');
        html = `${ic.mark}<div class="page-body">
          <header class="page-head">${esc(pg.branch.name)}${ic.head}</header>
          <div class="photos n${pg.photos.length}">${figs}</div></div>
          ${ic.foot}<div class="folio">${idx}</div>`;
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
          t.textContent = br.tabLabel || br.name;
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

  /* ---------------- page curl ----------------
   While a leaf is turning it is swapped for a chain of thin vertical strips.
   Each strip hinges on its neighbour, so rotating them by a few degrees each
   bends the page. Only the leaves that are moving get this treatment. */
  // The computer's "reduce motion" setting only picks the starting state. Pressing
  // the Curl button is an explicit choice, so it always works and is remembered.
  let curlOn = !OS_REDUCED;
  try {
    const v = localStorage.getItem('album-curl');
    if (v != null) curlOn = v === '1';
  } catch (_) { /* ignore */ }
  if (curlOn) REDUCED = false;

  function prepClone(face, left) {
    face.classList.remove('front', 'back');
    const st = face.style;
    st.left = left + 'px'; st.top = '0'; st.right = 'auto'; st.bottom = 'auto';
    st.width = metrics.pw + 'px'; st.height = metrics.ph + 'px'; st.transform = 'none';
  }

  function ensureCurl(i) {
    if (!curlOn || curl[i] || curl.filter(Boolean).length >= CURL_MAX) return;
    const leaf = leaves[i], pw = metrics.pw, w = pw / CURL_STRIPS;
    const frontSrc = leaf.querySelector('.face.front'), backSrc = leaf.querySelector('.face.back');
    const root = el('div', 'curl');
    const strips = [];
    let parent = root;
    for (let k = 0; k < CURL_STRIPS; k++) {
      const st = el('div', 'strip');
      st.style.width = w + 'px';
      st.style.left = (k ? w : 0) + 'px';
      const fc = el('div', 'strip-clip f'), bc = el('div', 'strip-clip b');
      fc.style.width = bc.style.width = (w + 1) + 'px';          // 1px overlap hides seams
      const ff = frontSrc.cloneNode(true), bf = backSrc.cloneNode(true);
      prepClone(ff, -k * w);
      prepClone(bf, -(pw - (k + 1) * w));                        // the back face is mirrored
      fc.appendChild(ff); bc.appendChild(bf);
      st.append(fc, bc);
      parent.appendChild(st); parent = st;
      strips.push({ el: st, fs: ff.querySelector('.shade'), bs: bf.querySelector('.shade') });
    }
    leaf.appendChild(root);
    curl[i] = { root, strips, last: parent, active: false, f: 0, v: 0, pa: angle[i], pt: performance.now() };
  }

  function activateCurl(i) {
    const c = curl[i];
    c.active = true; c.pa = angle[i]; c.pt = performance.now(); c.v = 0;
    leaves[i].classList.add('curling');
    if (leafTabs[i]) c.last.append(leafTabs[i][0], leafTabs[i][1]);   // tabs ride on the bent edge
  }

  function destroyCurl(i) {
    const c = curl[i];
    if (!c) return;
    if (c.active && leafTabs[i]) leaves[i].append(leafTabs[i][0], leafTabs[i][1]);
    leaves[i].classList.remove('curling');
    c.root.remove();
    curl[i] = null;
  }

  function destroyAllCurls() { curl.forEach((c, i) => { if (c) destroyCurl(i); }); }

  function updateCurl(i, a, fsh, bsh) {
    const c = curl[i];
    const now = performance.now(), dt = now - c.pt;
    if (dt >= 8) {                                   // angular speed, degrees per ms (smoothed)
      c.v += ((a - c.pa) / dt - c.v) * 0.5;
      c.pa = a; c.pt = now;
    }
    const s = Math.sin(a * Math.PI / 180);
    // free edge trails behind a spinning page; when you hold the page the edge leads
    let want = clamp(c.v / 0.45, -1, 1) * 0.9;
    if (drag && drag.i === i && drag.moved) want = (drag.fwd ? -0.5 : 0.5) * s + want * 0.4;
    else want += Math.sign(c.v) * 0.15 * s;
    c.f += (want - c.f) * 0.35;

    let cum = 0, edge = 0;
    const sw = metrics.pw / CURL_STRIPS;
    for (let k = 0; k < CURL_STRIPS; k++) {
      const b = CURL_K * (0.25 + 0.75 * k / (CURL_STRIPS - 1)) * c.f;   // stiff near the spine
      cum += b;
      edge += sw * Math.cos((cum - a) * Math.PI / 180);               // where the bent page edge really is
      const sk = c.strips[k];
      sk.el.style.transform = `rotateY(${b.toFixed(3)}deg)`;
      const extra = (1 - Math.cos(cum * Math.PI / 180)) * 3;           // bent areas catch the light differently
      sk.fs.style.opacity = clamp(fsh + extra, 0, 0.75).toFixed(3);
      sk.bs.style.opacity = clamp(bsh + extra, 0, 0.75).toFixed(3);
    }
    c.edge = edge;
  }

  const btnCurl = $('btnCurl');
  function paintCurlBtn() {
    if (!btnCurl) return;
    btnCurl.textContent = curlOn ? '↻ Curl on' : '↻ Curl off';
    btnCurl.setAttribute('aria-pressed', String(curlOn));
    btnCurl.classList.toggle('off', !curlOn);
    btnCurl.title = OS_REDUCED && !curlOn
      ? 'Your computer asks for reduced motion. Click to turn on page curl and animated page turns.'
      : 'Bend pages as they turn';
  }
  if (btnCurl) {
    btnCurl.addEventListener('click', () => {
      curlOn = !curlOn;
      if (curlOn) REDUCED = false;                    // turning curl on also turns page animation on
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

    for (let i = 0; i < N; i++) {
      const a = angle[i];
      const s = Math.sin(a * Math.PI / 180);
      leaves[i].style.transform = `rotateY(${-a}deg)`;
      leaves[i].style.zIndex = a < 90 ? N - i : i;

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

    // bend the leaves that are in motion
    for (let i = 0; i < N; i++) {
      const c = curl[i];
      if (!c) continue;
      const a = angle[i];
      if (a > 0.05 && a < 179.95) {
        if (!c.active) activateCurl(i);
        updateCurl(i, a, fs[i], bs[i]);
      } else if (c.active) destroyCurl(i);
    }

    // soft shadow the turning page throws on the page beneath it
    for (let i = 0; i < N; i++) {
      const a = angle[i], cs = casts[i];
      if (!(a > 0.05 && a < 179.95)) { cs.style.display = 'none'; continue; }
      const rad = a * Math.PI / 180, sn = Math.sin(rad), c = curl[i];
      const edge = Math.abs(c && c.active && c.edge != null ? c.edge : metrics.pw * Math.cos(rad));
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

  function flipLeaf(i, to, delay = 0, ms = FLIP_MS, sound = true) {
    ensureCurl(i);                       // build the bending rig before the clock starts
    target[i] = to;
    const from = angle[i];
    const dur = REDUCED ? 1 : Math.max(280, ms * Math.abs(to - from) / 180);
    anim[i] = { from, to, start: performance.now() + (REDUCED ? 0 : delay), dur };
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
    if (k > cur) { for (let i = cur; i < k; i++, d += gap, c++) flipLeaf(i, 180, d, ms, c < 5); }
    else         { for (let i = cur - 1; i >= k; i--, d += gap, c++) flipLeaf(i, 0, d, ms, c < 5); }
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
    if (DATA) render();
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
