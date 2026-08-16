/* ============================================================
 * practice-layout.js — C-08 PracticeLayout
 * ------------------------------------------------------------
 * 연습 영역의 DOM 골격을 만들고 슬롯 참조를 넘긴다.
 *
 * 골격과 내용을 나눈 것이 FR-025(토글해도 레이아웃 불변)의 근거다.
 * 골격을 한 번 만들면 토글은 슬롯 내용의 표시 여부만 바꾸므로
 * 구조가 흔들릴 여지가 없다.
 *
 * charElements 는 text 와 1:1 대응하는 flat 배열이다.
 * 단어 사이의 공백도 원소로 포함되므로
 * TypingEngine 의 인덱스를 변환 없이 그대로 쓸 수 있다.
 * ============================================================ */

(function (App) {
  'use strict';

  var refs = null;
  var root = null;
  var meaningEl = null;

  function el(tag, cls) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  }

  /* 연음 그룹 분할 — span 만큼 단어를 묶는다 (business-logic-model 5.1) */
  function splitGroups(words) {
    var groups = [], i = 0;
    while (i < words.length) {
      var span = (typeof words[i].span === 'number' && words[i].span > 0) ? words[i].span : 1;
      if (i + span > words.length) span = words.length - i;   // 방어
      groups.push({
        span: span,
        hangul: words[i].hangul,
        marks: words[i].marks || [],
        members: words.slice(i, i + span)
      });
      i += span;
    }
    return groups;
  }

  /* 단어 모드의 항목을 문장 모드와 같은 구조로 감싼다 */
  function asWordGroups(item) {
    return [{
      span: 1,
      hangul: item.hangul,
      marks: item.marks || [],
      members: [{ en: item.en }]
    }];
  }

  /* 문자 요소 하나 */
  function makeChar(ch, index) {
    var c = el('span', ch === ' ' ? 'ch space' : 'ch');
    c.textContent = ch;
    c.setAttribute('data-i', String(index));
    c.setAttribute('data-testid', 'char-' + index);
    return c;
  }

  /* 발음 슬롯의 빈 음절 3층 골격. 내용은 AnnotationRenderer 가 채운다 */
  function makeSyllable() {
    var syl = el('span', 'syl');
    syl.appendChild(el('span', 'mk-above'));
    var ch = el('span', 'mk-char');
    syl.appendChild(ch);
    syl.appendChild(el('span', 'mk-below'));
    return syl;
  }

  App.PracticeLayout = {

    /* rootEl: .groups, meaningEl: .meaning-layer */
    attach: function (groupsEl, meaningSlotEl) {
      root = groupsEl;
      meaningEl = meaningSlotEl;
    },

    build: function (item, mode) {
      if (!root) throw new Error('PracticeLayout.attach() 가 먼저 호출되어야 합니다.');

      root.textContent = '';
      if (meaningEl) meaningEl.textContent = '';

      var text = item.en;
      var groups = (mode === 'sentence') ? splitGroups(item.words || []) : asWordGroups(item);

      var charElements = [];
      var cursorInText = 0;
      var groupRefs = [];

      for (var g = 0; g < groups.length; g++) {
        var grp = groups[g];

        var groupEl = el('span', 'group');
        groupEl.setAttribute('data-span', String(grp.span));

        /* 발음 슬롯 — 한글 글자 수만큼 음절 골격 */
        var pron = el('span', 'pron-slot');
        var sylCount = (typeof grp.hangul === 'string') ? grp.hangul.length : 0;
        for (var s = 0; s < sylCount; s++) pron.appendChild(makeSyllable());
        groupEl.appendChild(pron);

        /* 영어 줄 — 그룹에 속한 단어들과 그 사이 공백 */
        var enRow = el('span', 'en-row');
        var wordBlocks = [];

        for (var m = 0; m < grp.members.length; m++) {
          if (m > 0) {
            /* 그룹 안 공백 (연음으로 묶인 단어 사이) */
            var innerSpace = makeChar(' ', cursorInText);
            enRow.appendChild(innerSpace);
            charElements.push(innerSpace);
            cursorInText += 1;
          }
          var wordEn = grp.members[m].en;
          var blockChars = [];
          for (var k = 0; k < wordEn.length; k++) {
            var ce = makeChar(wordEn.charAt(k), cursorInText);
            enRow.appendChild(ce);
            charElements.push(ce);
            blockChars.push(ce);
            cursorInText += 1;
          }
          wordBlocks.push({ en: wordEn, charElements: blockChars });
        }

        groupEl.appendChild(enRow);
        root.appendChild(groupEl);

        groupRefs.push({
          span: grp.span,
          hangul: grp.hangul,
          marks: grp.marks,
          pronunciationSlot: pron,
          syllables: pron.childNodes,
          wordBlocks: wordBlocks
        });

        /* 그룹 사이 공백 — 그룹 밖에 둔다. 줄바꿈은 여기서만 일어난다 (WR-SPAN06) */
        if (g < groups.length - 1) {
          var gapWrap = el('span', 'gap');
          var gapRow = el('span', 'en-row');
          var gapChar = makeChar(' ', cursorInText);
          gapRow.appendChild(gapChar);
          gapWrap.appendChild(el('span', 'pron-slot'));
          gapWrap.appendChild(gapRow);
          root.appendChild(gapWrap);
          charElements.push(gapChar);
          cursorInText += 1;
        }
      }

      /* charElements 가 text 와 어긋나면 이후 모든 인덱스가 틀어진다.
         조용히 넘어가면 원인을 찾기 어려우므로 즉시 드러낸다. */
      if (charElements.length !== text.length) {
        console.error(
          '[PracticeLayout] charElements 길이(' + charElements.length +
          ')가 text 길이(' + text.length + ')와 다릅니다. id=' + item.id
        );
      }

      refs = {
        root: root,
        groups: groupRefs,
        charElements: charElements,
        meaningSlot: meaningEl
      };
      return refs;
    },

    clear: function () {
      if (root) root.textContent = '';
      if (meaningEl) meaningEl.textContent = '';
      refs = null;
    },

    getRefs: function () { return refs; },

    /* 테스트용 */
    _splitGroups: splitGroups
  };

})(window.App = window.App || {});
