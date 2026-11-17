/* Ulipsu Sim Kit: shared runtime for conversation-simulation projects. Classic script, offline, no eval.
 * A project calls Kit.run(cfg) with: C (window.CONTENT), scenes[], items (inside C), makeData(seed,S), chain(S,D), dataHtml(S,D), pdfData(pdf,frame,S,D).
 * Scene: {id, name, items:[id]?, render(el, K)}. K exposes helpers listed at the bottom. */
'use strict';
(function () {
var C, CFG, LMS = window.LmsAdapter, S, D = null, T = { k: 1, busy: false };
var MAXA = 3;
function $(s, r) { return (r || document).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function uid() { try { var a = new Uint8Array(8); crypto.getRandomValues(a); return Array.prototype.map.call(a, function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); } catch (e) { return Math.random().toString(16).slice(2, 10) + Date.now().toString(16); } }
var mem = null, KEY;
function lsGet() { try { return localStorage.getItem(KEY); } catch (e) { return mem; } }
function lsSet(v) { try { localStorage.setItem(KEY, v); } catch (e) { mem = v; } }
function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { var a = hash(String(seed)); return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function shuffle(arr, r) { var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

/* ---------- state and scoring ---------- */
function fresh() { return { v: 1, attemptId: uid(), learnerId: null, startedAt: new Date().toISOString(), step: 0, sound: false, items: {}, x: {}, submitted: false, final: null, rp: 0 }; }
function compact() { return S; }
function save() { lsSet(JSON.stringify(S)); LMS.saveState(compact()); try { LMS.setProgress(progressPct()); } catch (e) {} }
function itDef(id) { return C.items.filter(function (x) { return x.id === id; })[0]; }
function it(id) { return S.items[id] || (S.items[id] = { a: 0, done: false, ok: false, rev: false, frac: null, resp: null }); }
function left(id) { return MAXA - it(id).a; }
function started() { return Object.keys(S.items).some(function (k) { return S.items[k].a > 0; }); }
function allDone() { return C.items.every(function (d) { return S.items[d.id] && S.items[d.id].done; }); }
function attempt(id, ok, resp) { var s = it(id); s.a++; s.resp = resp; if (ok) { s.done = true; s.ok = true; s.frac = [1, 0.7, 0.1][s.a - 1]; } else if (s.a >= MAXA) { s.done = true; s.ok = false; s.rev = true; s.frac = 0.1; } save(); try { fxAfter(id, s); } catch (e) {} return s; }
function score() { var pct = 0; C.items.forEach(function (d) { var s = S.items[d.id]; pct += d.w * (s && s.done ? s.frac : 0); }); pct = Math.round(pct * 10) / 10; var pts = Math.floor(pct * 10 + 0.5); return { percent: pct, points: pts, rank: Math.floor(pts / 10 + 0.5) }; }
function firstTry() { return C.items.filter(function (d) { var s = S.items[d.id]; return s && s.ok && s.a === 1; }).length; }
function progressPct() { return Math.round(C.items.filter(function (d) { return S.items[d.id] && S.items[d.id].done; }).length / C.items.length * 100); }
function starLine(id) { var l = left(id); return '<span class="stars">' + '★'.repeat(l) + '☆'.repeat(MAXA - l) + ' ' + l + (l === 1 ? ' try left. A wrong answer shows the answer.' : ' tries left.') + '</span>'; }

/* ---------- sound (muted by default) ---------- */
var AC = null;
function beep(f, d, type, when) { if (!S.sound) return; try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); var o = AC.createOscillator(), g = AC.createGain(); o.type = type || 'sine'; o.frequency.value = f; o.connect(g); g.connect(AC.destination); var t = AC.currentTime + (when || 0); g.gain.setValueAtTime(0.06, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.start(t); o.stop(t + d + 0.02); } catch (e) {} }
var SFX = { tap: function () { beep(520, 0.06); }, ok: function () { beep(660, 0.1); beep(880, 0.15, 'sine', 0.09); }, bad: function () { beep(220, 0.2, 'triangle'); }, done: function () { [523, 659, 784, 1047].forEach(function (f, i) { beep(f, 0.15, 'sine', i * 0.1); }); } };

/* ---------- scenes and navigation ---------- */
var SC = [];
function cur() { return SC[S.step]; }
function go(i) { S.step = Math.max(0, Math.min(i, SC.length - 1)); T.sel = null; T.fb = {}; save(); render(); bridgePing(); }
function ensureData() { if (!D) D = CFG.makeData(S.learnerId + '|' + C.id + '|' + (S.x.seed || ''), S); return D; }
function fitStage() { var w = window.innerWidth, h = window.innerHeight, k = Math.min(w / 1920, h / 1080); T.k = k; $('#stage').style.transform = 'translate(' + (w - 1920 * k) / 2 + 'px,' + (h - 1080 * k) / 2 + 'px) scale(' + k + ')'; $('#rot').hidden = !(h > w); }
function stagePt(ev) { var r = $('#stage').getBoundingClientRect(); return { x: (ev.clientX - r.left) / T.k, y: (ev.clientY - r.top) / T.k }; }
function showLayer(html) { var l = $('#layer'); l.innerHTML = '<div class="box">' + html + '</div>'; l.hidden = false; var b = $('button', l); if (b) b.focus(); }
function hideLayer() { $('#layer').hidden = true; $('#layer').innerHTML = ''; }
function setFoot(o) {
  var b = $('#b-back'), m = $('#b-main'), rs = $('#b-reset'); b.hidden = !!o.noBack || S.step === 0; m.hidden = !!o.noMain;
  rs.hidden = !o.reset; T.reset = o.reset || null;
  m.className = 'btn ' + (o.cls || 'pri') + (o.en ? ' ready' : ''); m.textContent = o.main || 'Next'; m.disabled = !o.en; $('#st').textContent = o.st || '';
  T.main = o.go; T.back = o.back || function () { go(S.step - 1); };
  var tr = $('#tries'); if (o.item && !it(o.item).done) { var l = left(o.item), h = ''; for (var i = 0; i < MAXA; i++) h += '<span class="' + (i < l ? 'f' : 'e' + (T.lost === i ? ' lost' : '')) + '">' + (i < l ? '\u2605' : '\u2606') + '</span>'; tr.innerHTML = h; tr.setAttribute('aria-label', l + ' tries left'); T.lost = null; } else tr.innerHTML = '';
}
// XP = points earned on correct answers (100% / 70% / 10% by try); misses = every wrong try. User asked for live XP, so DP-806 is relaxed here.
function earned(d) { var s = S.items[d.id]; return s && s.ok ? Math.round(d.w * 10 * s.frac) : 0; }
function xpNow() { return C.items.reduce(function (t, d) { return t + earned(d); }, 0); }
function tally() { var ok = 0, no = 0; C.items.forEach(function (d) { var s = S.items[d.id]; if (!s) return; if (s.ok) ok++; no += s.a - (s.ok ? 1 : 0); }); return { ok: ok, no: no }; }
function xpView(animate) {
  var t = tally(); $('#xtxt').textContent = xpNow() + ' XP'; $('#nok').textContent = '✓ ' + t.ok; $('#nno').textContent = '✗ ' + t.no;
  if (animate) { var x = $('#xp'); x.classList.remove('pop'); void x.offsetWidth; x.classList.add('pop'); }
}
function journey() { return SC.filter(function (x) { return x.id !== 'review' && x.id !== 'submitted' && x.id !== 'start'; }); }
function header() {
  var J = journey(), idx = J.indexOf(cur()), fin = S.submitted || cur().id === 'submitted', bar = '';
  J.forEach(function (sc, i) { var dn = fin || i < idx || (sc.items && sc.items.every(function (k) { return S.items[k] && S.items[k].done; }) && i !== idx); bar += (i ? '<b class="' + (dn || i <= idx ? 'd' : '') + '"></b>' : '') + '<i class="' + (i === idx ? 'o' : dn ? 'd' : '') + '" title="' + esc(sc.name) + '">' + (dn ? '✓' : (i + 1)) + '</i>'; });
  bar += '<b class="' + (fin ? 'd' : '') + '"></b><i class="end ' + (fin ? 'd' : '') + '" title="Result">★</i>';
  $('#pbar').innerHTML = bar; $('#pbar').setAttribute('aria-label', 'Step ' + Math.max(1, idx + 1) + ' of ' + J.length);
  var sb = $('#b-snd'); sb.className = 'hbtn icon-btn ' + (S.sound ? 'sound-on' : 'sound-off'); $('.hbtn-label', sb).textContent = S.sound ? 'Sound' : 'Muted'; xpView(false);
}
function chatStop() { (T.chatT || []).forEach(clearTimeout); T.chatT = []; }
function chat(el) {
  var bs = $$('.bubbles > .bub:not([hidden]), .bubbles > .q', el), af = $$('.after', el); T.seen = T.seen || {};
  if (!bs.length || reduced() || T.seen[cur().id]) { T.seen[cur().id] = 1; return; }
  T.seen[cur().id] = 1; bs.forEach(function (b) { b.classList.add('wait'); }); af.forEach(function (a) { a.classList.add('wait'); });
  var t = 300, dots = document.createElement('div'); dots.className = 'bub typing'; dots.innerHTML = '<i></i><i></i><i></i>';
  bs.forEach(function (b, i) {
    T.chatT.push(setTimeout(function () { b.parentNode.insertBefore(dots, b); }, t)); t += 900;
    T.chatT.push(setTimeout(function () { gone(dots); b.classList.remove('wait'); b.classList.add('in'); SFX.tap(); }, t)); t += i < bs.length - 1 ? 900 : 300;
  });
  T.chatT.push(setTimeout(function () { af.forEach(function (a) { a.classList.remove('wait'); a.classList.add('in'); }); }, t));
  if (T.cue) { clearTimeout(T.cueTimer); cueStop(true); T.chatT.push(setTimeout(function () { ringOn(); T.cueTimer = setTimeout(handShow, 700); }, t)); }
}
function render() { K.solve = null; cueStop(); chatStop(); (T.off || []).forEach(function (o) { o[0].removeEventListener(o[1], o[2]); }); T.off = []; var old = $('#content'), el = old.cloneNode(false); old.parentNode.replaceChild(el, old); header(); cur().render(el, K); chat(el); }
// Help shows, it does not tell: replay the hand cue for this screen, or point at the main button.
function help() { var sp = T.cue && (T.cue.drag || T.cue.seq) ? T.cue : { ring: '#b-main', seq: ['#b-main'] }; cueStop(); T.cue = sp; ringOn(); handShow(); }

/* ---------- character: a friendly alien drawn in SVG (offline, no image files) ---------- */
function alien(a) {
  a = a || {}; var b = a.body || '#9FE3C9', s = a.spot || '#7FD3B4', t = a.tip || '#FF9F80', k = '#2B2A4C';
  return '<svg class="alien" viewBox="0 0 120 120" aria-hidden="true"><path d="M44 34 L34 12" stroke="' + s + '" stroke-width="5" stroke-linecap="round"/><path d="M76 34 L86 12" stroke="' + s + '" stroke-width="5" stroke-linecap="round"/><circle cx="34" cy="11" r="7" fill="' + t + '"/><circle cx="86" cy="11" r="7" fill="' + t + '"/>' +
    '<ellipse cx="60" cy="70" rx="42" ry="40" fill="' + b + '"/><circle cx="30" cy="58" r="5" fill="' + s + '"/><circle cx="92" cy="86" r="6" fill="' + s + '"/><circle cx="86" cy="54" r="3.5" fill="' + s + '"/>' +
    '<circle cx="46" cy="64" r="13" fill="#fff"/><circle cx="76" cy="64" r="13" fill="#fff"/><circle cx="48" cy="66" r="6.5" fill="' + k + '"/><circle cx="78" cy="66" r="6.5" fill="' + k + '"/><circle cx="50.5" cy="63" r="2.2" fill="#fff"/><circle cx="80.5" cy="63" r="2.2" fill="#fff"/>' +
    '<circle cx="36" cy="82" r="5.5" fill="#FFB3C1" opacity=".75"/><circle cx="86" cy="82" r="5.5" fill="#FFB3C1" opacity=".75"/><path d="M50 86 Q61 96 72 86" stroke="' + k + '" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg>';
}
function face(who) { return who.alien ? alien(who.alien) : who.e; }

/* ---------- conversation block: {q:'...'} lines are the question (largest type), {me:'...'} is the learner ---------- */
function talk(who, lines, extra, cls) {
  return '<div class="talk ' + (cls || '') + '"><div class="who"><div class="avatar" aria-hidden="true">' + face(who) + '</div><div class="name">' + esc(who.n) + '</div><div class="role">' + esc(who.r || '') + '</div></div><div class="bubbles">' +
    lines.map(function (l) { return typeof l === 'string' ? '<div class="bub">' + l + '</div>' : l.q ? '<p class="q">' + l.q + '</p>' : '<div class="bub me">' + l.me + '</div>'; }).join('') + (extra || '') + '</div></div>';
}

/* ---------- numeric keypad (no typing in scored steps) ---------- */
function keypad(el, host, fields, onChange) {
  var cur0 = 0, vals = fields.map(function (f) { return ''; });
  function paint() {
    $$('.field', host).forEach(function (fe, i) { fe.textContent = vals[i] === '' ? '?' : vals[i] + (fields[i].unit || ''); fe.classList.toggle('on', i === cur0); });
    if (onChange) onChange(vals);
  }
  host.addEventListener('click', function (e) {
    var f = e.target.closest('.field'); if (f) { cur0 = +f.dataset.i; SFX.tap(); paint(); return; }
    var k = e.target.closest('.key'); if (!k) return; var v = k.dataset.k; SFX.tap();
    if (v === 'n') vals[cur0] = vals[cur0].charAt(0) === '-' ? vals[cur0].slice(1) : '-' + vals[cur0]; else if (v === 'c') vals[cur0] = ''; else if (v === 'b') vals[cur0] = vals[cur0].slice(0, -1); else if (v === '.') { if (vals[cur0].indexOf('.') < 0 && vals[cur0] !== '') vals[cur0] += '.'; } else if (vals[cur0].length < 6) vals[cur0] += v;
    paint();
  });
  paint(); return { set: function (i, v) { vals[i] = String(v); paint(); }, vals: function () { return vals; }, mark: function (i, cls) { var fe = $$('.field', host)[i]; fe.classList.remove('ok', 'no'); if (cls) fe.classList.add(cls); }, lock: function () { $$('.key', host).forEach(function (k) { k.disabled = true; }); } };
}
function padHtml(neg) { var keys = ['7', '8', '9', 'b', '4', '5', '6', 'c', '1', '2', '3', '.', '0']; return '<div class="pad">' + keys.map(function (k) { return k === '0' ? '<button class="key w" data-k="0">0</button>' : '<button class="key" data-k="' + k + '" aria-label="' + ({ b: 'Delete', c: 'Clear' }[k] || k) + '">' + ({ b: '⌫', c: 'C' }[k] || k) + '</button>'; }).join('') + (neg ? '<button class="key w" data-k="n" aria-label="Plus or minus">+ / \u2212</button>' : '') + '</div>'; }

/* ---------- pointer drag + tap-then-tap + keyboard (no HTML5 DnD) ---------- */
function winOn(type, fn) { window.addEventListener(type, fn); (T.off = T.off || []).push([window, type, fn]); }
function dnd(root, onDrop) {
  var sel = null, ghost = null, drag = null;
  function clearSel() { $$('.chip.sel', root).forEach(function (c) { c.classList.remove('sel'); }); sel = null; }
  function slotAt(x, y) { var els = document.elementsFromPoint(x, y); for (var i = 0; i < els.length; i++) { var s = els[i].closest && els[i].closest('[data-slot]'); if (s && root.contains(s)) return s; } return null; }
  root.addEventListener('pointerdown', function (e) {
    var c = e.target.closest('.chip'); if (!c || !root.contains(c) || c.disabled) return;
    drag = { c: c, x: e.clientX, y: e.clientY, moved: false, id: e.pointerId };
  });
  winOn('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 10) { drag.moved = true; ghost = drag.c.cloneNode(true); ghost.classList.add('ghost'); ghost.style.transform = 'translate(-50%,-50%) scale(' + T.k + ')'; document.body.appendChild(ghost); drag.c.classList.add('used'); }
    if (drag.moved) { ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px'; $$('[data-slot]', root).forEach(function (s) { s.classList.remove('over'); }); var s = slotAt(e.clientX, e.clientY); if (s) s.classList.add('over'); }
  });
  winOn('pointerup', function (e) {
    if (!drag || e.pointerId !== drag.id) return; var d = drag; drag = null;
    if (d.moved) { if (ghost) ghost.remove(); ghost = null; d.c.classList.remove('used'); $$('[data-slot]', root).forEach(function (s) { s.classList.remove('over'); }); var s = slotAt(e.clientX, e.clientY); if (s) { SFX.tap(); onDrop(d.c.dataset.id, s.dataset.slot, d.c); } }
    else { var was = d.c.classList.contains('sel'); clearSel(); if (!was) { d.c.classList.add('sel'); sel = d.c; SFX.tap(); } }
  });
  winOn('pointercancel', function () { if (ghost) ghost.remove(); ghost = null; drag = null; $$('.chip.used', root).forEach(function (c) { c.classList.remove('used'); }); });
  root.addEventListener('click', function (e) { var s = e.target.closest('[data-slot]'); if (s && sel && root.contains(s) && !e.target.closest('.chip')) { var c = sel; clearSel(); onDrop(c.dataset.id, s.dataset.slot, c); } });
  root.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('chip')) { e.preventDefault(); var was = e.target.classList.contains('sel'); clearSel(); if (!was) { e.target.classList.add('sel'); sel = e.target; } } else if ((e.key === 'Enter' || e.key === ' ') && e.target.dataset.slot && sel) { e.preventDefault(); var c = sel; clearSel(); onDrop(c.dataset.id, e.target.dataset.slot, c); } });
}

/* ---------- feedback helper ---------- */
function coach(kind, title, text) { return '<div class="coach ' + (kind || '') + '"><b>' + esc(title) + '</b>' + text + '</div>'; }

/* ---------- final scenes ---------- */
// No separate review/submit screen: leaving the last step saves the result and opens the result slide.
function reviewScene() { return { id: 'review', name: 'Finish', render: function (el) {
  if (allDone()) { el.innerHTML = ''; setFoot({ noMain: true, noBack: true }); doSubmit(); return; }
  var miss = SC.filter(function (x) { return x.items && x.items.some(function (k) { return !(S.items[k] && S.items[k].done); }); })[0];
  el.innerHTML = say('One step is still waiting for you.'); setFoot({ main: 'Go there', en: true, go: function () { go(SC.indexOf(miss)); } });
} }; }
function submittedScene() { return { id: 'submitted', name: 'Result', render: function (el) {
  var f = S.final || { points: 0, rank: 0, first: 0, at: new Date().toISOString() }, pg = S.rp || 0, t = tally(), h = '';
  if (pg === 0) { var n = f.points >= 800 ? 3 : f.points >= 500 ? 2 : 1;
    h = '<div class="res"><div class="card score"><div class="eyebrow">Mission complete</div><div class="stars3">' + '★'.repeat(n) + '<span class="e">' + '★'.repeat(3 - n) + '</span></div><div class="big">' + f.points + '<small> / 1000</small></div>' +
      '<div class="tiles"><div class="tile"><b>' + xpNow() + '</b>XP</div><div class="tile"><b>' + t.ok + '</b>Correct</div><div class="tile"><b>' + t.no + '</b>Misses</div><div class="tile"><b>' + f.rank + '</b>Rank Points</div></div></div>' +
      '<div class="card grow" style="display:flex;flex-direction:column;justify-content:center">' + (CFG.summaryHtml ? CFG.summaryHtml(S, ensureData()) : '') + '</div></div>'; }
  else h = CFG.dataHtml(S, ensureData());
  el.innerHTML = h; var last = pg === 1, canDl = typeof URL !== 'undefined' && !!URL.createObjectURL;
  setFoot({ noBack: pg === 0, back: function () { S.rp = 0; save(); render(); }, main: last ? (canDl ? 'Download PDF' : 'Finish') : 'See my work', cls: last ? 'gold' : 'pri', en: true, go: function () { if (!last) { S.rp = 1; save(); render(); } else if (canDl) downloadPDF(); else LMS.exit(); } });
  if (pg === 0 && S.justDone) { S.justDone = false; burst(960, 300); }
} }; }
function doSubmit() {
  if (T.busy) return; T.busy = true; var sc = score(); showLayer('<h2>Sending your report…</h2><p>Please wait.</p>');
  var res = buildResult(); S.final = { points: sc.points, rank: Math.floor(sc.points / 10 + 0.5), first: firstTry(), at: res.submittedAt };
  LMS.submit(res).then(function () { T.busy = false; S.submitted = true; S.justDone = true; SFX.done(); hideLayer(); S.rp = 0; go(SC.length - 1); }).catch(function () {
    T.busy = false; showLayer('<h2>Couldn’t save</h2><p>Check your connection and try again. Your answers are kept.</p><p style="text-align:right;margin:24px 0 0"><button class="btn pri" id="tr">Try again</button></p>'); $('#tr').addEventListener('click', function () { hideLayer(); doSubmit(); });
  });
}
function buildResult() {
  var sc = score(), t1 = new Date().toISOString(), pdf = buildPDF();
  return { schema: 'ulipsu.project-result.v1', projectId: C.id, version: C.version, attemptId: S.attemptId, startedAt: S.startedAt, submittedAt: t1, durationSec: Math.max(1, Math.round((Date.parse(t1) - Date.parse(S.startedAt)) / 1000)),
    score: { points: sc.points, maxPoints: 1000, percent: sc.percent }, completion: 'completed',
    items: C.items.map(function (d) { var s = it(d.id); return { id: d.id, lo: d.lo, type: d.type, response: s.resp, attempts: s.a, correct: !!s.ok, revealed: !!s.rev, points: Math.round(d.w * 10 * (s.frac || 0)), maxPoints: d.w * 10 }; }),
    report: { choices: S.x, firstTryCorrect: firstTry(), itemsTotal: C.items.length, rankPoints: Math.floor(sc.points / 10 + 0.5), chain: CFG.chain(S, ensureData()), pdfBase64: pdf.base64() } };
}
function downloadPDF() { var b = buildPDF().blob(), name = C.id + '_' + C.short + '_Report.pdf'; if (window.UlipsuBridge && UlipsuBridge.downloadBlob) { UlipsuBridge.downloadBlob(b, name, 'application/pdf'); return; } try { var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); a.remove(); } catch (e) {} }
function buildPDF() {
  var W = 842, H = 595, pdf = new window.MiniPDF(W, H), sc = score(), col = C.color, dd = ensureData(), ch = CFG.chain(S, dd), f = S.final || { points: sc.points, rank: Math.floor(sc.points / 10 + 0.5), first: firstTry(), at: new Date().toISOString() };
  function frame(t) { pdf.page(); pdf.rect(0, 0, W, 54, col); pdf.text(30, 36, C.title + '  -  ' + t, 20, true, '#FFFFFF'); pdf.text(30, H - 24, C.disclaimer, 9, false, '#4A6479'); pdf.text(30, H - 11, C.aiNote + '  Project ' + C.id + ' v' + C.version, 9, false, '#4A6479'); }
  frame('Project report'); pdf.text(30, 100, 'Date: ' + new Date(f.at).toDateString(), 13, true, '#17324D');
  pdf.rect(30, 120, 250, 150, '#EAF8FF', '#9FD3EC'); pdf.text(46, 152, 'Project score', 13, false, '#4A6479'); pdf.text(46, 192, f.points + ' / 1000', 34, true, col); pdf.text(46, 224, 'Rank Points: ' + f.rank + ' / 100', 16, true, col); pdf.text(46, 250, 'Correct on first try: ' + f.first + ' of ' + C.items.length, 12, false, '#17324D');
  var y = 320; pdf.text(30, y, 'Question results', 14, true, col); y += 20; C.items.forEach(function (d0, i) { var s = it(d0.id), x = 30 + (i % 3) * 270, yy = y + Math.floor(i / 3) * 30; pdf.text(x, yy + 12, d0.id + ': ' + (s.ok ? 'correct, try ' + s.a : 'answer shown'), 11, false, '#17324D'); });
  if (CFG.pdfSummary) CFG.pdfSummary(pdf, S, dd, col);
  frame('Your data'); CFG.pdfData(pdf, S, dd, col);
  frame('Your journey'); var yy = 100; ch.forEach(function (c, i) { pdf.rect(30, yy - 16, 8, 50, col); pdf.text(48, yy, (i + 1) + '. ' + c.choice, 14, true, '#17324D'); yy = pdf.para(48, yy + 18, c.consequence, 12, 95, 16, false, '#4A6479') + 22; });
  return pdf;
}
function bridgePing() { try { if (window.UlipsuBridge) UlipsuBridge.saveProgress(); } catch (e) {} }
function bridgeInit() {
  if (!window.UlipsuBridge) return;
  UlipsuBridge.init({ activityId: C.id, version: 1, getState: compact, getSteps: function () { return SC.map(function (s) { return s.id; }); },
    setState: function (saved, student) { if (saved && saved.v === 1 && !started() && !S.x.seed) S = Object.assign(fresh(), saved); if (student && student.id && !started()) S.learnerId = String(student.id); D = null; save(); render(); },
    jumpToStep: function (i) { if (CFG.preview) CFG.preview(S); D = null; ensureData(); go(+i); },
    getMetrics: function () { var sc = score(); return { userId: S.learnerId, stepIndex: S.step, stepId: cur().id, totalSteps: SC.length, progressPercent: Math.round(S.step / (SC.length - 1) * 100), pts: sc.points, maxPts: 1000, completed: !!S.submitted }; },
    getActivityData: function () { return { selections: S.x, responses: C.items.map(function (d) { var s = S.items[d.id] || {}; return { question: d.id, selected_option: s.resp, is_correct: !!s.ok, attempt: s.a || 0 }; }) }; } });
}


