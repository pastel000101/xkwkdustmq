/* ============================================================
 * stats-tracker.js — C-07 StatsTracker
 * ------------------------------------------------------------
 * 시간과 오타를 집계해 지표를 산출한다.
 *
 * ⚠️ 이 모듈은 백스페이스를 받지 않는다.
 *    호출 자체가 없으므로
 *      - 오타 집계가 취소될 수 없고        (AC-03.3)
 *      - 백스페이스가 타이머를 시작시킬 수 없다 (AC-04.3)
 *    두 요구사항이 코드 구조로 보장된다.
 * ============================================================ */

(function (App) {
  'use strict';

  var MIN_MEASURABLE_MS = 100;   // 이보다 짧으면 WPM 을 측정 불가로 본다 (WR-CALC04)

  var startedAt = null;
  var endedAt = null;
  var totalKeystrokes = 0;
  var errorCount = 0;
  var correctCount = 0;

  function now() { return Date.now(); }

  function elapsed() {
    if (startedAt === null) return 0;
    return (endedAt === null ? now() : endedAt) - startedAt;
  }

  function round1(n) { return Math.round(n * 10) / 10; }

  App.StatsTracker = {

    reset: function () {
      startedAt = null;
      endedAt = null;
      totalKeystrokes = 0;
      errorCount = 0;
      correctCount = 0;
    },

    /* 문자 입력 1회를 집계한다.
     * 타이머 시작은 오직 여기서만 일어난다 (AC-04.1). */
    recordChar: function (result) {
      if (!result || result.ignored) return;

      if (startedAt === null) startedAt = now();

      totalKeystrokes += 1;
      if (result.correct) correctCount += 1;
      else errorCount += 1;      // 이후 어떤 경로로도 감소하지 않는다 (AC-03.3)
    },

    recordCompletion: function () {
      if (startedAt !== null && endedAt === null) endedAt = now();
    },

    /* WR-TM05 — 완주 후 백스페이스로 완주가 취소되었을 때.
     * 타이머를 다시 시작하지는 않는다. 종료 시각만 해제한다. */
    recordUncomplete: function () {
      endedAt = null;
    },

    isRunning: function () { return startedAt !== null && endedAt === null; },

    getStats: function () {
      var ms = elapsed();
      var wpm = null;
      var accuracy = null;

      if (totalKeystrokes > 0) {
        accuracy = round1((totalKeystrokes - errorCount) / totalKeystrokes * 100);

        if (startedAt !== null && ms >= MIN_MEASURABLE_MS) {
          wpm = Math.round((correctCount / 5) / (ms / 60000));
        }
      }

      return {
        wpm: wpm,                    // null = 측정 불가 (화면에는 "—")
        accuracy: accuracy,          // null = 측정 불가
        elapsedMs: ms,
        totalKeystrokes: totalKeystrokes,
        errorCount: errorCount,
        correctCount: correctCount
      };
    },

    /* 테스트용 — 시각을 주입해 결정적으로 검증한다 */
    _inject: function (v) {
      if (v.startedAt !== undefined) startedAt = v.startedAt;
      if (v.endedAt !== undefined) endedAt = v.endedAt;
      if (v.totalKeystrokes !== undefined) totalKeystrokes = v.totalKeystrokes;
      if (v.errorCount !== undefined) errorCount = v.errorCount;
      if (v.correctCount !== undefined) correctCount = v.correctCount;
    },

    _raw: function () {
      return { startedAt: startedAt, endedAt: endedAt,
               totalKeystrokes: totalKeystrokes,
               errorCount: errorCount, correctCount: correctCount };
    }
  };

})(window.App = window.App || {});
