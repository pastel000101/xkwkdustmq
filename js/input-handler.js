/* ============================================================
 * input-handler.js — C-14 InputHandler
 * ------------------------------------------------------------
 * 키보드 입력을 받아 타이핑 / 백스페이스 / 단축키로 분류한다.
 *
 * ⚠️ 판정 순서가 곧 요구사항이다 (WR-IN).
 *    수식키 검사(8)가 문자 검사(9)보다 먼저 와야 한다.
 *    Ctrl+C 의 key 는 'c' 이고 길이가 1이므로,
 *    순서가 반대면 복사할 때마다 오타로 집계된다.
 *
 *    단축키는 전부 문자가 아닌 키다. 따라서 일반 문자는
 *    반드시 순위 9에 도달한다 → 단축키가 타이핑을 가로챌 수 없다 (AC-07.4).
 * ============================================================ */

(function (App) {
  'use strict';

  var handlers = {};
  var target = null;
  var composing = false;
  var bound = null;

  var SHORTCUT_KEYS = {
    'Tab':    { action: 'next',                prevent: true  },
    'Escape': { action: 'escape',              prevent: false },
    'F2':     { action: 'togglePronunciation', prevent: true  },
    'F4':     { action: 'toggleMeaning',       prevent: true  },
    'F9':     { action: 'legend',              prevent: true  }
  };

  var FORM_TAGS = ['INPUT', 'SELECT', 'TEXTAREA'];

  function isFormControl(node) {
    return node && FORM_TAGS.indexOf(node.tagName) !== -1;
  }

  /* WR-IME05 — 브라우저마다 IME 신호가 달라 셋을 함께 본다 */
  function isComposingEvent(e) {
    return composing || e.isComposing === true || e.keyCode === 229;
  }

  function onKeyDown(e) {
    /* 1. IME 조합 중 → 무시 (AC-18.3) */
    if (isComposingEvent(e)) {
      if (handlers.onImeState) handlers.onImeState(true);
      return;
    }

    /* 2. 백스페이스 */
    if (e.key === 'Backspace') {
      if (isFormControl(e.target)) return;
      e.preventDefault();
      if (handlers.onBackspace) handlers.onBackspace();
      return;
    }

    /* 3~7. 단축키 (전부 문자가 아닌 키) */
    var sc = SHORTCUT_KEYS[e.key];
    if (sc) {
      if (sc.prevent) e.preventDefault();
      if (handlers.onShortcut) handlers.onShortcut(sc.action);
      return;
    }

    /* 8. 수식키 조합 → 브라우저에 넘긴다.
          반드시 9번보다 먼저 걸러야 한다 (WR-IN01) */
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    /* 9. 인쇄 가능한 단일 문자 → 항상 타이핑 (AC-07.4) */
    if (e.key.length === 1) {
      if (isFormControl(e.target)) return;
      e.preventDefault();
      if (handlers.onImeState) handlers.onImeState(false);
      if (handlers.onChar) handlers.onChar(e.key);
      return;
    }

    /* 10. 그 외 (방향키·Home·Shift 등) → 무시 */
  }

  function onCompositionStart() {
    composing = true;
    if (handlers.onImeState) handlers.onImeState(true);
  }

  function onCompositionEnd() {
    composing = false;
    /* 조합 결과는 버린다. 경고는 정상 입력이 들어올 때 해제된다 (AC-18.2) */
  }

  App.InputHandler = {

    init: function (h) { handlers = h || {}; },

    attach: function (el) {
      target = el || document;
      bound = {
        keydown: onKeyDown,
        compositionstart: onCompositionStart,
        compositionend: onCompositionEnd
      };
      target.addEventListener('keydown', bound.keydown, true);
      target.addEventListener('compositionstart', bound.compositionstart, true);
      target.addEventListener('compositionend', bound.compositionend, true);
    },

    detach: function () {
      if (!target || !bound) return;
      target.removeEventListener('keydown', bound.keydown, true);
      target.removeEventListener('compositionstart', bound.compositionstart, true);
      target.removeEventListener('compositionend', bound.compositionend, true);
      bound = null;
    },

    isComposing: function () { return composing; },

    /* 테스트용 — 이벤트 객체를 직접 넣어 분류 결과를 확인한다 */
    _classify: function (e) {
      if (isComposingEvent(e)) return 'ime';
      if (e.key === 'Backspace') return 'backspace';
      if (SHORTCUT_KEYS[e.key]) return 'shortcut:' + SHORTCUT_KEYS[e.key].action;
      if (e.ctrlKey || e.altKey || e.metaKey) return 'ignore';
      if (e.key.length === 1) return 'char';
      return 'ignore';
    }
  };

})(window.App = window.App || {});
