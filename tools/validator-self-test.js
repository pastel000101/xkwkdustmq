/* ============================================================
 * validator-self-test.js — 검증기 자체 테스트
 * ------------------------------------------------------------
 * 각 검증 규칙마다 "일부러 틀린 데이터"를 넣고
 * 검증기가 실제로 잡아내는지 확인한다.
 *
 * 왜 이게 필요한가:
 *   이 프로젝트에는 발음을 검수할 사람이 없다. 검증 스크립트가
 *   유일한 품질 방어선이다. 그런데 그 검증기에 버그가 있어서
 *   모든 것을 통과시키면, 우리는 "위반 0건"이라는 거짓 안심을
 *   얻는다. 검증기가 아예 없는 것보다 나쁘다.
 *
 * 거짓 양성(정상 데이터를 위반으로 잡는 것)도 함께 확인한다.
 * ============================================================ */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./validate-content.js'));
  } else {
    root.ValidatorSelfTest = factory(root.ContentValidator);
  }
}(typeof self !== 'undefined' ? self : this, function (Validator) {
  'use strict';

  /* 최소 음소 가이드 — 실제 가이드와 같은 키 집합 */
  var GUIDE = {};
  ['f', 'v', 'th', 'dh', 'r', 'l', 'z', 'zh', 'sh', 'ae', 'stress', 'flap_t']
    .forEach(function (k) { GUIDE[k] = { key: k, symbol: k, label: k, articulation: 'x' }; });

  function baseWord(over) {
    var w = {
      id: 'w0001', en: 'book', hangul: '북', marks: [],
      meaning: '책', level: 'beginner', category: 'school'
    };
    for (var k in over) if (over.hasOwnProperty(k)) w[k] = over[k];
    return w;
  }

  function baseSentence(over) {
    var s = {
      id: 's0001',
      en: 'I like this book.',
      words: [
        { en: 'I',     hangul: '아이', marks: [] },
        { en: 'like',  hangul: '라이크', marks: [{ at: 0, phoneme: 'l' }] },
        { en: 'this',  hangul: '디스', marks: [{ at: 0, phoneme: 'dh' }] },
        { en: 'book.', hangul: '북', marks: [] }
      ],
      meaning: '나는 이 책을 좋아해.',
      level: 'beginner', category: 'school'
    };
    for (var k in over) if (over.hasOwnProperty(k)) s[k] = over[k];
    return s;
  }

  function run(data) {
    return Validator.validateAll({
      words: data.words || [],
      sentences: data.sentences || [],
      phonemeGuide: GUIDE
    });
  }

  /* 분량 부족(PR-IN15/16)과 카테고리 분포(PR-IN18)는 픽스처 특성상
     항상 발생하므로 자체 테스트에서 제외한다 */
  var IGNORED = ['PR-IN15', 'PR-IN16', 'PR-IN18'];

  function relevant(report) {
    return report.violations.filter(function (v) {
      return IGNORED.indexOf(v.rule) === -1;
    });
  }

  function hasRule(report, rule) {
    return relevant(report).some(function (v) { return v.rule === rule; });
  }

  /* ---------------- 테스트 케이스 ---------------- */

  var CASES = [

    /* --- Stage 1 구조 --- */
    {
      name: 'PR-IN01 id 형식 오류를 잡는다',
      rule: 'PR-IN01',
      data: { words: [baseWord({ id: 'bad-id' })] }
    },
    {
      name: 'PR-IN01 id 중복을 잡는다',
      rule: 'PR-IN01',
      data: { words: [baseWord(), baseWord({ en: 'desk', hangul: '데스크' })] }
    },
    {
      name: 'PR-IN01 en 중복을 잡는다',
      rule: 'PR-IN01',
      data: { words: [baseWord(), baseWord({ id: 'w0002' })] }
    },
    {
      name: 'PR-IN02 en 비어 있음을 잡는다',
      rule: 'PR-IN02',
      data: { words: [baseWord({ en: '' })] }
    },
    {
      name: 'PR-IN02 단어 en 의 공백을 잡는다',
      rule: 'PR-IN02',
      data: { words: [baseWord({ en: 'note book' })] }
    },
    {
      name: 'PR-IN07 marks 누락을 잡는다',
      rule: 'PR-IN07',
      data: { words: [baseWord({ marks: undefined })] }
    },
    {
      /* 스마트 따옴표가 데이터에 들어가면 사용자가 그 문자를
         키보드로 칠 수 없어 영원히 맞히지 못한다 (WR-CMP05) */
      name: 'PR-IN19 키보드로 칠 수 없는 문자를 잡는다',
      rule: 'PR-IN19',
      data: { words: [baseWord({ en: 'don’t', hangul: '도운트' })] }
    },
    {
      name: 'PR-IN19 일반 아포스트로피(U+0027)는 통과해야 한다',
      clean: true,
      data: { words: [baseWord({ id: 'w0011', en: "don't", hangul: '도운트',
                                 meaning: '~하지 않다', category: 'daily' })] }
    },

    /* --- Stage 2 값 --- */
    {
      name: 'PR-IN03 hangul 의 비한글 문자를 잡는다',
      rule: 'PR-IN03',
      data: { words: [baseWord({ hangul: 'boo크' })] }
    },
    {
      name: 'PR-IN03 hangul 빈 문자열을 잡는다',
      rule: 'PR-IN03',
      data: { words: [baseWord({ hangul: '' })] }
    },
    {
      name: 'PR-IN04 meaning 누락을 잡는다 (3종 세트)',
      rule: 'PR-IN04',
      data: { words: [baseWord({ meaning: '' })] }
    },
    {
      name: 'PR-IN04 meaning 에 한글이 없는 경우를 잡는다',
      rule: 'PR-IN04',
      data: { words: [baseWord({ meaning: 'book' })] }
    },
    {
      name: 'PR-IN05 level 값 오류를 잡는다',
      rule: 'PR-IN05',
      data: { words: [baseWord({ level: 'easy' })] }
    },
    {
      name: 'PR-IN06 category 값 오류를 잡는다',
      rule: 'PR-IN06',
      data: { words: [baseWord({ category: 'sports' })] }
    },

    /* --- Stage 3 표시 --- */
    {
      name: 'PR-IN08 at 범위 초과를 잡는다',
      rule: 'PR-IN08',
      data: { words: [baseWord({ marks: [{ at: 5, phoneme: 'f' }] })] }
    },
    {
      name: 'PR-IN08 음수 at 을 잡는다',
      rule: 'PR-IN08',
      data: { words: [baseWord({ marks: [{ at: -1, phoneme: 'f' }] })] }
    },
    {
      name: 'PR-IN09 알 수 없는 표시 키를 잡는다',
      rule: 'PR-IN09',
      data: { words: [baseWord({ marks: [{ at: 0, phoneme: 'xyz' }] })] }
    },
    {
      name: 'PR-IN10 (at, phoneme) 쌍 중복을 잡는다',
      rule: 'PR-IN10',
      data: {
        words: [baseWord({
          marks: [{ at: 0, phoneme: 'f' }, { at: 0, phoneme: 'f' }]
        })]
      }
    },
    {
      name: 'INV-8′ 경계 — 같은 at 에 다른 phoneme 은 통과해야 한다',
      clean: true,
      data: {
        words: [baseWord({
          id: 'w0003', en: 'fan', hangul: '팬', meaning: '선풍기',
          category: 'daily',
          marks: [{ at: 0, phoneme: 'f' }, { at: 0, phoneme: 'ae' }]
        })]
      }
    },
    {
      name: 'INV-8′ 경계 — 한 글자에 표시 3개도 통과해야 한다',
      clean: true,
      data: {
        words: [baseWord({
          id: 'w0004', en: 'thirsty', hangul: '써스티', meaning: '목마른',
          level: 'advanced', category: 'feeling',
          marks: [
            { at: 0, phoneme: 'th' },
            { at: 0, phoneme: 'r' },
            { at: 0, phoneme: 'stress' }
          ]
        })]
      }
    },

    /* --- Stage 4 문장 구조 --- */
    {
      name: 'PR-IN11 words 결합 불일치를 잡는다',
      rule: 'PR-IN11',
      data: { sentences: [baseSentence({ en: 'I like that book.' })] }
    },
    {
      /* span 이 남은 단어 수를 넘어서는 경우.
       * 주의: 단순히 span 을 크게 잡으면 뒤 단어들이 흡수되어
       *       합계가 우연히 맞아떨어질 수 있다. 마지막 단어에서
       *       넘치도록 구성해야 실제로 PR-IN12 가 발생한다. */
      name: 'PR-IN12 span 합계 초과를 잡는다',
      rule: 'PR-IN12',
      data: {
        sentences: [baseSentence({
          words: [
            { en: 'I',     hangul: '아이', marks: [], span: 2 },
            { en: 'like',  hangul: null, marks: [] },
            { en: 'this',  hangul: '디스', marks: [], span: 3 },
            { en: 'book.', hangul: null, marks: [] }
          ]
        })]
      }
    },
    {
      name: 'PR-IN13 흡수 단어의 hangul 이 null 이 아닌 경우를 잡는다',
      rule: 'PR-IN13',
      data: {
        sentences: [baseSentence({
          words: [
            { en: 'I',     hangul: '아이', marks: [] },
            { en: 'like',  hangul: '라이크', marks: [], span: 2 },
            { en: 'this',  hangul: '디스', marks: [] },
            { en: 'book.', hangul: '북', marks: [] }
          ]
        })]
      }
    },
    {
      name: 'PR-IN14 hangul 이 null 인데 marks 가 있는 경우를 잡는다',
      rule: 'PR-IN14',
      data: {
        sentences: [baseSentence({
          words: [
            { en: 'I',     hangul: '아이', marks: [] },
            { en: 'like',  hangul: '라이크', marks: [], span: 2 },
            { en: 'this',  hangul: null, marks: [{ at: 0, phoneme: 'dh' }] },
            { en: 'book.', hangul: '북', marks: [] }
          ]
        })]
      }
    },
    {
      name: 'PR-IN17 문장 단어 수 범위 초과를 잡는다',
      rule: 'PR-IN17',
      data: {
        sentences: [baseSentence({
          en: 'I go.',
          words: [
            { en: 'I',   hangul: '아이', marks: [] },
            { en: 'go.', hangul: '고우', marks: [] }
          ]
        })]
      }
    },
    {
      name: '정상 연음 문장은 통과해야 한다',
      clean: true,
      data: {
        sentences: [baseSentence({
          en: 'I want to go home.',
          words: [
            { en: 'I',     hangul: '아이', marks: [] },
            { en: 'want',  hangul: '워너', marks: [{ at: 0, phoneme: 'stress' }], span: 2 },
            { en: 'to',    hangul: null, marks: [] },
            { en: 'go',    hangul: '고우', marks: [] },
            { en: 'home.', hangul: '호움', marks: [] }
          ],
          meaning: '나는 집에 가고 싶어.'
        })]
      }
    },

    /* --- Stage 5 일관성 --- */
    {
      name: 'PR-CN01 접미사 -tion 꼬리 불일치를 잡는다',
      rule: 'PR-CN01',
      data: {
        words: [baseWord({
          id: 'w0005', en: 'station', hangul: '스테이쎤', meaning: '역',
          category: 'travel'
        })]
      }
    },
    {
      name: 'PR-CN01 -tion 기준 표기는 통과해야 한다',
      clean: true,
      data: {
        words: [baseWord({
          id: 'w0006', en: 'station', hangul: '스테이션', meaning: '역',
          category: 'travel'
        })]
      }
    },
    {
      name: 'PR-CN03 ph- 단어의 f 표시 누락을 잡는다',
      rule: 'PR-CN03',
      data: {
        words: [baseWord({
          id: 'w0007', en: 'phone', hangul: '포운', meaning: '전화',
          category: 'tech', marks: []
        })]
      }
    },
    {
      name: 'PR-CN03 ph- 단어에 f 표시가 있으면 통과해야 한다',
      clean: true,
      data: {
        words: [baseWord({
          id: 'w0008', en: 'phone', hangul: '포운', meaning: '전화',
          category: 'tech', marks: [{ at: 0, phoneme: 'f' }]
        })]
      }
    },
    {
      name: 'PR-EX 예외 단어는 일관성 검사에서 제외된다',
      clean: true,
      data: {
        words: [baseWord({
          id: 'w0009', en: 'comfortable', hangul: '컴퍼터블', meaning: '편안한',
          category: 'feeling', level: 'advanced',
          marks: [{ at: 2, phoneme: 'r' }, { at: 3, phoneme: 'l' }]
        })]
      }
    },
    {
      name: 'table 은 -able 접미사가 아니므로 검사에서 제외된다',
      clean: true,
      data: {
        words: [baseWord({
          id: 'w0010', en: 'table', hangul: '테이블', meaning: '탁자',
          category: 'daily', marks: [{ at: 2, phoneme: 'l' }]
        })]
      }
    },

    /* --- 거짓 양성 방지 --- */
    {
      name: '정상 데이터 전체는 위반 0건이어야 한다',
      clean: true,
      data: {
        words: [
          baseWord(),
          baseWord({ id: 'w0002', en: 'light', hangul: '라이트', meaning: '빛',
                     category: 'daily', marks: [{ at: 0, phoneme: 'l' }] }),
          baseWord({ id: 'w0003', en: 'right', hangul: '롸이트', meaning: '오른쪽',
                     category: 'daily', marks: [{ at: 0, phoneme: 'r' }] })
        ],
        sentences: [baseSentence()]
      }
    }
  ];

  /* ---------------- 실행 ---------------- */

  function runAll() {
    var passed = 0, failed = 0, details = [];

    CASES.forEach(function (c) {
      var report, ok, reason;
      try {
        report = run(c.data);
        if (c.clean) {
          var found = relevant(report).filter(function (v) { return v.severity === 'error'; });
          ok = found.length === 0;
          reason = ok ? '' : '예상: 위반 없음 / 실제: ' +
            found.map(function (v) { return v.rule + ' ' + v.message; }).join(' | ');
        } else {
          ok = hasRule(report, c.rule);
          reason = ok ? '' : '예상 규칙 ' + c.rule + ' 이 검출되지 않음. 검출된 규칙: [' +
            relevant(report).map(function (v) { return v.rule; }).join(', ') + ']';
        }
      } catch (e) {
        ok = false;
        reason = '예외 발생: ' + e.message;
      }

      if (ok) passed++; else failed++;
      details.push({ name: c.name, ok: ok, reason: reason });
    });

    return { passed: passed, failed: failed, total: CASES.length, details: details };
  }

  return { runAll: runAll, cases: CASES };
}));