/* ---------- effects: confetti, XP float, level-up, shake, star loss ---------- */
function stageXY(el) { var r = el.getBoundingClientRect(), sr = $('#stage').getBoundingClientRect(); return { x: (r.left + r.width / 2 - sr.left) / T.k, y: (r.top + r.height / 2 - sr.top) / T.k, w: r.width / T.k, h: r.height / T.k }; }
function reduced() { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
function gone(e) { if (e && e.parentNode) e.parentNode.removeChild(e); }
function burst(x, y) {
  if (reduced()) return; var st = $('#stage'), cols = ['#FF6B6B', '#FFC93C', '#4ECDC4', '#5B8DEF', '#9B5DE5', '#59A14F'], box = document.createElement('div'); box.className = 'fx'; box.style.left = x + 'px'; box.style.top = y + 'px';
  for (var i = 0; i < 26; i++) { var c = document.createElement('i'), a = Math.random() * Math.PI + Math.PI, d = 160 + Math.random() * 260; c.className = 'cf'; c.style.background = cols[i % cols.length]; c.style.setProperty('--dx', (Math.cos(a) * d) + 'px'); c.style.setProperty('--dy', (Math.sin(a) * d + 200) + 'px'); c.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg'); c.style.animationDelay = (Math.random() * 0.12) + 's'; box.appendChild(c); }
  st.appendChild(box); setTimeout(function () { gone(box); }, 1500);
}
function floatText(txt, x, y, cls) { var st = $('#stage'), e = document.createElement('div'); e.className = cls || 'xpf fx'; e.style.left = x + 'px'; e.style.top = y + 'px'; e.textContent = txt; st.appendChild(e); setTimeout(function () { gone(e); }, 2100); }
function fxAfter(id, s) {
  var main = $('#b-main'), p = main ? stageXY(main) : { x: 960, y: 1020 };
  var xb = stageXY($('#xp'));
  if (s.done) {
    cueStop(); xpView(true);
    if (s.ok) { burst(p.x, p.y - 40); SFX.ok(); floatText('+' + earned(itDef(id)) + ' XP', xb.x - 60, xb.y + 40); }
    header();
  } else {
    xpView(true);
    var c = $('#content'); c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake'); setTimeout(function () { c.classList.remove('shake'); }, 500);
    var av = $('.av, .avatar', c); if (av) { av.classList.remove('wob'); void av.offsetWidth; av.classList.add('wob'); }
    T.lost = left(id); // index of the star that just vanished
  }
}

/* ---------- visual cues: pulsing ring + animated hand, no written tutorial ---------- */
function cueStop(keep) {
  clearTimeout(T.cueTimer); if (T.cueAnim) { try { T.cueAnim.cancel(); } catch (e) {} } gone(T.cueEl); T.cueAnim = T.cueEl = null;
  $$('.attn').forEach(function (e) { e.classList.remove('attn'); }); if (!keep) T.cue = null;
}
function ringOn() { if (!T.cue || !T.cue.ring) return; $$(T.cue.ring).forEach(function (e) { e.classList.add('attn'); }); }
function cue(spec) {
  cueStop(); if (!spec || (spec.item && S.items[spec.item] && S.items[spec.item].done)) return; T.cue = spec; ringOn(); T.cueTimer = setTimeout(handShow, spec.delay == null ? 1500 : spec.delay);
}
function pt(sel) { var m = typeof sel === 'string' && /^\.pick:nth-child\((\d+)\)$/.exec(sel), e = m ? $$('.pick')[+m[1] - 1] : (typeof sel === 'string' ? $(sel) : sel); return e ? stageXY(e) : null; }
function handShow() {
  var sp = T.cue; if (!sp || reduced() || !$('#content')) return; var pts = [], frames = [], dur;
  var low = false; [sp.drag && sp.drag.from, sp.drag && sp.drag.to].concat(sp.seq || []).forEach(function (x) { var q = x && pt(x); if (q && q.y > 860) low = true; });
  var tf = function (q, s) { return 'translate(' + (q.x - 38) + 'px,' + (q.y - (low ? 96 : 8)) + 'px) scale(' + s + ')'; };
  if (sp.drag) {
    var a = pt(sp.drag.from), b = sp.drag.to ? pt(sp.drag.to) : (a ? { x: a.x + (sp.drag.dx || 0), y: a.y + (sp.drag.dy || 0) } : null); if (!a || !b) return; dur = 2600;
    frames = [{ transform: tf(a, 1), opacity: 0, offset: 0 }, { transform: tf(a, 1), opacity: 1, offset: 0.12 }, { transform: tf(a, 0.82), opacity: 1, offset: 0.22 }, { transform: tf(b, 0.82), opacity: 1, offset: 0.7 }, { transform: tf(b, 1), opacity: 1, offset: 0.8 }, { transform: tf(b, 1), opacity: 0, offset: 1 }];
  } else if (sp.seq) {
    sp.seq.forEach(function (s) { var q = pt(s); if (q) pts.push(q); }); if (!pts.length) return; dur = 1100 * pts.length + 500;
    frames.push({ transform: tf(pts[0], 1), opacity: 0, offset: 0 });
    pts.forEach(function (q, i) { frames.push({ transform: tf(q, 1), opacity: 1, offset: (i * 1100 + 350) / dur }, { transform: tf(q, 0.8), opacity: 1, offset: (i * 1100 + 650) / dur }, { transform: tf(q, 1), opacity: 1, offset: (i * 1100 + 900) / dur }); });
    frames.push({ transform: frames[frames.length - 1].transform, opacity: 0, offset: 1 });
  } else return;
  var h = document.createElement('div'); h.className = 'hand'; h.textContent = low ? '👇' : '👆'; h.setAttribute('aria-hidden', 'true'); $('#stage').appendChild(h); T.cueEl = h;
  T.cueAnim = h.animate(frames, { duration: dur, iterations: 2, easing: 'ease-in-out' });
  T.cueAnim.onfinish = function () { gone(T.cueEl); T.cueEl = T.cueAnim = null; T.cueTimer = setTimeout(handShow, 7000); };
}


/* ---------- shared scene helpers ---------- */
function say(txt) { return '<div class="say"><div class="av" aria-hidden="true">' + face(C.hero) + '</div><div class="bub" id="fb">' + txt + '</div></div>'; }
function typed(b, html) { if (!b) return; b.hidden = false; if (reduced()) { b.innerHTML = html; return; } b.classList.add('typing'); b.innerHTML = '<i></i><i></i><i></i>'; T.chatT.push(setTimeout(function () { b.classList.remove('typing'); b.innerHTML = html; }, 650)); }
function fbBox(html) { var b = $('#fb'); if (b) { b.hidden = false; b.innerHTML = html; } }
// When the screen is ready to move on, the hand points at the main button after a pause (no written "press Next").
function nextCue() { cue({ ring: '#b-main', seq: ['#b-main'], delay: 2500 }); }
function footFor(id, ready, check, st, reset) {
  if (done1(id)) { setFoot({ main: 'Next', en: true, go: function () { go(S.step + 1); } }); nextCue(); }
  else { setFoot({ main: 'Check', cls: 'go', en: ready, go: check, item: id, reset: reset }); if (ready) nextCue(); }
}
function done1(id) { return !!(S.items[id] && S.items[id].done); }
var OOPS = ['Hmm, not yet. Try again!', 'Almost! Have another go.', 'Oops! Look again.'];
function settle(id, ok, resp, good, bad, reveal, foot) {
  var s = attempt(id, ok, resp), box = $('#fb');
  if (ok) { SFX.ok(); typed(box, '<b>' + (s.a === 1 ? 'Yes! ' : 'You got it! ') + '</b>' + good); }
  else if (s.rev) { SFX.bad(); typed(box, '<b>Here it is.</b> ' + reveal); }
  else { SFX.bad(); typed(box, '<b>' + OOPS[(s.a - 1) % OOPS.length] + '</b>'); }
  if (foot) foot(); return s;
}
function svgPt(svg, ev) { var p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY; var m = svg.getScreenCTM(); return m ? p.matrixTransform(m.inverse()) : { x: 0, y: 0 }; }
function money(n) { return '₹' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }


/* ---------- scene builders: pick cards, number entry, drag into slots ---------- */
function pickScene(c) {
  return { id: c.id, name: c.name, help: c.help || 'Tap one card, then press Next.', render: function (el) {
    var D = ensureData(), o = c.opts(D);
    el.innerHTML = talk(c.who || C.hero, c.lines(D)) + '<div class="row" style="margin:56px 0 0 206px;gap:48px">' + o.map(function (p) { return '<button class="pick shelf' + (S.x[c.key] === p.id ? ' sel' : '') + '" data-p="' + p.id + '"' + (p.col ? ' style="border-top:14px solid ' + p.col + ';font-size:36px"' : ' style="font-size:36px"') + '><span style="font-size:96px">' + p.e + '</span>' + p.t + (p.sub ? '<small style="font-size:28px;color:var(--muted)">' + p.sub + '</small>' : '') + '</button>'; }).join('') + '</div>';
    function f() { setFoot({ main: 'Next', en: !!S.x[c.key], go: function () { go(S.step + 1); } }); }
    el.addEventListener('click', function (ev) { var b = ev.target.closest('.pick'); if (!b) return; S.x[c.key] = b.dataset.p; save(); SFX.tap(); $$('.pick', el).forEach(function (x) { x.classList.toggle('sel', x === b); }); f(); nextCue(); });
    f(); if (S.x[c.key]) { nextCue(); K.solve = function () { var b = $('.pick'); if (b) b.click(); }; return; } K.solve = function () { var b = $('.pick'); if (b) b.click(); }; cue({ ring: '.pick', seq: ['.pick:nth-child(1)', '.pick:nth-child(2)', '.pick:nth-child(3)'] });
  } };
}
function numScene(c) {
  return { id: c.id, icon: c.icon, name: c.name, items: [c.id], help: c.help, render: function (el) {
    var D = ensureData(), done = done1(c.id), F = c.fields(D), fmt = c.fmt || function (v) { return String(v); };
    el.innerHTML = say(c.say(D)) + '<div class="row" id="host" style="margin-top:14px;align-items:flex-start"><div class="col grow">' + (c.top ? c.top(D) : '') + '<div style="font-size:40px;display:flex;gap:34px;flex-wrap:wrap;align-items:center;margin-top:10px">' + F.map(function (f, i) { return '<span>' + (f.lbl || '') + ' <span class="field" data-i="' + i + '" tabindex="0" role="button" aria-label="' + esc(f.lbl || 'answer') + '"></span>' + (f.unit ? ' ' + f.unit : '') + '</span>'; }).join('') + '</div></div><div class="' + (c.compact ? 'compact' : '') + '">' + padHtml(c.neg) + '</div></div>';
    var host = $('#host'), kp = keypad(el, host, F.map(function () { return {}; }), function (v) { if (!done1(c.id)) footFor(c.id, v.every(function (x) { return x !== '' && x !== '-' && x !== '.'; }), check); });
    function lock() { var fs = $$('.field', host); F.forEach(function (f, i) { fs[i].textContent = fmt(f.ans, i); fs[i].classList.add('ok'); }); $$('.key', host).forEach(function (k) { k.disabled = true; }); }
    function check() {
      var v = kp.vals().map(parseFloat), res = F.map(function (f, i) { return Math.abs(v[i] - f.ans) <= (f.tol || 0) + 1e-9; }), ok = res.every(Boolean); res.forEach(function (r, i) { kp.mark(i, r ? 'ok' : 'no'); });
      settle(c.id, ok, v, c.good(D), c.bad ? c.bad(D, res) : (res.some(Boolean) && !ok ? 'Some are right (green). Fix the red ones.' : 'Not yet. Read the hint in the help and try again.'), c.reveal(D), function () { footFor(c.id, true, check); if (done1(c.id)) lock(); else cue({ item: c.id, ring: '.field.no', seq: ['.field.no'], delay: 400 }); });
    }
    K.solve = function () { F.forEach(function (f, i) { kp.set(i, f.ans); }); check(); };
    if (done) { lock(); fbBox('<b>Done.</b> ' + c.reveal(D)); }
    footFor(c.id, false, check, ''); cue({ item: c.id, ring: '.field[data-i="0"]', seq: ['.field[data-i="0"]', '.key[data-k="5"]'] });
  } };
}
function slotScene(c) {
  return { id: c.id, icon: c.icon, name: c.name, items: [c.id], help: c.help, render: function (el) {
    var D = ensureData(), done = done1(c.id), key = 'sl_' + c.id, bad = {}, asg = S.x[key] = S.x[key] || {}, truth = c.truth(D), chips = c.chips(D), slots = c.slots(D);
    if (done) S.x[key] = asg = Object.assign({}, truth);
    var shuf = shuffle(chips, rng(S.learnerId + c.id));
    el.innerHTML = say(c.say(D)) + (c.top ? c.top(D) : '') + '<div class="row" id="host" style="margin-top:14px;align-items:flex-start"><div class="col" style="width:' + (c.sw || 1000) + 'px;' + (c.sc ? 'display:grid;grid-template-columns:repeat(' + c.sc + ',1fr);gap:14px;align-content:start' : '') + '" id="slots"></div><div class="col grow" style="' + (c.pc ? 'display:grid;grid-template-columns:repeat(' + c.pc + ',1fr);gap:10px;align-content:start' : '') + '" id="pool"></div></div>';
    function chip(ch) { return '<button class="chip' + (done ? ' goodc' : '') + '" tabindex="0" data-id="' + ch.id + '" style="white-space:normal;min-height:' + (c.ch || 104) + 'px;font-size:' + (c.fs || 34) + 'px"' + (done ? ' disabled' : '') + '>' + ch.t + '</button>'; }
    function paint() {
      var used = {}; Object.keys(asg).forEach(function (k) { used[asg[k]] = 1; });
      $('#slots').innerHTML = slots.map(function (s) { var ch = chips.filter(function (x) { return x.id === asg[s.id]; })[0]; return '<div class="slot' + (ch ? '' : ' empty') + (bad[s.id] ? ' bad' : '') + '" data-slot="' + s.id + '" tabindex="0" style="min-height:' + (s.h || c.sh || 140) + 'px"><b style="font-size:' + (c.ls || 34) + 'px;' + (c.lw ? 'width:' + c.lw + 'px;' : '') + 'color:var(--pri)">' + s.label + '</b>' + (ch ? chip(ch) : '') + '</div>'; }).join('');
      $('#pool').innerHTML = '<div class="eyebrow" style="' + (c.pc ? 'grid-column:1/-1' : '') + '">' + (c.poolLabel || 'Pieces') + '</div>' + shuf.filter(function (x) { return !used[x.id]; }).map(chip).join('');
      var n = Object.keys(asg).length; if (!done1(c.id)) footFor(c.id, n === slots.length, check, '', n ? retry : null);
    }
    function retry() { Object.keys(asg).forEach(function (k) { delete asg[k]; }); bad = {}; save(); paint(); cue({ item: c.id, ring: '#pool .chip', drag: { from: '#pool .chip', to: '.slot.empty' }, delay: 600 }); }
    function check() {
      var wrong = c.verify ? c.verify(asg, D, slots) : slots.filter(function (s) { return asg[s.id] !== truth[s.id]; }), ok = wrong.length === 0;
      var s = settle(c.id, ok, JSON.stringify(asg), c.good(D), '', c.reveal(D));
      if (s.done) { done = true; bad = {}; Object.assign(asg, truth); paint(); save(); footFor(c.id, true, check); return; }
      // wrong: show which boxes are wrong, then send those pieces back to the pool and point the hand at an empty box
      bad = {}; wrong.forEach(function (w) { var sid = w && w.id != null ? w.id : w; if (typeof sid === 'string' && asg[sid] != null) bad[sid] = 1; }); paint(); save();
      setTimeout(function () { if (!$('#slots')) return; Object.keys(bad).forEach(function (k) { delete asg[k]; }); bad = {}; save(); paint(); cue({ item: c.id, ring: '.slot.empty', drag: { from: '#pool .chip', to: '.slot.empty' }, delay: 300 }); }, 1100);
    }
    if (!done) dnd(el, function (id, slot) { if (c.accept && !c.accept(id, slot)) { SFX.bad(); var se = $('[data-slot="' + slot + '"]'); if (se) { se.classList.add('bad'); setTimeout(function () { se.classList.remove('bad'); }, 600); } return; } Object.keys(asg).forEach(function (k) { if (asg[k] === id) delete asg[k]; }); delete bad[slot]; asg[slot] = id; save(); paint(); });
    K.solve = function () { Object.keys(asg).forEach(function (k) { delete asg[k]; }); Object.assign(asg, truth); paint(); check(); };
    paint(); if (done) fbBox('<b>Done.</b> ' + c.reveal(D)); else if (Object.keys(asg).length < slots.length) cue({ item: c.id, ring: '#pool .chip', drag: { from: '#pool .chip', to: '.slot.empty' } });
  } };
}
function startFor(lines) { return function (el) { el.innerHTML = talk(C.hero, lines) + '<div style="margin:18px 0 0 268px">' + coach('', 'About 15 minutes', 'You have 3 tries on every step. ' + esc(C.aiNote)) + '</div>'; setFoot({ noBack: true, main: 'Start', cls: 'go', en: true, go: function () { if (!S.x.seed) S.x.seed = 'v1'; D = null; save(); go(S.step + 1); } }); }; }


/* ---------- Ask DP-148: no emoji on interactive controls. Emoji is lifted out of buttons, chips and cards into decorative art. ---------- */
var EMO = /(?:\p{Emoji_Presentation}|\p{Extended_Pictographic}️)(?:‍(?:\p{Emoji_Presentation}|\p{Extended_Pictographic}️?))*/gu;
function hasEmo(s) { EMO.lastIndex = 0; var r = EMO.test(s); EMO.lastIndex = 0; return r; }
function cleanControls() {
  $$('#content button, #content [role="button"], #layer button').forEach(function (el) {
    if (!hasEmo(el.textContent)) return;
    var found = [], tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), n, nodes = [];
    while ((n = tw.nextNode())) nodes.push(n);
    nodes.forEach(function (tn) { tn.nodeValue = tn.nodeValue.replace(EMO, function (m) { found.push(m); return ''; }); });
    $$('span', el).forEach(function (sp) { if (!sp.children.length && !sp.textContent.trim() && !sp.classList.contains('field')) sp.parentNode.removeChild(sp); });
    if (el.classList.contains('shelf') && found.length && el.parentNode) {
      var wrap = document.createElement('div'), art = document.createElement('div'); wrap.className = 'shelfw'; art.className = 'art'; art.setAttribute('aria-hidden', 'true'); art.textContent = found.join('');
      el.parentNode.insertBefore(wrap, el); wrap.appendChild(art); wrap.appendChild(el);
    }
  });
}
var cleaning = false;
function watchControls() {
  var st = $('#stage'); if (!st || !window.MutationObserver) return;
  new MutationObserver(function () { if (cleaning) return; cleaning = true; try { cleanControls(); noOrphans(); } catch (e) {} cleaning = false; }).observe(st, { childList: true, subtree: true });
  cleanControls(); noOrphans();
}
// No orphan words: glue the last two words of each text block (fallback for browsers without text-wrap:pretty).
function noOrphans() {
  $$('#content .bub, #content .q, #content p, #content .chip, #content .pick, #content .coach, #content .slot b, #content td').forEach(function (el) {
    var tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), n, last = null; while ((n = tw.nextNode())) if (n.nodeValue.trim()) last = n;
    if (!last) return; var v = last.nodeValue, m = /^([\s\S]*\S) (\S{1,12}\s*)$/.exec(v); if (m) last.nodeValue = m[1] + ' ' + m[2];
  });
}

