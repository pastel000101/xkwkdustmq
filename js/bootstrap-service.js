/* ============================================================
 * bootstrap-service.js — S-01 BootstrapService
 * ------------------------------------------------------------
 * 앱을 기동하고 컴포넌트를 연결한다.
 *
 * 이 파일이 스크립트 로드 순서상 마지막이어야 한다.
 * 다른 모듈은 로드 시점에 네임스페이스 등록만 하고
 * 상호 참조는 start() 가 불릴 때 비로소 시작된다.
 * ============================================================ */

(function (App) {
  'use strict';

  function $(id) { return document.getElementById(id); }

  function collectDom() {
    return {
      practiceArea:   $('practice-area'),
      groups:         $('groups'),
      meaningLayer:   $('meaning-layer'),

      modeSelect:     $('mode-select'),
      levelSelect:    $('level-select'),
      categorySelect: $('category-select'),
      orderSelect:    $('order-select'),
      pronToggle:     $('pron-toggle'),
      meaningToggle:  $('meaning-toggle'),
      legendButton:   $('legend-btn'),
      shortcutGuide:  $('shortcut-guide'),

      imeWarning:     $('ime-warning'),
      emptyNotice:    $('empty-notice'),
      loadError:      $('load-error'),

      panel:          $('result-panel'),
      wpm:            $('result-wpm'),
      accuracy:       $('result-accuracy'),
      time:           $('result-time'),
      errors:         $('result-errors'),
      retryButton:    $('retry-button'),
      nextButton:     $('next-button'),

      backdrop:       $('legend-modal'),
      body:           $('legend-body'),
      closeButton:    $('legend-close')
    };
  }

  App.BootstrapService = {

    start: function () {
      var dom = collectDom();

      /* 1. 데이터 적재 */
      var load = App.ContentStore.init(window.APP_DATA);
      if (!load.ok) { this.handleLoadFailure(dom, load.error); return; }

      /* 2. 상태 초기화 — 토글 기본값은 둘 다 꺼짐 (A-6) */
      App.AppState.init();

      /* 3. 뷰 컴포넌트 초기화 */
      App.PracticeLayout.attach(dom.groups, dom.meaningLayer);
      App.AnnotationRenderer.init(null, App.ContentStore.getGuide(), dom.practiceArea);
      App.LegendView.init(dom, App.ContentStore.getGuide());

      /* 4. 핸들러 주입 */
      App.ControlPanel.init(dom, {
        onSettingChange:       function (k, v) { App.SettingsService.changeSetting(k, v); },
        onTogglePronunciation: function () { App.SettingsService.togglePronunciation(); },
        onToggleMeaning:       function () { App.SettingsService.toggleMeaning(); },
        onShowLegend:          function () { App.SettingsService.showLegend(); }
      });

      App.ResultView.init(dom, {
        onRetry: function () { App.PracticeSessionService.restart(); },
        onNext:  function () { App.PracticeSessionService.startNext(); }
      });

      App.InputHandler.init({
        onChar:      function (ch) { App.PracticeSessionService.onChar(ch); },
        onBackspace: function () { App.PracticeSessionService.onBackspace(); },
        onShortcut:  function (a) { App.SettingsService.handleShortcut(a); },
        onImeState:  function (active) {
          if (App.AppState.get().env.imeActive !== active) {
            App.AppState.update({ env: { imeActive: active } });
          }
        }
      });
      App.InputHandler.attach(document);

      /* 5. 구독 등록 — 관심 키가 바뀔 때만 해당 구독자가 호출된다 */
      this.wireComponents();

      /* 6. 초기 UI 반영 */
      var st = App.AppState.get();
      App.ControlPanel.setCategoryOptions(App.ContentStore.getCategories(st.settings.mode));
      App.ControlPanel.renderSettings(st);
      App.ControlPanel.renderToggleStates(st.display.showPronunciation, st.display.showMeaning);
      App.AnnotationRenderer.setPronunciationVisible(st.display.showPronunciation);
      App.AnnotationRenderer.setMeaningVisible(st.display.showMeaning);

      /* 7. 첫 문항 */
      App.PracticeSessionService.startNext();
    },

    wireComponents: function () {
      /* 타이핑 상태 → 텍스트 렌더러만.
         발음 토글이 바뀌어도 여기는 호출되지 않는다 (NFR-004) */
      App.AppState.subscribe(['session.charStates', 'session.changedIndexes'], function (s) {
        App.TextRenderer.renderChanged(s.session.changedIndexes, s.session.charStates);
      });

      App.AppState.subscribe(['display.showPronunciation'], function (s) {
        App.AnnotationRenderer.setPronunciationVisible(s.display.showPronunciation);
      });

      App.AppState.subscribe(['display.showMeaning'], function (s) {
        App.AnnotationRenderer.setMeaningVisible(s.display.showMeaning);
      });

      App.AppState.subscribe(['display.showPronunciation', 'display.showMeaning'], function (s) {
        App.ControlPanel.renderToggleStates(s.display.showPronunciation, s.display.showMeaning);
      });

      App.AppState.subscribe(['settings'], function (s) {
        App.ControlPanel.renderSettings(s);
      });

      App.AppState.subscribe(['env.imeActive'], function (s) {
        App.ControlPanel.showImeWarning(s.env.imeActive);
      });

      App.AppState.subscribe(['env.contentEmpty'], function (s) {
        App.ControlPanel.showEmptyContentNotice(s.env.contentEmpty);
      });

      App.AppState.subscribe(['session.phase'], function (s) {
        var area = document.getElementById('practice-area');
        if (area) {
          if (s.session.phase === 'empty') area.classList.add('inactive');
          else area.classList.remove('inactive');
        }
      });
    },

    handleLoadFailure: function (dom, message) {
      if (dom.loadError) {
        dom.loadError.textContent = message;
        dom.loadError.hidden = false;
      }
      if (dom.practiceArea) dom.practiceArea.classList.add('inactive');
      console.error('[Bootstrap] ' + message);
    }
  };

})(window.App = window.App || {});
