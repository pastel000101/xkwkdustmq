/* ============================================================
 * practice-session-service.js — S-02 PracticeSessionService
 * ------------------------------------------------------------
 * 한 문항의 시작부터 완료까지를 조율한다.
 *
 * ⚠️ onBackspace 에는 StatsTracker 호출이 없다.
 *    이 부재가 두 수용 기준을 동시에 지킨다:
 *      AC-03.3  지운 오타도 통계에 남는다 (errorCount 를 건드릴 경로가 없다)
 *      AC-04.3  백스페이스는 타이머를 시작시키지 않는다
 *    나중에 이 규칙을 깨려면 없던 호출을 새로 추가해야 한다.
 * ============================================================ */

(function (App) {
  'use strict';

  function pushCharState() {
    App.AppState.update({
      session: {
        charStates:     App.TypingEngine.getCharStates(),
        changedIndexes: App.TypingEngine.getChangedIndexes(),
        cursor:         App.TypingEngine.getCursor()
      }
    });
  }

  App.PracticeSessionService = {

    startNext: function () {
      var st = App.AppState.get();
      App.AppState.resetSession();
      App.ResultView.hide();

      var item = App.ContentStore.getNext(st.settings);
      if (!item) {
        App.PracticeLayout.clear();
        App.AppState.update({ session: { phase: 'empty' }, env: { contentEmpty: true } });
        return;
      }

      this._begin(item, st.settings.mode);
    },

    restart: function () {
      var item = App.ContentStore.getCurrent();
      if (!item) { this.startNext(); return; }

      var mode = App.AppState.get().settings.mode;
      App.AppState.resetSession();
      App.ResultView.hide();
      this._begin(item, mode);
    },

    _begin: function (item, mode) {
      App.TypingEngine.load(item.en);

      var refs = App.PracticeLayout.build(item, mode);
      App.TextRenderer.init(refs);
      App.AnnotationRenderer.init(refs);

      /* 발음과 뜻은 토글 상태와 무관하게 항상 미리 채운다 (WR-LAY02).
         토글을 켤 때 비로소 만들면 그 시점에 레이아웃이 재계산되어
         FR-025(레이아웃 불변)가 깨진다. */
      App.AnnotationRenderer.renderPronunciation();
      App.AnnotationRenderer.renderMeaning(item);

      App.AppState.update({
        session: {
          currentItem:    item,
          text:           item.en,
          charStates:     App.TypingEngine.getCharStates(),
          changedIndexes: [],
          cursor:         0,
          phase:          'ready'
        },
        env: { contentEmpty: false }
      });

      App.TextRenderer.renderAll(App.TypingEngine.getCharStates());
    },

    onChar: function (ch) {
      var st = App.AppState.get();
      if (st.session.phase === 'empty' || st.session.phase === 'completed') return;
      if (!st.session.text) return;

      var result = App.TypingEngine.handleChar(ch);
      if (result.ignored) return;

      App.StatsTracker.recordChar(result);      /* 타이머 시작이 여기 있다 (AC-04.1) */

      pushCharState();
      if (st.session.phase === 'ready') {
        App.AppState.update({ session: { phase: 'typing' } });
      }

      if (result.completed) this.handleCompletion();
    },

    onBackspace: function () {
      var st = App.AppState.get();
      if (st.session.phase === 'empty') return;
      if (!st.session.text) return;

      var result = App.TypingEngine.handleBackspace();
      if (!result.applied) return;              /* AC-03.4 */

      /* ⚠️ StatsTracker 를 호출하지 않는다 — AC-03.3 / AC-04.3 */

      if (result.uncompleted) {
        App.StatsTracker.recordUncomplete();    /* 종료 시각만 해제. 오타는 그대로 */
        App.ResultView.hide();
        App.AppState.update({ session: { phase: 'typing' } });
      }

      pushCharState();
    },

    handleCompletion: function () {
      App.StatsTracker.recordCompletion();      /* AC-04.2 */
      var stats = App.StatsTracker.getStats();
      App.AppState.update({ session: { phase: 'completed' } });
      App.ResultView.show(stats);               /* AC-05.1 */
    }
  };

})(window.App = window.App || {});
