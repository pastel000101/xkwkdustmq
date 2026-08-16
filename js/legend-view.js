/* ============================================================
 * legend-view.js — C-13 LegendView
 * ------------------------------------------------------------
 * 발음 구분 표시의 뜻과 조음 방법을 보여준다 (FR-023).
 *
 * 부류별로 묶어서 표시한다. 소리·강세·철자 정보가 섞이면
 * 학습자가 flap_t 를 하나의 음소로 오해한다.
 *
 * 열어도 연습 상태를 건드리지 않는다 (AC-15.3).
 * ============================================================ */

(function (App) {
  'use strict';

  var els = {};
  var guide = null;

  var SECTION = [
    { key: 'phoneme',  title: '소리 — 한글로는 구분되지 않는 발음' },
    { key: 'prosody',  title: '강세 — 어느 음절을 세게 읽는가' },
    { key: 'spelling', title: '철자 정보 — 철자와 소리가 어긋나는 자리' }
  ];

  var COLS = ['기호', '이름', '발음 방법', '헷갈리는 소리', '예'];

  function cell(tag, text, cls) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    e.textContent = text == null ? '—' : text;
    return e;
  }

  function buildTable(entries, sectionKey) {
    var table = document.createElement('table');
    table.className = 'legend-table';

    var thead = document.createElement('thead');
    var htr = document.createElement('tr');
    for (var c = 0; c < COLS.length; c++) htr.appendChild(cell('th', COLS[c]));
    thead.appendChild(htr);
    table.appendChild(thead);

    var tbody = document.createElement('tbody');
    for (var i = 0; i < entries.length; i++) {
      var e = entries[i];
      var tr = document.createElement('tr');
      if (sectionKey === 'spelling') tr.className = 'spelling';
      tr.appendChild(cell('td', e.symbol, 'sym'));
      tr.appendChild(cell('td', e.label));
      tr.appendChild(cell('td', e.articulation));
      tr.appendChild(cell('td', e.confusedWith));
      tr.appendChild(cell('td', e.example, 'ex'));
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    return table;
  }

  function render() {
    if (!els.body || !guide) return;
    els.body.textContent = '';

    for (var s = 0; s < SECTION.length; s++) {
      var sec = SECTION[s];
      var entries = [];
      for (var k in guide) {
        if (guide.hasOwnProperty(k) && guide[k].category === sec.key) entries.push(guide[k]);
      }
      if (entries.length === 0) continue;

      var wrap = document.createElement('section');
      wrap.className = 'legend-section';
      var h = document.createElement('h3');
      h.textContent = sec.title;
      wrap.appendChild(h);
      wrap.appendChild(buildTable(entries, sec.key));
      els.body.appendChild(wrap);
    }
  }

  App.LegendView = {

    init: function (dom, phonemeGuide) {
      els = dom;
      guide = phonemeGuide;
      render();

      if (els.closeButton) {
        els.closeButton.addEventListener('click', function () { App.LegendView.hide(); });
      }
      if (els.backdrop) {
        els.backdrop.addEventListener('click', function (e) {
          if (e.target === els.backdrop) App.LegendView.hide();
        });
      }
    },

    show: function () { if (els.backdrop) els.backdrop.hidden = false; },

    hide: function () { if (els.backdrop) els.backdrop.hidden = true; },

    isOpen: function () { return !!(els.backdrop && !els.backdrop.hidden); },

    toggle: function () { this.isOpen() ? this.hide() : this.show(); }
  };

})(window.App = window.App || {});
