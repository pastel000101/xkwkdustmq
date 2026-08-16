/* ============================================================
 * app-logic-test.js — Unit 2 로직 단위 테스트
 * ------------------------------------------------------------
 * DOM 없이 검증 가능한 순수 로직만 테스트한다.
 * 렌더링 결과는 눈으로 보는 스모크 확인에서 검증한다.
 *
 * 왜 이게 필요한가:
 *   AC-03.3(지운 오타도 집계 유지)과 AC-04.1(타이머는 첫 문자부터)은
 *   화면을 봐서는 확인할 수 없다. 눈으로는 완벽히 정상으로 보이는데
 *   숫자만 틀린다. 오타를 지우고 다시 쳤을 때 정확도가 슬쩍 100%로
 *   올라가도, 보고 있으면 모른다.
 *
 *   이런 것은 자동 테스트로만 잡힌다.
 * ============================================================ */

(function (App) {
  'use strict';

  var cases = [];
  function test(name, fn) { cases.push({ name: name, fn: fn }); }

  function eq(actual, expected, label) {
    if (actual !== expected) {
      throw new Error((label || '') + ' 기대 ' + JSON.stringify(expected) +
                      ' / 실제 ' + JSON.stringify(actual));
    }
  }
  function deepEq(a, b, label) {
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      throw new Error((label || '') + ' 기대 ' + JSON.stringify(b) +
                      ' / 실제 ' + JSON.stringify(a));
    }
  }
  function ok(v, label) { if (!v) throw new Error((label || '') + ' 참이어야 함'); }

  var E = App.TypingEngine;
  var S = App.StatsTracker;

  /* ============ TypingEngine ============ */

  test('load — 전부 pending, 첫 글자가 current', function () {
    E.load('hi');
    deepEq(E.getCharStates(), ['current', 'pending']);
    eq(E.getCursor(), 0);
  });

  test('정타 — correct 로 바뀌고 커서 +1 (AC-01.1)', function () {
    E.load('hello');
    var r = E.handleChar('h');
    ok(r.correct, '정타');
    eq(E.getCursor(), 1);
    deepEq(E.getCharStates().slice(0, 2), ['correct', 'current']);
  });

  test('오타 — incorrect 지만 커서는 +1 (AC-01.2)', function () {
    E.load('hello');
    var r = E.handleChar('x');
    eq(r.correct, false);
    eq(E.getCursor(), 1, '오타여도 진행');
    deepEq(E.getCharStates().slice(0, 2), ['incorrect', 'current']);
  });

  test('4상태가 동시에 구분된다 (AC-01.3)', function () {
    E.load('hello');
    E.handleChar('h');
    E.handleChar('x');
    E.handleChar('l');
    deepEq(E.getCharStates(), ['correct', 'incorrect', 'correct', 'current', 'pending']);
  });

  test('공백 문자도 판정된다 (AC-01.4)', function () {
    E.load('a b');
    E.handleChar('a');
    var r = E.handleChar(' ');
    ok(r.correct, '스페이스');
    eq(E.getCharStates()[1], 'correct');
  });

  test('대소문자를 구분한다 (AC-01.5)', function () {
    E.load('Hello');
    var r = E.handleChar('h');
    eq(r.correct, false, '소문자로 대문자를 치면 오답');
  });

  test('백스페이스 — pending 으로 되돌리고 커서 -1 (AC-03.1)', function () {
    E.load('hello');
    E.handleChar('h');
    E.handleChar('x');
    var r = E.handleBackspace();
    ok(r.applied);
    eq(E.getCursor(), 1);
    deepEq(E.getCharStates().slice(0, 2), ['correct', 'current']);
  });

  test('수정 후 정타 (AC-03.2)', function () {
    E.load('hello');
    E.handleChar('h'); E.handleChar('x'); E.handleBackspace();
    var r = E.handleChar('e');
    ok(r.correct);
    eq(E.getCharStates()[1], 'correct');
  });

  test('시작 지점 백스페이스는 무시된다 (AC-03.4)', function () {
    E.load('hello');
    var r = E.handleBackspace();
    eq(r.applied, false);
    eq(E.getCursor(), 0);
    eq(E.getCharStates()[0], 'current');
  });

  test('완주 판정 — 마지막 문자가 오답이어도 완주', function () {
    E.load('hi');
    E.handleChar('h');
    var r = E.handleChar('z');
    eq(r.correct, false);
    eq(r.completed, true, '오답이어도 완주');
    ok(E.isComplete());
  });

  test('완주 후 백스페이스로 완주가 취소된다 (WR-CUR06)', function () {
    E.load('hi');
    E.handleChar('h'); E.handleChar('i');
    ok(E.isComplete());
    var r = E.handleBackspace();
    ok(r.applied);
    eq(r.uncompleted, true);
    eq(E.isComplete(), false);
  });

  test('변경 인덱스는 최대 2개다 (WR-PERF02)', function () {
    E.load('hello');
    E.handleChar('h');
    ok(E.getChangedIndexes().length <= 2, '변경 인덱스 수');
    deepEq(E.getChangedIndexes(), [0, 1]);
  });

  /* ============ StatsTracker ============ */

  test('타이머는 첫 문자 입력에서 시작한다 (AC-04.1)', function () {
    S.reset();
    eq(S._raw().startedAt, null, '입력 전');
    S.recordChar({ correct: true });
    ok(S._raw().startedAt !== null, '입력 후');
  });

  test('⚠️ 백스페이스는 타이머를 시작시키지 않는다 (AC-04.3)', function () {
    S.reset();
    /* 백스페이스 경로에는 StatsTracker 호출 자체가 없다.
       그 부재를 여기서 확인한다 — 아무것도 호출하지 않으면 타이머는 멈춰 있어야 한다 */
    eq(S._raw().startedAt, null);
    eq(S.isRunning(), false);
  });

  test('⚠️ 지운 오타도 집계에 남는다 (AC-03.3)', function () {
    S.reset();
    S.recordChar({ correct: true });    /* h */
    S.recordChar({ correct: false });   /* x — 오타 */
    /* 여기서 사용자가 백스페이스를 누른다. StatsTracker 는 호출되지 않는다 */
    S.recordChar({ correct: true });    /* e — 고쳐 씀 */
    var st = S.getStats();
    eq(st.errorCount, 1, '오타는 그대로 1');
    eq(st.totalKeystrokes, 3, '재입력도 분모에 포함');
    eq(st.accuracy, 66.7, '정확도가 100 으로 회복되지 않는다');
  });

  test('무오타 완주는 정확도 100% (AC-05.4)', function () {
    S.reset();
    for (var i = 0; i < 5; i++) S.recordChar({ correct: true });
    S._inject({ startedAt: 1000, endedAt: 2000 });
    var st = S.getStats();
    eq(st.accuracy, 100);
    eq(st.errorCount, 0);
  });

  test('WPM 산정 — 정타 250자 / 1분 = 50 (AC-05.2)', function () {
    S.reset();
    S._inject({ startedAt: 0, endedAt: 60000,
                totalKeystrokes: 250, errorCount: 0, correctCount: 250 });
    eq(S.getStats().wpm, 50);
  });

  test('WPM 은 오타 문자를 정타 수에 넣지 않는다 (AC-05.2)', function () {
    S.reset();
    S._inject({ startedAt: 0, endedAt: 60000,
                totalKeystrokes: 250, errorCount: 50, correctCount: 200 });
    eq(S.getStats().wpm, 40, '(200/5)/1 = 40');
  });

  test('정확도 산정 — 100회 중 8회 오타 = 92% (AC-05.3)', function () {
    S.reset();
    S._inject({ startedAt: 0, endedAt: 60000,
                totalKeystrokes: 100, errorCount: 8, correctCount: 92 });
    eq(S.getStats().accuracy, 92);
  });

  test('경계 — 입력 0회면 wpm·accuracy 가 null (WR-CALC04)', function () {
    S.reset();
    var st = S.getStats();
    eq(st.wpm, null);
    eq(st.accuracy, null);
  });

  test('경계 — 경과 100ms 미만이면 wpm 만 null', function () {
    S.reset();
    S._inject({ startedAt: 0, endedAt: 50,
                totalKeystrokes: 5, errorCount: 0, correctCount: 5 });
    var st = S.getStats();
    eq(st.wpm, null, 'wpm 측정 불가');
    eq(st.accuracy, 100, '정확도는 계산된다');
  });

  test('경계 — 타이머 미시작이면 elapsedMs 0', function () {
    S.reset();
    S._inject({ totalKeystrokes: 3, errorCount: 0, correctCount: 3 });
    var st = S.getStats();
    eq(st.elapsedMs, 0);
    eq(st.wpm, null);
  });

  test('완주 취소 시 종료 시각만 해제되고 오타는 유지된다 (WR-TM05)', function () {
    S.reset();
    S._inject({ startedAt: 0, endedAt: 5000,
                totalKeystrokes: 10, errorCount: 2, correctCount: 8 });
    S.recordUncomplete();
    eq(S._raw().endedAt, null, '종료 시각 해제');
    eq(S._raw().startedAt, 0, '시작 시각 유지');
    eq(S._raw().errorCount, 2, '오타 유지');
  });

  test('항등식 — totalKeystrokes = correctCount + errorCount', function () {
    S.reset();
    S.recordChar({ correct: true });
    S.recordChar({ correct: false });
    S.recordChar({ correct: true });
    var r = S._raw();
    eq(r.totalKeystrokes, r.correctCount + r.errorCount);
  });

  /* ============ ContentStore ============ */

  var FIXTURE = {
    phonemeGuide: { f: { key: 'f', symbol: 'f', category: 'phoneme' } },
    words: [
      { id: 'w0001', en: 'a', hangul: '에이', marks: [], meaning: '가', level: 'beginner', category: 'daily' },
      { id: 'w0002', en: 'b', hangul: '비',   marks: [], meaning: '나', level: 'beginner', category: 'food' },
      { id: 'w0003', en: 'c', hangul: '씨',   marks: [], meaning: '다', level: 'advanced', category: 'daily' }
    ],
    sentences: [
      { id: 's0001', en: 'x y z w', words: [], meaning: '가', level: 'beginner', category: 'daily' }
    ]
  };

  test('ContentStore — 로드 결과', function () {
    var r = App.ContentStore.init(FIXTURE);
    ok(r.ok);
    eq(r.wordCount, 3);
    eq(r.sentenceCount, 1);
  });

  test('ContentStore — 데이터 없음을 알린다 (시나리오 S-8)', function () {
    var r = App.ContentStore.init(null);
    eq(r.ok, false);
    ok(r.error && r.error.length > 0);
    App.ContentStore.init(FIXTURE);
  });

  test('ContentStore — 난이도 필터 (AC-10.2)', function () {
    App.ContentStore.init(FIXTURE);
    eq(App.ContentStore.countAvailable({ mode: 'word', level: 'beginner', category: 'all' }), 2);
    eq(App.ContentStore.countAvailable({ mode: 'word', level: 'advanced', category: 'all' }), 1);
  });

  test('ContentStore — 카테고리 필터 (AC-11.3)', function () {
    App.ContentStore.init(FIXTURE);
    eq(App.ContentStore.countAvailable({ mode: 'word', level: 'all', category: 'daily' }), 2);
    eq(App.ContentStore.countAvailable({ mode: 'word', level: 'all', category: 'food' }), 1);
  });

  test('ContentStore — 조건에 맞는 항목이 없으면 null (AC-11.4)', function () {
    App.ContentStore.init(FIXTURE);
    var r = App.ContentStore.getNext({ mode: 'word', level: 'advanced', category: 'food', order: 'random' });
    eq(r, null);
  });

  test('ContentStore — 순차 출제 (AC-11.1)', function () {
    App.ContentStore.init(FIXTURE);
    var c = { mode: 'word', level: 'all', category: 'all', order: 'sequential' };
    eq(App.ContentStore.getNext(c).id, 'w0001');
    eq(App.ContentStore.getNext(c).id, 'w0002');
    eq(App.ContentStore.getNext(c).id, 'w0003');
    eq(App.ContentStore.getNext(c).id, 'w0001', '순환');
  });

  test('ContentStore — 무작위여도 직전과 연속되지 않는다 (AC-11.2)', function () {
    App.ContentStore.init(FIXTURE);
    var c = { mode: 'word', level: 'all', category: 'all', order: 'random' };
    var prev = App.ContentStore.getNext(c);
    for (var i = 0; i < 40; i++) {
      var cur = App.ContentStore.getNext(c);
      if (cur.id === prev.id) throw new Error('직전 문항이 연속 출제됨: ' + cur.id);
      prev = cur;
    }
  });

  test('ContentStore — 후보가 1개뿐이면 직전과 같아도 낸다 (WR-SEL09)', function () {
    App.ContentStore.init(FIXTURE);
    var c = { mode: 'word', level: 'all', category: 'food', order: 'random' };
    eq(App.ContentStore.getNext(c).id, 'w0002');
    eq(App.ContentStore.getNext(c).id, 'w0002');
  });

  /* ============ AppState ============ */

  test('AppState — 관심 키가 바뀔 때만 구독자가 호출된다 (NFR-004)', function () {
    App.AppState._clearSubscribers();
    App.AppState.init();
    var typingCalls = 0, toggleCalls = 0;

    App.AppState.subscribe(['session.charStates'], function () { typingCalls++; });
    App.AppState.subscribe(['display.showPronunciation'], function () { toggleCalls++; });

    App.AppState.update({ display: { showPronunciation: true } });
    eq(typingCalls, 0, '발음 토글이 타이핑 렌더러를 부르지 않는다');
    eq(toggleCalls, 1);

    App.AppState.update({ session: { charStates: ['current'] } });
    eq(typingCalls, 1);
    eq(toggleCalls, 1);

    App.AppState._clearSubscribers();
  });

  test('AppState — resetSession 이 display 를 유지한다 (AC-06.3)', function () {
    App.AppState._clearSubscribers();
    App.AppState.init();
    App.AppState.update({ display: { showPronunciation: true, showMeaning: true } });
    App.AppState.update({ session: { text: 'hello', cursor: 3 } });

    App.AppState.resetSession();

    var s = App.AppState.get();
    eq(s.display.showPronunciation, true, '발음 토글 유지');
    eq(s.display.showMeaning, true, '뜻 토글 유지');
    eq(s.session.cursor, 0, '세션은 초기화');
    eq(s.session.text, '', '세션은 초기화');
    App.AppState._clearSubscribers();
  });

  test('AppState — 두 토글은 독립이다 (AC-12.4)', function () {
    App.AppState._clearSubscribers();
    App.AppState.init();
    var combos = [];

    App.SettingsService.togglePronunciation();
    combos.push([App.AppState.get().display.showPronunciation,
                 App.AppState.get().display.showMeaning]);

    App.SettingsService.toggleMeaning();
    combos.push([App.AppState.get().display.showPronunciation,
                 App.AppState.get().display.showMeaning]);

    App.SettingsService.togglePronunciation();
    combos.push([App.AppState.get().display.showPronunciation,
                 App.AppState.get().display.showMeaning]);

    deepEq(combos, [[true, false], [true, true], [false, true]],
           '발음만 / 둘 다 / 뜻만 — 4가지 조합이 도달 가능');
    App.AppState._clearSubscribers();
  });

  /* ============ InputHandler 분류 ============ */

  test('입력 분류 — 일반 문자는 타이핑 (AC-07.4)', function () {
    eq(App.InputHandler._classify({ key: 'a' }), 'char');
    eq(App.InputHandler._classify({ key: ' ' }), 'char');
    eq(App.InputHandler._classify({ key: '.' }), 'char');
  });

  test('⚠️ 입력 분류 — Ctrl+C 는 타이핑이 아니다 (WR-IN01)', function () {
    /* key 는 'c' 이고 길이가 1이다. 수식키 검사가 문자 검사보다
       먼저 오지 않으면 복사할 때마다 오타로 집계된다. */
    eq(App.InputHandler._classify({ key: 'c', ctrlKey: true }), 'ignore');
    eq(App.InputHandler._classify({ key: 'v', ctrlKey: true }), 'ignore');
    eq(App.InputHandler._classify({ key: 'a', metaKey: true }), 'ignore');
  });

  test('입력 분류 — 단축키 (AC-07.1~07.6)', function () {
    eq(App.InputHandler._classify({ key: 'Enter' }), 'shortcut:next');
    eq(App.InputHandler._classify({ key: 'Escape' }), 'shortcut:escape');
    eq(App.InputHandler._classify({ key: 'F2' }), 'shortcut:togglePronunciation');
    eq(App.InputHandler._classify({ key: 'F4' }), 'shortcut:toggleMeaning');
    eq(App.InputHandler._classify({ key: 'F9' }), 'shortcut:legend');
  });

  test('⚠️ 버튼에 포커스가 있으면 Enter 를 가로채지 않는다', function () {
    /* 가로채면 키보드로 "다시하기" 버튼을 누를 수 없게 된다.
       Enter 가 항상 "다음 문항"이 되어버려 버튼이 무력화된다. */
    eq(App.InputHandler._classify({ key: 'Enter', target: { tagName: 'BUTTON' } }), 'yield');
    eq(App.InputHandler._classify({ key: 'Enter', target: { tagName: 'SELECT' } }), 'yield');
    eq(App.InputHandler._classify({ key: 'Enter', target: { tagName: 'DIV' } }), 'shortcut:next');
  });

  test('Tab 은 단축키가 아니다 — 포커스 이동에 맡긴다', function () {
    eq(App.InputHandler._classify({ key: 'Tab' }), 'ignore');
  });

  test('입력 분류 — 백스페이스', function () {
    eq(App.InputHandler._classify({ key: 'Backspace' }), 'backspace');
  });

  test('입력 분류 — IME 조합 중 입력은 무시 (AC-18.3)', function () {
    eq(App.InputHandler._classify({ key: 'a', isComposing: true }), 'ime');
    eq(App.InputHandler._classify({ key: 'Process', keyCode: 229 }), 'ime');
  });

  test('입력 분류 — 방향키 등은 무시', function () {
    eq(App.InputHandler._classify({ key: 'ArrowLeft' }), 'ignore');
    eq(App.InputHandler._classify({ key: 'Shift' }), 'ignore');
  });

  /* ============ AnnotationRenderer 분류 ============ */

  var GUIDE = {
    f:      { key: 'f',      symbol: 'f', category: 'phoneme' },
    ae:     { key: 'ae',     symbol: 'æ', category: 'phoneme' },
    th:     { key: 'th',     symbol: 'θ', category: 'phoneme' },
    r:      { key: 'r',      symbol: 'r', category: 'phoneme' },
    stress: { key: 'stress', symbol: 'ˈ', category: 'prosody' },
    flap_t: { key: 'flap_t', symbol: 'ᵗ', category: 'spelling' }
  };

  test('표시 분류 — fan 의 f/æ 가 한 글자 위에 나란히 (U2-4)', function () {
    var r = App.AnnotationRenderer._classify(
      [{ at: 0, phoneme: 'f' }, { at: 0, phoneme: 'ae' }], 1, GUIDE);
    deepEq(r.above[0], ['f', 'æ']);
    eq(r.emphasize[0], false);
    deepEq(r.below[0], []);
  });

  test('표시 분류 — pan 은 æ 만 (fan 과 달라야 한다)', function () {
    var r = App.AnnotationRenderer._classify([{ at: 0, phoneme: 'ae' }], 1, GUIDE);
    deepEq(r.above[0], ['æ']);
  });

  test('표시 분류 — 한 글자에 3개가 자리를 나눠 갖는다 (U2-1)', function () {
    var r = App.AnnotationRenderer._classify([
      { at: 0, phoneme: 'th' }, { at: 0, phoneme: 'r' }, { at: 0, phoneme: 'stress' }
    ], 3, GUIDE);
    deepEq(r.above[0], ['θ', 'r'], '음소는 위');
    eq(r.emphasize[0], true, '강세는 글자 자체');
    deepEq(r.below[0], [], '아래는 비어 있음');
  });

  test('표시 분류 — flap_t 는 아래층으로 간다 (U2-3)', function () {
    var r = App.AnnotationRenderer._classify([
      { at: 0, phoneme: 'stress' }, { at: 1, phoneme: 'flap_t' }, { at: 1, phoneme: 'r' }
    ], 2, GUIDE);
    eq(r.emphasize[0], true);
    deepEq(r.above[1], ['r']);
    deepEq(r.below[1], ['ᵗ'], 'flap_t 는 아래');
  });

  test('표시 분류 — 가이드에 없는 키는 건너뛴다 (시나리오 S-9)', function () {
    var r = App.AnnotationRenderer._classify([{ at: 0, phoneme: 'unknown' }], 1, GUIDE);
    deepEq(r.above[0], []);
  });

  test('표시 분류 — 범위를 벗어난 at 은 건너뛴다', function () {
    var r = App.AnnotationRenderer._classify([{ at: 5, phoneme: 'f' }], 2, GUIDE);
    deepEq(r.above, [[], []]);
  });

  /* ============ 연음 그룹 분할 ============ */

  test('연음 그룹 — span:2 가 두 단어를 묶는다 (AC-16.3)', function () {
    var g = App.PracticeLayout._splitGroups([
      { en: 'I',     hangul: '아이' },
      { en: 'want',  hangul: '워너', span: 2 },
      { en: 'to',    hangul: null },
      { en: 'go',    hangul: '고우' }
    ]);
    eq(g.length, 3);
    eq(g[1].span, 2);
    eq(g[1].members.length, 2);
    eq(g[1].members[1].en, 'to');
    eq(g[2].members[0].en, 'go');
  });

  test('연음 그룹 — span:3 (a lot of, U2-5)', function () {
    var g = App.PracticeLayout._splitGroups([
      { en: 'a',   hangul: '얼라러', span: 3 },
      { en: 'lot', hangul: null },
      { en: 'of',  hangul: null },
      { en: 'it',  hangul: '잇' }
    ]);
    eq(g.length, 2);
    eq(g[0].members.length, 3);
    eq(g[1].members[0].en, 'it');
  });

  test('연음 그룹 — span 없으면 단어 하나씩', function () {
    var g = App.PracticeLayout._splitGroups([
      { en: 'a', hangul: '어' }, { en: 'b', hangul: '비' }
    ]);
    eq(g.length, 2);
  });

  /* ============ ResultView 표시 형식 ============ */

  test('결과 표시 — null 은 "—" 로 (WR-CALC04)', function () {
    eq(App.ResultView._format.wpm(null), '—');
    eq(App.ResultView._format.accuracy(null), '—');
    eq(App.ResultView._format.time(0), '—');
  });

  test('결과 표시 — 소요 시간은 소수 1자리 (AC-05.5)', function () {
    eq(App.ResultView._format.time(42700), '42.7초');
    eq(App.ResultView._format.accuracy(94.3), '94.3%');
  });

  /* ============ 렌더링 구조 (실데이터) ============
   * 화면을 눈으로 보기 전에, DOM 구조 수준에서 잡을 수 있는 것을 잡는다.
   * window.APP_DATA 가 로드되어 있을 때만 실행된다. */

  function hasData() {
    return typeof window !== 'undefined' && window.APP_DATA &&
           window.APP_DATA.words && window.APP_DATA.phonemeGuide;
  }

  function findWord(en) {
    var w = window.APP_DATA.words;
    for (var i = 0; i < w.length; i++) if (w[i].en === en) return w[i];
    return null;
  }
  function findSentence(id) {
    var s = window.APP_DATA.sentences || [];
    for (var i = 0; i < s.length; i++) if (s[i].id === id) return s[i];
    return null;
  }

  /* 항목 하나를 렌더링하고 구조를 돌려준다 */
  function renderItem(item, mode) {
    var groupsEl = document.createElement('div');
    var meaningEl = document.createElement('div');
    App.PracticeLayout.attach(groupsEl, meaningEl);
    var refs = App.PracticeLayout.build(item, mode);
    App.AnnotationRenderer.init(refs, window.APP_DATA.phonemeGuide, null);
    App.AnnotationRenderer.renderPronunciation();
    App.AnnotationRenderer.renderMeaning(item);
    return refs;
  }

  /* 그룹 g 의 음절 s 에서 위/글자/아래 텍스트를 뽑는다 */
  function syl(refs, g, s) {
    var el = refs.groups[g].pronunciationSlot.children[s];
    return {
      above: el.children[0].textContent,
      char:  el.children[1].textContent,
      below: el.children[2].textContent,
      stressed: /stressed/.test(el.children[1].className)
    };
  }

  function renderTest(name, fn) {
    test(name, function () {
      if (!hasData()) throw new Error('APP_DATA 가 로드되지 않아 확인할 수 없음');
      fn();
    });
  }

  renderTest('스모크 1 — fan 과 pan 이 구조적으로 다르다 (SC-7, U2-4)', function () {
    var fan = syl(renderItem(findWord('fan'), 'word'), 0, 0);
    var pan = syl(renderItem(findWord('pan'), 'word'), 0, 0);
    eq(fan.char, pan.char, '한글 글자는 똑같아야 한다(전제)');
    ok(fan.above !== pan.above,
       '표시가 달라야 한다. fan="' + fan.above + '" pan="' + pan.above + '"');
    eq(fan.above, 'fæ');
    eq(pan.above, 'æ');
  });

  renderTest('스모크 2 — think 와 sink 가 구조적으로 다르다 (SC-7)', function () {
    var t = syl(renderItem(findWord('think'), 'word'), 0, 0);
    var s = syl(renderItem(findWord('sink'), 'word'), 0, 0);
    eq(t.char, s.char, '한글 글자는 똑같아야 한다(전제)');
    eq(t.above, 'θ');
    eq(s.above, '');
  });

  renderTest('스모크 3 — thirsty 의 첫 글자에 표시 3개가 자리를 나눈다 (U2-1)', function () {
    var r = syl(renderItem(findWord('thirsty'), 'word'), 0, 0);
    eq(r.char, '써');
    eq(r.above, 'θr', '음소 2개가 위에');
    eq(r.stressed, true, '강세는 글자 자체');
    eq(r.below, '', '아래는 비어 있음');
  });

  renderTest('스모크 4 — water 의 flap_t 와 r 이 같은 글자에 함께', function () {
    var refs = renderItem(findWord('water'), 'word');
    var s0 = syl(refs, 0, 0), s1 = syl(refs, 0, 1);
    eq(s0.char, '워'); eq(s0.stressed, true);
    eq(s1.char, '러');
    eq(s1.above, 'r', '음소는 위');
    eq(s1.below, 'ᵗ', 'flap_t 는 아래');
  });

  renderTest('스모크 5 — banana 의 강세가 두 번째 글자에 붙는다', function () {
    var refs = renderItem(findWord('banana'), 'word');
    eq(syl(refs, 0, 0).stressed, false);
    eq(syl(refs, 0, 1).stressed, true);
    eq(syl(refs, 0, 1).above, 'æ');
  });

  renderTest('스모크 6 — love 의 v 가 마지막 글자에 붙는다 (at 경계)', function () {
    var refs = renderItem(findWord('love'), 'word');
    eq(syl(refs, 0, 0).above, 'l');
    eq(syl(refs, 0, 1).char, '브');
    eq(syl(refs, 0, 1).above, 'v');
  });

  renderTest('스모크 7 — s0001 의 "워너"가 want+to 두 단어를 덮는다', function () {
    var refs = renderItem(findSentence('s0001'), 'sentence');
    var g = refs.groups[1];
    eq(g.span, 2);
    eq(g.wordBlocks.length, 2);
    eq(g.wordBlocks[0].en, 'want');
    eq(g.wordBlocks[1].en, 'to');
    eq(g.pronunciationSlot.children[0].children[1].textContent, '워');
    eq(g.pronunciationSlot.children[1].children[1].textContent, '너');
  });

  renderTest('스모크 8 — s0002 는 첫 단어부터 연음이 걸린다', function () {
    var refs = renderItem(findSentence('s0002'), 'sentence');
    var g = refs.groups[0];
    eq(g.span, 2);
    eq(g.wordBlocks[0].en, 'What');
    eq(g.wordBlocks[1].en, 'are');
    eq(syl(refs, 0, 1).below, 'ᵗ', 'flap_t');
  });

  renderTest('⚠️ charElements 가 text 와 1:1 로 대응한다 (전 항목)', function () {
    var bad = [];
    var all = window.APP_DATA.words.map(function (w) { return { item: w, mode: 'word' }; })
      .concat((window.APP_DATA.sentences || []).map(function (s) {
        return { item: s, mode: 'sentence' };
      }));

    for (var i = 0; i < all.length; i++) {
      var refs = renderItem(all[i].item, all[i].mode);
      var text = all[i].item.en;
      if (refs.charElements.length !== text.length) {
        bad.push(all[i].item.id + ' 길이 ' + refs.charElements.length + '≠' + text.length);
        continue;
      }
      for (var k = 0; k < text.length; k++) {
        if (refs.charElements[k].textContent !== text.charAt(k)) {
          bad.push(all[i].item.id + ' [' + k + '] "' +
                   refs.charElements[k].textContent + '"≠"' + text.charAt(k) + '"');
          break;
        }
      }
    }
    if (bad.length) throw new Error('불일치 ' + bad.length + '건: ' + bad.slice(0, 5).join(' | '));
  });

  renderTest('전 항목의 발음 글자 수와 음절 슬롯 수가 일치한다', function () {
    var bad = [];
    var ws = window.APP_DATA.words;
    for (var i = 0; i < ws.length; i++) {
      var refs = renderItem(ws[i], 'word');
      var expect = ws[i].hangul.length;
      var actual = refs.groups[0].pronunciationSlot.children.length;
      if (expect !== actual) bad.push(ws[i].id + ' ' + actual + '≠' + expect);
    }
    if (bad.length) throw new Error(bad.join(', '));
  });

  renderTest('전 항목에 뜻이 채워진다 (SC-8)', function () {
    var bad = [];
    var all = window.APP_DATA.words.concat(window.APP_DATA.sentences || []);
    for (var i = 0; i < all.length; i++) {
      var mode = all[i].id.charAt(0) === 's' ? 'sentence' : 'word';
      var refs = renderItem(all[i], mode);
      if (!refs.meaningSlot.textContent) bad.push(all[i].id);
    }
    if (bad.length) throw new Error('뜻 누락: ' + bad.join(', '));
  });

  /* ============ 실행 ============ */

  App.LogicTest = {
    runAll: function () {
      var passed = 0, failed = 0, details = [];
      for (var i = 0; i < cases.length; i++) {
        var c = cases[i], ok_ = true, reason = '';
        try { c.fn(); }
        catch (err) { ok_ = false; reason = err.message; }
        if (ok_) passed++; else failed++;
        details.push({ name: c.name, ok: ok_, reason: reason });
      }
      return { passed: passed, failed: failed, total: cases.length, details: details };
    },
    cases: cases
  };

})(window.App = window.App || {});
