/* Story Dice Adventure (L1LC02): help Zibbo fuel a rocket with a story.
   Every task is a small machine to build or run (dial, dice, story wheels, story train, fix-it test, book cover, launch), not a quiz. */
'use strict';
(function () {
var C = window.CONTENT, K = Kit, $ = K.$, $$ = K.$$, WHO = C.hero;
var CH = [{ f: 'a brave little dragon', s: 'Dragon', e: '🐉' }, { f: 'a clever fox', s: 'Fox', e: '🦊' }, { f: 'a shy robot', s: 'Robot', e: '🤖' }, { f: 'a sleepy bear', s: 'Bear', e: '🐻' }, { f: 'a fast turtle', s: 'Turtle', e: '🐢' }, { f: 'a magic parrot', s: 'Parrot', e: '🦜' }];
var PL = [{ f: 'a floating island', s: 'Sky Island', e: '🏝️' }, { f: 'an underwater cave', s: 'Deep Cave', e: '🌊' }, { f: 'a busy market', s: 'Busy Market', e: '🛒' }, { f: 'a snowy mountain', s: 'Snow Peak', e: '🏔️' }, { f: 'a garden on the moon', s: 'Moon Garden', e: '🌙' }, { f: 'an old library', s: 'Old Library', e: '📚' }];
var PR = [{ f: 'lost the map home', s: 'Lost Map', e: '🗺️', ok: '🏠', fix: 'asked new friends for help and found a path home' }, { f: 'could not find a best friend', s: 'Missing Friend', e: '🔍', ok: '🤝', fix: 'followed the footprints and found the friend' }, { f: 'got stuck in a big storm', s: 'Big Storm', e: '⛈️', ok: '☀️', fix: 'built a little shelter and waited for the sun' }, { f: 'lost all the magic', s: 'Lost Magic', e: '💤', ok: '✨', fix: 'shared a kind word and the magic came back' }, { f: 'found a broken bridge', s: 'Broken Bridge', e: '🚧', ok: '🌉', fix: 'worked together to mend the bridge' }, { f: 'was hungry with no food', s: 'Empty Basket', e: '🧺', ok: '🍲', fix: 'swapped stories for a big warm meal' }];
var MOOD = [{ id: 'fun', e: '😄', t: 'Funny', sub: 'Lots of giggles', col: '#9FE3C9', bg: '#E2F7F0' }, { id: 'spooky', e: '👻', t: 'A bit spooky', sub: 'Shivers and surprises', col: '#B9A8FF', bg: '#EEECFF' }, { id: 'exc', e: '🚀', t: 'Exciting', sub: 'Fast and brave', col: '#FFB48A', bg: '#FFEDE5' }];
var SHARE = [{ id: 'read', e: '📖', t: 'Read it aloud', col: '#9FE3C9' }, { id: 'draw', e: '🖍️', t: 'Draw it', col: '#FFD98A' }, { id: 'act', e: '🎭', t: 'Act it out', col: '#FFB48A' }];
function at(i) { return (i === 0 || i === 3 ? 'on ' : 'in ') + PL[i].f; }
function cap(t) { return t.charAt(0).toUpperCase() + t.slice(1); }
function make(seed) { var r = Kit.rng(seed + 'roll'); return { c: Math.floor(r() * 6), p: Math.floor(r() * 6), q: Math.floor(r() * 6) }; }
window.DiceTest = function (n) { var bad = 0; for (var i = 0; i < n; i++) { var d = make('d' + i); if ([d.c, d.p, d.q].some(function (x) { return x < 0 || x > 5; })) bad++; } return bad; };
var PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
function die(n, cls) { var s = '<div class="die ' + (cls || '') + '">'; for (var i = 0; i < 9; i++) s += '<i class="' + ((PIPS[n] || []).indexOf(i) >= 0 ? 'on' : '') + '"></i>'; return s + '</div>'; }
function head(lines) { return K.talk(WHO, lines, '<div class="bub" id="fb" hidden></div>', 'sm'); }
function arrow(up) { return '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="' + (up ? 'M12 30 L24 18 L36 30' : 'M12 18 L24 30 L36 18') + '" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }
function side(left) { return '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="' + (left ? 'M30 12 L18 24 L30 36' : 'M18 12 L30 24 L18 36') + '" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }
function later(fn, ms) { setTimeout(function () { if ($('#content')) fn(); }, ms); }

var CSS = '.arrowb{min-width:0;width:150px;padding:0}' +
'.reel{width:430px;height:320px;border-radius:24px;background:#fff;border:3px solid var(--line);display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;box-shadow:var(--shadow)}.reel .em{font-size:130px;line-height:1}.reel .nm{font-size:38px;font-weight:900;margin-top:12px}.reel .tag{position:absolute;top:12px;left:14px;width:54px;height:54px;border-radius:50%;background:var(--pri-t);color:var(--pri-d);font-weight:900;font-size:30px;display:grid;place-items:center}.reel.bad{border-color:var(--badline);background:var(--bad)}.reel.good{border-color:var(--go);background:var(--go-t)}' +
'.rollnum{width:84px;height:84px;border-radius:22px;background:#fff;border:5px solid var(--ink);font-size:46px;font-weight:900;display:grid;place-items:center}' +
'.track{display:flex;gap:20px;align-items:flex-end;position:relative;padding-bottom:28px}.track::after{content:"";position:absolute;left:0;right:0;bottom:0;height:14px;border-radius:7px;background:repeating-linear-gradient(90deg,#CFC8F0 0 20px,transparent 20px 44px)}' +
'.engine{width:200px;height:210px;flex:0 0 200px;border-radius:40px 40px 18px 18px;background:var(--pri);padding:22px;position:relative}.engine::before,.engine::after,.car::before,.car::after{content:"";position:absolute;bottom:-20px;width:36px;height:36px;border-radius:50%;background:var(--ink);border:6px solid #fff}.engine::before,.car::before{left:40px}.engine::after,.car::after{right:40px}' +
'.cslot{width:500px;height:200px;flex:0 0 500px;border:3px dashed var(--line2);border-radius:22px;background:#FBFAFF;display:flex;align-items:center;justify-content:center;font-size:40px;font-weight:900;color:var(--line2)}.cslot.full{border:0;background:transparent}' +
'.car{width:500px;height:200px;border-radius:22px;border:3px solid var(--line);background:#fff;font:inherit;font-size:29px;line-height:1.3;font-weight:800;color:var(--ink);padding:14px 24px;text-align:left;cursor:pointer;position:relative;box-shadow:0 4px 0 var(--line);transition:transform .15s,border-color .15s}.car:hover:not(:disabled){transform:translateY(-2px);border-color:var(--line2)}.car.bad{border-color:var(--badline);background:var(--bad)}.car.good{border-color:var(--go);background:var(--go-t)}' +
'.tags{display:flex;gap:20px;margin:16px 0 0 220px}.tags span{width:500px;text-align:center;font-size:24px;font-weight:900;letter-spacing:2px;text-transform:uppercase;color:var(--pri)}' +
'.siding{display:flex;gap:20px;justify-content:center;margin-top:46px;min-height:220px}' +
'.scene{width:680px;height:500px;flex:0 0 680px;border-radius:30px;background:linear-gradient(160deg,#EEECFF,#E2F7F0);border:2px solid var(--line);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px}.scene .pair{display:flex;gap:50px;font-size:150px;line-height:1}.scene .pair span{display:inline-block}.scene .cap{font-size:34px;font-weight:900}.scene.win{background:linear-gradient(160deg,#FFF5D6,#E2F7F0)}' +
'.idea{width:1000px;min-height:130px;justify-content:flex-start}.idea.badc{border-color:var(--badline);background:var(--bad);opacity:.7}.idea.goodc{border-color:var(--go);background:var(--go-t)}' +
'.book{width:740px;height:560px;flex:0 0 740px;border-radius:18px 36px 36px 18px;background:linear-gradient(140deg,#B9A8FF,#9C88F5);box-shadow:inset 22px 0 0 #8A75EE,var(--shadow);padding:50px 56px 34px 84px;display:flex;flex-direction:column;justify-content:space-between;color:#fff}.book .t{font-size:50px;font-weight:900;line-height:1.75}.book .by{display:flex;align-items:center;gap:18px;font-size:28px;font-weight:800}' +
'.gap{display:inline-flex;min-width:210px;height:78px;border:3px dashed #fff;border-radius:16px;vertical-align:middle;align-items:center;justify-content:center;padding:0 20px;font:inherit;font-size:42px;font-weight:900;color:var(--ink);background:#ffffff40;cursor:pointer;margin:0 6px}.gap.full{background:#fff;border-style:solid}.gap.bad{background:var(--bad);border-color:var(--badline)}.gap.good{background:var(--go-t);border-color:var(--go)}' +
'.wt{width:400px;min-height:100px;justify-content:center;text-align:center;font-size:36px}' +
'.space{position:relative;height:610px;border-radius:30px;background:radial-gradient(circle at 12% 30%,#fff 0 3px,transparent 4px),radial-gradient(circle at 70% 12%,#fff 0 3px,transparent 4px),radial-gradient(circle at 88% 70%,#fff 0 4px,transparent 5px),linear-gradient(180deg,#E6E1FF,#FFF1EA);border:2px solid var(--line);overflow:hidden}' +
'.planet{position:absolute;top:40px;width:320px;display:flex;flex-direction:column;align-items:center;gap:16px;cursor:pointer}.orb{width:210px;height:210px;border-radius:50%;display:grid;place-items:center;font-size:104px;box-shadow:inset -22px -18px 0 #00000012;transition:box-shadow .2s}.planet.sel .orb{box-shadow:inset -22px -18px 0 #00000012,0 0 0 8px var(--gold)}' +
'.rocket{position:absolute;left:70px;top:430px;font-size:120px;line-height:1;transition:left 1s ease-in-out,top 1s ease-in-out}' +
'.gauge g[data-z]{cursor:pointer}.needle{transition:transform .45s ease}.mprev{width:560px;height:360px;flex:0 0 560px;border-radius:30px;border:2px solid var(--line);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;transition:background-color .3s}.mprev .em{font-size:130px;line-height:1}.mprev .tt{font-size:46px;font-weight:900}.mprev .sb{font-size:30px;color:var(--muted);font-weight:700}';
var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

var scenes = [];

/* 1. Mood dial (not scored): turn the dial, the preview changes live */
scenes.push({ id: 'mood', name: 'Story mood', render: function (el) {
  var S = K.S(), cx = 320, cy = 320;
  function p(a, r) { var t = a * Math.PI / 180; return (cx + r * Math.cos(t)).toFixed(1) + ' ' + (cy + r * Math.sin(t)).toFixed(1); }
  function arc(a0, a1) { return 'M' + p(a0, 290) + ' A290 290 0 0 1 ' + p(a1, 290) + ' L' + p(a1, 150) + ' A150 150 0 0 0 ' + p(a0, 150) + ' Z'; }
  var g = '<svg class="gauge" viewBox="0 0 640 350" width="640" height="350" aria-hidden="true">' + MOOD.map(function (m, i) { var a0 = 180 + i * 60, q = p(a0 + 30, 222).split(' '); return '<g data-z="' + i + '"><path d="' + arc(a0 + 1.5, a0 + 58.5) + '" fill="' + m.col + '"/><text x="' + q[0] + '" y="' + (+q[1] + 24) + '" font-size="84" text-anchor="middle">' + m.e + '</text></g>'; }).join('') +
    '<g class="needle" id="needle" style="transform-origin:320px 320px"><line x1="320" y1="320" x2="320" y2="120" stroke="#2B2A4C" stroke-width="12" stroke-linecap="round"/></g><circle cx="320" cy="320" r="26" fill="#2B2A4C"/></svg>';
  el.innerHTML = head(['Hi! I am <b>Zibbo</b>. My rocket runs on <b>stories</b>, and the tank is empty!', { q: 'Turn the dial. What kind of story shall we make?' }]) +
    '<div class="after row" style="margin-top:28px;justify-content:center;align-items:center;gap:80px"><div class="col" style="align-items:center;gap:18px">' + g + '<div class="row" style="gap:24px"><button class="btn soft arrowb" id="dl" aria-label="Turn left">' + side(true) + '</button><button class="btn soft arrowb" id="dr" aria-label="Turn right">' + side(false) + '</button></div></div><div class="mprev" id="mprev"></div></div>';
  function idx() { for (var i = 0; i < MOOD.length; i++) if (MOOD[i].id === S.x.mood) return i; return -1; }
  function paint() {
    var i = idx(), m = MOOD[i]; $('#needle').style.transform = 'rotate(' + (i < 0 ? -90 : (i - 1) * 60) + 'deg)';
    $('#mprev').style.background = m ? m.bg : '#fff'; $('#mprev').innerHTML = m ? '<div class="em">' + m.e + '</div><div class="tt">' + m.t + '</div><div class="sb">' + m.sub + '</div>' : '<div class="em" style="color:var(--line2);font-weight:900">?</div>';
    K.setFoot({ main: 'Next', en: i >= 0, go: K.next });
  }
  function set(i) { S.x.mood = MOOD[(i + 3) % 3].id; K.save(); K.SFX.tap(); paint(); K.nextCue(); }
  $('#dl').addEventListener('click', function () { var i = idx(); set(i < 0 ? 0 : i - 1); });
  $('#dr').addEventListener('click', function () { set(idx() + 1); });
  $$('g[data-z]', el).forEach(function (z) { z.addEventListener('click', function () { set(+z.dataset.z); }); });
  K.solve = function () { set(0); }; paint();
  if (idx() < 0) K.cue({ ring: '#dr', seq: ['#dr', '#dr'] }); else K.nextCue();
} });

/* 2. Roll the dice (not scored) */
scenes.push({ id: 'dice', name: 'Roll the dice', render: function (el) {
  var S = K.S(), D = K.D(), n = S.x.rolled || 0, rolls = [D.c, D.p, D.q], names = ['Character', 'Place', 'Problem'];
  el.innerHTML = head([{ q: 'Roll three times. Each number picks a story piece!' }]) +
    '<div class="after row" style="margin-top:40px;align-items:center;justify-content:center;gap:90px"><div class="col" style="align-items:center;gap:30px"><div id="dd">' + die(n ? rolls[n - 1] + 1 : 1) + '</div><button class="btn gold" id="roll" style="min-width:260px">Roll</button></div><div class="col" id="got" style="gap:20px"></div></div>';
  function rs() {
    $('#got').innerHTML = names.map(function (nm, i) { var on = i < n; return '<div class="card" style="width:560px;display:flex;align-items:center;gap:26px;padding:16px 26px;' + (on ? 'border-color:var(--go);background:var(--go-t)' : i === n ? 'border-color:var(--gold-d)' : 'opacity:.55') + '"><div style="font-size:64px;font-weight:900;width:70px;text-align:center;color:var(--pri-d)">' + (on ? rolls[i] + 1 : '?') + '</div><div style="font-size:34px;font-weight:900">' + nm + '</div></div>'; }).join('');
    $('#roll').disabled = n >= 3; K.setFoot({ main: 'Next', en: n >= 3, go: K.next });
    if (n >= 3) K.nextCue(); else K.cue({ ring: '#roll', seq: ['#roll'], delay: n ? 2500 : 900 });
  }
  $('#roll').addEventListener('click', function () { if (n >= 3) return; $('#roll').disabled = true; $('#dd').innerHTML = die(rolls[n] + 1, 'tumble'); n++; S.x.rolled = n; K.save(); K.SFX.ok(); later(rs, 750); });
  K.solve = function () { n = 3; S.x.rolled = 3; $('#dd').innerHTML = die(rolls[2] + 1); rs(); }; rs();
} });

/* 3. Story machine: turn three wheels to the rolled numbers */
scenes.push({ id: 'pieces', name: 'Story machine', items: ['pieces'], render: function (el) {
  var S = K.S(), D = K.D(), rolls = [D.c, D.p, D.q], lists = [CH, PL, PR], names = ['Character', 'Place', 'Problem'], done = K.done('pieces');
  var pos = S.x.reel = S.x.reel || [0, 0, 0], touched = !!S.x.reelT, bad = {};
  if (done) S.x.reel = pos = rolls.slice();
  el.innerHTML = head(['Your numbers are in! The story machine needs them.', { q: 'Turn each wheel to <b>your number</b>.' }]) +
    '<div class="after row" style="margin-top:22px;justify-content:center;gap:60px">' + names.map(function (nm, i) { return '<div class="col" style="align-items:center;gap:12px"><div class="row" style="align-items:center;gap:16px"><span class="eyebrow">' + nm + '</span><span class="rollnum">' + (rolls[i] + 1) + '</span></div><button class="btn soft arrowb" data-r="' + i + '" data-d="-1" aria-label="' + nm + ' wheel up">' + arrow(true) + '</button><div class="reel" id="reel' + i + '"></div><button class="btn soft arrowb" data-r="' + i + '" data-d="1" aria-label="' + nm + ' wheel down">' + arrow(false) + '</button></div>'; }).join('') + '</div>';
  function paint() {
    for (var i = 0; i < 3; i++) { var it = lists[i][pos[i]], r = $('#reel' + i); r.className = 'reel' + (done ? ' good' : bad[i] ? ' bad' : ''); r.innerHTML = '<span class="tag">' + (pos[i] + 1) + '</span><span class="em">' + it.e + '</span><span class="nm">' + it.s + '</span>'; }
    $$('[data-r]', el).forEach(function (b) { b.disabled = done; });
    K.footFor('pieces', touched, check);
  }
  function check() {
    var wrong = [0, 1, 2].filter(function (i) { return pos[i] !== rolls[i]; });
    var s = K.settle('pieces', !wrong.length, pos.join(','), 'The machine hums. Zibbo’s tank is filling up!', '', CH[D.c].s + ', ' + PL[D.p].s + ' and ' + PR[D.q].s + '.');
    if (s.done) { done = true; S.x.reel = pos = rolls.slice(); bad = {}; paint(); K.save(); return; }
    bad = {}; wrong.forEach(function (i) { bad[i] = 1; }); paint();
    K.cue({ item: 'pieces', ring: '#reel' + wrong[0], seq: ['[data-r="' + wrong[0] + '"][data-d="1"]', '[data-r="' + wrong[0] + '"][data-d="1"]'], delay: 900 });
  }
  el.addEventListener('click', function (e) { var b = e.target.closest('[data-r]'); if (!b || done) return; var i = +b.dataset.r; pos[i] = (pos[i] + (+b.dataset.d) + 6) % 6; delete bad[i]; touched = S.x.reelT = true; K.save(); K.SFX.tap(); paint(); });
  K.solve = function () { S.x.reel = pos = rolls.slice(); touched = true; paint(); check(); };
  paint(); if (done) K.fb('<b>Done.</b> ' + CH[D.c].s + ', ' + PL[D.p].s + ' and ' + PR[D.q].s + '.'); else if (!touched) K.cue({ item: 'pieces', ring: '.reel', seq: ['[data-r="0"][data-d="1"]', '[data-r="1"][data-d="1"]', '[data-r="2"][data-d="1"]'] });
} });

/* 4. Story train: couple the cars behind the engine in story order */
scenes.push({ id: 'order', name: 'Story train', items: ['order'], render: function (el) {
  var S = K.S(), D = K.D(), done = K.done('order'), bad = {};
  var cars = [{ id: 'b1', t: 'Once upon a time, ' + CH[D.c].f + ' lived ' + at(D.p) + '.' }, { id: 'm1', t: 'One day, ' + CH[D.c].f.replace(/^an? /, 'the ') + ' ' + PR[D.q].f + '.' }, { id: 'e1', t: 'In the end, everything turned out well.' }], truth = ['b1', 'm1', 'e1'];
  var order = K.shuffleOf(cars, K.rng(S.learnerId + 'train')), tr = S.x.train = S.x.train || [null, null, null];
  if (done) S.x.train = tr = truth.slice();
  function car(c, where) { return '<button class="car' + (done ? ' good' : bad[where] ? ' bad' : '') + '" data-c="' + c.id + '"' + (done ? ' disabled' : '') + '>' + c.t + '</button>'; }
  el.innerHTML = head(['Every story has a <b>beginning</b>, a <b>middle</b> and an <b>end</b>.', { q: 'Build the story train. Tap the cars in story order.' }]) +
    '<div class="after" style="margin-top:20px"><div class="track"><div class="engine" aria-hidden="true">' + K.alien(WHO.alien) + '</div><div class="cslot"></div><div class="cslot"></div><div class="cslot"></div></div><div class="tags"><span>Beginning</span><span>Middle</span><span>End</span></div><div class="siding" id="siding"></div></div>';
  function byId(id) { return cars.filter(function (c) { return c.id === id; })[0]; }
  function paint() {
    $$('.cslot', el).forEach(function (s, i) { s.className = 'cslot' + (tr[i] ? ' full' : ''); s.innerHTML = tr[i] ? car(byId(tr[i]), i) : String(i + 1); });
    $('#siding').innerHTML = order.filter(function (c) { return tr.indexOf(c.id) < 0; }).map(function (c) { return car(c, 'x'); }).join('');
    var n = tr.filter(Boolean).length; K.footFor('order', n === 3, check, '', n ? retry : null);
  }
  function retry() { S.x.train = tr = [null, null, null]; bad = {}; K.save(); paint(); K.cue({ item: 'order', ring: '#siding .car', seq: ['#siding .car'], delay: 500 }); }
  function check() {
    var wrong = [0, 1, 2].filter(function (i) { return tr[i] !== truth[i]; });
    var s = K.settle('order', !wrong.length, tr.join(','), 'Choo choo! First we meet them, then trouble comes, then it all works out.', '', 'Beginning: meet the character. Middle: the problem. End: it works out.');
    if (s.done) { done = true; S.x.train = tr = truth.slice(); bad = {}; paint(); K.save(); return; }
    bad = {}; wrong.forEach(function (i) { bad[i] = 1; }); paint();
    later(function () { wrong.forEach(function (i) { tr[i] = null; }); bad = {}; K.save(); paint(); K.cue({ item: 'order', ring: '#siding .car', seq: ['#siding .car'], delay: 300 }); }, 1100);
  }
  el.addEventListener('click', function (e) {
    var b = e.target.closest('.car'); if (!b || done) return; var id = b.dataset.c, a = tr.indexOf(id);
    if (a >= 0) tr[a] = null; else { var f = tr.indexOf(null); if (f < 0) return; tr[f] = id; }
    K.SFX.tap(); K.save(); paint();
  });
  K.solve = function () { S.x.train = tr = truth.slice(); paint(); check(); };
  paint(); if (done) K.fb('<b>Done.</b> Beginning, middle, end.'); else if (!tr.some(Boolean)) K.cue({ item: 'order', ring: '#siding .car', seq: ['#siding .car'] });
} });

/* 5. Fix-it test: try an idea and watch whether the problem goes away */
scenes.push({ id: 'ending', name: 'Fix the problem', items: ['ending'], render: function (el) {
  var S = K.S(), D = K.D(), done = K.done('ending'), tried = S.x.tried = S.x.tried || [], sel = null;
  var ideas = K.shuffleOf([D.q, (D.q + 2) % 6, (D.q + 4) % 6], K.rng(S.learnerId + 'ideas'));
  el.innerHTML = head(['Oh no! ' + cap(CH[D.c].f.replace(/^an? /, 'the ')) + ' ' + PR[D.q].f + '.', { q: 'Test an idea. Does it fix the problem?' }]) +
    '<div class="after row" style="margin-top:24px;align-items:center;gap:56px"><div class="scene" id="scene"></div><div class="col" style="gap:20px">' + ideas.map(function (i) { return '<button class="pick idea" data-i="' + i + '">They ' + PR[i].fix + '.</button>'; }).join('') + '</div></div>';
  function paint(win) {
    var sc = $('#scene'); win = done || win;
    sc.className = 'scene' + (win ? ' win' : ''); sc.innerHTML = '<div class="pair"><span>' + CH[D.c].e + '</span><span id="pe">' + (win ? PR[D.q].ok : PR[D.q].e) + '</span></div><div class="cap">' + (win ? 'Problem fixed!' : PR[D.q].s) + '</div>';
    $$('.idea', el).forEach(function (b) { var i = +b.dataset.i; b.classList.toggle('sel', sel === i); b.classList.toggle('badc', tried.indexOf(i) >= 0); b.classList.toggle('goodc', done && i === D.q); b.disabled = done || tried.indexOf(i) >= 0; });
    K.footFor('ending', sel !== null, check);
  }
  function check() {
    var ok = sel === D.q, s = K.settle('ending', ok, String(sel), 'Look! That idea fixes it.', '', 'They ' + PR[D.q].fix + '.');
    if (s.done) { done = true; sel = null; paint(true); if (ok) K.burst(400, 420); return; }
    tried.push(sel); sel = null; K.save(); paint();
    var pe = $('#pe'); if (pe) pe.classList.add('shake');
    K.cue({ item: 'ending', ring: '.idea:not(:disabled)', seq: ['.idea:not(:disabled)'], delay: 900 });
  }
  el.addEventListener('click', function (e) { var b = e.target.closest('.idea'); if (!b || b.disabled) return; sel = +b.dataset.i; K.SFX.tap(); paint(); });
  K.solve = function () { sel = D.q; paint(); check(); };
  paint(); if (done) K.fb('<b>Done.</b> They ' + PR[D.q].fix + '.'); else K.cue({ item: 'ending', ring: '.idea', seq: ['.idea:not(:disabled)'] });
} });

/* 6. Book cover: build the title from word tiles */
scenes.push({ id: 'title', name: 'Book cover', items: ['title'], render: function (el) {
  var S = K.S(), D = K.D(), done = K.done('title'), bad = {};
  var words = [CH[D.c].s, CH[(D.c + 1) % 6].s, CH[(D.c + 3) % 6].s, PR[D.q].s, PR[(D.q + 2) % 6].s, PR[(D.q + 4) % 6].s], truth = [CH[D.c].s, PR[D.q].s];
  var pool = K.shuffleOf(words, K.rng(S.learnerId + 'words')), gp = S.x.gaps = S.x.gaps || [null, null];
  if (done) S.x.gaps = gp = truth.slice();
  el.innerHTML = head(['Last job! Every book needs a name.', { q: 'Build a title with <b>your hero</b> and <b>the problem</b>.' }]) +
    '<div class="after row" style="margin-top:24px;align-items:center;justify-content:center;gap:60px"><div class="book"><div class="t" id="bt"></div><div class="by"><div style="width:110px">' + K.alien(WHO.alien) + '</div>A story by me</div></div><div style="display:grid;grid-template-columns:repeat(2,400px);gap:18px" id="tiles"></div></div>';
  function paint() {
    $('#bt').innerHTML = 'The ' + [0, 1].map(function (i) { return '<button class="gap' + (gp[i] ? ' full' : '') + (done ? ' good' : bad[i] ? ' bad' : '') + '" data-g="' + i + '"' + (done ? ' disabled' : '') + ' aria-label="Gap ' + (i + 1) + '">' + (gp[i] || '') + '</button>'; }).join(' and the ');
    $('#tiles').innerHTML = pool.map(function (w) { var used = gp.indexOf(w) >= 0; return '<button class="pick wt" data-w="' + w + '"' + (used || done ? ' disabled style="visibility:hidden"' : '') + '>' + w + '</button>'; }).join('');
    var n = gp.filter(Boolean).length; K.footFor('title', n === 2, check, '', n ? retry : null);
  }
  function retry() { S.x.gaps = gp = [null, null]; bad = {}; K.save(); paint(); K.cue({ item: 'title', ring: '.wt:not(:disabled)', seq: ['.wt:not(:disabled)'], delay: 500 }); }
  function check() {
    var wrong = [0, 1].filter(function (i) { return gp[i] !== truth[i]; });
    var s = K.settle('title', !wrong.length, gp.join('|'), 'It names your hero and the problem. Readers will want to know more!', '', 'The ' + truth[0] + ' and the ' + truth[1] + '.');
    if (s.done) { done = true; S.x.gaps = gp = truth.slice(); bad = {}; paint(); K.save(); return; }
    bad = {}; wrong.forEach(function (i) { bad[i] = 1; }); paint();
    later(function () { wrong.forEach(function (i) { gp[i] = null; }); bad = {}; K.save(); paint(); K.cue({ item: 'title', ring: '.wt:not(:disabled)', seq: ['.wt:not(:disabled)'], delay: 300 }); }, 1100);
  }
  el.addEventListener('click', function (e) {
    if (done) return; var g = e.target.closest('.gap'), w = e.target.closest('.wt');
    if (g && gp[+g.dataset.g]) gp[+g.dataset.g] = null; else if (w && !w.disabled) { var f = gp.indexOf(null); if (f < 0) return; gp[f] = w.dataset.w; } else return;
    K.SFX.tap(); K.save(); paint();
  });
  K.solve = function () { S.x.gaps = gp = truth.slice(); paint(); check(); };
  paint(); if (done) K.fb('<b>Done.</b> The ' + truth[0] + ' and the ' + truth[1] + '.'); else if (!gp.some(Boolean)) K.cue({ item: 'title', ring: '.wt', seq: ['.wt'] });
} });

/* 7. Launch (not scored): tap a planet and the rocket flies there */
scenes.push({ id: 'share', name: 'Launch', render: function (el) {
  var S = K.S(), X = [130, 736, 1342];
  el.innerHTML = head(['Woohoo! The tank is full of <b>story power</b>.', { q: 'Where should Zibbo fly your story?' }]) +
    '<div class="after space" style="margin-top:22px">' + SHARE.map(function (p, i) { return '<div class="planet" data-p="' + p.id + '" style="left:' + X[i] + 'px"><div class="orb" style="background:' + p.col + '" aria-hidden="true">' + p.e + '</div><button class="btn soft">' + p.t + '</button></div>'; }).join('') + '<div class="rocket" id="rk" aria-hidden="true">🚀</div></div>';
  function paint() {
    var i = -1; SHARE.forEach(function (p, j) { if (p.id === S.x.share) i = j; });
    $$('.planet', el).forEach(function (p) { p.classList.toggle('sel', p.dataset.p === S.x.share); });
    var rk = $('#rk'); if (i >= 0) { rk.style.left = (X[i] + 100) + 'px'; rk.style.top = '330px'; }
    K.setFoot({ main: 'Finish', cls: 'go', en: i >= 0, go: K.next });
  }
  el.addEventListener('click', function (e) { var p = e.target.closest('.planet'); if (!p) return; S.x.share = p.dataset.p; K.save(); K.SFX.ok(); paint(); K.nextCue(); });
  K.solve = function () { S.x.share = 'read'; paint(); };
  paint(); if (S.x.share) K.nextCue(); else K.cue({ ring: '.orb', seq: ['.planet:nth-of-type(1) .orb', '.planet:nth-of-type(2) .orb', '.planet:nth-of-type(3) .orb'] });
} });

function chain(S, D) {
  var m = MOOD.filter(function (x) { return x.id === S.x.mood; })[0] || MOOD[0], sh = SHARE.filter(function (x) { return x.id === S.x.share; })[0] || SHARE[0];
  return [
    { choice: 'Mood: ' + m.t, consequence: 'You chose a ' + m.t.toLowerCase() + ' story and rolled the dice three times.' },
    { choice: 'The rolls: ' + (D.c + 1) + ', ' + (D.p + 1) + ', ' + (D.q + 1), consequence: 'Your character is ' + CH[D.c].f + ', the place is ' + PL[D.p].f + ' and the problem is that they ' + PR[D.q].f + '.' },
    { choice: 'Story shape', consequence: 'Beginning: meet the character. Middle: the problem. End: everything is solved.' },
    { choice: 'The ending', consequence: 'They ' + PR[D.q].fix + '.' },
    { choice: 'Sharing: ' + sh.t, consequence: 'Your story “The ' + CH[D.c].s + ' and the ' + PR[D.q].s + '” will be shared: ' + sh.t.toLowerCase() + '.' }
  ];
}
K.run({
  C: C, scenes: scenes, makeData: make, chain: chain,
  preview: function (S) { S.x.seed = S.x.seed || 'v1'; S.x.mood = S.x.mood || 'fun'; S.x.share = S.x.share || 'read'; },
  summaryHtml: function (S, D) { return '<div class="row" style="align-items:center"><div style="width:220px;flex:0 0 220px">' + K.alien(WHO.alien) + '</div><div class="grow"><div class="eyebrow">My story</div><p class="q" style="margin:10px 0">The ' + CH[D.c].s + ' and the ' + PR[D.q].s + '</p><p class="lead">' + cap(CH[D.c].f) + ' ' + at(D.p) + '.</p></div></div>'; },
  dataHtml: function (S, D) { return '<div class="card" style="height:100%;display:flex;align-items:center;gap:60px;padding:40px 70px"><div style="width:300px;flex:0 0 300px">' + K.alien(WHO.alien) + '</div><div class="grow" style="font-size:40px;line-height:1.5"><p class="q" style="font-size:56px;margin-bottom:24px">The ' + CH[D.c].s + ' and the ' + PR[D.q].s + '</p><p><b>Beginning:</b> Once upon a time, ' + CH[D.c].f + ' lived ' + at(D.p) + '.</p><p><b>Middle:</b> One day, the ' + CH[D.c].s.toLowerCase() + ' ' + PR[D.q].f + '.</p><p><b>End:</b> They ' + PR[D.q].fix + '.</p></div></div>'; },
  pdfData: function (pdf, S, D, col) {
    var y = 100; pdf.text(40, y, 'The ' + CH[D.c].s + ' and the ' + PR[D.q].s, 18, true, col); y += 30; pdf.text(40, y, 'Dice rolls: ' + (D.c + 1) + ', ' + (D.p + 1) + ', ' + (D.q + 1), 11, false, '#4A6479');
    y += 34; pdf.text(40, y, 'Beginning', 12, true, col); y = pdf.para(40, y + 18, 'Once upon a time, ' + CH[D.c].f + ' lived ' + at(D.p) + '.', 12, 95, 16, false, '#17324D') + 14;
    pdf.text(40, y, 'Middle', 12, true, col); y = pdf.para(40, y + 18, 'One day, the ' + CH[D.c].s.toLowerCase() + ' ' + PR[D.q].f + '.', 12, 95, 16, false, '#17324D') + 14; pdf.text(40, y, 'End', 12, true, col); pdf.para(40, y + 18, 'They ' + PR[D.q].fix + '.', 12, 95, 16, false, '#17324D');
  }
});
})();
