/* ============================================================
 * app-state.js — C-04 AppState
 * ------------------------------------------------------------
 * 애플리케이션의 유일한 공유 상태를 보관하고, 변경을 통지한다.
 *
 * 이 모듈은 아무것도 계산하지 않는다. 보관하고 알릴 뿐이다.
 * 상태 저장소가 로직을 갖기 시작하면 "현재 상태가 무엇인가"를
 * 한 곳에서 볼 수 있다는 이점이 사라진다.
 *
 * 구독은 관심 키 기반이다. 발음 토글이 바뀌었을 때
 * 타이핑 렌더러를 호출하지 않는 것이 NFR-004(16ms) 확보의 근거다.
 * ============================================================ */

(function (App) {
  'use strict';

  var state = null;
  var subscribers = [];   // { keys: string[], fn: function }

  function defaults() {
    return {
      settings: {
        mode:     'word',
        level:    'all',
        category: 'all',
        order:    'random'
      },
      display: {
        showPronunciation: false,   // A-6 — 기본 숨김
        showMeaning:       false    // A-6 — showPronunciation 과 독립 (D-18)
      },
      session: {
        currentItem:    null,
        text:           '',
        charStates:     [],
        cursor:         0,
        changedIndexes: [],
        phase:          'ready'
      },
      stats: {
        startedAt:       null,
        endedAt:         null,
        totalKeystrokes: 0,
        errorCount:      0,
        correctCount:    0
      },
      env: {
        imeActive:    false,
        contentEmpty: false,
        loadError:    null
      }
    };
  }

  function shallowCopy(o) {
    var r = {}, k;
    for (k in o) if (o.hasOwnProperty(k)) r[k] = o[k];
    return r;
  }

  /* 변경된 최상위 그룹 키 목록을 만든다.
   * 구독자는 'session.charStates' 처럼 점 표기로 관심 키를 지정할 수 있다. */
  function changedKeys(partial) {
    var keys = [], group, field;
    for (group in partial) {
      if (!partial.hasOwnProperty(group)) continue;
      keys.push(group);
      if (partial[group] && typeof partial[group] === 'object') {
        for (field in partial[group]) {
          if (partial[group].hasOwnProperty(field)) keys.push(group + '.' + field);
        }
      }
    }
    return keys;
  }

  function notify(keys) {
    for (var i = 0; i < subscribers.length; i++) {
      var s = subscribers[i];
      var hit = false;
      for (var j = 0; j < s.keys.length; j++) {
        if (keys.indexOf(s.keys[j]) !== -1) { hit = true; break; }
      }
      if (hit) s.fn(get());
    }
  }

  function get() {
    if (!state) return null;
    return {
      settings: shallowCopy(state.settings),
      display:  shallowCopy(state.display),
      session:  shallowCopy(state.session),
      stats:    shallowCopy(state.stats),
      env:      shallowCopy(state.env)
    };
  }

  App.AppState = {

    init: function (initial) {
      state = defaults();
      if (initial) this.update(initial, true);
      return get();
    },

    get: get,

    /* partial 은 { group: { field: value } } 형태.
     * 그룹 단위로 병합하며, 지정하지 않은 필드는 유지된다. */
    update: function (partial, silent) {
      if (!state) state = defaults();
      var group, field;
      for (group in partial) {
        if (!partial.hasOwnProperty(group)) continue;
        if (!state[group]) { state[group] = {}; }
        for (field in partial[group]) {
          if (partial[group].hasOwnProperty(field)) {
            state[group][field] = partial[group][field];
          }
        }
      }
      if (!silent) notify(changedKeys(partial));
    },

    /* keys: 관심 키 배열. 예) ['session.charStates', 'session.changedIndexes'] */
    subscribe: function (keys, fn) {
      var entry = { keys: keys, fn: fn };
      subscribers.push(entry);
      return function unsubscribe() {
        var i = subscribers.indexOf(entry);
        if (i !== -1) subscribers.splice(i, 1);
      };
    },

    /* 세션과 통계만 초기화한다.
     * settings 와 display 는 건드리지 않는다 → AC-06.3(문항 이동 시 토글 유지) */
    resetSession: function () {
      var d = defaults();
      state.session = d.session;
      state.stats   = d.stats;
      state.env.contentEmpty = false;
      notify(['session', 'session.charStates', 'session.changedIndexes',
              'session.phase', 'stats', 'env', 'env.contentEmpty']);
    },

    resetAll: function () {
      state = defaults();
      notify(['settings', 'display', 'session', 'stats', 'env']);
    },

    /* 테스트용 — 구독자 전체 해제 */
    _clearSubscribers: function () { subscribers = []; }
  };

})(window.App = window.App || {});
