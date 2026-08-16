/* ============================================================
 * result-view.js — C-11 ResultView
 * ------------------------------------------------------------
 * 연습 결과를 같은 화면 안에 표시한다 (단일 화면 구성).
 *
 * 측정 불가(null)는 0 이나 클램프 값이 아니라 "—" 로 보여준다.
 * 0 을 보여주면 사용자가 그것을 실제 기록으로 오해한다 (WR-CALC04).
 * ============================================================ */

(function (App) {
  'use strict';

  var els = {};
  var handlers = {};

  function fmtWpm(v)      { return v === null || v === undefined ? '—' : String(v); }
  function fmtAccuracy(v) { return v === null || v === undefined ? '—' : v.toFixed(1) + '%'; }
  function fmtTime(ms) {
    if (!ms || ms <= 0) return '—';
    return (ms / 1000).toFixed(1) + '초';    /* 소수 1자리 (AC-05.5) */
  }

  App.ResultView = {

    init: function (dom, h) {
      els = dom;
      handlers = h || {};
      if (els.retryButton) {
        els.retryButton.addEventListener('click', function () {
          if (handlers.onRetry) handlers.onRetry();
        });
      }
      if (els.nextButton) {
        els.nextButton.addEventListener('click', function () {
          if (handlers.onNext) handlers.onNext();
        });
      }
    },

    show: function (stats) {
      if (!els.panel) return;
      els.wpm.textContent      = fmtWpm(stats.wpm);
      els.accuracy.textContent = fmtAccuracy(stats.accuracy);
      els.time.textContent     = fmtTime(stats.elapsedMs);
      els.errors.textContent   = String(stats.errorCount);
      els.panel.hidden = false;
    },

    hide: function () {
      if (els.panel) els.panel.hidden = true;
    },

    isVisible: function () {
      return !!(els.panel && !els.panel.hidden);
    },

    /* 테스트용 */
    _format: { wpm: fmtWpm, accuracy: fmtAccuracy, time: fmtTime }
  };

})(window.App = window.App || {});
