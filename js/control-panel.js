/* ============================================================
 * control-panel.js — C-12 ControlPanel
 * ------------------------------------------------------------
 * 설정 조작 UI. 발음 토글과 뜻 토글을 별개 컨트롤로 제공한다 (FR-028).
 *
 * 토글 상태를 색이 아니라 "켬"/"끔" 텍스트로도 표시한다 (AC-12.7, NFR-008).
 * ============================================================ */

(function (App) {
  'use strict';

  var els = {};
  var handlers = {};

  var LEVEL_LABEL = {
    all: '전체', beginner: '초급', intermediate: '중급', advanced: '고급'
  };
  var CATEGORY_LABEL = {
    all: '전체', daily: '일상', food: '음식', travel: '여행', school: '학교·공부',
    work: '직장', feeling: '감정·관계', tech: '기술·IT', nature: '자연·날씨'
  };
  var ORDER_LABEL = { random: '무작위', sequential: '순서대로' };

  var SHORTCUTS = [
    ['Tab', '다음 문항'],
    ['Esc', '다시하기'],
    ['F2', '발음 켜기/끄기'],
    ['F4', '뜻 켜기/끄기'],
    ['F9', '발음 기호 범례']
  ];

  function fillSelect(sel, values, labels) {
    sel.textContent = '';
    for (var i = 0; i < values.length; i++) {
      var o = document.createElement('option');
      o.value = values[i];
      o.textContent = labels[values[i]] || values[i];
      sel.appendChild(o);
    }
  }

  /* 설정을 바꾼 뒤 포커스를 놓아야 타이핑이 이어진다.
     select 에 포커스가 남으면 문자 키가 옵션 점프로 먹힌다. */
  function blurAndNotify(key, value) {
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    if (handlers.onSettingChange) handlers.onSettingChange(key, value);
  }

  App.ControlPanel = {

    init: function (dom, h) {
      els = dom;
      handlers = h || {};

      /* 모드 */
      if (els.modeSelect) {
        els.modeSelect.addEventListener('click', function (e) {
          var btn = e.target.closest ? e.target.closest('.seg-btn') : null;
          if (btn && btn.getAttribute('data-value')) {
            blurAndNotify('mode', btn.getAttribute('data-value'));
          }
        });
      }

      fillSelect(els.levelSelect, ['all', 'beginner', 'intermediate', 'advanced'], LEVEL_LABEL);
      fillSelect(els.orderSelect, ['random', 'sequential'], ORDER_LABEL);

      els.levelSelect.addEventListener('change', function () {
        blurAndNotify('level', els.levelSelect.value);
      });
      els.categorySelect.addEventListener('change', function () {
        blurAndNotify('category', els.categorySelect.value);
      });
      els.orderSelect.addEventListener('change', function () {
        blurAndNotify('order', els.orderSelect.value);
      });

      /* 발음 토글과 뜻 토글은 서로 다른 핸들러를 부른다 (AC-12.4) */
      els.pronToggle.addEventListener('click', function () {
        els.pronToggle.blur();
        if (handlers.onTogglePronunciation) handlers.onTogglePronunciation();
      });
      els.meaningToggle.addEventListener('click', function () {
        els.meaningToggle.blur();
        if (handlers.onToggleMeaning) handlers.onToggleMeaning();
      });

      if (els.legendButton) {
        els.legendButton.addEventListener('click', function () {
          els.legendButton.blur();
          if (handlers.onShowLegend) handlers.onShowLegend();
        });
      }

      this.renderShortcutGuide();
    },

    renderSettings: function (state) {
      var s = state.settings;

      var btns = els.modeSelect.querySelectorAll('.seg-btn');
      for (var i = 0; i < btns.length; i++) {
        var on = btns[i].getAttribute('data-value') === s.mode;
        btns[i].className = on ? 'seg-btn on' : 'seg-btn';
        btns[i].setAttribute('aria-pressed', on ? 'true' : 'false');
      }

      if (els.levelSelect.value !== s.level) els.levelSelect.value = s.level;
      if (els.orderSelect.value !== s.order) els.orderSelect.value = s.order;
      if (els.categorySelect.value !== s.category) els.categorySelect.value = s.category;
    },

    setCategoryOptions: function (categories) {
      var values = ['all'].concat(categories);
      var keep = els.categorySelect.value;
      fillSelect(els.categorySelect, values, CATEGORY_LABEL);
      els.categorySelect.value = (values.indexOf(keep) !== -1) ? keep : 'all';
    },

    /* 켜짐/꺼짐을 색이 아닌 텍스트로도 표시 (AC-12.7) */
    renderToggleStates: function (pronOn, meaningOn) {
      function paint(btn, on) {
        btn.className = on ? 'toggle on' : 'toggle';
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        var state = btn.querySelector('.toggle-state');
        if (state) state.textContent = on ? '켬' : '끔';
      }
      paint(els.pronToggle, pronOn);
      paint(els.meaningToggle, meaningOn);
    },

    showEmptyContentNotice: function (show) {
      if (els.emptyNotice) els.emptyNotice.hidden = !show;
    },

    showImeWarning: function (show) {
      if (els.imeWarning) els.imeWarning.hidden = !show;
    },

    showLoadError: function (message) {
      if (!els.loadError) return;
      if (message) {
        els.loadError.textContent = message;
        els.loadError.hidden = false;
      } else {
        els.loadError.hidden = true;
      }
    },

    renderShortcutGuide: function () {
      if (!els.shortcutGuide) return;
      els.shortcutGuide.textContent = '';
      for (var i = 0; i < SHORTCUTS.length; i++) {
        var wrap = document.createElement('span');
        var k = document.createElement('kbd');
        k.textContent = SHORTCUTS[i][0];
        wrap.appendChild(k);
        wrap.appendChild(document.createTextNode(SHORTCUTS[i][1]));
        els.shortcutGuide.appendChild(wrap);
      }
    }
  };

})(window.App = window.App || {});
