/* ============================================================
 * text-renderer.js — C-09 TextRenderer
 * ------------------------------------------------------------
 * 영어 텍스트를 4가지 상태로 그린다.
 *
 * DOM 노드를 만들거나 지우지 않는다. className 만 교체한다.
 * 한 번의 입력에서 바뀌는 인덱스는 최대 2개이므로
 * 타이핑 중 리플로우가 발생하지 않는다 (NFR-004).
 * ============================================================ */

(function (App) {
  'use strict';

  var chars = [];

  var CLASS = {
    pending:   '',
    correct:   'ok',
    incorrect: 'bad',
    current:   'cur'
  };

  function baseClass(el) {
    return el.getAttribute('data-space') === '1' ? 'ch space'
         : (el.textContent === ' ' ? 'ch space' : 'ch');
  }

  function apply(el, state) {
    var extra = CLASS[state] || '';
    el.className = extra ? baseClass(el) + ' ' + extra : baseClass(el);
  }

  App.TextRenderer = {

    init: function (refs) {
      chars = (refs && refs.charElements) ? refs.charElements : [];
      /* 공백 여부를 미리 표시해 두면 매번 textContent 를 읽지 않아도 된다 */
      for (var i = 0; i < chars.length; i++) {
        if (chars[i].textContent === ' ') chars[i].setAttribute('data-space', '1');
      }
    },

    renderAll: function (states) {
      var n = Math.min(chars.length, states.length);
      for (var i = 0; i < n; i++) apply(chars[i], states[i]);
    },

    /* 변경된 인덱스만 갱신 (WR-PERF01) */
    renderChanged: function (indexes, states) {
      if (!indexes || indexes.length === 0) return;
      for (var i = 0; i < indexes.length; i++) {
        var idx = indexes[i];
        if (idx >= 0 && idx < chars.length && idx < states.length) {
          apply(chars[idx], states[idx]);
        }
      }
    }
  };

})(window.App = window.App || {});
