/* ============================================================
 * validate-content.js — 콘텐츠 데이터 검증 로직
 * ------------------------------------------------------------
 * 브라우저와 Node 양쪽에서 동작한다 (UMD 패턴).
 *   브라우저: <script src> 로 로드 → window.ContentValidator
 *   Node    : require('./validate-content.js')
 *
 * 검사 단계
 *   Stage 1  구조    필드 존재, 타입, id 형식·유일성, en 중복
 *   Stage 2  값      hangul 문자 종류, meaning, level, category
 *   Stage 3  표시    at 범위, phoneme 유효성, (at,phoneme) 중복
 *   Stage 4  문장    words 결합=en, span 합계, null 정합, 단어 수
 *   Stage 5  일관성  접미사·어두 패턴 그룹 비교
 *   Stage 6  집계    분량, 카테고리 분포
 *
 * 앞 Stage 에서 error 가 난 항목은 이후 Stage 를 건너뛴다.
 *
 * 이 검증기가 담보하는 것은 "규칙과의 일관성"이지
 * "발음의 절대적 정확성"이 아니다. docs/pronunciation-rules.md 12절 참조.
 * ============================================================ */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ContentValidator = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------------- 설정 ---------------- */

  var LEVELS = ['beginner', 'intermediate', 'advanced'];

  var CATEGORIES = ['daily', 'food', 'travel', 'school', 'work', 'feeling', 'tech', 'nature'];

  var MIN_WORDS = 1000;
  var MIN_SENTENCES = 300;
  var MIN_WORDS_PER_CATEGORY = 60;
  var SENTENCE_WORD_MIN = 4;
  var SENTENCE_WORD_MAX = 14;

  var HANGUL_ONLY = /^[가-힣]+$/;
  var HAS_HANGUL = /[가-힣]/;

  /* PR-IN19 — en 필드는 키보드로 칠 수 있는 문자만 담는다.
   * 스마트 따옴표(U+2019)나 en-dash(U+2013)가 들어가면
   * 사용자가 그 문자를 영원히 맞힐 수 없다 (Unit 2 WR-CMP05). */
  var TYPEABLE_ASCII = /^[\x20-\x7E]+$/;
  var WORD_ID = /^w\d{4,}$/;
  var SENTENCE_ID = /^s\d{4,}$/;

  /* PR-EX01 예외 목록 — 일관성 검사에서 제외 */
  var EXCEPTION_WORDS = [
    'one', 'two', 'of', 'colonel', 'wednesday',
    'february', 'comfortable', 'iron',
    /* -tion 이지만 /ʃən/ 이 아니라 /tʃən/ 으로 발음된다 */
    'question', 'suggestion', 'digestion'
  ];

  /* PR-CN01 접미사 꼬리 표기 검사
   *
   * 꼬리는 대부분 1글자로 본다. 한글은 앞 자음이 접미사 글자에 합쳐지기 때문이다.
   *   message  -> 메시지   ('이지' 가 아니라 '지' 로 끝난다)
   *   famous   -> 페이머스 ('어스' 가 아니라 '스' 로 끝난다)
   *   vegetable-> 베지터블 ('어블' 이 아니라 '블' 로 끝난다)
   * 꼬리를 길게 잡으면 정상 표기를 위반으로 잡는 거짓 양성이 난다.
   *
   * minLen: 접미사가 아닌 우연한 일치를 걸러낸다
   *         (table 은 'able' 로 끝나지만 -able 접미사가 아니다)
   *
   * skipBefore: 접미사 앞 글자가 여기 있으면 검사하지 않는다.
   *         butterfly 의 'ly' 는 부사 접미사가 아니라 'fly' 의 일부다. */
  var TAIL_PATTERNS = [
    { suffix: 'tion', tails: ['션'],               minLen: 6 },
    { suffix: 'sion', tails: ['션', '전'],          minLen: 6 },
    { suffix: 'ture', tails: ['처'],               minLen: 6 },
    { suffix: 'ous',  tails: ['스'],               minLen: 6 },
    { suffix: 'ment', tails: ['먼트'],             minLen: 7 },
    { suffix: 'ness', tails: ['니스'],             minLen: 7 },
    { suffix: 'age',  tails: ['지'],               minLen: 6 },
    { suffix: 'able', tails: ['블'],               minLen: 7 },
    { suffix: 'ible', tails: ['블'],               minLen: 7 },
    { suffix: 'ly',   tails: ['리'],               minLen: 5, skipBefore: 'fpbgc' },
    /* PR-CN02 — -ed 는 선행 음소에 따라 3갈래. 셋 중 하나면 통과 */
    { suffix: 'ed',   tails: ['트', '드', '이드'],  minLen: 5 }
  ];

  /* -ing 은 꼬리 문자열로 검사할 수 없다.
   * 앞 자음이 합쳐져 '잉' 이라는 글자가 남지 않기 때문이다.
   *   morning -> 모닝,  bring -> 브륑,  going -> 고잉
   * 공통점은 "마지막 글자의 종성이 ㅇ" 이라는 구조적 성질이다. */
  var JONGSEONG_NG = 21;   /* 한글 종성 인덱스에서 ㅇ */

  function endsWithNg(hangul) {
    if (!hangul || hangul.length === 0) return false;
    var code = hangul.charCodeAt(hangul.length - 1) - 0xAC00;
    if (code < 0 || code > 11171) return false;
    return (code % 28) === JONGSEONG_NG;
  }

  /* PR-CN03 어두·어말 패턴 — 특정 표시를 요구한다 */
  var MARK_PATTERNS = [
    { kind: 'prefix', pattern: 'ph', requireAny: ['f'],        minLen: 3 },
    { kind: 'prefix', pattern: 'th', requireAny: ['th', 'dh'], minLen: 3 },
    { kind: 'prefix', pattern: 'sh', requireAny: ['sh'],       minLen: 3 },
    { kind: 'prefix', pattern: 'wr', requireAny: ['r'],        minLen: 3 },
    { kind: 'suffix', pattern: 'er', requireAny: ['r'],        minLen: 5 },
    { kind: 'suffix', pattern: 'or', requireAny: ['r'],        minLen: 5 },
    { kind: 'suffix', pattern: 'ture', requireAny: ['r'],      minLen: 6 }
  ];

  /* ---------------- 유틸 ---------------- */

  function violation(itemId, field, rule, message, severity) {
    return {
      itemId: itemId,
      field: field,
      rule: rule,
      message: message,
      severity: severity || 'error'
    };
  }

  function isArray(v) { return Object.prototype.toString.call(v) === '[object Array]'; }
  function isString(v) { return typeof v === 'string'; }

  function tail(str, n) { return str.slice(Math.max(0, str.length - n)); }

  /* ---------------- Stage 1 : 구조 ---------------- */

  function checkStructure(item, kind, seenIds, seenEn) {
    var v = [];
    var idPattern = kind === 'word' ? WORD_ID : SENTENCE_ID;
    var id = isString(item.id) ? item.id : '(id 없음)';

    if (!isString(item.id) || !idPattern.test(item.id)) {
      v.push(violation(id, 'id', 'PR-IN01',
        id + ': id 형식 오류 (기대: ' + (kind === 'word' ? 'w0000' : 's0000') + ' 형식)'));
    } else if (seenIds[item.id]) {
      v.push(violation(id, 'id', 'PR-IN01', id + ': id 중복'));
    } else {
      seenIds[item.id] = true;
    }

    if (!isString(item.en) || item.en.length === 0) {
      v.push(violation(id, 'en', 'PR-IN02', id + ': en 필드가 비어 있음'));
    } else {
      var key = item.en.toLowerCase();
      if (seenEn[key]) {
        v.push(violation(id, 'en', 'PR-IN01',
          id + ': en "' + item.en + '" 이 ' + seenEn[key] + ' 와 중복'));
      } else {
        seenEn[key] = item.id;
      }
      if (kind === 'word' && /\s/.test(item.en)) {
        v.push(violation(id, 'en', 'PR-IN02', id + ': 단어 en 에 공백이 포함됨'));
      }
      if (!TYPEABLE_ASCII.test(item.en)) {
        v.push(violation(id, 'en', 'PR-IN19',
          id + ': en 에 키보드로 칠 수 없는 문자가 있음 — "' + item.en + '"'));
      }
    }

    if (kind === 'word' && !isArray(item.marks)) {
      v.push(violation(id, 'marks', 'PR-IN07', id + ': marks 필드 누락 또는 배열 아님'));
    }
    if (kind === 'sentence' && !isArray(item.words)) {
      v.push(violation(id, 'words', 'PR-IN07', id + ': words 필드 누락 또는 배열 아님'));
    }

    return v;
  }

  /* ---------------- Stage 2 : 값 ---------------- */

  function checkValues(item, kind) {
    var v = [];
    var id = item.id;

    if (kind === 'word') {
      if (!isString(item.hangul) || item.hangul.length === 0) {
        v.push(violation(id, 'hangul', 'PR-IN03', id + ': hangul 이 비어 있음'));
      } else if (!HANGUL_ONLY.test(item.hangul)) {
        v.push(violation(id, 'hangul', 'PR-IN03',
          id + ': hangul 에 한글 아닌 문자 포함 — "' + item.hangul + '"'));
      }
    }

    if (!isString(item.meaning) || item.meaning.length === 0) {
      v.push(violation(id, 'meaning', 'PR-IN04',
        id + ': meaning 누락 — 영어/발음/뜻 3종 세트 미완비'));
    } else if (!HAS_HANGUL.test(item.meaning)) {
      v.push(violation(id, 'meaning', 'PR-IN04',
        id + ': meaning 에 한글이 없음 — "' + item.meaning + '"'));
    }

    if (LEVELS.indexOf(item.level) === -1) {
      v.push(violation(id, 'level', 'PR-IN05', id + ': level 값 오류 — "' + item.level + '"'));
    }

    if (item.category !== undefined && CATEGORIES.indexOf(item.category) === -1) {
      v.push(violation(id, 'category', 'PR-IN06',
        id + ': category 값 오류 — "' + item.category + '"'));
    }

    return v;
  }

  /* ---------------- Stage 3 : 표시 ---------------- */

  function checkMarks(marks, hangul, ownerId, guide, fieldPrefix) {
    var v = [];
    var seen = {};
    var prefix = fieldPrefix || 'marks';

    if (!isArray(marks)) {
      v.push(violation(ownerId, prefix, 'PR-IN07', ownerId + ': ' + prefix + ' 가 배열이 아님'));
      return v;
    }

    for (var i = 0; i < marks.length; i++) {
      var m = marks[i];
      var field = prefix + '[' + i + ']';

      if (typeof m.at !== 'number' || m.at < 0 || !hangul || m.at >= hangul.length) {
        v.push(violation(ownerId, field + '.at', 'PR-IN08',
          ownerId + ': mark.at=' + m.at + ' 이 hangul 길이 ' +
          (hangul ? hangul.length : 0) + ' 범위를 벗어남'));
        continue;
      }

      if (!guide || !guide[m.phoneme]) {
        v.push(violation(ownerId, field + '.phoneme', 'PR-IN09',
          ownerId + ': 알 수 없는 표시 키 "' + m.phoneme + '"'));
        continue;
      }

      /* INV-8′ — (at, phoneme) 쌍 기준 중복 검사.
       * 같은 at 에 서로 다른 phoneme 은 정상이다 (fan → 팬 에 f + ae). */
      var key = m.at + ' ' + m.phoneme;
      if (seen[key]) {
        v.push(violation(ownerId, field, 'PR-IN10',
          ownerId + ': 표시 중복 — at=' + m.at + ', phoneme=' + m.phoneme));
      } else {
        seen[key] = true;
      }
    }

    return v;
  }

  /* ---------------- Stage 4 : 문장 구조 ---------------- */

  function checkSentenceStructure(item, guide) {
    var v = [];
    var id = item.id;
    var words = item.words;

    if (!isArray(words)) return v;

    if (words.length < SENTENCE_WORD_MIN || words.length > SENTENCE_WORD_MAX) {
      v.push(violation(id, 'words', 'PR-IN17',
        id + ': 단어 수 ' + words.length + ' 이 허용 범위(' +
        SENTENCE_WORD_MIN + '~' + SENTENCE_WORD_MAX + ') 밖'));
    }

    /* INV-1 */
    var joined = words.map(function (w) { return w.en; }).join(' ');
    if (joined !== item.en) {
      v.push(violation(id, 'words', 'PR-IN11',
        id + ': words 결합 결과가 원문과 불일치\n      원문: "' + item.en + '"\n      결합: "' + joined + '"'));
    }

    /* INV-2 / INV-3 */
    var spanSum = 0;
    var absorbRemaining = 0;
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      var span = (typeof w.span === 'number') ? w.span : 1;

      if (absorbRemaining > 0) {
        if (w.hangul !== null) {
          v.push(violation(id, 'words[' + i + '].hangul', 'PR-IN13',
            id + ': span 흡수 단어 "' + w.en + '" 의 hangul 이 null 이 아님'));
        }
        if (isArray(w.marks) && w.marks.length > 0) {
          v.push(violation(id, 'words[' + i + '].marks', 'PR-IN14',
            id + ': hangul 이 null 인데 marks 가 비어 있지 않음 — "' + w.en + '"'));
        }
        /* 흡수된 단어는 앞 단어의 span 에 이미 포함되었으므로 spanSum 에 더하지 않는다 */
        absorbRemaining--;
        continue;
      }

      if (w.hangul === null) {
        v.push(violation(id, 'words[' + i + '].hangul', 'PR-IN13',
          id + ': "' + w.en + '" 의 hangul 이 null 인데 앞선 span 에 흡수되지 않음'));
      } else if (!isString(w.hangul) || w.hangul.length === 0) {
        v.push(violation(id, 'words[' + i + '].hangul', 'PR-IN03',
          id + ': "' + w.en + '" 의 hangul 이 비어 있음'));
      } else if (!HANGUL_ONLY.test(w.hangul)) {
        v.push(violation(id, 'words[' + i + '].hangul', 'PR-IN03',
          id + ': "' + w.en + '" 의 hangul 에 한글 아닌 문자 포함 — "' + w.hangul + '"'));
      } else {
        if (!TYPEABLE_ASCII.test(w.en)) {
          v.push(violation(id, 'words[' + i + '].en', 'PR-IN19',
            id + ': 문장 내 단어 "' + w.en + '" 에 키보드로 칠 수 없는 문자가 있음'));
        }
        v = v.concat(checkMarks(w.marks, w.hangul, id, guide, 'words[' + i + '].marks'));
      }

      spanSum += span;
      if (span > 1) absorbRemaining = span - 1;
    }

    if (spanSum !== words.length) {
      v.push(violation(id, 'words', 'PR-IN12',
        id + ': span 합계 ' + spanSum + ' ≠ 단어 수 ' + words.length));
    }

    return v;
  }

  /* ---------------- Stage 5 : 일관성 ---------------- */

  function markKeysOf(item) {
    var keys = {};
    if (isArray(item.marks)) {
      for (var i = 0; i < item.marks.length; i++) keys[item.marks[i].phoneme] = true;
    }
    return keys;
  }

  function checkConsistency(words) {
    var v = [];

    var targets = words.filter(function (w) {
      return isString(w.en) && isString(w.hangul) &&
             EXCEPTION_WORDS.indexOf(w.en.toLowerCase()) === -1;
    });

    /* 접미사 꼬리 표기 */
    for (var p = 0; p < TAIL_PATTERNS.length; p++) {
      var pat = TAIL_PATTERNS[p];
      for (var i = 0; i < targets.length; i++) {
        var w = targets[i];
        var en = w.en.toLowerCase();
        if (en.length < pat.minLen) continue;
        if (tail(en, pat.suffix.length) !== pat.suffix) continue;

        /* 접미사가 아닌 우연한 일치를 건너뛴다 (butterfly 의 'fly') */
        if (pat.skipBefore) {
          var before = en.charAt(en.length - pat.suffix.length - 1);
          if (pat.skipBefore.indexOf(before) !== -1) continue;
        }

        var matched = pat.tails.some(function (t) {
          return tail(w.hangul, t.length) === t;
        });
        if (!matched) {
          v.push(violation(w.id, 'hangul', 'PR-CN01',
            w.id + ' (' + w.en + '): 패턴 -' + pat.suffix +
            ' 의 기준 표기 [' + pat.tails.join(', ') + '] 중 어느 것으로도 끝나지 않음 — "' + w.hangul + '"'));
        }
      }
    }

    /* -ing 은 구조적으로 검사한다 — 마지막 글자의 종성이 ㅇ 인가 */
    for (var n = 0; n < targets.length; n++) {
      var nw = targets[n];
      var nen = nw.en.toLowerCase();
      if (nen.length < 5) continue;
      if (tail(nen, 3) !== 'ing') continue;
      if (!endsWithNg(nw.hangul)) {
        v.push(violation(nw.id, 'hangul', 'PR-CN01',
          nw.id + ' (' + nw.en + '): -ing 단어인데 마지막 글자의 종성이 ㅇ 이 아님 — "' +
          nw.hangul + '"'));
      }
    }

    /* 어두·어말 표시 요구 */
    for (var q = 0; q < MARK_PATTERNS.length; q++) {
      var mp = MARK_PATTERNS[q];
      for (var j = 0; j < targets.length; j++) {
        var t = targets[j];
        var lower = t.en.toLowerCase();
        if (lower.length < mp.minLen) continue;

        var hit = mp.kind === 'prefix'
          ? lower.indexOf(mp.pattern) === 0
          : tail(lower, mp.pattern.length) === mp.pattern;
        if (!hit) continue;

        var keys = markKeysOf(t);
        var ok = mp.requireAny.some(function (k) { return keys[k]; });
        if (!ok) {
          v.push(violation(t.id, 'marks', 'PR-CN03',
            t.id + ' (' + t.en + '): ' + mp.kind + ' "' + mp.pattern +
            '" 인데 [' + mp.requireAny.join(' | ') + '] 표시가 없음'));
        }
      }
    }

    return v;
  }

  /* ---------------- Stage 6 : 집계 ---------------- */

  function checkAggregate(words, sentences) {
    var v = [];

    if (words.length < MIN_WORDS) {
      v.push(violation('(전체)', 'words', 'PR-IN15',
        '단어 수 부족: ' + words.length + '/' + MIN_WORDS));
    }
    if (sentences.length < MIN_SENTENCES) {
      v.push(violation('(전체)', 'sentences', 'PR-IN16',
        '문장 수 부족: ' + sentences.length + '/' + MIN_SENTENCES));
    }

    var byCat = {};
    CATEGORIES.forEach(function (c) { byCat[c] = 0; });
    words.forEach(function (w) {
      if (byCat[w.category] !== undefined) byCat[w.category]++;
    });
    CATEGORIES.forEach(function (c) {
      if (byCat[c] < MIN_WORDS_PER_CATEGORY) {
        v.push(violation('(전체)', 'category:' + c, 'PR-IN18',
          '카테고리 "' + c + '" 단어 수 부족: ' + byCat[c] + '/' + MIN_WORDS_PER_CATEGORY,
          'warning'));
      }
    });

    return v;
  }

  /* ---------------- 개별 항목 검증 ---------------- */

  function validateWord(item, guide, seenIds, seenEn) {
    var v = checkStructure(item, 'word', seenIds, seenEn);
    if (v.length > 0) return v;
    v = v.concat(checkValues(item, 'word'));
    if (v.length > 0) return v;
    return v.concat(checkMarks(item.marks, item.hangul, item.id, guide));
  }

  function validateSentence(item, guide, seenIds, seenEn) {
    var v = checkStructure(item, 'sentence', seenIds, seenEn);
    if (v.length > 0) return v;
    v = v.concat(checkValues(item, 'sentence'));
    if (v.length > 0) return v;
    return v.concat(checkSentenceStructure(item, guide));
  }

  /* ---------------- 전체 검증 ---------------- */

  function validateAll(data) {
    var words = (data && isArray(data.words)) ? data.words : [];
    var sentences = (data && isArray(data.sentences)) ? data.sentences : [];
    var guide = (data && data.phonemeGuide) ? data.phonemeGuide : null;

    var violations = [];

    if (!guide) {
      violations.push(violation('(전체)', 'phonemeGuide', 'PR-IN09',
        'phonemeGuide 가 로드되지 않음 — 표시 키 검증 불가'));
    }

    var seenIds = {};
    var seenWordEn = {};
    var seenSentenceEn = {};

    for (var i = 0; i < words.length; i++) {
      violations = violations.concat(validateWord(words[i], guide, seenIds, seenWordEn));
    }
    for (var j = 0; j < sentences.length; j++) {
      violations = violations.concat(validateSentence(sentences[j], guide, seenIds, seenSentenceEn));
    }

    violations = violations.concat(checkConsistency(words));
    violations = violations.concat(checkAggregate(words, sentences));

    var errors = violations.filter(function (x) { return x.severity === 'error'; });
    var warnings = violations.filter(function (x) { return x.severity === 'warning'; });

    var byCategory = {};
    CATEGORIES.forEach(function (c) { byCategory[c] = 0; });
    words.forEach(function (w) {
      if (byCategory[w.category] !== undefined) byCategory[w.category]++;
    });

    var byLevel = { beginner: 0, intermediate: 0, advanced: 0 };
    words.forEach(function (w) { if (byLevel[w.level] !== undefined) byLevel[w.level]++; });

    return {
      ok: errors.length === 0,
      total: { words: words.length, sentences: sentences.length },
      byCategory: byCategory,
      byLevel: byLevel,
      violations: violations,
      summary: { error: errors.length, warning: warnings.length }
    };
  }

  return {
    validateAll: validateAll,
    validateWord: validateWord,
    validateSentence: validateSentence,
    validateMarks: checkMarks,
    validateConsistency: checkConsistency,
    validateVolume: checkAggregate,
    config: {
      LEVELS: LEVELS,
      CATEGORIES: CATEGORIES,
      MIN_WORDS: MIN_WORDS,
      MIN_SENTENCES: MIN_SENTENCES,
      MIN_WORDS_PER_CATEGORY: MIN_WORDS_PER_CATEGORY,
      TAIL_PATTERNS: TAIL_PATTERNS,
      MARK_PATTERNS: MARK_PATTERNS,
      EXCEPTION_WORDS: EXCEPTION_WORDS
    }
  };
}));
