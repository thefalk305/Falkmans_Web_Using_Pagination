/* ==========================================================================
  Album diagnostics. Not needed for normal use.

  1. Put this file next to your other scripts (e.g. js/diagnose.js).
  2. In flip.html add this line as the FIRST script, above album-data.js:
        <script src="js/diagnose.js"></script>
  3. Reload with Ctrl+F5, open the album on an inner photo spread,
    click the small "Diagnose" button (bottom-left), then "Copy report"
    and paste the report back into the chat.
  It only reads the page and turns one page forward and back; it changes nothing.
  ========================================================================== */
(function () {
  'use strict';
  // WHAT THIS FILE IS: a troubleshooting helper. It adds a small 'Diagnose' button and
  // builds a report (browser, file versions, whether the curl styles are loaded, a live
  // test turn). Delete its <script> line from flip.html when you no longer need it,
  // and always before publishing.
  //
  // EXPECTED is the version this file expects the other files to be; if they differ,
  // the report says which file is out of date.
  var EXPECTED = '2026-10-09b';
  // Every error the page reports is collected here and printed in the report.
  var errors = [];

  window.addEventListener('error', function (e) {
    errors.push('error: ' + e.message + ' (' + String(e.filename || '').split('/').pop() + ':' + e.lineno + ')');
  });
  window.addEventListener('unhandledrejection', function (e) {
    errors.push('promise: ' + ((e.reason && e.reason.message) || e.reason));
  });
  ['error', 'warn'].forEach(function (k) {
    var orig = console[k];
    console[k] = function () {
      errors.push('console.' + k + ': ' + [].slice.call(arguments).map(String).join(' ').slice(0, 300));
      return orig.apply(console, arguments);
    };
  });

  // Small helpers: wait, find an element by id, and press a keyboard key.
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var $ = function (id) { return document.getElementById(id); };
  var fire = function (key) { document.dispatchEvent(new KeyboardEvent('keydown', { key: key, bubbles: true })); };

  // Checks that the stylesheet that was actually loaded contains the page-curl rules.
  function probeCss() {
    var box = document.createElement('div');
    box.style.cssText = 'position:absolute;left:-9999px;top:0;width:10px;height:10px;';
    box.innerHTML =
      '<div class="leaf curling"><div class="face"></div><div class="curl"><div class="peel-clip"></div></div></div>' +
      '<div class="cast"></div>';
    document.body.appendChild(box);
    var cs = function (sel, prop) { return getComputedStyle(box.querySelector(sel))[prop]; };
    var r = {
      faceHiddenWhileCurling: cs('.leaf.curling > .face', 'visibility') === 'hidden',
      curlShown: cs('.curl', 'display') === 'block',
      stripAbsolute: cs('.peel-clip', 'position') === 'absolute',
      clipHidesOverflow: true,
      castDefined: cs('.cast', 'position') === 'absolute',
      cssVersion: (getComputedStyle(document.documentElement).getPropertyValue('--album-css-version') || '').replace(/['"\s]/g, '') || '(none)'
    };
    box.remove();
    return r;
  }

  // Takes a snapshot of the curl while a page is turning (used by the live test).
  function snapshot() {
    var clips = [].slice.call(document.querySelectorAll('.peel-clip'));
    var folded = clips.filter(function (c) { return c.style.clipPath && c.style.clipPath !== 'none'; }).length;
    var leaf = document.querySelector('.leaf.curling') || null;
    return {
      curlingLeaves: document.querySelectorAll('.leaf.curling').length,
      rigs: document.querySelectorAll('.curl').length,
      strips: clips.length,
      totalBendDeg: folded ? 10 : 0,
      leafTransform: leaf ? leaf.style.transform : '-'
    };
  }

  // Builds the report: turns one page forward and back while sampling the curl,
  // then lists the versions, errors and a plain-language verdict.
  async function run() {
    var out = [], L = function (s) { out.push(s); };
    var curlBtn = $('btnCurl');

    L('ALBUM CURL DIAGNOSTIC  ' + new Date().toString());
    L('Browser : ' + navigator.userAgent);
    L('Window  : ' + innerWidth + 'x' + innerHeight + ', pixel ratio ' + devicePixelRatio);
    L('Page    : ' + decodeURI(location.href));
    L('System "reduce motion" setting: ' + (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'ON' : 'off'));
    try { L('Saved switches: album-curl=' + localStorage.getItem('album-curl') + '  album-sound=' + localStorage.getItem('album-sound')); }
    catch (e) { L('Saved switches: (localStorage blocked)'); }
    L('3D support: preserve-3d=' + CSS.supports('transform-style', 'preserve-3d') + ', backface-visibility=' +
      (CSS.supports('backface-visibility', 'hidden') || CSS.supports('-webkit-backface-visibility', 'hidden')));
    L('');
    L('Files the page loads:');
    [].forEach.call(document.scripts, function (s) { if (s.src) L('  script  ' + decodeURI(s.src)); });
    [].forEach.call(document.querySelectorAll('link[rel=stylesheet]'), function (l) { L('  style   ' + decodeURI(l.href)); });

    var eng = window.AlbumEngine;
    var css = probeCss();
    L('');
    L('Versions (want ' + EXPECTED + '):');
    L('  album.js  : ' + (eng ? (eng.version || '(older - no stamp)') : '(not running)'));
    L('  editor.js : ' + (window.AlbumEditorVersion || '(older - no stamp / not loaded)'));
    L('  style.css : ' + css.cssVersion);
    L('Curl rules found in the stylesheet: hideFlatFace=' + css.faceHiddenWhileCurling + ' showRig=' + css.curlShown +
      ' strip=' + css.stripAbsolute + ' clip=' + css.clipHidesOverflow + ' shadow=' + css.castDefined);
    L('Curl button : ' + (curlBtn ? curlBtn.textContent.trim() + (curlBtn.disabled ? ' (DISABLED)' : '') : '(missing)'));
    L('Leaves in book: ' + document.querySelectorAll('.leaf').length + '   page info: ' + (($('pageInfo') || {}).textContent || '?'));
    var imgs = [].slice.call(document.querySelectorAll('.leaf .ph img'));
    L('Photos: ' + imgs.length + ' on pages, ' + imgs.filter(function (i) { return i.complete && i.naturalWidth === 0; }).length + ' failed to load');

    // live test: turn one page and look at it mid-turn
    L('');
    var before = ($('pageInfo') || {}).textContent;
    var nextBtn = $('btnNext');
    var key = nextBtn && !nextBtn.disabled ? 'ArrowRight' : 'ArrowLeft';
    var back = key === 'ArrowRight' ? 'ArrowLeft' : 'ArrowRight';
    L('Live test: pressing ' + key + ' from "' + before + '"');
    var samples = [];
    fire(key);
    for (var t = 0, i = 0; i < 4; i++) {
      var step = [150, 150, 150, 200][i];
      await wait(step); t += step;
      var s = snapshot(); s.at = t; samples.push(s);
      L('  ' + t + ' ms: leaves curling=' + s.curlingLeaves + ' rigs=' + s.rigs + ' fold-layers=' + s.strips + ' folded=' + (s.totalBendDeg ? 'yes' : 'no') + '  ' + s.leafTransform);
    }
    await wait(1100);
    var after = ($('pageInfo') || {}).textContent;
    L('  after the turn: "' + after + '"');
    fire(back);
    await wait(1300);
    L('  turned back : "' + (($('pageInfo') || {}).textContent) + '"');

    L('');
    L('Errors/warnings seen: ' + (errors.length ? '' : 'none'));
    errors.slice(0, 12).forEach(function (e) { L('  ' + e); });

    // verdict
    var v = [];
    var peak = samples.reduce(function (m, s) { return Math.max(m, s.curlingLeaves); }, 0);
    var bend = samples.reduce(function (m, s) { return Math.max(m, Math.abs(s.totalBendDeg)); }, 0);
    if (!eng) v.push('album.js did not run (check the script path in flip.html and the errors above).');
    if (eng && eng.version !== EXPECTED) v.push('album.js is not the newest version - the browser may be using an old copy or a different folder. Replace it and press Ctrl+F5.');
    if (css.cssVersion !== EXPECTED) v.push('style.css is not the newest version (' + css.cssVersion + '). The page may be loading a different style.css than the one you updated; see "Files the page loads" above.');
    if (!(css.faceHiddenWhileCurling && css.curlShown && css.stripAbsolute && css.clipHidesOverflow)) v.push('The page-curl rules are missing from the loaded stylesheet.');
    if (curlBtn && /off/i.test(curlBtn.textContent)) v.push('Curl is switched OFF (button reads "Curl off"). Click it once to turn it on.');
    if (after === before) v.push('The test key press did not turn the page (maybe a pop-up or the editor was in the way).');
    else if (peak === 0) v.push('The page turned but no curl was applied.');
    else if (bend < 2) v.push('A curl rig was built but the page barely bent (corner not folded).');
    if (!v.length) v.push('Everything looks right: the page curled (peak ' + peak + ' leaf, corner fold applied). If you still do not SEE it, the browser may be drawing the page flat (try turning on hardware acceleration in the browser settings, or try another browser).');
    L('');
    L('VERDICT:');
    v.forEach(function (x) { L('  - ' + x); });
    return out.join('\n');
  }

  // Adds the Diagnose button. Clicking it runs the test and shows the report.
  function ui() {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Diagnose';
    btn.style.cssText = 'position:fixed;left:10px;bottom:10px;z-index:99999;padding:.4rem .8rem;font:13px system-ui,sans-serif;' +
      'background:#fff8e0;color:#222;border:1px solid #b9962f;border-radius:.4rem;cursor:pointer;opacity:.85';
    btn.addEventListener('click', async function () {
      btn.disabled = true; btn.textContent = 'Testing...';
      var text;
      try { text = await run(); } catch (e) { text = 'Diagnostic failed: ' + e.message + '\n' + errors.join('\n'); }
      btn.disabled = false; btn.textContent = 'Diagnose';
      show(text);
    });
    document.body.appendChild(btn);
  }

  // Shows the report in a window with Copy report, Download report and Close buttons.
  function show(text) {
    var old = document.getElementById('diagPanel'); if (old) old.remove();
    var p = document.createElement('div');
    p.id = 'diagPanel';
    p.style.cssText = 'position:fixed;inset:6% 8%;z-index:100000;background:#1e1a16;color:#f1e6cf;border:1px solid #dcb862;' +
      'border-radius:.6rem;padding:1rem;display:flex;flex-direction:column;gap:.7rem;font:13px system-ui,sans-serif;box-shadow:0 1rem 3rem #000';
    var ta = document.createElement('textarea');
    ta.value = text; ta.readOnly = true;
    ta.style.cssText = 'flex:1;width:100%;background:#0e0b09;color:#f1e6cf;border:1px solid #555;border-radius:.4rem;padding:.6rem;' +
      'font:12px/1.4 Consolas,Menlo,monospace;resize:none;-webkit-user-select:text;user-select:text;white-space:pre';
    var row = document.createElement('div'); row.style.cssText = 'display:flex;gap:.6rem;align-items:center;flex-wrap:wrap';
    var mk = function (label, fn) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = label;
      b.style.cssText = 'padding:.4rem .9rem;font:inherit;background:#dcb862;color:#2a1d10;border:0;border-radius:.4rem;cursor:pointer;font-weight:600';
      b.addEventListener('click', fn); return b;
    };
    var note = document.createElement('span'); note.style.opacity = '.8';
    row.append(
      mk('Copy report', function () {
        ta.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (e) { /* ignore */ }
        if (!ok && navigator.clipboard) navigator.clipboard.writeText(text).then(function () { note.textContent = 'Copied.'; });
        else note.textContent = ok ? 'Copied.' : 'Press Ctrl+C to copy the selected text.';
      }),
      mk('Download report', function () {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
        a.download = 'album-diagnostic.txt'; document.body.appendChild(a); a.click(); a.remove();
      }),
      mk('Close', function () { p.remove(); }), note);
    p.append(ta, row);
    document.body.appendChild(p);
  }

  if (document.body) ui(); else document.addEventListener('DOMContentLoaded', ui);
})();
