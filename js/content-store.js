/* ============================================================
 * content-store.js — C-05 ContentStore
 * ------------------------------------------------------------
 * Unit 1 이 만든 window.APP_DATA 를 읽어
 * 조건에 맞는 문항을 골라 준다.
 *
 * 이 모듈이 Unit 1 의 데이터에 직접 손대는 유일한 컴포넌트다.
 * 나머지 컴포넌트는 여기서 돌려준 항목 객체만 다룬다.
 * ============================================================ */

(function (App) {
  'use strict';

  var words = [];
  var sentences = [];
  var guide = null;
  var current = null;
  var seqIndex = { word: -1, sentence: -1 };

  function isArray(v) { return Object.prototype.toString.call(v) === '[object Array]'; }

  function listOf(mode) { return mode === 'sentence' ? sentences : words; }

  function matches(item, criteria) {
    if (criteria.level && criteria.level !== 'all' && item.level !== criteria.level) return false;
    if (criteria.category && criteria.category !== 'all' && item.category !== criteria.category) return false;
    return true;
  }

  function filtered(criteria) {
    var list = listOf(criteria.mode);
    var out = [], i;
    for (i = 0; i < list.length; i++) {
      if (matches(list[i], criteria)) out.push(list[i]);
    }
    return out;
  }

  App.ContentStore = {

    init: function (rawData) {
      if (!rawData) {
        return { ok: false, wordCount: 0, sentenceCount: 0,
                 error: '콘텐츠 데이터를 찾을 수 없습니다. data/ 폴더의 파일이 로드되었는지 확인하세요.' };
      }
      words     = isArray(rawData.words) ? rawData.words : [];
      sentences = isArray(rawData.sentences) ? rawData.sentences : [];
      guide     = rawData.phonemeGuide || null;
      current   = null;
      seqIndex  = { word: -1, sentence: -1 };

      if (words.length === 0 && sentences.length === 0) {
        return { ok: false, wordCount: 0, sentenceCount: 0,
                 error: '콘텐츠가 비어 있습니다. data/words.js 와 data/sentences.js 를 확인하세요.' };
      }
      if (!guide) {
        return { ok: false, wordCount: words.length, sentenceCount: sentences.length,
                 error: '발음 기호 가이드를 찾을 수 없습니다. data/phoneme-guide.js 를 확인하세요.' };
      }
      return { ok: true, wordCount: words.length, sentenceCount: sentences.length, error: null };
    },

    getGuide: function () { return guide; },

    countAvailable: function (criteria) {
      return filtered(criteria).length;
    },

    /* WR-SEL01~09 */
    getNext: function (criteria) {
      var pool = filtered(criteria);

      if (pool.length === 0) { current = null; return null; }

      /* 후보가 하나뿐이면 직전과 같아도 그것을 낸다 (WR-SEL09) */
      if (pool.length === 1) { current = pool[0]; return current; }

      var picked;

      if (criteria.order === 'sequential') {
        var mode = criteria.mode === 'sentence' ? 'sentence' : 'word';
        seqIndex[mode] = (seqIndex[mode] + 1) % pool.length;
        picked = pool[seqIndex[mode]];
        /* 순차인데 직전과 같으면(필터가 바뀐 경우 등) 한 칸 더 */
        if (current && picked.id === current.id) {
          seqIndex[mode] = (seqIndex[mode] + 1) % pool.length;
          picked = pool[seqIndex[mode]];
        }
      } else {
        var candidates = pool;
        if (current) {
          candidates = [];
          for (var i = 0; i < pool.length; i++) {
            if (pool[i].id !== current.id) candidates.push(pool[i]);
          }
          if (candidates.length === 0) candidates = pool;
        }
        picked = candidates[Math.floor(Math.random() * candidates.length)];
      }

      current = picked;
      return current;
    },

    getCurrent: function () { return current; },

    /* 테스트·재시작 시 직전 항목을 지정 */
    setCurrent: function (item) { current = item || null; },

    getCategories: function (mode) {
      var list = listOf(mode), seen = {}, out = [], i, c;
      for (i = 0; i < list.length; i++) {
        c = list[i].category;
        if (c && !seen[c]) { seen[c] = true; out.push(c); }
      }
      out.sort();
      return out;
    },

    getLevels: function (mode) {
      var list = listOf(mode), seen = {}, order = ['beginner', 'intermediate', 'advanced'], i;
      for (i = 0; i < list.length; i++) seen[list[i].level] = true;
      return order.filter(function (l) { return seen[l]; });
    }
  };

})(window.App = window.App || {});
