/* ==========================================================================
   In-page album editor ("Edit album" button).
   - Add photos (pick or drag & drop), caption them, reorder, remove.
   - Add branches (new tab), story pages, and "start a new page here" breaks.
   - Edits and photos are saved in THIS browser (IndexedDB) and override
     album-data.js until you press "Reset". Use Backup to move them elsewhere.
   ========================================================================== */
(() => {
  'use strict';

  // WHAT THIS FILE IS: the in-page editor (the 'Edit album' button). It builds a
  // side drawer where you can add photos, caption them, reorder them, add branches
  // and story pages, change the cover text, and make or restore a backup.
  //
  // HOW IT WORKS: the editor keeps its own copy of your album ('state'). Every
  // change redraws the book and is saved inside THIS browser (IndexedDB), not in
  // your files. Saved edits take priority over album-data.js. Uploaded photos are
  // shrunk and stored in the browser too.
  //
  // FOR A PUBLIC WEB PAGE you can leave this file (and the Edit album button) out
  // of flip.html completely; the book then just shows album-data.js.
  //
  // MAP OF THIS FILE: small helpers, state, storage, loader, images, the drawer,
  // form helpers, then one view per tab (Photos & pages, Cover & text, Backup),
  // then backup/restore and the 'album-data.js has changed' notice.
  window.AlbumEditorVersion = '2026-10-09c';
  // Sample (placeholder) photos start with this text; it lets the editor recognise them.
  const SAMPLE_PREFIX = 'data:image/svg+xml';
  // Colours offered for the tab of each new branch, in turn.
  const PALETTE = ['#8c2f39', '#2f6b4f', '#2d5a8c', '#a8741f', '#6b3f8c', '#2b7a7a', '#8c5a2f', '#5a6b2f'];
  // Largest side of an uploaded photo, in pixels. Bigger photos are scaled down to this.
  const MAX_SIDE = 1800;                    // uploaded photos are scaled down to this
  // uid() makes a short random id so every photo and branch can be told apart.
  const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
  // The album engine (album.js) that draws the book.
  const eng = () => window.AlbumEngine;
  // clone() makes an independent copy of an object, so edits never alter the original.
  const clone = o => (window.structuredClone ? structuredClone(o) : JSON.parse(JSON.stringify(o)));

  /* ---------------- tiny DOM helper ---------------- */
  // h('div', {class:'x'}, child...) builds a page element; the editor's whole
  // interface is built with this small helper.
  function h(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === false) continue;
        if (k === 'class') e.className = v;
        else if (k === 'text') e.textContent = v;
        else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
        else if (k in e) e[k] = v;
        else e.setAttribute(k, v);
      }
    }
    for (const c of kids.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(c));
    return e;
  }

  /* ---------------- state ---------------- */
  // ORIGINAL is exactly what album-data.js says. 'state' (below) is the editable copy.
  const ORIGINAL = clone(window.ALBUM || { branches: [] });
  // A fingerprint of what album-data.js says. Saved edits remember it, so the album can
  // tell when the file was edited afterwards and ask which version should win.
  const fingerprint = str => { let x = 5381; for (let i = 0; i < str.length; i++) x = ((x << 5) + x + str.charCodeAt(i)) | 0; return String(x >>> 0); };
  // A short number computed from album-data.js. It is saved with your edits, so if
  // you later change album-data.js the editor notices and asks which to keep.
  const SRC_HASH = fingerprint(JSON.stringify(ORIGINAL));
  // state = the album being edited. db = the browser storage connection.
  let state = null;
  let db = null;
  let hasSaved = false;
  let fileChanged = false;
  // Which branch is selected in the editor, which tab is showing, and other screen flags.
  let sel = 0;                  // selected branch
  let view = 'photos';
  let showNewBranch = false;
  let settingsOpen = false;
  let busy = 0;
  // Photos you uploaded are held here (blobs) and shown through temporary links (urls).
  const blobs = new Map();      // blob id -> Blob
  const urls = new Map();       // blob id -> object URL

  /* ---------------- storage (IndexedDB) ---------------- */
  // Browser storage. Opens (or creates) the database called family-album-v1.
  function openDB() {
    return new Promise((resolve, reject) => {
      try {
        const r = indexedDB.open('family-album-v1', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('kv');
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
        r.onblocked = () => reject(new Error('blocked'));
      } catch (e) { reject(e); }
    });
  }
  // Tiny helpers to read, write, delete and list items in the browser database.
  // The 'state' item holds the album; items named 'blob:...' hold uploaded photos.
  const store = mode => db.transaction('kv', mode).objectStore('kv');
  const req = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const kvGet = k => req(store('readonly').get(k));
  const kvPut = (k, v) => req(store('readwrite').put(v, k));
  const kvDel = k => req(store('readwrite').delete(k));
  const kvKeys = () => req(store('readonly').getAllKeys());

  // Returns a temporary link to show an uploaded photo.
  function urlFor(id, blob) {
    if (!urls.has(id)) urls.set(id, URL.createObjectURL(blob));
    return urls.get(id);
  }

  // Stores an uploaded photo in the browser database.
  async function putBlob(id, blob) {
    blobs.set(id, blob);
    if (db) {
      try { await kvPut('blob:' + id, blob); }
      catch (e) { console.error(e); setStatus('Could not store a photo in this browser: ' + e.message, true); }
    }
  }

  // Gives every branch and photo an id and a type, so the editor can track them.
  function prepare(s) {
    s.branches = s.branches || [];
    s.branches.forEach(b => {
      b.id = b.id || uid();
      b.photos = b.photos || [];
      b.photos.forEach(p => {
        p.id = p.id || uid(); p.type = p.type || 'photo';
        // story pages written in album-data.js use 'image' / 'imageCaption'; the editor uses src / caption
        if (p.type === 'note') {
          if (p.image && !p.src) p.src = p.image;
          if (p.imageCaption && !p.caption) p.caption = p.imageCaption;
        }
      });
    });
    return s;
  }

  // After loading saved edits, turns the stored photo ids back into pictures the page can show.
  async function hydrate(s) {
    const jobs = [];
    const bind = (obj, field, blobField) => {
      const id = obj[blobField];
      if (!id) return;
      jobs.push(kvGet('blob:' + id).then(b => {
        if (b) { blobs.set(id, b); obj[field] = urlFor(id, b); } else obj[field] = null;
      }).catch(() => { obj[field] = null; }));
    };
    bind(s, 'crest', 'crestBlob');
    bind(s, 'backCrest', 'backCrestBlob');
    s.branches.forEach(b => {
      bind(b, 'crest', 'crestBlob');
      b.photos.forEach(p => bind(p, 'src', 'blob'));
    });
    await Promise.all(jobs);
  }

  // what gets stored: everything except object URLs (they are rebuilt from blobs)
  // Makes the saveable copy of the album. Uploaded photos are saved separately,
  // so their temporary links are dropped from the main record.
  function serialize() {
    const s = clone(state);
    s._src = SRC_HASH;
    if (s.crestBlob) s.crest = null;
    if (s.backCrestBlob) s.backCrest = null;
    s.branches.forEach(b => {
      if (b.crestBlob) b.crest = null;
      b.photos.forEach(p => { if (p.blob) delete p.src; });
    });
    return s;
  }

  // Lists the stored photos the album still uses.
  function usedBlobIds() {
    const used = new Set();
    if (state.crestBlob) used.add(state.crestBlob);
    if (state.backCrestBlob) used.add(state.backCrestBlob);
    state.branches.forEach(b => {
      if (b.crestBlob) used.add(b.crestBlob);
      b.photos.forEach(p => { if (p.blob) used.add(p.blob); });
    });
    return used;
  }

  // 'Garbage collection': deletes stored photos that are no longer used anywhere.
  async function gc() {
    if (!db || busy) return;
    const used = usedBlobIds();
    for (const k of await kvKeys()) {
      if (typeof k === 'string' && k.startsWith('blob:') && !used.has(k.slice(5))) await kvDel(k);
    }
  }

  let saveTimer = 0, saving = Promise.resolve();
  // Saves a moment after the last change (so typing does not save on every letter).
  function scheduleSave() {
    setStatus('Saving…');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { saving = saving.then(doSave); }, 400);
  }
  // Does the actual save and updates the status line at the bottom of the drawer.
  async function doSave() {
    if (!db) { setStatus('Not saved – this browser blocks storage. Use Backup → Download to keep your work.', true); return; }
    try {
      await kvPut('state', serialize());
      await gc();
      hasSaved = true;
      setStatus('All changes saved in this browser');
    } catch (e) {
      console.error(e);
      setStatus('Could not save: ' + e.message, true);
    }
  }

  /* ---------------- loader used by album.js ---------------- */
  // Called by album.js at start-up. It opens the browser database and uses your saved
  // edits if there are any (otherwise album-data.js). If the file changed since the
  // edits were saved, it shows the notice that asks which version to use. Adding
  // ?original to the page address ignores saved edits.
  window.ALBUM_LOADER = async () => {
    try {
      db = await Promise.race([openDB(), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 3000))]);
    } catch (e) { db = null; }
    let saved = null;
    if (db && !/[?&]original\b/.test(location.search)) {
      try { saved = await kvGet('state'); } catch (e) { /* ignore */ }
    }
    if (saved && Array.isArray(saved.branches)) {
      state = prepare(saved);
      await hydrate(state);
      hasSaved = true;
      if (saved._src !== SRC_HASH) { fileChanged = true; showFileChangedBanner(); }   // file edited since these were saved (or saved by an older version)
    } else {
      state = prepare(clone(ORIGINAL));
    }
    if (!db) setStatus('Browser storage unavailable – edits will not be kept. Use Backup → Download.', true);
    return state;
  };

  /* ---------------- engine glue ---------------- */
  let rt = 0;
  // refresh redraws the book from the edited album. changed() also saves;
  // changedSoon() waits a moment first (used while typing).
  const refresh = opts => eng().rebuild(state, opts || {});
  const changed = opts => { refresh(opts); scheduleSave(); };
  const changedSoon = opts => { clearTimeout(rt); rt = setTimeout(() => refresh(opts), 350); scheduleSave(); };

  /* ---------------- images ---------------- */
  // Reads an image file into something that can be drawn, fixing phone-photo rotation.
  async function decode(file) {
    try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); }
    catch (e) {
      return new Promise((res, rej) => {
        const u = URL.createObjectURL(file);
        const im = new Image();
        im.onload = () => { URL.revokeObjectURL(u); res(im); };
        im.onerror = () => { URL.revokeObjectURL(u); rej(new Error('unsupported image')); };
        im.src = u;
      });
    }
  }

  // Shrinks an uploaded photo to MAX_SIDE and re-saves it as a smaller JPEG
  // (crests stay PNG so transparency is kept).
  async function processImage(file, { max = MAX_SIDE, type = 'image/jpeg', q = 0.86 } = {}) {
    const img = await decode(file);
    const W = img.naturalWidth || img.width, H = img.naturalHeight || img.height;
    const k = Math.min(1, max / Math.max(W, H));
    const w = Math.max(1, Math.round(W * k)), ht = Math.max(1, Math.round(H * k));
    const c = document.createElement('canvas');
    c.width = w; c.height = ht;
    const ctx = c.getContext('2d');
    if (type === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, ht); }
    ctx.drawImage(img, 0, 0, w, ht);
    if (img.close) img.close();
    const blob = await new Promise(r => c.toBlob(r, type, q));
    if (!blob) throw new Error('could not encode image');
    return { blob, w, ht };
  }

  // Wide pictures start as 'large', others as 'medium'. You can change it per photo.
  const guessSize = (w, ht) => (w / ht >= 1.6 ? 'large' : 'medium');
  // True if a dropped file looks like a picture.
  const isImageFile = f => /^image\//.test(f.type) || /\.(jpe?g|png|gif|webp|bmp|avif)$/i.test(f.name);

  /* ---------------- drawer shell ---------------- */
  // The drawer itself: a header, the tab buttons, a scrolling body, messages and a status line.
  const btnEdit = document.getElementById('btnEdit');
  const body = h('div', { class: 'ed-body' });
  const status = h('div', { class: 'ed-status', role: 'status' });
  const toastBox = h('div', { class: 'ed-toast', hidden: true });
  const tabBar = h('div', { class: 'ed-tabs' });
  const drawer = h('aside', { class: 'editor', hidden: true, 'aria-label': 'Album editor' },
    h('header', { class: 'ed-head' },
      h('h2', { text: 'Edit album' }),
      h('button', { type: 'button', class: 'ed-x', 'aria-label': 'Close editor', title: 'Close', text: '✕', onclick: () => closeEditor() })),
    tabBar, body, toastBox, status);
  document.body.append(drawer);

  // Shows a message in the status line at the bottom of the drawer.
  function setStatus(msg, warn) {
    status.textContent = msg;
    status.classList.toggle('warn', !!warn);
  }

  let toastTimer = 0;
  // Shows a short pop-up message, optionally with an Undo button.
  function toast(msg, action) {
    toastBox.textContent = '';
    toastBox.append(h('span', { text: msg }));
    if (action) toastBox.append(h('button', { type: 'button', text: action.label, onclick: () => { toastBox.hidden = true; action.fn(); } }));
    toastBox.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastBox.hidden = true; }, action ? 8000 : 5000);
  }

  // Opens / closes the drawer.
  function openEditor() {
    drawer.hidden = false;
    document.body.classList.add('editing');
    btnEdit.classList.add('on');
    render();
  }
  function closeEditor() {
    drawer.hidden = true;
    document.body.classList.remove('editing');
    btnEdit.classList.remove('on');
  }
  btnEdit.addEventListener('click', () => (drawer.hidden ? openEditor() : closeEditor()));

  /* ---------------- form helpers ---------------- */
  // Form helpers: a labelled box (field), a text box (textInput), a larger box (areaInput)
  // and a drop-down (selectInput). They write straight into the album object they are given.
  const field = (label, input, hint) => h('label', { class: 'ed-field' }, h('span', { text: label }), input, hint ? h('small', { text: hint }) : null);

  function textInput(obj, key, opts = {}) {
    return h('input', {
      type: 'text', value: obj[key] || '', placeholder: opts.placeholder || '', maxLength: opts.max,
      oninput: e => { obj[key] = e.target.value; if (opts.after) opts.after(e.target.value); changedSoon(opts.focus); }
    });
  }
  function areaInput(obj, key, opts = {}) {
    return h('textarea', {
      rows: opts.rows || 3, value: obj[key] || '', placeholder: opts.placeholder || '',
      oninput: e => { obj[key] = e.target.value; if (opts.after) opts.after(e.target.value); changedSoon(opts.focus); }
    });
  }
  function selectInput(options, value, onchange) {
    const s = h('select', { onchange: e => onchange(e.target.value) },
      options.map(([v, label]) => h('option', { value: v, text: label })));
    s.value = value;
    return s;
  }

  /* crest picker: image shown on a cover / branch title page */
  // The 'choose crest image' control. 'key' says which crest it edits: the family crest,
  // a branch's crest, or the back-cover crest.
  function crestControl(obj, focusOpts, key) {
    key = key || 'crest';
    const bk = key + 'Blob';
    const fi = h('input', {
      type: 'file', accept: 'image/*', hidden: true,
      onclick: e => e.stopPropagation(),
      onchange: async e => {
        const f = e.target.files[0]; e.target.value = '';
        if (!f) return;
        busy++;
        try {
          const { blob } = await processImage(f, { max: 800, type: 'image/png' });
          const id = uid();
          await putBlob(id, blob);
          obj[bk] = id; obj[key] = urlFor(id, blob);
          changed(focusOpts); render();
        } catch (err) { toast('Could not read that image.'); }
        finally { busy--; }
      }
    });
    return h('div', { class: 'ed-crest' },
      h('div', { class: 'ed-crest-prev' }, obj[key] ? h('img', { src: obj[key], alt: '' }) : h('span', { text: 'none' })),
      h('div', { class: 'ed-crest-btns' },
        h('button', { type: 'button', text: obj[key] ? 'Change crest…' : 'Choose crest image…', onclick: () => fi.click() }),
        obj[key] ? h('button', { type: 'button', class: 'ghost', text: 'Remove', onclick: () => { obj[key] = null; delete obj[bk]; changed(focusOpts); render(); } }) : null,
        fi));
  }

  /* ---------------- views ---------------- */
  // Redraws the drawer for the current tab.
  function render() {
    tabBar.textContent = '';
    [['photos', 'Photos & pages'], ['cover', 'Cover & text'], ['backup', 'Backup']].forEach(([v, label]) =>
      tabBar.append(h('button', { type: 'button', class: v === view ? 'on' : '', text: label, onclick: () => { view = v; render(); } })));
    body.textContent = '';
    if (view === 'photos') viewPhotos();
    else if (view === 'cover') viewCover();
    else viewBackup();
  }

  /* ----- photos & pages ----- */
  // TAB 1 - Photos & pages: pick a branch, add photos by choosing or dropping files,
  // and edit the list of photos and story pages for that branch.
  function viewPhotos() {
    const bs = state.branches;
    if (sel >= bs.length) sel = Math.max(0, bs.length - 1);
    const b = bs[sel];

    // branch picker
    const picker = selectInput(bs.map((x, i) => [i, x.name || '(unnamed)']), sel, v => {
      sel = +v; showNewBranch = false; eng().rebuild(state, { focusBranch: sel }); render();
    });
    body.append(h('div', { class: 'ed-row' },
      h('div', { class: 'ed-grow' }, h('span', { class: 'ed-lbl', text: 'Family branch (tab)' }), bs.length ? picker : h('em', { text: 'No branches yet' })),
      h('button', { type: 'button', class: 'solid', text: '+ New branch', onclick: () => { showNewBranch = !showNewBranch; render(); } })));

    if (showNewBranch || !bs.length) body.append(newBranchForm());
    if (!b) return;

    // branch settings
    const det = h('details', { class: 'ed-details', open: settingsOpen },
      h('summary', { text: 'Branch settings – name, colour, crest' }),
      field('Name', textInput(b, 'name', { focus: { focusBranch: sel }, after: v => { picker.options[sel].text = v || '(unnamed)'; } })),
      field('Tab text (optional, shorter)', textInput(b, 'tabLabel', { placeholder: b.name, focus: { focusBranch: sel } })),
      field('Colour', h('input', { type: 'color', value: /^#[0-9a-f]{6}$/i.test(b.color) ? b.color : '#8a6d3b', oninput: e => { b.color = e.target.value; changedSoon({ focusBranch: sel }); } })),
      field('Short note on the title page', areaInput(b, 'blurb', { rows: 2, focus: { focusBranch: sel } })),
      h('div', { class: 'ed-field' }, h('span', { text: 'Branch crest (title page and inner pages)' }), crestControl(b, { focusBranch: sel })),
      h('div', { class: 'ed-btnrow' },
        h('button', { type: 'button', text: '◀ Move earlier', disabled: sel === 0, onclick: () => moveBranch(-1) }),
        h('button', { type: 'button', text: 'Move later ▶', disabled: sel === bs.length - 1, onclick: () => moveBranch(1) }),
        h('button', { type: 'button', class: 'danger', text: 'Delete branch', onclick: deleteBranch })));
    det.addEventListener('toggle', () => { settingsOpen = det.open; });
    body.append(det);

    // add photos
    const fi = h('input', { type: 'file', accept: 'image/*', multiple: true, hidden: true, onchange: e => { addFiles(e.target.files); e.target.value = ''; } });
    const dzMsg = h('span', { text: 'Drop pictures here, or click to choose…' });
    const dz = h('div', {
      class: 'ed-drop', tabindex: 0, role: 'button', 'data-msg': dzMsg.textContent,
      onclick: () => fi.click(),
      onkeydown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fi.click(); } },
      ondragover: e => { if (hasFiles(e)) { e.preventDefault(); dz.classList.add('over'); } },
      ondragleave: () => dz.classList.remove('over'),
      ondrop: e => { if (!hasFiles(e)) return; e.preventDefault(); e.stopPropagation(); dz.classList.remove('over'); addFiles(e.dataTransfer.files); }
    }, h('strong', { text: '+ Add photos to “' + (b.name || 'this branch') + '”' }), dzMsg);
    dz.setMsg = t => { dzMsg.textContent = t; };
    currentDz = dz;
    body.append(dz, fi);

    // tools
    const tools = h('div', { class: 'ed-btnrow' },
      h('button', { type: 'button', text: '+ Story page', title: 'A page of text: a family story, names, a note', onclick: addNote }));
    if (hasSamples()) tools.append(h('button', { type: 'button', class: 'ghost', text: 'Remove sample photos', onclick: removeSamples }));
    body.append(tools);

    // items
    if (!b.photos.length) body.append(h('p', { class: 'ed-empty', text: 'No photos yet. Photos are placed 3–5 to a page automatically; large photos take more room.' }));
    const list = h('div', { class: 'ed-list' });
    b.photos.forEach((item, i) => list.append(item.type === 'note' ? noteRow(b, item, i) : photoRow(b, item, i)));
    body.append(list);
  }

  let currentDz = null;
  // True while files (not text) are being dragged over the drawer.
  const hasFiles = e => [...((e.dataTransfer && e.dataTransfer.types) || [])].includes('Files');

  // The small form for adding a new family branch (it gets its own tab and title page).
  function newBranchForm() {
    const color = PALETTE[state.branches.length % PALETTE.length];
    const name = h('input', { type: 'text', placeholder: 'e.g. The Smith Family', maxLength: 60 });
    const col = h('input', { type: 'color', value: color });
    const create = () => {
      const n = name.value.trim();
      if (!n) { name.focus(); return; }
      state.branches.push({ id: uid(), name: n, color: col.value, crest: null, blurb: '', photos: [] });
      sel = state.branches.length - 1; showNewBranch = false; settingsOpen = true;
      changed({ focusBranch: sel }); render();
      toast('Branch added – now add its photos below.');
    };
    name.addEventListener('keydown', e => { if (e.key === 'Enter') create(); });
    const f = h('div', { class: 'ed-newbranch' },
      h('strong', { text: 'New family branch' }),
      h('p', { text: 'Each branch gets its own tab on the page edge and its own title page.' }),
      h('div', { class: 'ed-row' }, h('div', { class: 'ed-grow' }, name), col, h('button', { type: 'button', class: 'solid', text: 'Add', onclick: create })));
    setTimeout(() => { if (!state.branches.length || showNewBranch) name.focus(); }, 0);
    return f;
  }

  // Moves the selected branch earlier or later in the book.
  function moveBranch(d) {
    const bs = state.branches, j = sel + d;
    if (j < 0 || j >= bs.length) return;
    [bs[sel], bs[j]] = [bs[j], bs[sel]];
    sel = j; changed({ focusBranch: sel }); render();
  }
  // Deletes the selected branch (after asking).
  function deleteBranch() {
    const b = state.branches[sel];
    if (!confirm(`Delete the branch “${b.name}” and its ${b.photos.length} photo/page item(s)?\nThis cannot be undone.`)) return;
    state.branches.splice(sel, 1);
    sel = Math.max(0, sel - 1);
    changed({ focusBranch: state.branches.length ? sel : null, page: 2 }); render();
  }

  // True if any placeholder sample photos are still in the album.
  const hasSamples = () => state.branches.some(b => b.photos.some(p => p.type !== 'note' && !p.blob && String(p.src).startsWith(SAMPLE_PREFIX)));
  // Removes all placeholder sample photos at once.
  function removeSamples() {
    if (!confirm('Remove all the sample (placeholder) photos from every branch?\nYour own photos are not touched.')) return;
    state.branches.forEach(b => { b.photos = b.photos.filter(p => p.type === 'note' || p.blob || !String(p.src).startsWith(SAMPLE_PREFIX)); });
    changed({ focusBranch: sel }); render();
  }

  // Adds a story page (a page of text) to the selected branch.
  function addNote() {
    const b = state.branches[sel];
    const item = { id: uid(), type: 'note', title: 'Our story', text: '' };
    b.photos.push(item);
    changed({ focus: item.id }); render(); scrollToItem(item.id);
  }

  // Scrolls the list to a photo and flashes it, after it is added or moved.
  function scrollToItem(id) {
    const row = body.querySelector(`[data-id="${id}"]`);
    if (row) { row.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); row.classList.add('flash'); setTimeout(() => row.classList.remove('flash'), 1200); }
  }

  /* ----- upload ----- */
  // Handles chosen or dropped photos: shrinks each one, stores it, adds it to the end
  // of the selected branch and shows the page it landed on.
  async function addFiles(fileList) {
    const b = state.branches[sel];
    if (!b) { toast('Create a family branch first.'); return; }
    const files = [...fileList].filter(isImageFile);
    if (!files.length) { toast('No picture files found (try JPG, PNG, WebP or GIF).'); return; }
    busy++;
    const added = [], failed = [];
    try {
      for (let i = 0; i < files.length; i++) {
        if (currentDz) { currentDz.setMsg(`Adding photo ${i + 1} of ${files.length}…`); currentDz.classList.add('working'); }
        try {
          const { blob, w, ht } = await processImage(files[i]);
          const id = uid();
          await putBlob(id, blob);
          const item = { id, type: 'photo', blob: id, src: urlFor(id, blob), caption: '', date: '', size: guessSize(w, ht), w, h: ht };
          b.photos.push(item);
          added.push(item);
        } catch (e) { failed.push(files[i].name); }
      }
    } finally { busy--; }
    if (added.length) { changed({ focus: added[0].id }); }
    render();
    if (added.length) scrollToItem(added[0].id);
    if (failed.length) toast(`Could not read: ${failed.slice(0, 3).join(', ')}${failed.length > 3 ? '…' : ''} (HEIC photos are not supported – export as JPG first).`);
    else if (added.length) toast(`${added.length} photo${added.length > 1 ? 's' : ''} added. Add captions below.`);
  }

  /* ----- put a real photo in place of a placeholder ----- */
  // A placeholder (sample) photo can be swapped for your own picture, keeping its
  // place in the book. Click the placeholder to get a small box where you drop or
  // choose a file, or drag a picture straight from your computer onto the placeholder.
  const findItem = id => { for (const b of state.branches) { const it = b.photos.find(p => p.id === id); if (it) return it; } return null; };
  const isSample = it => !!it && it.type !== 'note' && !it.blob && String(it.src || '').startsWith(SAMPLE_PREFIX);

  // Reads, shrinks and stores the file, then puts it into the placeholder's slot.
  async function replaceSample(id, file) {
    const item = findItem(id);
    if (!item || !file) return;
    if (!isImageFile(file)) { toast('That is not a picture file (try JPG, PNG, WebP or GIF).'); return; }
    busy++;
    try {
      const { blob, w, ht } = await processImage(file);
      const bid = uid();
      await putBlob(bid, blob);
      item.blob = bid; item.src = urlFor(bid, blob); item.w = w; item.h = ht;
      changed({ focus: item.id }); render();
      toast('Photo placed. Add its caption in the list (Edit album).');
    } catch (err) { toast('Could not read that image (HEIC is not supported – export as JPG first).'); }
    finally { busy--; }
  }

  // The small drop box that appears when you click a placeholder.
  let pickBox = null;
  function closePick() { if (pickBox) { pickBox.remove(); pickBox = null; } }
  function openPick(id, fig) {
    closePick();
    const take = f => { closePick(); replaceSample(id, f); };
    const fi = h('input', { type: 'file', accept: 'image/*', hidden: true,
      onchange: ev => { const f = ev.target.files[0]; ev.target.value = ''; if (f) take(f); } });
    const zone = h('div', { class: 'pick-zone', tabindex: 0, role: 'button',
      onclick: () => fi.click(),
      onkeydown: ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); fi.click(); } },
      ondragover: ev => { ev.preventDefault(); ev.stopPropagation(); zone.classList.add('over'); },
      ondragleave: () => zone.classList.remove('over'),
      ondrop: ev => { ev.preventDefault(); ev.stopPropagation(); zone.classList.remove('over'); const f = [...ev.dataTransfer.files].find(isImageFile); if (f) take(f); }
    }, h('b', { text: 'Drag a photo here' }), h('span', { text: 'or click to choose a file' }));
    pickBox = h('div', { class: 'pick-box', role: 'dialog', 'aria-label': 'Place a photo' },
      h('p', { text: 'Place your photo in this spot' }), zone,
      h('button', { type: 'button', class: 'ghost', text: 'Cancel', onclick: closePick }), fi);
    document.body.append(pickBox);
    // sit next to the clicked placeholder, kept inside the window
    const r = fig.getBoundingClientRect(), bw = pickBox.offsetWidth, bh = pickBox.offsetHeight;
    pickBox.style.left = Math.max(8, Math.min(innerWidth - bw - 8, r.left + r.width / 2 - bw / 2)) + 'px';
    pickBox.style.top = Math.max(8, Math.min(innerHeight - bh - 8, r.top + r.height / 2 - bh / 2)) + 'px';
    zone.focus();
  }
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape') closePick(); });
  document.addEventListener('pointerdown', ev => { if (pickBox && !pickBox.contains(ev.target)) closePick(); }, true);

  // Called by the book when a photo is clicked: for a placeholder, open the drop box.
  window.AlbumEditor = Object.assign(window.AlbumEditor || {}, {
    sampleClick(id, fig) {
      if (!isSample(findItem(id))) return false;
      openPick(id, fig);
      return true;
    }
  });

  // Dragging a file over a placeholder in the book lights it up; dropping puts the photo there.
  let hotFig = null;
  const setHot = f => { if (hotFig !== f) { if (hotFig) hotFig.classList.remove('drop-hot'); hotFig = f; if (f) f.classList.add('drop-hot'); } };
  const sampleUnder = e => {
    const f = eng() && eng().figAt ? eng().figAt(e.clientX, e.clientY) : null;
    return f && isSample(findItem(f.dataset.id)) ? f : null;
  };

  window.addEventListener('dragover', e => { if (hasFiles(e)) { e.preventDefault(); setHot(sampleUnder(e)); } });
  window.addEventListener('dragleave', e => { if (!e.relatedTarget) setHot(null); });
  window.addEventListener('drop', e => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    const hot = sampleUnder(e); setHot(null);
    if (hot) { const f = [...e.dataTransfer.files].find(isImageFile); if (f) replaceSample(hot.dataset.id, f); return; }   // dropped on a placeholder
    if (drawer.hidden) openEditor();
    view = 'photos'; render();
    addFiles(e.dataTransfer.files);
  });

  /* ----- rows ----- */
  let dragId = null;

  // The frame around each row in the list. Rows can be dragged to reorder.
  function rowShell(b, item, i, inner) {
    const handle = h('span', {
      class: 'ed-handle', draggable: true, title: 'Drag to reorder', text: '⠿',
      ondragstart: e => { dragId = item.id; e.dataTransfer.setData('text/plain', item.id); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setDragImage(row, 20, 20); } catch (_) { /* ignore */ } row.classList.add('dragging'); },
      ondragend: () => { dragId = null; row.classList.remove('dragging'); body.querySelectorAll('.drop-before,.drop-after').forEach(n => n.classList.remove('drop-before', 'drop-after')); }
    });
    const row = h('div', {
      class: 'ed-item' + (item.type === 'note' ? ' note' : ''), 'data-id': item.id,
      ondragover: e => {
        if (!dragId || dragId === item.id) return;
        e.preventDefault();
        const r = row.getBoundingClientRect(), after = e.clientY > r.top + r.height / 2;
        row.classList.toggle('drop-after', after); row.classList.toggle('drop-before', !after);
      },
      ondragleave: () => row.classList.remove('drop-before', 'drop-after'),
      ondrop: e => {
        if (!dragId || dragId === item.id) return;
        e.preventDefault(); e.stopPropagation();
        const r = row.getBoundingClientRect();
        reorder(b, dragId, item.id, e.clientY > r.top + r.height / 2);
      }
    }, handle, inner);
    return row;
  }

  // Moves a photo to just before / after another one (drag and drop).
  function reorder(b, id, targetId, after) {
    const from = b.photos.findIndex(p => p.id === id);
    if (from < 0) return;
    const [it] = b.photos.splice(from, 1);
    let to = b.photos.findIndex(p => p.id === targetId);
    if (to < 0) to = b.photos.length;
    b.photos.splice(after ? to + 1 : to, 0, it);
    changed({ focus: id }); render(); scrollToItem(id);
  }

  // Moves a photo up (-1) or down (+1) one place with the arrow buttons.
  function nudge(b, item, d) {
    const i = b.photos.indexOf(item), j = i + d;
    if (j < 0 || j >= b.photos.length) return;
    b.photos.splice(i, 1); b.photos.splice(j, 0, item);
    changed({ focus: item.id }); render(); scrollToItem(item.id);
  }

  // Removes a photo or story page, with an Undo button.
  function removeItem(b, item) {
    const i = b.photos.indexOf(item);
    b.photos.splice(i, 1);
    changed({ focusBranch: sel }); render();
    toast(item.type === 'note' ? 'Story page removed.' : 'Photo removed.', {
      label: 'Undo', fn: async () => {
        if (item.blob && blobs.has(item.blob)) await putBlob(item.blob, blobs.get(item.blob));
        b.photos.splice(Math.min(i, b.photos.length), 0, item);
        changed({ focus: item.id }); render(); scrollToItem(item.id);
      }
    });
  }

  // The up / down / View / remove buttons on each row.
  const actionBtns = (b, item) => h('div', { class: 'ed-acts' },
    h('button', { type: 'button', title: 'Move up', text: '↑', onclick: () => nudge(b, item, -1) }),
    h('button', { type: 'button', title: 'Move down', text: '↓', onclick: () => nudge(b, item, 1) }),
    h('button', { type: 'button', title: 'Show this page in the book', text: 'View', onclick: () => eng().showItem(item.id) }),
    h('button', { type: 'button', class: 'danger', title: 'Remove', text: '✕', onclick: () => removeItem(b, item) }));

  // One photo row: thumbnail, caption, date, size, 'fit', and 'start a new page here'.
  function photoRow(b, item, i) {
    const f = { focus: item.id };
    return rowShell(b, item, i, h('div', { class: 'ed-itembody' },
      h('img', { class: 'ed-thumb', src: item.src || '', alt: '', draggable: false, onclick: () => eng().showItem(item.id) }),
      h('div', { class: 'ed-fields' },
        textInput(item, 'caption', { placeholder: 'Caption – names, place…', focus: f }),
        h('div', { class: 'ed-2' },
          textInput(item, 'date', { placeholder: 'Date / year', focus: f }),
          selectInput([['small', 'Small'], ['medium', 'Medium'], ['large', 'Large']], item.size || 'medium', v => { item.size = v; changed(f); })),
        h('div', { class: 'ed-2' },
          selectInput([['cover', 'Crop to fill'], ['contain', 'Whole photo']], item.fit === 'contain' ? 'contain' : 'cover', v => { item.fit = v; changed(f); }),
          h('label', { class: 'ed-check', title: 'Ends the current page; this photo begins a fresh page' },
            h('input', { type: 'checkbox', checked: !!item.newPage, onchange: e => { item.newPage = e.target.checked; changed(f); } }), ' New page here')),
        actionBtns(b, item))));
  }

  // One story-page row: optional picture (shown above the story), heading and text.
  function noteRow(b, item, i) {
    const f = { focus: item.id };
    const count = h('small', { class: 'ed-count' });
    const upd = () => { const n = (item.text || '').length; count.textContent = `${n} characters` + (n > 900 ? ' – long text is shrunk to fit' : ''); };
    upd();
    // picture chooser: reads the file, shrinks it, stores it like any other photo
    const fi = h('input', {
      type: 'file', accept: 'image/*', hidden: true,
      onclick: ev => ev.stopPropagation(),
      onchange: async ev => {
        const file = ev.target.files[0]; ev.target.value = '';
        if (!file) return;
        busy++;
        try {
          const { blob, w, ht } = await processImage(file);
          const id = uid();
          await putBlob(id, blob);
          item.blob = id; item.src = urlFor(id, blob); item.w = w; item.h = ht;
          changed(f); render();
        } catch (err) { toast('Could not read that image (HEIC is not supported – export as JPG first).'); }
        finally { busy--; }
      }
    });
    const pic = h('div', { class: 'ed-notepic' },
      item.src ? h('img', { class: 'ed-thumb', src: item.src, alt: '', draggable: false, onclick: () => eng().showItem(item.id) }) : null,
      h('button', { type: 'button', text: item.src ? 'Change picture' : '+ Add picture', title: 'A photo shown at the top of the story page', onclick: () => fi.click() }),
      item.src ? h('button', { type: 'button', class: 'danger', text: 'Remove picture', onclick: () => {
        item.src = null; delete item.blob; delete item.image; delete item.imageCaption; item.caption = '';
        changed(f); render();
      } }) : null, fi);
    return rowShell(b, item, i, h('div', { class: 'ed-itembody' },
      h('div', { class: 'ed-notebadge', text: 'Story\npage' }),
      h('div', { class: 'ed-fields' },
        textInput(item, 'title', { placeholder: 'Heading', focus: f }),
        pic,
        item.src ? textInput(item, 'caption', { placeholder: 'Picture caption (optional)', focus: f }) : null,
        areaInput(item, 'text', { rows: 5, placeholder: 'Write the story, names, dates…', focus: f, after: upd }),
        count,
        actionBtns(b, item))));
  }

  /* ----- cover & text ----- */
  // The font choices for the cover lettering (the list comes from album.js).
  function coverFontOptions() {
    const list = window.ALBUM_COVER_FONTS || { classic: { label: 'Classic (default)' } };
    const opts = Object.keys(list).map(k => [k, list[k].label]);
    // a custom CSS font-family typed into album-data.js stays selectable
    if (state.coverFont && !list[state.coverFont]) opts.push([state.coverFont, 'Custom: ' + state.coverFont]);
    return opts;
  }

  // TAB 2 - Cover & text: title, subtitle, crests, cover lettering, dedication and back text.
  function viewCover() {
    const c0 = { page: 0 }, c1 = { page: 1 };
    body.append(
      h('p', { class: 'ed-help', text: 'Words on the front cover, inside cover and back cover.' }),
      field('Title', textInput(state, 'title', { focus: c0 })),
      field('Subtitle', textInput(state, 'subtitle', { focus: c0 })),
      field('Small line above the crest (optional)', textInput(state, 'eyebrow', { focus: c0 })),
      h('div', { class: 'ed-field' }, h('span', { text: 'Family crest (front cover, and back cover unless you pick one below)' }), crestControl(state, c0),
        h('small', { text: 'A PNG with a transparent background looks best.' })),
      h('div', { class: 'ed-field' }, h('span', { text: 'Back cover crest (optional)' }), crestControl(state, { page: 1e6 }, 'backCrest'),
        h('small', { text: 'Leave empty to use the family crest above on the back cover too.' })),
      field('Photo index at the back of the book',
        selectInput([['alpha', 'A to Z by caption'], ['branch', 'Grouped by family branch'], ['none', 'No photo index']],
          state.photoIndex === undefined || state.photoIndex === true ? 'alpha' : (state.photoIndex || 'none'), v => { state.photoIndex = v; changed({ page: 1e6 }); }),
        'Lists every photo that has a caption, with its page number. Click an entry in the book to jump there.'),
      field('Crest on the inner pages',
        selectInput([['none', 'None'], ['header', 'Small, in the page heading'], ['footer', 'Small, at the bottom corner'], ['watermark', 'Faint watermark behind the photos']],
          state.innerCrest || 'none', v => { state.innerCrest = v; changed({}); }),
        'Each branch uses its own crest (Photos & pages \u2192 Branch settings); branches without one use the family crest above.'),
      field('Lettering on the front and back cover',
        selectInput(coverFontOptions(), state.coverFont || 'classic', v => { state.coverFont = v === 'classic' ? '' : v; changed({ page: 0 }); }),
        'These are fonts already on most computers, so the album stays fully offline. A font that is missing on a computer falls back to a similar one.'),
      field('Dedication (inside the front cover)', areaInput(state, 'dedication', { rows: 3, focus: c1 })),
      field('Back cover text', textInput(state, 'backText', { focus: { page: 1e6 } })));
  }

  /* ----- backup ----- */
  // TAB 3 - Backup: download a backup file, restore one, or start over from album-data.js.
  function viewBackup() {
    const importInput = h('input', { type: 'file', accept: '.json,application/json', hidden: true, onchange: e => { importBackup(e.target.files[0]); e.target.value = ''; } });
    body.append(
      h('p', { class: 'ed-help', text: db
        ? 'Everything you add here is saved automatically inside this browser on this computer. Download a backup to keep a safe copy or to open the album on another computer. Supported browsers let you choose the download folder.'
        : 'This browser is blocking storage, so changes are not saved automatically. Download a backup before closing the page. Supported browsers let you choose the download folder.' }),
      hasSaved ? h('p', { class: 'ed-note', text: 'This browser holds saved edits, and they take priority over album-data.js. Press “Start over” below to go back to the file’s content.' }) : null,
      h('div', { class: 'ed-btnrow col' },
        h('button', { type: 'button', class: 'solid', text: '⬇ Download backup (.json)', onclick: downloadBackup }),
        h('button', { type: 'button', text: '⬆ Restore from a backup…', onclick: () => importInput.click() }),
        h('button', { type: 'button', class: 'danger', text: 'Start over (discard saved edits)', onclick: resetAll }),
        importInput),
      h('p', { class: 'ed-help', text: 'Tip: you can also keep photos in an “images” folder and list them in album-data.js; that file works without any browser storage.' }));
  }

  // Backup helpers: photos are packed into the backup file as text and unpacked on restore.
  const toDataURL = blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(blob); });
  function dataURLToBlob(u) {
    const m = /^data:([^;,]*)(;base64)?,(.*)$/s.exec(u);
    if (!m) throw new Error('bad data');
    const bin = m[2] ? atob(m[3]) : decodeURIComponent(m[3]);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: m[1] || 'application/octet-stream' });
  }

  // Builds one .json file containing the whole album and all uploaded photos and crests.
  async function downloadBackup() {
    try {
      let directory = null;
      if (window.isSecureContext && typeof window.showDirectoryPicker === 'function') {
        setStatus('Choose a folder for the backup…');
        try { directory = await window.showDirectoryPicker({ mode: 'readwrite' }); }
        catch (e) {
          if (e.name === 'AbortError') { setStatus('Backup cancelled'); return; }
          throw e;
        }
      }
      setStatus('Preparing backup…');
      const s = serialize();
      const embed = async (o, blobField, dataField) => { const id = o[blobField]; if (id && blobs.has(id)) o[dataField] = await toDataURL(blobs.get(id)); };
      await embed(s, 'crestBlob', 'crestData');
      await embed(s, 'backCrestBlob', 'backCrestData');
      for (const b of s.branches) {
        await embed(b, 'crestBlob', 'crestData');
        for (const p of b.photos) await embed(p, 'blob', 'data');
      }
      const saved = new Date().toISOString();
      const filename = `family-album-backup-${saved.slice(0, 10)}.json`;
      const out = new Blob([JSON.stringify({ app: 'family-flip-album', version: 1, saved, state: s })], { type: 'application/json' });
      if (directory) {
        const file = await directory.getFileHandle(filename, { create: true });
        const writable = await file.createWritable();
        await writable.write(out);
        await writable.close();
        setStatus('Backup saved to the selected folder');
      } else {
        const a = h('a', { href: URL.createObjectURL(out), download: filename });
        document.body.append(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
        setStatus('Backup downloaded');
      }
    } catch (e) { console.error(e); setStatus('Backup failed: ' + e.message, true); }
  }

  // Restores a backup file, replacing the current album.
  async function importBackup(file) {
    if (!file) return;
    let counted = false;
    try {
      const j = JSON.parse(await file.text());
      if (j.app !== 'family-flip-album' || !j.state || !Array.isArray(j.state.branches)) throw new Error('not an album backup file');
      if (!confirm('Replace the current album with this backup?')) return;
      busy++; counted = true;
      const s = j.state;
      const restore = async (o, blobField, dataField, urlField) => {
        if (o[dataField]) {
          const id = uid(), blob = dataURLToBlob(o[dataField]);
          await putBlob(id, blob);
          o[blobField] = id; o[urlField] = urlFor(id, blob);
          delete o[dataField];
        }
      };
      await restore(s, 'crestBlob', 'crestData', 'crest');
      await restore(s, 'backCrestBlob', 'backCrestData', 'backCrest');
      for (const b of s.branches) {
        await restore(b, 'crestBlob', 'crestData', 'crest');
        for (const p of b.photos || []) await restore(p, 'blob', 'data', 'src');
      }
      state = prepare(s); sel = 0;
      busy--; counted = false;
      changed({ page: 0 }); render();
      toast('Backup restored.');
    } catch (e) {
      if (counted) busy--;
      console.error(e); toast('Could not restore: ' + e.message);
    }
  }

  // 'Start over': asks first, then discards the saved edits so the book goes back to album-data.js.
  async function resetAll() {
    if (!confirm('Discard everything saved in this browser (photos, captions, branches) and go back to album-data.js?\nTip: download a backup first.')) return;
    await discardSaved();
  }

  // Does the discarding (no question asked): wipes saved edits and stored photos from
  // this browser and reloads album-data.js. Used by Start over and by the notice below.
  async function discardSaved() {
    try {
      if (db) { for (const k of await kvKeys()) await kvDel(k); }
    } catch (e) { console.error(e); }
    blobs.clear(); urls.forEach(u => URL.revokeObjectURL(u)); urls.clear();
    state = prepare(clone(ORIGINAL)); sel = 0; hasSaved = false;
    refresh({ page: 0 }); render();
    setStatus('Back to the original album');
  }

  /* ----- "album-data.js has changed" notice ----- */
  // The notice at the top of the page shown when album-data.js was edited after you
  // saved edits in the editor: choose to use the file or keep the saved edits.
  function showFileChangedBanner() {
    const bar = h('div', { class: 'ed-banner', role: 'alert' },
      h('div', {},
        h('strong', { text: 'album-data.js has been edited. ' }),
        'This browser also holds edits you made with the Edit album button, and until now those were being shown instead of the file. Which should the album use?'),
      h('div', { class: 'ed-banner-btns' },
        h('button', { type: 'button', class: 'solid', text: 'Use album-data.js', title: 'Discards photos and edits saved in this browser',
          onclick: async () => { bar.remove(); await discardSaved(); setStatus('Now showing album-data.js'); } }),
        h('button', { type: 'button', text: 'Keep my browser edits',
          onclick: () => { bar.remove(); scheduleSave(); } })));
    document.body.append(bar);
  }


  setStatus('Ready');
})();
