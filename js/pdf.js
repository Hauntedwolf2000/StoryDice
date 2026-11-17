/* Minimal offline PDF writer (no libraries, DP-401). Text is limited to Latin-1 base fonts. */
window.MiniPDF = function (W, H) {
  var pages = [], cs = null;
  var MAP = { '₹': 'Rs ', '–': '-', '—': '-', '’': "'", '‘': "'", '“': '"', '”': '"', '×': 'x', '÷': '/', '★': '*', '☆': '-', '✓': 'ok', '…': '...', '→': '->' };
  function esc(s) { return String(s).replace(/[^\x20-\x7E]/g, function (c) { return MAP[c] || '?'; }).replace(/([\\()])/g, '\\$1'); }
  function col(c) { c = c || '#000000'; return [1, 3, 5].map(function (i) { return (parseInt(c.substr(i, 2), 16) / 255).toFixed(3); }).join(' '); }
  function n(x) { return x.toFixed(1); }

  var api = {
    page: function () { cs = []; pages.push(cs); return api; },
    text: function (x, y, s, size, bold, c) { cs.push('BT /F' + (bold ? 2 : 1) + ' ' + size + ' Tf ' + col(c) + ' rg ' + n(x) + ' ' + n(H - y) + ' Td (' + esc(s) + ') Tj ET'); return api; },
    para: function (x, y, s, size, maxChars, lead, bold, c) {
      var words = String(s).split(/\s+/), line = '', yy = y;
      words.forEach(function (w) {
        if ((line + ' ' + w).trim().length > maxChars) { api.text(x, yy, line, size, bold, c); yy += lead; line = w; } else line = (line + ' ' + w).trim();
      });
      if (line) { api.text(x, yy, line, size, bold, c); yy += lead; }
      return yy;
    },
    rect: function (x, y, w, h, fill, stroke) {
      var o = '';
      if (fill) o += col(fill) + ' rg ';
      if (stroke) o += col(stroke) + ' RG 1 w ';
      o += n(x) + ' ' + n(H - y - h) + ' ' + n(w) + ' ' + n(h) + ' re ' + (fill && stroke ? 'B' : fill ? 'f' : 'S');
      cs.push(o); return api;
    },
    line: function (x1, y1, x2, y2, c, w) { cs.push(col(c) + ' RG ' + (w || 1) + ' w ' + n(x1) + ' ' + n(H - y1) + ' m ' + n(x2) + ' ' + n(H - y2) + ' l S'); return api; },
    poly: function (pts, c, w) {
      var o = col(c) + ' RG ' + (w || 1.5) + ' w ';
      pts.forEach(function (p, i) { o += n(p[0]) + ' ' + n(H - p[1]) + (i ? ' l ' : ' m '); });
      cs.push(o + 'S'); return api;
    },
    mark: function (x, y, kind, c) { // chart marker: circle, square or triangle (shape plus colour, DP-504)
      var r = 4.5, k = 0.5523 * r, X = x, Y = H - y, o = col(c) + ' rg ';
      if (kind === 'square') o += n(X - r) + ' ' + n(Y - r) + ' ' + n(2 * r) + ' ' + n(2 * r) + ' re f';
      else if (kind === 'tri') o += n(X - r - 1) + ' ' + n(Y - r) + ' m ' + n(X + r + 1) + ' ' + n(Y - r) + ' l ' + n(X) + ' ' + n(Y + r + 1) + ' l f';
      else o += n(X + r) + ' ' + n(Y) + ' m ' + n(X + r) + ' ' + n(Y + k) + ' ' + n(X + k) + ' ' + n(Y + r) + ' ' + n(X) + ' ' + n(Y + r) + ' c ' +
        n(X - k) + ' ' + n(Y + r) + ' ' + n(X - r) + ' ' + n(Y + k) + ' ' + n(X - r) + ' ' + n(Y) + ' c ' + n(X - r) + ' ' + n(Y - k) + ' ' + n(X - k) + ' ' + n(Y - r) + ' ' + n(X) + ' ' + n(Y - r) + ' c ' +
        n(X + k) + ' ' + n(Y - r) + ' ' + n(X + r) + ' ' + n(Y - k) + ' ' + n(X + r) + ' ' + n(Y) + ' c f';
      cs.push(o); return api;
    },
    build: function () {
      var objs = [], out = '%PDF-1.4\n', offs = [];
      function add(s) { objs.push(s); return objs.length; }
      add('<< /Type /Catalog /Pages 2 0 R >>');
      add(''); // pages, filled below
      add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
      add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
      var kids = [];
      pages.forEach(function (p) {
        var body = p.join('\n'), cid = objs.length + 2;
        var pid = add('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + W + ' ' + H + '] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ' + cid + ' 0 R >>');
        add('<< /Length ' + body.length + ' >>\nstream\n' + body + '\nendstream');
        kids.push(pid + ' 0 R');
      });
      objs[1] = '<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + kids.length + ' >>';
      objs.forEach(function (o, i) { offs.push(out.length); out += (i + 1) + ' 0 obj\n' + o + '\nendobj\n'; });
      var x = out.length;
      out += 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n';
      offs.forEach(function (o) { out += ('0000000000' + o).slice(-10) + ' 00000 n \n'; });
      out += 'trailer\n<< /Size ' + (objs.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + x + '\n%%EOF';
      var u = new Uint8Array(out.length);
      for (var i = 0; i < out.length; i++) u[i] = out.charCodeAt(i) & 255;
      return u;
    },
    blob: function () { return new Blob([api.build()], { type: 'application/pdf' }); },
    base64: function () { var u = api.build(), s = ''; for (var i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s); }
  };
  return api;
};
