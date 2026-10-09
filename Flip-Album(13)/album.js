/* ==========================================================================
   Flip-book engine. You normally don't need to edit this file.
   Content comes from album-data.js, or from the in-page editor
   (the "Edit album" button), which saves in your browser.
   ========================================================================== */
(() => {
  'use strict';

  // WHAT THIS FILE IS: the 'engine'. It reads your album (album-data.js, or
  // your saved edits from the editor), turns it into pages, draws the book, and
  // handles turning pages, the curl, the sound and the photo zoom.
  //
  // MAP OF THIS FILE (top to bottom):
  //   1. settings        numbers you can tweak (page ratio, photos per page, speed)
  //   2. helpers         tiny utilities used everywhere
  //   3. pagination      decides which photos land on which page
  //   4. page faces      builds the HTML for each page (cover, contents, photos...)
  //   5. book building   creates the leaves (a leaf = one sheet, front + back)
  //   6. tabs and text   shrinks tab names and story text so they fit
  //   7. page curl       the folded-corner effect while a page turns
  //   8. render + flip   positions every page for the current angle, animates turns
  //   9. sound           a synthesised page-turn swoosh (no sound files needed)
  //  10. navigation     buttons, arrow keys, jumping to a tab
  //  11. dragging       turning a page with the mouse or a finger
  //  12. photo viewer   the zoom / pan / next-previous pop-up
  //  13. sizing, rebuild and start
  //
  // Words used below: a LEAF is one sheet of paper. Its FRONT is the right-hand
  // page and its BACK is the left-hand page once it has been turned. An ANGLE of
  // 0 means flat on the right, 180 means turned over onto the left.
  /* ---------------- settings ---------------- */
  // Shape of a page: height divided by width. Raise it for taller pages.
  const RATIO = 1.32;                       // page height / page width
  // Fewest and most photos placed on one page.
  const MIN_PER_PAGE = 3, MAX_PER_PAGE = 5; // photos per page
  // Each page has 'room' for 6 units. A small photo uses 1, medium 1.5,
  // large 2 (see COST below). When the next photo would not fit, a new page starts.
  const PAGE_CAPACITY = 6;                  // "room" on a page...
  const COST = { small: 1, medium: 1.5, large: 2 }; // ...and what each size uses
  const RANK = { small: 1, medium: 2, large: 3 };
  // Animation speeds, in milliseconds. FLIP_MS = one full page turn.
  // STAGGER_MS = the gap between pages when jumping several pages at once.
  const FLIP_MS = 1000;                     // one full page turn
  const STAGGER_MS = 110;                   // delay between pages on multi-page jumps
  // Space reserved for the control bar at the bottom of the screen (pixels).
  const CONTROLS_H = 56;
  // Largest zoom in the photo viewer (10 = ten times actual size).
  const LB_MAX = 10;                        // maximum zoom in the photo viewer
  // Page curl settings: how far the folded corner lifts, and how many pages
  // may be curling at the same time (each one costs some memory).
  const CURL_LIFT = 0.3;                    // how high the bottom corner rises mid-turn (x page width)
  const CURL_MAX = 3;                       // pages that may curl at the same time
  // Some computers have a 'reduce motion' setting. We note it here, but the
  // Curl button always has the last word (see the page curl section).
  const OS_REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let REDUCED = OS_REDUCED;                 // instant page turns; switched off if the person turns Curl on

  /* ---------------- helpers ---------------- */
  // $('x') finds the page element with id x.
  const $ = id => document.getElementById(id);
  // el('div', 'name') creates a new element with a CSS class.
  const el = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };
  // esc() makes text safe to put into HTML (so a caption containing < or &
  // can never break the page).
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // clamp() keeps a number between a minimum and a maximum.
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  // ease() makes a page turn start slowly, speed up, then settle (0..1 in, 0..1 out).
  const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  // The dashed 'YOUR CREST' placeholder shown until you add a crest image.
  const SHIELD =
    '<svg class="crest-ph" viewBox="0 0 100 120" aria-hidden="true">' +
    '<path d="M50 4 L92 18 V58 C92 88 70 106 50 116 C30 106 8 88 8 58 V18 Z" fill="none" ' +
    'stroke="currentColor" stroke-width="3" stroke-dasharray="6 4"/>' +
    '<text x="50" y="64" text-anchor="middle" font-size="11" fill="currentColor" ' +
    'font-family="Georgia,serif" letter-spacing="1">YOUR CREST</text></svg>';
  // crestHTML() returns the crest picture, or the placeholder if there is none.
  const crestHTML = src => src
    ? `<img src="${esc(src)}" alt="Family crest" draggable="false">`
    : SHIELD;

  // Grab the fixed parts of the page (defined in flip.html) once, up front.
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

  // The engine's memory. DATA is the album. 'pages' is the flat list of every
  // page in order. 'angle' holds how far each leaf is turned right now; 'anim'
  // holds the running animation for each leaf; 'cur' is how many leaves are turned.
  /* ---------------- state ---------------- */
  let DATA = null;
  let pages = [], branchStart = [], itemPage = {}, photoList = [], N = 0;
  let photoIndexStart = null;           // page where the photo index begins (null = no index)
  let leaves = [], frontShade = [], backShade = [], tabs = [], bookShadow = null;
  let angle = [], anim = [], target = [];
  let casts = [];
  let curl = [], leafTabs = [];         // per-leaf curl rigs and the tabs that ride on them
  let cur = 0;                          // number of leaves turned
  let raf = 0;
  // leather spine with raised bands, along the hinge edge of both covers
  // The leather spine strip drawn on the hinge edge of the front and back cover.
  const SPINE = '<div class="spine" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>';
  // Current page size in pixels. Updated by layout() whenever the window changes.
  const metrics = { pw: 400, ph: 528 };

  /* ---------------- photo pagination (3-5 per page, by size) ---------------- */
  // Splits a list of photos into pages. Photos are added to a page until it is
  // full (by count or by 'room'). The last page is rebalanced so you never get
  // a nearly empty final page.
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
  // Handles one branch. A story page (type 'note') or a photo marked
  // newPage: true ends the current run of photos, so those runs are paginated
  // separately.
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
  // Builds the complete list of pages in reading order: cover, inside front,
  // contents, then for each branch a title page followed by its photo/story
  // pages, then inside back and back cover. Blank pages are added so that each
  // branch title page opens on the left. 'itemPage' remembers which page each
  // photo is on (the editor's View button uses it).
  function buildPages() {
    pages = []; branchStart = []; itemPage = {}; photoIndexStart = null;
    const photoPage = new Map();            // each photo -> the page it is on
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
          pg.photos.forEach(p => { itemPage[p.id] = pages.length; photoPage.set(p, pages.length); });
          pages.push({ type: 'photos', branch: b, bi, color: b.color, photos: pg.photos });
        }
      });
    });
    addPhotoIndex(photoPage);
    while (pages.length % 2 !== 0) pages.push({ type: 'blank' });
    pages.push({ type: 'inside-back' });
    pages.push({ type: 'back-cover' });
    N = pages.length / 2;   // number of leaves (each leaf = 2 pages)
  }

  // PHOTO INDEX (at the back of the book). Lists every photo that has a caption, with
  // the page it is on. DATA.photoIndex chooses the style: 'alpha' (A-Z by caption, the
  // default), 'branch' (grouped under each family branch) or 'none' (no index).
  const INDEX_ROWS = 15;                    // room for about 15 lines on one index page
  function addPhotoIndex(photoPage) {
    const mode = DATA.photoIndex === undefined || DATA.photoIndex === true ? 'alpha' : DATA.photoIndex;
    if (mode !== 'alpha' && mode !== 'branch') return;
    const entries = [];
    (DATA.branches || []).forEach((b, bi) => (b.photos || []).forEach(p => {
      if (p.type === 'note' || !p.caption || !photoPage.has(p)) return;
      entries.push({ caption: p.caption, date: p.date || '', branch: b.name, bi, color: b.color, page: photoPage.get(p) });
    }));
    if (!entries.length) return;
    const rows = [];
    if (mode === 'alpha') {
      const key = e => e.caption.replace(/^[^\p{L}\p{N}]+/u, '').toLowerCase();
      entries.sort((a, b) => key(a).localeCompare(key(b), undefined, { numeric: true }));
      let letter = '';
      entries.forEach(e => {
        const l = (key(e).charAt(0) || '#').toUpperCase();
        if (l !== letter) { letter = l; rows.push({ head: l }); }
        rows.push(e);
      });
    } else {
      (DATA.branches || []).forEach((b, bi) => {
        const mine = entries.filter(e => e.bi === bi).sort((x, y) => x.page - y.page);
        if (!mine.length) return;
        rows.push({ head: b.name }, ...mine);
      });
    }
    // split the rows into pages (a heading counts as 1.6 lines, and never ends a page)
    const groups = []; let grp = [], used = 0;
    rows.forEach(r => {
      const c = r.head ? 1.6 : 1;
      if (used + c > INDEX_ROWS && grp.length) { groups.push(grp); grp = []; used = 0; }
      grp.push(r); used += c;
    });
    if (grp.length) groups.push(grp);
    for (let gi = 0; gi < groups.length; gi++) {
      const g = groups[gi];
      if (g.length && g[g.length - 1].head && groups[gi + 1]) groups[gi + 1].unshift(g.pop());
    }
    if (pages.length % 2 === 0) pages.push({ type: 'blank' });      // opens on a left-hand page
    photoIndexStart = pages.length;
    groups.forEach((g, gi) => pages.push({ type: 'photo-index', rows: g, first: gi === 0, mode }));
  }

  /* ---------------- crest on inner pages ----------------
     DATA.innerCrest: 'none' | 'header' | 'footer' | 'watermark'
     Uses the branch's own crest if it has one, otherwise the family crest. */
  // Works out the small crest shown on inner pages (heading, footer corner or
  // faint watermark), using the branch's own crest or else the family crest.
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
  /* cover lettering: DATA.coverFont is a key below, or any CSS font-family you type in album-data.js */
  // The cover lettering choices shown in the editor. 'css' is the font stack
  // tried in order; 'soft' turns off wide-spaced capitals for script fonts.
  const COVER_FONTS = {
    classic:    { label: 'Classic (default)',        css: '' },
    georgia:    { label: 'Georgia',                  css: 'Georgia, "Times New Roman", serif' },
    palatino:   { label: 'Palatino (book style)',    css: '"Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif' },
    garamond:   { label: 'Garamond (elegant)',       css: 'Garamond, "Hoefler Text", "Baskerville Old Face", Baskerville, Georgia, serif' },
    times:      { label: 'Times (traditional)',      css: '"Times New Roman", Times, serif' },
    copperplate:{ label: 'Copperplate (engraved)',   css: 'Copperplate, "Copperplate Gothic Light", "Trajan Pro", Georgia, serif' },
    script:     { label: 'Script (handwritten)',     css: '"Segoe Script", "Brush Script MT", "Lucida Handwriting", "Apple Chancery", cursive', soft: true },
    typewriter: { label: 'Typewriter',               css: '"Courier New", Courier, monospace' },
    modern:     { label: 'Modern sans-serif',        css: '"Trebuchet MS", "Segoe UI", Helvetica, Arial, sans-serif' }
  };
  window.ALBUM_COVER_FONTS = COVER_FONTS;       // the editor builds its font list from this
  // Builds the inline style that applies the chosen cover font (if any).
  function coverStyle() {
    const f = COVER_FONTS[DATA.coverFont];
    const css = f ? f.css : (DATA.coverFont || '');
    if (!css) return '';
    const soft = f && f.soft;                       // script lettering reads badly in wide-spaced capitals
    return ` style="font-family:${esc(css)}${soft ? ';--cover-caps:none;--cover-track:.02em;--cover-size:2.6em' : ''}"`;
  }

  // Builds the HTML for ONE page, depending on its type: cover, back-cover,
  // inside-front (dedication), inside-back, index (contents), branch (title
  // page), note (story page), photos, or blank. 'idx' is the page number.
  function renderFace(pg, idx) {
    const side = idx % 2 === 0 ? 'right' : 'left';
    const ic = innerCrest(pg, DATA.innerCrest);
    const face = el('div', `face ${side} t-${pg.type}`);
    face.style.setProperty('--accent', pg.color || '#8a6d3b');
    let html = '';

    switch (pg.type) {
      case 'cover':
        html = `${SPINE}<div class="cover-frame"${coverStyle()}>
          ${DATA.eyebrow ? `<p class="eyebrow">${esc(DATA.eyebrow)}</p>` : ''}
          <div class="crest crest-lg">${crestHTML(DATA.crest)}</div>
          <h1>${esc(DATA.title)}</h1>
          <p class="cover-sub">${esc(DATA.subtitle)}</p></div>`;
        break;

      case 'back-cover':
        html = `${SPINE}<div class="cover-frame"${coverStyle()}>
          <div class="crest crest-sm">${crestHTML(DATA.backCrest || DATA.crest)}</div>
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
          <ol class="idx-list${DATA.branches.length + (photoIndexStart == null ? 0 : 1) > 8 ? ' dense' : ''}">${DATA.branches.map((b, bi) => `
            <li><a href="#" class="idx-link" data-goto="${branchStart[bi]}">
              <span class="dot" style="background:${esc(b.color)}"></span>
              <span class="idx-name">${esc(b.name)}</span>
              <span class="idx-leader"></span>
              <span class="idx-page">${branchStart[bi]}</span></a></li>`).join('')}${photoIndexStart == null ? '' : `
            <li><a href="#" class="idx-link" data-goto="${photoIndexStart}">
              <span class="dot" style="background:#8a7a62"></span>
              <span class="idx-name">Index of Photos</span>
              <span class="idx-leader"></span>
              <span class="idx-page">${photoIndexStart}</span></a></li>`}
          </ol></div>${ic.foot}<div class="folio">${idx}</div>`;
        break;

      case 'photo-index':
        html = `${ic.mark}<div class="page-body">
          <h2 class="page-title">Index of Photos${pg.first ? '' : ' <small>(continued)</small>'}</h2><div class="rule"></div>
          <ul class="pidx-list">${pg.rows.map(r => r.head
            ? `<li class="pidx-head">${esc(r.head)}</li>`
            : `<li><a href="#" class="idx-link pidx-link" data-goto="${r.page}">
                <span class="dot" style="background:${esc(r.color)}"></span>
                <span class="idx-name"><span class="cap">${esc(r.caption)}</span>${r.date ? ` <em>${esc(r.date)}</em>` : ''}${pg.mode === 'alpha' ? ` <small>${esc(r.branch)}</small>` : ''}</span>
                <span class="idx-leader"></span>
                <span class="idx-page">${r.page}</span></a></li>`).join('')}
          </ul></div>${ic.foot}<div class="folio">${idx}</div>`;
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
  // Creates the physical book: one .leaf element per sheet with a front face
  // (right page) and a back face (left page), a soft shadow layer for each,
  // and the branch tabs on the right leaves. Sets every leaf to its starting angle.
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
  // Shrink each tab's name until it fits the tab (tabs get shorter as families are added).
  // When a name is too long to fit on one line at a readable size, it is allowed to break
  // across lines with a hyphen (never leaving fewer than 3 letters on a line).
  const TAB_FONT = 0.72, TAB_MIN_FONT = 0.44;    // em, as set on .tab in style.css
  const TAB_ONE_LINE_MIN = 0.5;                  // keep a name on one line if it fits at this size or more
  // Mark where a name may break between syllables (roughly: ba-na-na, hen-der-son, kowal-ski).
  const ONSETS = /^(bl|br|ch|cl|cr|dr|fl|fr|gl|gr|ph|pl|pr|sc|sh|sk|sl|sm|sn|sp|st|sw|th|tr|tw|wh)$/;
  const isV = ch => /[aeiouyàáâäãåèéêëìíîïòóôöõøùúûü]/i.test(ch || '');
  const isL = ch => /\p{L}/u.test(ch || '');
  // Inserts invisible 'may break here' marks into long words so a tab name can
  // wrap across two lines (ba-na-na) instead of being shrunk too small.
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

  // Shrinks one tab's text until it fits inside the tab; reports the final size
  // and whether it still had to be cut short with '...'.
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

  // Fits every branch tab: first at normal size, then with hyphenated line
  // breaks, and as a last resort cuts the name short. Runs after every resize.
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

  // Story pages: if the text is too long for the page, shrink it until it fits.
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
   While a paper page turns, it lies flat and its bottom outer corner is folded
   over along a diagonal crease that sweeps across the spread. The part of the
   page past the crease is hidden (the page underneath shows through) and the
   back of the page is drawn, reflected, on the near side of the crease.
   The hard covers don't fold; they swing over as before. */
  // The computer's "reduce motion" setting only picks the starting state. Pressing
  // the Curl button is an explicit choice, so it always works and is remembered.
  let curlOn = !OS_REDUCED;
  try {
    const v = localStorage.getItem('album-curl');
    if (v != null) curlOn = v === '1';
  } catch (_) { /* ignore */ }
  if (curlOn) REDUCED = false;

  // Prepares a copy of a page face for use inside the curl effect.
  function prepClone(node) {
    node.classList.remove('front', 'back');
    node.style.transform = 'none';
    const sh = node.querySelector && node.querySelector('.shade');
    if (sh) sh.style.opacity = '0';
    return node;
  }

  // Throw away rigs that were built in advance (on mouse-down) but never used,
  // e.g. when the click opened the photo viewer instead of turning the page.
  // Throws away curl rigs that were built ahead of time (on mouse-down) but
  // never used, for example when you clicked a photo instead of turning the page.
  function purgeIdleCurls(keep) {
    curl.forEach((c, j) => {
      if (c && j !== keep && !c.active && !anim[j] && !(drag && drag.i === j)) destroyCurl(j);
    });
  }

  // Builds the curl rig for leaf i: a copy of its front and back faces that can
  // be clipped along a diagonal crease. Only built when needed, and never more
  // than CURL_MAX at once.
  function ensureCurl(i) {
    if (!curlOn || curl[i]) return;
    purgeIdleCurls(i);
    if (curl.filter(Boolean).length >= CURL_MAX) return;
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

  // Switches leaf i from its normal flat faces to the curl rig.
  function activateCurl(i) {
    curl[i].active = true;
    leaves[i].classList.add('curling');
  }

  // Removes the curl rig and shows the normal faces again.
  function destroyCurl(i) {
    const c = curl[i];
    if (!c) return;
    leaves[i].classList.remove('curling');
    c.root.remove();
    curl[i] = null;
  }

  // Removes every curl rig (used when Curl is turned off or the size changes).
  function destroyAllCurls() { curl.forEach((c, i) => { if (c) destroyCurl(i); }); }

  // place a shading band whose left edge lies on the crease, running in direction (vx, vy)
  // Positions a shading strip along the fold line (for the light and shadow).
  function band(node, mx, my, vx, vy, w, len) {
    node.style.width = w.toFixed(1) + 'px';
    node.style.height = (2 * len).toFixed(1) + 'px';
    node.style.transform = `translate(${mx.toFixed(1)}px, ${my.toFixed(1)}px) ` +
      `rotate(${Math.atan2(vy, vx).toFixed(4)}rad) translate(0, ${(-len).toFixed(1)}px)`;
  }

  // The heart of the curl. For the current turn angle 'a' it works out where
  // the bottom outer corner has moved to, draws the fold line (crease) halfway
  // between the corner's old and new position, hides the part of the page past
  // the crease, draws the back of the page reflected across the crease, and adds
  // the shading on the flap and the shadow on the page underneath.
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
  // Updates the Curl button's text (Curl on / Curl off).
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
  // Called whenever any angle changes. Sets each leaf's rotation and stacking
  // order, adds the shading while pages move, applies the curl to moving pages,
  // draws the soft shadow a turning page throws, slides the book so a closed
  // cover sits centred, and fades the tabs when the book is closed.
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
      } else if (c.active) destroyCurl(i);
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

  // The animation loop. Each frame it moves every turning leaf a little closer
  // to its target angle, then calls render().
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

  // Starts turning leaf i to angle 'to' (0 = right side, 180 = left side),
  // optionally after a delay, and plays the swoosh sound.
  function flipLeaf(i, to, delay = 0, ms = FLIP_MS, sound = true) {
    ensureCurl(i);                       // build the bending rig before the clock starts
    target[i] = to;
    const from = angle[i];
    const dur = REDUCED ? 1 : Math.max(280, ms * Math.abs(to - from) / 180);
    anim[i] = { from, to, start: performance.now() + (REDUCED ? 0 : delay), dur };
    if (sound && Math.abs(to - from) > 20) flipSound(delay, dur);
    if (!raf) raf = requestAnimationFrame(tick);
  }

  // Recomputes 'cur', the number of leaves that have been turned.
  function recount() { cur = target.reduce((s, t) => s + (t === 180 ? 1 : 0), 0); }

  /* ---------------- optional page-turn sound (synthesised, no files) ---------------- */
  let soundOn = true;
  try { const v = localStorage.getItem('album-sound'); if (v != null) soundOn = v === '1'; } catch (_) { /* ignore */ }
  let actx = null, noiseBuf = null;

  // A page turn in three parts: a flap of paper, an airy swoosh that rises and
  // falls with the page's speed, and a soft settle as it lands.
  // Synthesises the page-turn swoosh with the browser's audio system, so no
  // sound file is needed. It is a short rustle, a sweeping airy sound, and a
  // soft settle.
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

  // Updates the Sound button's text (Sound on / Sound off).
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
  // Updates the page counter text, the arrow buttons and which tab is lit.
  function updateUI() {
    if (cur === 0) info.textContent = 'Front cover';
    else if (cur === N) info.textContent = 'Back cover';
    else info.textContent = `Pages ${2 * cur - 1} – ${2 * cur}`;
    btnPrev.disabled = cur === 0;
    btnNext.disabled = cur === N;

    const ref = cur === 0 ? -1 : (cur === N ? 2 * cur - 1 : 2 * cur);
    let active = -1;
    branchStart.forEach((p, bi) => { if (p <= ref) active = bi; });
    if (photoIndexStart != null && ref >= photoIndexStart) active = -1;      // no tab is lit on the photo index
    tabs.forEach((pair, bi) => pair.forEach(t => t.classList.toggle('active', bi === active)));
  }

  // Turn forward / backward by one leaf.
  function next() { if (cur < N) { flipLeaf(cur, 180); cur++; updateUI(); } }
  function prev() { if (cur > 0) { cur--; flipLeaf(cur, 0); updateUI(); } }

  // Jump to spread k (clicking a tab or a contents entry): turns every page in
  // between, one after another.
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
  // Mouse and touch dragging. Pressing on a page picks up the nearest leaf;
  // moving the pointer sets its angle; letting go finishes the turn forwards or
  // backwards depending on how far and how fast you dragged.
  let drag = null;

  // Pointer pressed: decide which leaf you grabbed and remember where you started.
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

  // Pointer released. A plain click on a photo opens the viewer; a click on empty
  // page turns it. After a drag, the page finishes turning to whichever side it is
  // nearer (past halfway = turned), unless you flicked it quickly in one direction.
  function endDrag(e) {
    if (!drag) return;
    const d = drag; drag = null;
    stage.classList.remove('dragging');
    try { stage.releasePointerCapture(e.pointerId); } catch (_) { /* ignore */ }

    if (!d.moved) {                              // a plain click
      const fig = d.target.closest && d.target.closest('.ph');
      if (fig) { purgeIdleCurls(-1); openLightbox(+fig.dataset.n); }
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

  // Photo viewer helpers. lbApply draws the current zoom and position.
  function lbApply() {
    lbImg.style.transform = `translate(${lb.x}px, ${lb.y}px) scale(${lb.scale})`;
    lbZoomLbl.textContent = Math.round(lb.scale * 100) + '%';
    lightbox.classList.toggle('zoomed', lb.scale > 1.001);
  }

  // Centres the photo in the window.
  function lbCenter() {
    return { x: lbImg.offsetLeft + lbImg.offsetWidth / 2, y: lbImg.offsetTop + lbImg.offsetHeight / 2 };
  }

  // Stops you dragging the photo completely out of view.
  function lbClampPan() {
    const w = lbImg.offsetWidth * lb.scale, h = lbImg.offsetHeight * lb.scale;
    const mx = w > window.innerWidth ? (w - window.innerWidth) / 2 + 60 : 0;
    const my = h > window.innerHeight ? (h - window.innerHeight) / 2 + 60 : 0;
    lb.x = clamp(lb.x, -mx, mx);
    lb.y = clamp(lb.y, -my, my);
  }

  // zoom to scale s, keeping the point under (px, py) fixed
  // Zooms to scale s, keeping the point under the cursor (px, py) in place.
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

  // Opens the viewer on photo number n (its position in the whole album).
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
  // Closes the viewer.
  function closeLightbox() { lightbox.hidden = true; lbImg.removeAttribute('src'); }
  const lbStep = d => { if (photoList[lb.n + d]) openLightbox(lb.n + d); };

  // Keyboard in the viewer: Esc closes, arrows move between photos, +/- zoom,
  // 0 fits to screen, 1 shows actual pixels.
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

  // Ends a drag / pinch in the viewer.
  function lbPointerEnd(e) {
    if (!lbPtr.has(e.pointerId)) return;
    lbPtr.delete(e.pointerId);
    lbPinch = 0;
    if (!lbMoved && lbPtr.size === 0 && e.type === 'pointerup' && e.target === lightbox) closeLightbox();
  }
  lightbox.addEventListener('pointerup', lbPointerEnd);
  lightbox.addEventListener('pointercancel', lbPointerEnd);

  /* ---------------- sizing ---------------- */
  // Works out the page size from the window size (so the book always fits),
  // stores it in 'metrics', and scales the text with it (1 em = pw/24).
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
  // Rebuilds everything from album data. The editor calls this after every
  // change. opts says which page to show afterwards (a photo, a branch, or a
  // page number).
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

  // The few functions the editor is allowed to call.
  window.AlbumEngine = {
    version: '2026-10-08a',
    rebuild,
    showItem: id => { if (itemPage[id] != null) goToPage(itemPage[id]); },
    goToPage,
    pageOf: id => (itemPage[id] != null ? itemPage[id] : null)
  };

  /* ---------------- start ---------------- */
  // START: if editor.js is loaded it provides ALBUM_LOADER (your saved edits or
  // the file); otherwise the engine simply uses window.ALBUM from album-data.js.
  // This is why the editor can be left out completely for a public page.
  const loader = window.ALBUM_LOADER ? window.ALBUM_LOADER() : window.ALBUM;
  Promise.resolve(loader)
    .catch(err => { console.error('Could not load saved album, using album-data.js', err); return window.ALBUM; })
    .then(data => {
      if (!data) { console.error('album-data.js did not load.'); return; }
      rebuild(data);
    });
})();
