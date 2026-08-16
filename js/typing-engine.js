/* ============================================================
 * typing-engine.js — C-06 TypingEngine
 * ------------------------------------------------------------
 * 문자 단위 정오를 판정하고 커서를 진행시킨다.
 *
 * ⚠️ 이 모듈은 통계를 다루지 않는다.
 *    백스페이스가 화면 상태만 되돌리고 오타 집계는 되돌리지 않는 것(AC-03.3)이
 *    이 컴포넌트와 StatsTracker 를 나눈 이유다.
 * ============================================================ */

(function (App) {
  'use strict';

  var PENDING = 'pending', CORRECT = 'correct', INCORRECT = 'incorrect', CURRENT = 'current';

  var text = '';
  var states = [];
  var cursor = 0;
  var changed = [];

  function setCurrentAt(i) {
    if (i >= 0 && i < states.length && states[i] === PENDING) states[i] = CURRENT;
  }

  function clearCurrentAt(i) {
    if (i >= 0 && i < states.length && states[i] === CURRENT) states[i] = PENDING;
  }

  App.TypingEngine = {

    STATES: { PENDING: PENDING, CORRECT: CORRECT, INCORRECT: INCORRECT, CURRENT: CURRENT },

    load: function (t) {
      text = String(t == null ? '' : t);
      states = [];
      for (var i = 0; i < text.length; i++) states.push(PENDING);
      cursor = 0;
      changed = [];
      setCurrentAt(0);
      return states.slice();
    },

    /* WR-CMP01/02 — 코드포인트 동등 비교. 대소문자 구분. 정규화·치환 없음 */
    compare: function (expected, actual) {
      return expected === actual;
    },

    /* WR-ST01/02 — 오답이어도 커서가 +1 된다 (AC-01.2) */
    handleChar: function (ch) {
      if (cursor >= text.length) {
        return { index: -1, expected: null, actual: ch, correct: false, completed: true, ignored: true };
      }

      var index = cursor;
      var expected = text.charAt(index);
      var correct = this.compare(expected, ch);

      clearCurrentAt(index);
      states[index] = correct ? CORRECT : INCORRECT;
      cursor = index + 1;

      changed = [index];
      if (cursor < text.length) {
        setCurrentAt(cursor);
        changed.push(cursor);
      }

      return {
        index: index,
        expected: expected,
        actual: ch,
        correct: correct,
        completed: cursor >= text.length,
        ignored: false
      };
    },

    /* WR-ST03 / AC-03.4 — 시작 지점에서는 아무 일도 하지 않는다 */
    handleBackspace: function () {
      if (cursor <= 0) {
        changed = [];
        return { applied: false, index: null, uncompleted: false };
      }

      var wasComplete = cursor >= text.length;
      var target = cursor - 1;

      clearCurrentAt(cursor);
      states[target] = PENDING;
      cursor = target;
      setCurrentAt(cursor);

      changed = [target];
      if (wasComplete === false && target + 1 < text.length) changed.push(target + 1);

      /* WR-CUR06 — 완주 후 백스페이스면 완주가 취소된다 */
      return { applied: true, index: target, uncompleted: wasComplete };
    },

    getCharStates: function () { return states.slice(); },

    getChangedIndexes: function () { return changed.slice(); },

    getCursor: function () { return cursor; },

    getText: function () { return text; },

    isComplete: function () { return text.length > 0 && cursor >= text.length; },

    reset: function () { return this.load(text); }
  };

})(window.App = window.App || {});