/* ---------- boot ---------- */
function run(cfg) {
  CFG = cfg; C = cfg.C; KEY = 'ulipsu_' + C.id.toLowerCase() + '_v1';
  SC = (cfg.start ? [{ id: 'start', name: 'Welcome', render: cfg.start }] : []).concat(cfg.scenes, [reviewScene(), submittedScene()]);
  S = fresh();
  $('.ttl-text').textContent = C.title; document.title = C.title; $('#dis').textContent = C.disclaimer || '';
  $('#b-back').addEventListener('click', function () { if (T.back) T.back(); });
  $('#b-reset').addEventListener('click', function () { if (T.reset) { SFX.tap(); T.reset(); } });
  $('#b-main').addEventListener('click', function () { if (T.main && !$('#b-main').disabled) T.main(); });
  $('#b-help').addEventListener('click', help);
  $('#b-snd').addEventListener('click', function () { S.sound = !S.sound; save(); header(); if (S.sound) SFX.tap(); });
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('[data-close]')) hideLayer(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hideLayer(); });
  document.addEventListener('selectstart', function (e) { e.preventDefault(); });
  document.addEventListener('dragstart', function (e) { e.preventDefault(); });
  window.addEventListener('resize', fitStage); window.addEventListener('orientationchange', fitStage); document.addEventListener('fullscreenchange', fitStage);
  document.addEventListener('visibilitychange', function () { if (document.hidden) save(); }); window.addEventListener('pagehide', save);
  document.addEventListener('pointerdown', function () { if (!T.cue) return; cueStop(true); T.cueTimer = setTimeout(function () { ringOn(); handShow(); }, 8000); }, true);
  fitStage(); watchControls();
  LMS.init().then(function (r) {
    var saved = r.savedState; if (!saved) { try { var j = lsGet(); saved = j ? JSON.parse(j) : null; } catch (e) { saved = null; } }
    if (saved && saved.v === 1) S = Object.assign(fresh(), saved);
    S.learnerId = r.learnerId || S.learnerId || ('anon-' + uid()); if (!cfg.start && !S.x.seed) S.x.seed = 'v1';
    if (r.status === 'submitted') S.submitted = true;
    if (S.submitted) S.step = SC.length - 1;
    D = null; if (S.x.seed) ensureData(); save(); render(); bridgeInit();
  });
}

var K = { alien: alien, typed: typed, nextCue: nextCue, pickScene: pickScene, numScene: numScene, slotScene: slotScene, startFor: startFor, shuffleOf: shuffle, say: say, fb: fbBox, footFor: footFor, settle: settle, svgPt: svgPt, money: money, cue: cue, burst: burst, xpNow: xpNow, run: run, $: $, $$: $$, esc: esc, rng: rng, shuffle: shuffle, hash: hash, talk: talk, coach: coach, keypad: keypad, padHtml: padHtml, dnd: dnd, setFoot: setFoot, go: go, next: function () { go(S.step + 1); }, save: save, render: render,
  S: function () { return S; }, D: ensureData, it: it, left: left, attempt: attempt, starLine: starLine, done: function (id) { return !!(S.items[id] && S.items[id].done); }, showLayer: showLayer, hideLayer: hideLayer, stagePt: stagePt, SFX: SFX, score: score, uid: uid, allDone: allDone, reset: function () { D = null; } };
window.Kit = K;
})();
