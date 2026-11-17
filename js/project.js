/* Story Dice Adventure (L1LC02): roll three dice for a character, a place and a problem, then shape a story. */
'use strict';
(function () {
var C = window.CONTENT, K = Kit, $ = K.$, WHO = C.hero;
var CH = [{ f: 'a brave little dragon', s: 'Dragon' }, { f: 'a clever fox', s: 'Fox' }, { f: 'a shy robot', s: 'Robot' }, { f: 'a sleepy bear', s: 'Bear' }, { f: 'a fast turtle', s: 'Turtle' }, { f: 'a magic parrot', s: 'Parrot' }];
var PL = [{ f: 'a floating island', s: 'Sky Island' }, { f: 'an underwater cave', s: 'Deep Cave' }, { f: 'a busy market', s: 'Busy Market' }, { f: 'a snowy mountain', s: 'Snow Peak' }, { f: 'a garden on the moon', s: 'Moon Garden' }, { f: 'an old library', s: 'Old Library' }];
var PR = [{ f: 'lost the map home', s: 'Lost Map', fix: 'asked new friends for help and found a path home' }, { f: 'could not find a best friend', s: 'Missing Friend', fix: 'followed the footprints and found the friend' }, { f: 'got stuck in a big storm', s: 'Big Storm', fix: 'built a little shelter and waited for the sun' }, { f: 'lost all the magic', s: 'Lost Magic', fix: 'shared a kind word and the magic came back' }, { f: 'found a broken bridge', s: 'Broken Bridge', fix: 'worked together to mend the bridge' }, { f: 'was hungry with no food', s: 'Empty Basket', fix: 'swapped stories for a big warm meal' }];
var MOOD = [{ id: 'fun', e: '😄', t: 'Funny', sub: 'Giggles and silly moments' }, { id: 'spooky', e: '👻', t: 'A little spooky', sub: 'Shivers and surprises' }, { id: 'exc', e: '🚀', t: 'Exciting', sub: 'Fast and brave' }];
var SHARE = [{ id: 'read', e: '📖', t: 'Read it aloud', sub: 'To my family' }, { id: 'draw', e: '🖍️', t: 'Draw the pictures', sub: 'Make it a picture book' }, { id: 'act', e: '🎭', t: 'Act it out', sub: 'With my friends' }];
function make(seed) { var r = Kit.rng(seed + 'roll'); return { c: Math.floor(r() * 6), p: Math.floor(r() * 6), q: Math.floor(r() * 6) }; }
window.DiceTest = function (n) { var bad = 0; for (var i = 0; i < n; i++) { var d = make('d' + i); if ([d.c, d.p, d.q].some(function (x) { return x < 0 || x > 5; })) bad++; } return bad; };
var PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
function die(n, cls) { var s = '<div class="die ' + (cls || '') + '">'; for (var i = 0; i < 9; i++) s += '<i class="' + ((PIPS[n] || []).indexOf(i) >= 0 ? 'on' : '') + '"></i>'; return s + '</div>'; }
function tableTop() { return '<table class="t tight" style="font-size:28px;margin-top:10px"><thead><tr><th class="n" style="width:60px">#</th><th>Character</th><th>Place</th><th>Problem</th></tr></thead><tbody>' + CH.map(function (c, i) { return '<tr><td class="n"><b>' + (i + 1) + '</b></td><td>' + c.f + '</td><td>' + PL[i].f + '</td><td>' + PR[i].f + '</td></tr>'; }).join('') + '</tbody></table>'; }
var scenes = [];
scenes.push(K.pickScene({ id: 'mood', key: 'mood', name: 'Story mood', help: 'Read what Anu says, then tap the mood of your story.', lines: function () { return ['Hello, writer! I am Author Anu. Today we write a story with the help of a <b>dice</b>!', 'We roll three times: for the <b>main character</b>, for <b>where the story happens</b> and for the <b>problem</b> the character faces. Every story needs a <b>beginning, middle and end</b>.', 'What mood should your story have?']; }, opts: function () { return MOOD; } }));
scenes.push({ id: 'dice', name: 'Roll the dice', help: 'Press the Roll button three times. Each roll gives a number for your story.', render: function (el) {
  var S = K.S(), D = K.D(), n = S.x.rolled || 0, rolls = [D.c, D.p, D.q], names = ['Character', 'Place', 'Problem'];
  el.innerHTML = K.talk(WHO, ['Time to roll! Press the button. Each roll gives a number from 1 to 6. We will turn the numbers into story pieces next.'], '', 'sm') + '<div class="row" style="margin-top:16px;align-items:center;gap:60px;justify-content:center"><div id="dd">' + die(n ? rolls[n - 1] + 1 : 1) + '</div><div class="col" style="align-items:center"><button class="btn gold" id="roll" style="min-width:360px">Roll the dice</button><div id="rs" style="font-size:44px;font-weight:900;margin-top:14px"></div></div></div>';
  function rs() { var t = ''; for (var i = 0; i < n; i++) t += names[i] + ': <b>' + (rolls[i] + 1) + '</b><br>'; $('#rs').innerHTML = t; $('#roll').disabled = n >= 3; $('#roll').textContent = n >= 3 ? 'All three rolled' : 'Roll the dice (' + (n + 1) + ' of 3)'; K.setFoot({ main: 'Next', en: n >= 3, go: K.next, st: n >= 3 ? '' : 'Roll three times' }); }
  $('#roll').addEventListener('click', function () { if (n >= 3) return; $('#dd').innerHTML = die(rolls[n] + 1, 'tumble'); n++; S.x.rolled = n; K.save(); K.SFX.ok(); setTimeout(rs, 900); $('#roll').disabled = true; });
  K.solve = function () { n = 3; S.x.rolled = 3; $('#dd').innerHTML = die(rolls[2] + 1); rs(); }; rs(); K.cue({ ring: '#roll', seq: ['#roll'], delay: 700 });
} });
scenes.push(K.slotScene({ id: 'pieces', icon: '🧩', name: 'Story pieces', help: 'Look up each rolled number in the table. Drag the matching character, place and problem into the boxes.', sw: 920, pc: 2, lw: 220, ls: 28, sh: 92, ch: 62, fs: 28,
  say: function (D) { return 'You rolled <b>' + (D.c + 1) + '</b> for the character, <b>' + (D.p + 1) + '</b> for the place and <b>' + (D.q + 1) + '</b> for the problem. Look them up and build your story pieces.'; },
  top: function () { return tableTop(); },
  slots: function () { return [{ id: 'who', label: 'Main character' }, { id: 'where', label: 'Where it happens' }, { id: 'what', label: 'The problem' }]; },
  chips: function (D) { var c = [{ id: 'c_' + D.c, t: CH[D.c].f }, { id: 'p_' + D.p, t: PL[D.p].f }, { id: 'q_' + D.q, t: PR[D.q].f }], o = [(D.c + 2) % 6, (D.p + 3) % 6, (D.q + 4) % 6]; c.push({ id: 'c_' + o[0], t: CH[o[0]].f }); c.push({ id: 'p_' + o[1], t: PL[o[1]].f }); c.push({ id: 'q_' + o[2], t: PR[o[2]].f }); return c; },
  accept: function (id, slot) { return id.charAt(0) === { who: 'c', where: 'p', what: 'q' }[slot]; },
  truth: function (D) { return { who: 'c_' + D.c, where: 'p_' + D.p, what: 'q_' + D.q }; },
  good: function (D) { return 'Your story: ' + CH[D.c].f + ' in ' + PL[D.p].f + ' who ' + PR[D.q].f + '. What an adventure!'; },
  bad: function () { return 'Match each number to the same row in the table: first roll is the character, second the place, third the problem.'; },
  reveal: function (D) { return CH[D.c].f + ', ' + PL[D.p].f + ', and the problem: ' + PR[D.q].f + '.'; } }));
scenes.push(K.slotScene({ id: 'order', icon: '📚', name: 'Beginning, middle, end', help: 'Put the story parts in order: the beginning, the middle and the end. Drag each part to the right box.', sw: 960, lw: 220, ls: 28, sh: 104, ch: 78, fs: 28,
  say: function () { return 'Every story has a <b>beginning</b>, a <b>middle</b> and an <b>end</b>. Put the three parts of your story in order.'; },
  slots: function () { return [{ id: 'b', label: 'Beginning' }, { id: 'm', label: 'Middle' }, { id: 'e', label: 'End' }]; },
  chips: function (D) { return [{ id: 'e1', t: 'In the end, everything turned out well and the day was saved.' }, { id: 'b1', t: 'Once upon a time, ' + CH[D.c].f + ' lived in ' + PL[D.p].f + '.' }, { id: 'm1', t: 'One day, ' + CH[D.c].f.replace(/^an? /, 'the ') + ' ' + PR[D.q].f + '.' }]; },
  truth: function () { return { b: 'b1', m: 'm1', e: 'e1' }; },
  good: function () { return 'Beginning meets the character and place, the middle brings the problem, and the end wraps it up.'; },
  bad: function () { return 'Which part says "Once upon a time"? Which one brings the trouble? Which one finishes the story?'; },
  reveal: function () { return 'Beginning: meet the character and place. Middle: the problem. End: it turns out well.'; } }));
scenes.push(K.slotScene({ id: 'ending', icon: '🏁', name: 'The ending', help: 'Pick the ending that solves your character\'s problem.', sw: 960, lw: 220, ls: 28, sh: 110, ch: 70, fs: 28,
  say: function (D) { return 'Your character ' + PR[D.q].f + '. Which ending <b>solves that problem</b>?'; },
  slots: function () { return [{ id: 'end', label: 'The ending' }]; },
  chips: function (D) { return [D.q, (D.q + 2) % 6, (D.q + 4) % 6].map(function (i) { return { id: 'f_' + i, t: 'They ' + PR[i].fix + '.' }; }); },
  truth: function (D) { return { end: 'f_' + D.q }; },
  good: function (D) { return 'A good ending fits the problem: they ' + PR[D.q].fix + '.'; },
  bad: function () { return 'The ending must fix the exact problem from the middle of the story.'; },
  reveal: function (D) { return 'They ' + PR[D.q].fix + '.'; } }));
scenes.push(K.slotScene({ id: 'title', icon: '🏷️', name: 'The title', help: 'Pick the title that tells readers about your story.', sw: 960, lw: 220, ls: 28, sh: 110, ch: 70, fs: 28,
  say: function () { return 'Last of all, a <b>fun title</b>! Pick the one that fits your story.'; },
  slots: function () { return [{ id: 'title', label: 'My story is called' }]; },
  chips: function (D) { return [{ id: 't_0', t: 'The ' + CH[D.c].s + ' and the ' + PR[D.q].s }, { id: 't_1', t: 'The ' + CH[(D.c + 1) % 6].s + ' and the ' + PR[(D.q + 2) % 6].s }, { id: 't_2', t: 'The ' + CH[(D.c + 3) % 6].s + ' and the ' + PR[(D.q + 4) % 6].s }]; },
  truth: function () { return { title: 't_0' }; },
  good: function (D) { return '“The ' + CH[D.c].s + ' and the ' + PR[D.q].s + '” names the character and the problem. A title makes readers curious.'; },
  bad: function () { return 'A good title mentions your main character and hints at the problem.'; },
  reveal: function (D) { return 'The ' + CH[D.c].s + ' and the ' + PR[D.q].s + '.'; } }));
scenes.push(K.pickScene({ id: 'share', key: 'share', name: 'Share it', help: 'Tap how you will share your story.', lines: function () { return ['Your story is finished!', 'How will you share it?']; }, opts: function () { return SHARE; } }));
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
  C: C, scenes: scenes, makeData: make, chain: chain, start: K.startFor(['Hello, writer! I am Author Anu.', 'You will roll a dice for story pieces, shape a beginning, middle and end and choose a title. Your points appear at the end.']),
  preview: function (S) { S.x.seed = S.x.seed || 'v1'; S.x.mood = S.x.mood || 'fun'; S.x.share = S.x.share || 'read'; },
  summaryHtml: function (S, D) { return '<div class="eyebrow">My story</div><p style="font-size:38px;margin:8px 0;font-weight:900">The ' + CH[D.c].s + ' and the ' + PR[D.q].s + '</p><p class="sm">' + CH[D.c].f + ' in ' + PL[D.p].f + '</p>'; },
  dataHtml: function (S, D) { return '<div class="card" style="font-size:36px;line-height:1.5"><b>The ' + CH[D.c].s + ' and the ' + PR[D.q].s + '</b><p><b>Beginning:</b> Once upon a time, ' + CH[D.c].f + ' lived in ' + PL[D.p].f + '.</p><p><b>Middle:</b> One day, the ' + CH[D.c].s.toLowerCase() + ' ' + PR[D.q].f + '.</p><p><b>End:</b> They ' + PR[D.q].fix + '.</p></div>'; },
  pdfData: function (pdf, S, D, col) {
    var y = 100; pdf.text(40, y, 'The ' + CH[D.c].s + ' and the ' + PR[D.q].s, 18, true, col); y += 30; pdf.text(40, y, 'Dice rolls: ' + (D.c + 1) + ', ' + (D.p + 1) + ', ' + (D.q + 1), 11, false, '#4A6479');
    y += 34; pdf.text(40, y, 'Beginning', 12, true, col); y = pdf.para(40, y + 18, 'Once upon a time, ' + CH[D.c].f + ' lived in ' + PL[D.p].f + '.', 12, 95, 16, false, '#17324D') + 14;
    pdf.text(40, y, 'Middle', 12, true, col); y = pdf.para(40, y + 18, 'One day, the ' + CH[D.c].s.toLowerCase() + ' ' + PR[D.q].f + '.', 12, 95, 16, false, '#17324D') + 14; pdf.text(40, y, 'End', 12, true, col); pdf.para(40, y + 18, 'They ' + PR[D.q].fix + '.', 12, 95, 16, false, '#17324D');
  }
});
})();
