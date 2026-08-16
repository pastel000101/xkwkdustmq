/* ============================================================
 * annotation-renderer.js — C-10 AnnotationRenderer
 * ------------------------------------------------------------
 * 발음 표기와 뜻을 슬롯에 채우고 표시를 전환한다.
 *
 * ⚠️ 표시 키 이름을 하드코딩하지 않는다.
 *    phonemeGuide[key].category 만 보고 배치하므로,
 *    Unit 1 이 표시 키를 추가해도 이 파일은 바뀌지 않는다 (WR-MK04).
 *
 * ⚠️ setPronunciationVisible 과 setMeaningVisible 은
 *    서로를 호출하지 않는다. 그래야 4가지 조합이 모두
 *    도달 가능하다는 것이 우연이 아니라 구조가 된다 (AC-12.4).
 * ============================================================ */

(function (App) {
  'use strict';

  var refs = null;
  var guide = null;
  var areaEl = null;

  function setGuide(g) { guide = g || {}; }

  /* marks 를 글자 인덱스별·부류별로 분류한다 (business-logic-model 4.1) */
  function classify(marks, sylCount) {
    var above = [], emphasize = [], below = [], i;
    for (i = 0; i < sylCount; i++) { above.push([]); emphasize.push(false); below.push([]); }

    if (!marks) return { above: above, emphasize: emphasize, below: below };

    for (i = 0; i < marks.length; i++) {
      var m = marks[i];
      var entry = guide[m.phoneme];

      /* 가이드에 없는 키는 건너뛴다 (시나리오 S-9).
         검증 스크립트가 걸렀어야 하는 상황이므로 앱을 멈추지는 않는다. */
      if (!entry) continue;
      if (typeof m.at !== 'number' || m.at < 0 || m.at >= sylCount) continue;

      switch (entry.category) {
        case 'prosody':  emphasize[m.at] = true; break;
        case 'spelling': below[m.at].push(entry.symbol); break;
        default:         above[m.at].push(entry.symbol); break;   /* 'phoneme' */
      }
    }
    return { above: above, emphasize: emphasize, below: below };
  }

  function fillSyllable(sylEl, ch, aboveList, stressed, belowList) {
    var mkAbove = sylEl.children[0];
    var mkChar  = sylEl.children[1];
    var mkBelow = sylEl.children[2];

    mkAbove.textContent = '';
    for (var i = 0; i < aboveList.length; i++) {
      var a = document.createElement('i');
      a.textContent = aboveList[i];
      mkAbove.appendChild(a);
    }

    mkChar.textContent = ch;
    mkChar.className = stressed ? 'mk-char stressed' : 'mk-char';

    mkBelow.textContent = '';
    for (var j = 0; j < belowList.length; j++) {
      var b = document.createElement('i');
      b.textContent = belowList[j];
      mkBelow.appendChild(b);
    }
  }

  App.AnnotationRenderer = {

    init: function (layoutRefs, phonemeGuide, practiceAreaEl) {
      refs = layoutRefs;
      if (phonemeGuide) setGuide(phonemeGuide);
      if (practiceAreaEl) areaEl = practiceAreaEl;
    },

    setGuide: setGuide,

    /* 그룹별 발음을 채운다.
       흡수된 단어(hangul === null)는 자기 슬롯이 없으므로
       그룹의 발음이 그 폭 전체를 덮는다 (WR-SPAN02/03). */
    renderPronunciation: function () {
      if (!refs) return;
      for (var g = 0; g < refs.groups.length; g++) {
        var grp = refs.groups[g];
        var hangul = grp.hangul;
        if (typeof hangul !== 'string' || hangul.length === 0) continue;

        var cls = classify(grp.marks, hangul.length);
        var syls = grp.pronunciationSlot.children;

        for (var s = 0; s < hangul.length && s < syls.length; s++) {
          fillSyllable(syls[s], hangul.charAt(s),
                       cls.above[s], cls.emphasize[s], cls.below[s]);
        }
      }
    },

    renderMeaning: function (item) {
      if (!refs || !refs.meaningSlot) return;
      refs.meaningSlot.textContent = (item && item.meaning) ? item.meaning : '';
    },

    /* visibility 만 바꾼다. display:none 을 쓰지 않는다 (WR-LAY03) */
    setPronunciationVisible: function (visible) {
      if (!areaEl) return;
      if (visible) areaEl.classList.remove('hide-pron');
      else areaEl.classList.add('hide-pron');
    },

    setMeaningVisible: function (visible) {
      if (!areaEl) return;
      if (visible) areaEl.classList.remove('hide-meaning');
      else areaEl.classList.add('hide-meaning');
    },

    /* 테스트용 */
    _classify: function (marks, sylCount, g) {
      var prev = guide;
      if (g) guide = g;
      var r = classify(marks, sylCount);
      guide = prev;
      return r;
    }
  };

})(window.App = window.App || {});
