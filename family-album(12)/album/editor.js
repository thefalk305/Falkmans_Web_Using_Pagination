/* ==========================================================================
   In-page album editor ("Edit album" button).
   - Add photos (pick or drag & drop), caption them, reorder, remove.
   - Add branches (new tab), story pages, and "start a new page here" breaks.
   - Edits and photos are saved in THIS browser (IndexedDB) and override
     album-data.js until you press "Reset". Use Backup to move them elsewhere.
   ========================================================================== */
(() => {
  'use strict';

  const SAMPLE_PREFIX = 'data:image/svg+xml';
  const PALETTE = ['#8c2f39', '#2f6b4f', '#2d5a8c', '#a8741f', '#6b3f8c', '#2b7a7a', '#8c5a2f', '#5a6b2f'];
  const MAX_SIDE = 1800;                    // uploaded photos are scaled down to this
  const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
  const eng = () => window.AlbumEngine;
  const clone = o => (window.structuredClone ? structuredClone(o) : JSON.parse(JSON.stringify(o)));

  /* ---------------- tiny DOM helper ---------------- */
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
  const ORIGINAL = clone(window.ALBUM || { branches: [] });
  let state = null;
  let db = null;
  let hasSaved = false;
  let sel = 0;                  // selected branch
  let view = 'photos';
  let showNewBranch = false;
  let settingsOpen = false;
  let busy = 0;
  const blobs = new Map();      // blob id -> Blob
  const urls = new Map();       // blob id -> object URL

  /* ---------------- storage (IndexedDB) ---------------- */
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
  const store = mode => db.transaction('kv', mode).objectStore('kv');
  const req = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const kvGet = k => req(store('readonly').get(k));
  const kvPut = (k, v) => req(store('readwrite').put(v, k));
  const kvDel = k => req(store('readwrite').delete(k));
  const kvKeys = () => req(store('readonly').getAllKeys());

  function urlFor(id, blob) {
    if (!urls.has(id)) urls.set(id, URL.createObjectURL(blob));
    return urls.get(id);
  }

  async function putBlob(id, blob) {
    blobs.set(id, blob);
    if (db) {
      try { await kvPut('blob:' + id, blob); }
      catch (e) { console.error(e); setStatus('Could not store a photo in this browser: ' + e.message, true); }
    }
  }

  function prepare(s) {
    s.branches = s.branches || [];
    s.branches.forEach(b => {
      b.id = b.id || uid();
      b.photos = b.photos || [];
      b.photos.forEach(p => { p.id = p.id || uid(); p.type = p.type || 'photo'; });
    });
    return s;
  }

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
    s.branches.forEach(b => {
      bind(b, 'crest', 'crestBlob');
      b.photos.forEach(p => bind(p, 'src', 'blob'));
    });
    await Promise.all(jobs);
  }

  // what gets stored: everything except object URLs (they are rebuilt from blobs)
  function serialize() {
    const s = clone(state);
    if (s.crestBlob) s.crest = null;
    s.branches.forEach(b => {
      if (b.crestBlob) b.crest = null;
      b.photos.forEach(p => { if (p.blob) delete p.src; });
    });
    return s;
  }

  function usedBlobIds() {
    const used = new Set();
    if (state.crestBlob) used.add(state.crestBlob);
    state.branches.forEach(b => {
      if (b.crestBlob) used.add(b.crestBlob);
      b.photos.forEach(p => { if (p.blob) used.add(p.blob); });
    });
    return used;
  }

  async function gc() {
    if (!db || busy) return;
    const used = usedBlobIds();
    for (const k of await kvKeys()) {
      if (typeof k === 'string' && k.startsWith('blob:') && !used.has(k.slice(5))) await kvDel(k);
    }
  }

  let saveTimer = 0, saving = Promise.resolve();
  function scheduleSave() {
    setStatus('Saving…');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { saving = saving.then(doSave); }, 400);
  }
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
    } else {
      state = prepare(clone(ORIGINAL));
    }
    if (!db) setStatus('Browser storage unavailable – edits will not be kept. Use Backup → Download.', true);
    return state;
  };

  /* ---------------- engine glue ---------------- */
  let rt = 0;
  const refresh = opts => eng().rebuild(state, opts || {});
  const changed = opts => { refresh(opts); scheduleSave(); };
  const changedSoon = opts => { clearTimeout(rt); rt = setTimeout(() => refresh(opts), 350); scheduleSave(); };

  /* ---------------- images ---------------- */
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

  const guessSize = (w, ht) => (w / ht >= 1.6 ? 'large' : 'medium');
  const isImageFile = f => /^image\//.test(f.type) || /\.(jpe?g|png|gif|webp|bmp|avif)$/i.test(f.name);

  /* ---------------- drawer shell ---------------- */
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

  function setStatus(msg, warn) {
    status.textContent = msg;
    status.classList.toggle('warn', !!warn);
  }

  let toastTimer = 0;
  function toast(msg, action) {
    toastBox.textContent = '';
    toastBox.append(h('span', { text: msg }));
    if (action) toastBox.append(h('button', { type: 'button', text: action.label, onclick: () => { toastBox.hidden = true; action.fn(); } }));
    toastBox.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastBox.hidden = true; }, action ? 8000 : 5000);
  }

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
  function crestControl(obj, focusOpts) {
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
          obj.crestBlob = id; obj.crest = urlFor(id, blob);
          changed(focusOpts); render();
        } catch (err) { toast('Could not read that image.'); }
        finally { busy--; }
      }
    });
    return h('div', { class: 'ed-crest' },
      h('div', { class: 'ed-crest-prev' }, obj.crest ? h('img', { src: obj.crest, alt: '' }) : h('span', { text: 'none' })),
      h('div', { class: 'ed-crest-btns' },
        h('button', { type: 'button', text: obj.crest ? 'Change crest…' : 'Choose crest image…', onclick: () => fi.click() }),
        obj.crest ? h('button', { type: 'button', class: 'ghost', text: 'Remove', onclick: () => { obj.crest = null; delete obj.crestBlob; changed(focusOpts); render(); } }) : null,
        fi));
  }

  /* ---------------- views ---------------- */
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
  const hasFiles = e => [...((e.dataTransfer && e.dataTransfer.types) || [])].includes('Files');

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

  function moveBranch(d) {
    const bs = state.branches, j = sel + d;
    if (j < 0 || j >= bs.length) return;
    [bs[sel], bs[j]] = [bs[j], bs[sel]];
    sel = j; changed({ focusBranch: sel }); render();
  }
  function deleteBranch() {
    const b = state.branches[sel];
    if (!confirm(`Delete the branch “${b.name}” and its ${b.photos.length} photo/page item(s)?\nThis cannot be undone.`)) return;
    state.branches.splice(sel, 1);
    sel = Math.max(0, sel - 1);
    changed({ focusBranch: state.branches.length ? sel : null, page: 2 }); render();
  }

  const hasSamples = () => state.branches.some(b => b.photos.some(p => p.type !== 'note' && !p.blob && String(p.src).startsWith(SAMPLE_PREFIX)));
  function removeSamples() {
    if (!confirm('Remove all the sample (placeholder) photos from every branch?\nYour own photos are not touched.')) return;
    state.branches.forEach(b => { b.photos = b.photos.filter(p => p.type === 'note' || p.blob || !String(p.src).startsWith(SAMPLE_PREFIX)); });
    changed({ focusBranch: sel }); render();
  }

  function addNote() {
    const b = state.branches[sel];
    const item = { id: uid(), type: 'note', title: 'Our story', text: '' };
    b.photos.push(item);
    changed({ focus: item.id }); render(); scrollToItem(item.id);
  }

  function scrollToItem(id) {
    const row = body.querySelector(`[data-id="${id}"]`);
    if (row) { row.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); row.classList.add('flash'); setTimeout(() => row.classList.remove('flash'), 1200); }
  }

  /* ----- upload ----- */
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

  window.addEventListener('dragover', e => { if (hasFiles(e)) e.preventDefault(); });
  window.addEventListener('drop', e => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    if (drawer.hidden) openEditor();
    view = 'photos'; render();
    addFiles(e.dataTransfer.files);
  });

  /* ----- rows ----- */
  let dragId = null;

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

  function reorder(b, id, targetId, after) {
    const from = b.photos.findIndex(p => p.id === id);
    if (from < 0) return;
    const [it] = b.photos.splice(from, 1);
    let to = b.photos.findIndex(p => p.id === targetId);
    if (to < 0) to = b.photos.length;
    b.photos.splice(after ? to + 1 : to, 0, it);
    changed({ focus: id }); render(); scrollToItem(id);
  }

  function nudge(b, item, d) {
    const i = b.photos.indexOf(item), j = i + d;
    if (j < 0 || j >= b.photos.length) return;
    b.photos.splice(i, 1); b.photos.splice(j, 0, item);
    changed({ focus: item.id }); render(); scrollToItem(item.id);
  }

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

  const actionBtns = (b, item) => h('div', { class: 'ed-acts' },
    h('button', { type: 'button', title: 'Move up', text: '↑', onclick: () => nudge(b, item, -1) }),
    h('button', { type: 'button', title: 'Move down', text: '↓', onclick: () => nudge(b, item, 1) }),
    h('button', { type: 'button', title: 'Show this page in the book', text: 'View', onclick: () => eng().showItem(item.id) }),
    h('button', { type: 'button', class: 'danger', title: 'Remove', text: '✕', onclick: () => removeItem(b, item) }));

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

  function noteRow(b, item, i) {
    const f = { focus: item.id };
    const count = h('small', { class: 'ed-count' });
    const upd = () => { const n = (item.text || '').length; count.textContent = `${n} characters` + (n > 900 ? ' – long text is shrunk to fit' : ''); };
    upd();
    return rowShell(b, item, i, h('div', { class: 'ed-itembody' },
      h('div', { class: 'ed-notebadge', text: 'Story\npage' }),
      h('div', { class: 'ed-fields' },
        textInput(item, 'title', { placeholder: 'Heading', focus: f }),
        areaInput(item, 'text', { rows: 5, placeholder: 'Write the story, names, dates…', focus: f, after: upd }),
        count,
        actionBtns(b, item))));
  }

  /* ----- cover & text ----- */
  function viewCover() {
    const c0 = { page: 0 }, c1 = { page: 1 };
    body.append(
      h('p', { class: 'ed-help', text: 'Words on the front cover, inside cover and back cover.' }),
      field('Title', textInput(state, 'title', { focus: c0 })),
      field('Subtitle', textInput(state, 'subtitle', { focus: c0 })),
      field('Small line above the crest (optional)', textInput(state, 'eyebrow', { focus: c0 })),
      h('div', { class: 'ed-field' }, h('span', { text: 'Family crest (front and back cover)' }), crestControl(state, c0),
        h('small', { text: 'A PNG with a transparent background looks best.' })),
      field('Crest on the inner pages',
        selectInput([['none', 'None'], ['header', 'Small, in the page heading'], ['footer', 'Small, at the bottom corner'], ['watermark', 'Faint watermark behind the photos']],
          state.innerCrest || 'none', v => { state.innerCrest = v; changed({}); }),
        'Each branch uses its own crest (Photos & pages \u2192 Branch settings); branches without one use the family crest above.'),
      field('Dedication (inside the front cover)', areaInput(state, 'dedication', { rows: 3, focus: c1 })),
      field('Back cover text', textInput(state, 'backText', { focus: { page: 1e6 } })));
  }

  /* ----- backup ----- */
  function viewBackup() {
    const importInput = h('input', { type: 'file', accept: '.json,application/json', hidden: true, onchange: e => { importBackup(e.target.files[0]); e.target.value = ''; } });
    body.append(
      h('p', { class: 'ed-help', text: db
        ? 'Everything you add here is saved automatically inside this browser on this computer. Download a backup to keep a safe copy or to open the album on another computer.'
        : 'This browser is blocking storage, so changes are not saved automatically. Download a backup before closing the page.' }),
      hasSaved ? h('p', { class: 'ed-note', text: 'This browser holds saved edits, and they take priority over album-data.js. Press “Start over” below to go back to the file’s content.' }) : null,
      h('div', { class: 'ed-btnrow col' },
        h('button', { type: 'button', class: 'solid', text: '⬇ Download backup (.json)', onclick: downloadBackup }),
        h('button', { type: 'button', text: '⬆ Restore from a backup…', onclick: () => importInput.click() }),
        h('button', { type: 'button', class: 'danger', text: 'Start over (discard saved edits)', onclick: resetAll }),
        importInput),
      h('p', { class: 'ed-help', text: 'Tip: you can also keep photos in an “images” folder and list them in album-data.js; that file works without any browser storage.' }));
  }

  const toDataURL = blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(blob); });
  function dataURLToBlob(u) {
    const m = /^data:([^;,]*)(;base64)?,(.*)$/s.exec(u);
    if (!m) throw new Error('bad data');
    const bin = m[2] ? atob(m[3]) : decodeURIComponent(m[3]);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: m[1] || 'application/octet-stream' });
  }

  async function downloadBackup() {
    try {
      setStatus('Preparing backup…');
      const s = serialize();
      const embed = async (o, blobField, dataField) => { const id = o[blobField]; if (id && blobs.has(id)) o[dataField] = await toDataURL(blobs.get(id)); };
      await embed(s, 'crestBlob', 'crestData');
      for (const b of s.branches) {
        await embed(b, 'crestBlob', 'crestData');
        for (const p of b.photos) await embed(p, 'blob', 'data');
      }
      const out = new Blob([JSON.stringify({ app: 'family-flip-album', version: 1, saved: new Date().toISOString(), state: s })], { type: 'application/json' });
      const a = h('a', { href: URL.createObjectURL(out), download: `family-album-backup-${new Date().toISOString().slice(0, 10)}.json` });
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      setStatus('Backup downloaded');
    } catch (e) { console.error(e); setStatus('Backup failed: ' + e.message, true); }
  }

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

  async function resetAll() {
    if (!confirm('Discard everything saved in this browser (photos, captions, branches) and go back to album-data.js?\nTip: download a backup first.')) return;
    try {
      if (db) { for (const k of await kvKeys()) await kvDel(k); }
    } catch (e) { console.error(e); }
    blobs.clear(); urls.forEach(u => URL.revokeObjectURL(u)); urls.clear();
    state = prepare(clone(ORIGINAL)); sel = 0; hasSaved = false;
    refresh({ page: 0 }); render();
    setStatus('Back to the original album');
  }

  setStatus('Ready');
})();
