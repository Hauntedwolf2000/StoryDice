/* Story Dice Adventure (L1LC02): roll three dice for a character, a place and a problem, then shape a story. */
'use strict';
(function () {
var C = window.CONTENT, K = Kit, $ = K.$, WHO = C.hero;
var CH = [{ f: 'a brave little dragon', s: 'Dragon' }, { f: 'a clever fox', s: 'Fox' }, { f: 'a shy robot', s: 'Robot' }, { f: 'a sleepy bear', s: 'Bear' }, { f: 'a fast turtle', s: 'Turtle' }, { f: 'a magic parrot', s: 'Parrot' }];
var PL = [{ f: 'a floating island', s: 'Sky Island' }, { f: 'an underwater cave', s: 'Deep Cave' }, { f: 'a busy market', s: 'Busy Market' }, { f: 'a snowy mountain', s: 'Snow Peak' }, { f: 'a garden on the moon', s: 'Moon Garden' }, { f: 'an old library', s: 'Old Library' }];
var PR = [{ f: 'lost the map home', s: 'Lost Map', fix: 'asked new friends for help and found a path home' }, { f: 'could not find a best friend', s: 'Missing Friend', fix: 'followed the footprints and found the friend' }, { f: 'got stuck in a big storm', s: 'Big Storm', fix: 'built a little shelter and waited for the sun' }, { f: 'lost all the magic', s: 'Lost Magic', fix: 'shared a kind word and the magic came back' }, { f: 'found a broken bridge', s: 'Broken Bridge', fix: 'worked together to mend the bridge' }, { f: 'was hungry with no food', s: 'Empty Basket', fix: 'swapped stories for a big warm meal' }];
var MOOD = [{ id: 'fun', e: '😄', t: 'Funny', sub: 'Lots of giggles' }, { id: 'spooky', e: '👻', t: 'A bit spooky', sub: 'Shivers and surprises' }, { id: 'exc', e: '🚀', t: 'Exciting', sub: 'Fast and brave' }];
var SHARE = [{ id: 'read', e: '📖', t: 'Read it aloud', sub: 'To my family' }, { id: 'draw', e: '🖍️', t: 'Draw it', sub: 'Make a picture book' }, { id: 'act', e: '🎭', t: 'Act it out', sub: 'With my friends' }];
function at(i) { return (i === 0 || i === 3 ? 'on ' : 'in ') + PL[i].f; }
function make(seed) { var r = Kit.rng(seed + 'roll'); return { c: Math.floor(r() * 6), p: Math.floor(r() * 6), q: Math.floor(r() * 6) }; }
window.DiceTest = function (n) { var bad = 0; for (var i = 0; i < n; i++) { var d = make('d' + i); if ([d.c, d.p, d.q].some(function (x) { return x < 0 || x > 5; })) bad++; } return bad; };
var PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
function die(n, cls) { var s = '<div class="die ' + (cls || '') + '">'; for (var i = 0; i < 9; i++) s += '<i class="' + ((PIPS[n] || []).indexOf(i) >= 0 ? 'on' : '') + '"></i>'; return s + '</div>'; }
function tableTop() { return '<table class="t tight" style="font-size:28px;margin-top:10px"><thead><tr><th class="n" style="width:60px">#</th><th>Character</th><th>Place</th><th>Problem</th></tr></thead><tbody>' + CH.map(function (c, i) { return '<tr><td class="n"><b>' + (i + 1) + '</b></td><td>' + c.f + '</td><td>' + PL[i].f + '</td><td>' + PR[i].f + '</td></tr>'; }).join('') + '</tbody></table>'; }
var scenes = [];
var NAMES = ['Character', 'Place', 'Problem'];
scenes.push(K.pickScene({ id: 'mood', key: 'mood', name: 'Story mood', lines: function () { return ['Hi! I am <b>Zibbo</b>. My rocket runs on <b>stories</b>, and the tank is empty!', { q: 'What kind of story shall we make?' }]; }, opts: function () { return MOOD; } }));
scenes.push({ id: 'dice', name: 'Roll the dice', render: function (el) {
  var S = K.S(), D = K.D(), n = S.x.rolled || 0, rolls = [D.c, D.p, D.q];
  el.innerHTML = K.talk(WHO, [{ q: 'Roll three times. Each number picks a story piece!' }], '', 'sm') +
    '<div class="row" style="margin-top:40px;align-items:center;justify-content:center;gap:90px"><div class="col" style="align-items:center;gap:30px"><div id="dd">' + die(n ? rolls[n - 1] + 1 : 1) + '</div><button class="btn gold" id="roll" style="min-width:260px">Roll</button></div><div class="col" id="got" style="gap:20px"></div></div>';
  function rs() {
    $('#got').innerHTML = NAMES.map(function (nm, i) { var on = i < n; return '<div class="card" style="width:560px;display:flex;align-items:center;gap:26px;padding:16px 26px;' + (on ? 'border-color:var(--go);background:var(--go-t)' : i === n ? 'border-color:var(--gold-d)' : 'opacity:.55') + '"><div style="font-size:64px;font-weight:900;width:70px;text-align:center;color:var(--pri-d)">' + (on ? rolls[i] + 1 : '?') + '</div><div style="font-size:34px;font-weight:900">' + nm + '</div></div>'; }).join('');
    $('#roll').disabled = n >= 3; K.setFoot({ main: 'Next', en: n >= 3, go: K.next });
    if (n >= 3) K.cue({ ring: '#b-main', seq: ['#b-main'], delay: 1500 }); else K.cue({ ring: '#roll', seq: ['#roll'], delay: n ? 2500 : 900 });
  }
  $('#roll').addEventListener('click', function () { if (n >= 3) return; $('#roll').disabled = true; $('#dd').innerHTML = die(rolls[n] + 1, 'tumble'); n++; S.x.rolled = n; K.save(); K.SFX.ok(); setTimeout(rs, 750); });
  K.solve = function () { n = 3; S.x.rolled = 3; $('#dd').innerHTML = die(rolls[2] + 1); rs(); }; rs();
} });
scenes.push(K.slotScene({ id: 'pieces', name: 'Story pieces', sw: 900, pc: 2, lw: 260, ls: 26, sh: 88, ch: 60, fs: 26, poolLabel: 'Story pieces',
  say: function () { return 'Find <b>your numbers</b> in the table. Drag each piece to its box.'; },
  top: function () { return tableTop(); },
  slots: function (D) { return [{ id: 'who', label: 'Character ' + (D.c + 1) }, { id: 'where', label: 'Place ' + (D.p + 1) }, { id: 'what', label: 'Problem ' + (D.q + 1) }]; },
  chips: function (D) { var c = [{ id: 'c_' + D.c, t: CH[D.c].f }, { id: 'p_' + D.p, t: PL[D.p].f }, { id: 'q_' + D.q, t: PR[D.q].f }], o = [(D.c + 2) % 6, (D.p + 3) % 6, (D.q + 4) % 6]; c.push({ id: 'c_' + o[0], t: CH[o[0]].f }); c.push({ id: 'p_' + o[1], t: PL[o[1]].f }); c.push({ id: 'q_' + o[2], t: PR[o[2]].f }); return c; },
  accept: function (id, slot) { return id.charAt(0) === { who: 'c', where: 'p', what: 'q' }[slot]; },
  truth: function (D) { return { who: 'c_' + D.c, where: 'p_' + D.p, what: 'q_' + D.q }; },
  good: function () { return 'What an adventure! Zibbo’s tank is filling up.'; },
  reveal: function (D) { return CH[D.c].f + ', ' + PL[D.p].f + ', and the problem: ' + PR[D.q].f + '.'; } }));
scenes.push(K.slotScene({ id: 'order', name: 'Beginning, middle, end', sw: 1000, lw: 210, ls: 32, sh: 190, ch: 150, fs: 36, top: function () { return '<div style="height:40px"></div>'; }, poolLabel: 'Story parts',
  say: function () { return 'Every story has a <b>beginning</b>, a <b>middle</b> and an <b>end</b>. Put yours in order.'; },
  slots: function () { return [{ id: 'b', label: 'Beginning' }, { id: 'm', label: 'Middle' }, { id: 'e', label: 'End' }]; },
  chips: function (D) { return [{ id: 'e1', t: 'In the end, everything turned out well.' }, { id: 'b1', t: 'Once upon a time, ' + CH[D.c].f + ' lived ' + at(D.p) + '.' }, { id: 'm1', t: 'One day, ' + CH[D.c].f.replace(/^an? /, 'the ') + ' ' + PR[D.q].f + '.' }]; },
  truth: function () { return { b: 'b1', m: 'm1', e: 'e1' }; },
  good: function () { return 'First we meet them, then trouble comes, then it all works out.'; },
  reveal: function () { return 'Beginning: meet the character. Middle: the problem. End: it works out.'; } }));
scenes.push(K.slotScene({ id: 'ending', name: 'The ending', sw: 900, lw: 200, ls: 32, sh: 300, ch: 150, fs: 36, top: function () { return '<div style="height:40px"></div>'; }, poolLabel: 'Endings',
  say: function (D) { return 'Oh no! ' + CH[D.c].f.replace(/^an? /, 'The ') + ' ' + PR[D.q].f + '. Which ending <b>fixes it</b>?'; },
  slots: function () { return [{ id: 'end', label: 'The ending' }]; },
  chips: function (D) { return [D.q, (D.q + 2) % 6, (D.q + 4) % 6].map(function (i) { return { id: 'f_' + i, t: 'They ' + PR[i].fix + '.' }; }); },
  truth: function (D) { return { end: 'f_' + D.q }; },
  good: function () { return 'That ending fixes the problem. Phew!'; },
  reveal: function (D) { return 'They ' + PR[D.q].fix + '.'; } }));
scenes.push(K.slotScene({ id: 'title', name: 'The title', sw: 900, lw: 300, ls: 32, sh: 300, ch: 150, fs: 40, top: function () { return '<div style="height:40px"></div>'; }, poolLabel: 'Titles',
  say: function () { return 'Last one! Give your story a <b>name</b>.'; },
  slots: function () { return [{ id: 'title', label: 'My story is called' }]; },
  chips: function (D) { return [{ id: 't_0', t: 'The ' + CH[D.c].s + ' and the ' + PR[D.q].s }, { id: 't_1', t: 'The ' + CH[(D.c + 1) % 6].s + ' and the ' + PR[(D.q + 2) % 6].s }, { id: 't_2', t: 'The ' + CH[(D.c + 3) % 6].s + ' and the ' + PR[(D.q + 4) % 6].s }]; },
  truth: function () { return { title: 't_0' }; },
  good: function () { return 'It names your hero and the problem. Readers will want to know more!'; },
  reveal: function (D) { return 'The ' + CH[D.c].s + ' and the ' + PR[D.q].s + '.'; } }));
scenes.push(K.pickScene({ id: 'share', key: 'share', name: 'Share it', lines: function () { return ['Woohoo! The rocket is <b>full of story power</b>.', { q: 'How will you share your story?' }]; }, opts: function () { return SHARE; } }));
function chain(S, D) {
  var m = MOOD.filter(function (x) { return x.id === S.x.mood; })[0] || MOOD[0], sh = SHARE.filter(function (x) { return x.id === S.x.share; })[0] || SHARE[0];
  return [
    { choice: 'Mood: ' + m.t, consequence: 'You chose a ' + m.t.toLowerCase() + ' story and rolled the dice three times.' },
    { choice: 'The rolls: ' + (D.c + 1) + ', ' + (D.p + 1) + ', ' + (D.q + 1), consequence: 'Your character is ' + CH[D.c].f + ', the place is ' + PL[D.p].f + ' and the problem is that they ' + PR[D.q].f + '.' },
    { choice: 'Story shape', consequence: 'Beginning: meet the character. Middle: the problem. End: everything is solved.' },
    { choice: 'The ending', consequence: 'They ' + PR[D.q].fix + '.' },
    { choice: 'Sharing: ' + sh.t, consequence: 'Your story “The ' + CH[D.c].s + ' and the ' + PR[D.q].s + '” will be shared by: ' + sh.t.toLowerCase() + '.' }
  ];
}
K.run({
  C: C, scenes: scenes, makeData: make, chain: chain,
  preview: function (S) { S.x.seed = S.x.seed || 'v1'; S.x.mood = S.x.mood || 'fun'; S.x.share = S.x.share || 'read'; },
  summaryHtml: function (S, D) { return '<div class="row" style="align-items:center"><div style="width:220px;flex:0 0 220px">' + K.alien(WHO.alien) + '</div><div class="grow"><div class="eyebrow">My story</div><p class="q" style="margin:10px 0">The ' + CH[D.c].s + ' and the ' + PR[D.q].s + '</p><p class="lead">' + CH[D.c].f.charAt(0).toUpperCase() + CH[D.c].f.slice(1) + ' ' + at(D.p) + '.</p></div></div>'; },
  dataHtml: function (S, D) { return '<div class="card" style="height:100%;display:flex;align-items:center;gap:60px;padding:40px 70px"><div style="width:300px;flex:0 0 300px">' + K.alien(WHO.alien) + '</div><div class="grow" style="font-size:40px;line-height:1.5"><p class="q" style="font-size:56px;margin-bottom:24px">The ' + CH[D.c].s + ' and the ' + PR[D.q].s + '</p><p><b>Beginning:</b> Once upon a time, ' + CH[D.c].f + ' lived ' + at(D.p) + '.</p><p><b>Middle:</b> One day, the ' + CH[D.c].s.toLowerCase() + ' ' + PR[D.q].f + '.</p><p><b>End:</b> They ' + PR[D.q].fix + '.</p></div></div>'; },
  pdfData: function (pdf, S, D, col) {
    var y = 100; pdf.text(40, y, 'The ' + CH[D.c].s + ' and the ' + PR[D.q].s, 18, true, col); y += 30; pdf.text(40, y, 'Dice rolls: ' + (D.c + 1) + ', ' + (D.p + 1) + ', ' + (D.q + 1), 11, false, '#4A6479');
    y += 34; pdf.text(40, y, 'Beginning', 12, true, col); y = pdf.para(40, y + 18, 'Once upon a time, ' + CH[D.c].f + ' lived ' + at(D.p) + '.', 12, 95, 16, false, '#17324D') + 14;
    pdf.text(40, y, 'Middle', 12, true, col); y = pdf.para(40, y + 18, 'One day, the ' + CH[D.c].s.toLowerCase() + ' ' + PR[D.q].f + '.', 12, 95, 16, false, '#17324D') + 14; pdf.text(40, y, 'End', 12, true, col); pdf.para(40, y + 18, 'They ' + PR[D.q].fix + '.', 12, 95, 16, false, '#17324D');
  }
});
})();
