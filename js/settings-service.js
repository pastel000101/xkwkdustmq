/* ============================================================
 * settings-service.js — S-03 SettingsService
 * ------------------------------------------------------------
 * 설정과 표시 토글 변경을 처리한다.
 *
 * ⚠️ togglePronunciation 과 toggleMeaning 은 서로를 호출하지 않는다.
 *    두 토글이 한 함수를 공유하면 독립성이 우연에 의존하게 된다.
 *    이렇게 나눠 두면 4가지 조합이 모두 도달 가능하다는 것이
 *    구조로 보장된다 (AC-12.4).
 * ============================================================ */

(function (App) {
  'use strict';

  App.SettingsService = {

    changeSetting: function (key, value) {
      var patch = {};
      patch[key] = value;
      App.AppState.update({ settings: patch });

      var s = App.AppState.get().settings;

      /* 모드가 바뀌면 그 모드의 카테고리 목록으로 갱신 */
      if (key === 'mode') {
        App.ControlPanel.setCategoryOptions(App.ContentStore.getCategories(s.mode));
        s = App.AppState.get().settings;
      }

      var count = App.ContentStore.countAvailable(s);
      if (count === 0) {
        App.AppState.update({ session: { phase: 'empty' }, env: { contentEmpty: true } });
        App.PracticeLayout.clear();
        App.ResultView.hide();
        return;
      }

      App.AppState.update({ env: { contentEmpty: false } });
      App.PracticeSessionService.startNext();     /* AC-10.3 */
    },

    togglePronunciation: function () {
      var cur = App.AppState.get().display.showPronunciation;
      App.AppState.update({ display: { showPronunciation: !cur } });
      /* showMeaning 은 건드리지 않는다 */
    },

    toggleMeaning: function () {
      var cur = App.AppState.get().display.showMeaning;
      App.AppState.update({ display: { showMeaning: !cur } });
      /* showPronunciation 은 건드리지 않는다 */
    },

    showLegend: function () {
      App.LegendView.toggle();
      /* 세션 상태를 건드리지 않는다 (AC-15.3) */
    },

    handleShortcut: function (action) {
      switch (action) {
        case 'next':
          App.PracticeSessionService.startNext();
          break;

        case 'escape':
          /* 모달이 열려 있으면 Esc 는 모달 닫기로 동작한다.
             Esc 의 의미가 문맥에 따라 달라지는 유일한 예외다. */
          if (App.LegendView.isOpen()) App.LegendView.hide();
          else App.PracticeSessionService.restart();
          break;

        case 'togglePronunciation':
          this.togglePronunciation();
          break;

        case 'toggleMeaning':
          this.toggleMeaning();
          break;

        case 'legend':
          this.showLegend();
          break;
      }
    }
  };

})(window.App = window.App || {});
