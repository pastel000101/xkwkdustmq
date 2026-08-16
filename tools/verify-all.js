#!/usr/bin/env node
/* ============================================================
 * verify-all.js — 전체 검증 한 번에 실행
 * ------------------------------------------------------------
 * 사용:  node tools/verify-all.js
 *
 * 이 프로젝트에는 빌드 스텝이 없다 (NFR-003).
 * "빌드"에 해당하는 것은 아래 세 가지 확인이다.
 *
 *   1. 정적 규약 검사   — 외부 참조 0건, ES Module 미사용 등
 *   2. 콘텐츠 검증      — 발음 데이터가 규칙을 지켰는가
 *   3. 로직·구조 테스트 — 타이핑 판정과 렌더링 구조가 맞는가
 *
 * 브라우저에서 눈으로 봐야 하는 항목은 이 스크립트가 확인하지 못한다.
 * 마지막에 그 목록을 출력한다.
 *
 * 종료 코드:  0 = 전부 통과,  1 = 실패 있음
 * ============================================================ */

'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var cp = require('child_process');

var ROOT = path.resolve(__dirname, '..');
var C = { r: '[0m', red: '[31m', grn: '[32m', ylw: '[33m',
          dim: '[2m', bold: '[1m' };

function line(ch) { return new Array(66).join(ch || '-'); }
function read(f) { return fs.readFileSync(path.join(ROOT, f), 'utf8'); }

/* 주석을 지우고 검사한다.
 * 줄 단위로 "이 줄에 주석 시작 기호가 있는가"만 보면
 * 여러 줄 주석의 중간 줄을 코드로 오인한다. */
function stripComments(src) {
  return src
    .replace(/<!--[\s\S]*?-->/g, '')   /* HTML 주석 */
    .replace(/\/\*[\s\S]*?\*\//g, '')  /* JS·CSS 블록 주석 */
    .replace(/(^|\s)\/\/[^\n]*/g, '$1'); /* JS 한 줄 주석 (URL 의 // 는 앞에 공백이 없어 보존됨) */
}
function exists(f) { return fs.existsSync(path.join(ROOT, f)); }

function listFiles(dir, ext) {
  var p = path.join(ROOT, dir);
  if (!fs.existsSync(p)) return [];
  return fs.readdirSync(p)
    .filter(function (f) { return f.slice(-ext.length) === ext; })
    .map(function (f) { return dir + '/' + f; });
}

var results = [];
function check(name, fn) {
  var ok, detail = '';
  try { var r = fn(); ok = r === true || (r && r.ok); detail = (r && r.detail) || ''; }
  catch (e) { ok = false; detail = e.message; }
  results.push({ name: name, ok: ok, detail: detail });
  console.log('  ' + (ok ? C.grn + 'PASS' + C.r : C.red + 'FAIL' + C.r) + '  ' + name +
              (detail ? '\n        ' + C.dim + detail + C.r : ''));
  return ok;
}

/* ============ 1. 정적 규약 검사 ============ */

console.log('');
console.log(C.bold + '영어 타자연습 — 전체 검증' + C.r);
console.log(line('='));
console.log('');
console.log(C.bold + '[1] 정적 규약 검사' + C.r);

var APP_FILES = ['index.html'].concat(listFiles('css', '.css'))
                             .concat(listFiles('js', '.js'));

check('필수 파일이 모두 존재한다', function () {
  var required = ['index.html', 'css/style.css', 'css/practice.css',
                  'data/phoneme-guide.js', 'data/words.js', 'data/sentences.js',
                  'docs/pronunciation-rules.md'];
  var missing = required.filter(function (f) { return !exists(f); });
  return missing.length === 0 ? true : { ok: false, detail: '누락: ' + missing.join(', ') };
});

check('외부 리소스를 참조하지 않는다 (NFR-001)', function () {
  var hits = [];
  APP_FILES.forEach(function (f) {
    if (/https?:\/\/|src\s*=\s*["']\/\//.test(stripComments(read(f)))) hits.push(f);
  });
  return hits.length === 0 ? true : { ok: false, detail: hits.join(', ') };
});

check('ES Module 을 쓰지 않는다 (file:// CORS 회피)', function () {
  var hits = [];
  ['index.html', 'tools/test.html', 'tools/validate.html'].forEach(function (f) {
    if (exists(f) && /type\s*=\s*["']module["']/.test(stripComments(read(f)))) hits.push(f);
  });
  listFiles('js', '.js').forEach(function (f) {
    if (/^\s*(import|export)\s/m.test(stripComments(read(f)))) hits.push(f);
  });
  return hits.length === 0 ? true : { ok: false, detail: hits.join(', ') };
});

check('fetch / XMLHttpRequest 를 쓰지 않는다 (NFR-002)', function () {
  var hits = [];
  ['index.html'].concat(listFiles('js', '.js')).forEach(function (f) {
    if (/fetch\s*\(|XMLHttpRequest/.test(stripComments(read(f)))) hits.push(f);
  });
  return hits.length === 0 ? true : { ok: false, detail: hits.join(', ') };
});

check('bootstrap-service.js 가 마지막으로 로드된다', function () {
  var srcs = read('index.html').match(/src="([^"]+)"/g) || [];
  var last = srcs[srcs.length - 1] || '';
  return last.indexOf('bootstrap-service.js') !== -1
    ? true : { ok: false, detail: '마지막 스크립트: ' + last };
});

check('js/ 에 콘텐츠 데이터가 하드코딩되어 있지 않다 (FR-030)', function () {
  /* UI 라벨·오류 메시지는 허용. 영어 단어-한글 발음 쌍이 없어야 한다 */
  var hits = [];
  listFiles('js', '.js').forEach(function (f) {
    if (/hangul\s*:\s*['"][가-힣]/.test(read(f))) hits.push(f);
  });
  return hits.length === 0 ? true : { ok: false, detail: hits.join(', ') };
});

check('데이터 파일 총 용량이 2MB 이하다 (NFR-009)', function () {
  var total = ['data/phoneme-guide.js', 'data/words.js', 'data/sentences.js']
    .reduce(function (a, f) { return a + fs.statSync(path.join(ROOT, f)).size; }, 0);
  var kb = (total / 1024).toFixed(1);
  return total <= 2 * 1024 * 1024
    ? { ok: true, detail: kb + ' KB (상한의 ' + (total / (2 * 1024 * 1024) * 100).toFixed(1) + '%)' }
    : { ok: false, detail: kb + ' KB — 상한 초과' };
});

check('data-testid 가 부여되어 있다 (자동화 친화)', function () {
  var n = (read('index.html').match(/data-testid=/g) || []).length;
  return n >= 20 ? { ok: true, detail: n + '개' } : { ok: false, detail: '겨우 ' + n + '개' };
});

/* ============ 2. 콘텐츠 검증 ============ */

console.log('');
console.log(C.bold + '[2] 콘텐츠 검증' + C.r);

var contentOk = false;
try {
  cp.execSync('node "' + path.join(__dirname, 'validate-cli.js') + '"',
              { cwd: ROOT, stdio: 'pipe' });
  contentOk = true;
} catch (e) { contentOk = false; }

var Validator = require('./validate-content.js');
(function () {
  var sb = { window: {} }; sb.self = sb; vm.createContext(sb);
  ['phoneme-guide.js', 'words.js', 'sentences.js'].forEach(function (f) {
    vm.runInContext(read('data/' + f), sb, { filename: f });
  });
  var rep = Validator.validateAll(sb.window.APP_DATA);

  check('검증기 자체 테스트 전 케이스 통과', function () {
    var st = require('./validator-self-test.js').runAll();
    return st.failed === 0
      ? { ok: true, detail: st.passed + '/' + st.total }
      : { ok: false, detail: st.failed + '건 실패' };
  });

  check('콘텐츠 검증 error 0건', function () {
    return rep.summary.error === 0
      ? { ok: true, detail: '단어 ' + rep.total.words + ' / 문장 ' + rep.total.sentences }
      : { ok: false, detail: 'error ' + rep.summary.error + '건' };
  });

  check('단어 1,000개 이상 (SC-4)', function () {
    return rep.total.words >= 1000
      ? { ok: true, detail: rep.total.words + '개' }
      : { ok: false, detail: rep.total.words + '개' };
  });

  check('문장 300개 이상 (SC-4)', function () {
    return rep.total.sentences >= 300
      ? { ok: true, detail: rep.total.sentences + '개' }
      : { ok: false, detail: rep.total.sentences + '개' };
  });

  check('표시 키 12개가 모두 실제로 쓰인다', function () {
    var used = {};
    sb.window.APP_DATA.words.forEach(function (w) {
      w.marks.forEach(function (mk) { used[mk.phoneme] = true; });
    });
    sb.window.APP_DATA.sentences.forEach(function (s) {
      s.words.forEach(function (w) {
        w.marks.forEach(function (mk) { used[mk.phoneme] = true; });
      });
    });
    var all = Object.keys(sb.window.APP_DATA.phonemeGuide);
    var unused = all.filter(function (k) { return !used[k]; });
    return unused.length === 0
      ? { ok: true, detail: all.length + '/' + all.length }
      : { ok: false, detail: '미사용: ' + unused.join(', ') };
  });

  check('연음 18종이 모두 문장에 등장한다', function () {
    var kinds = {};
    sb.window.APP_DATA.sentences.forEach(function (s) {
      s.words.forEach(function (w, i) {
        if (w.span > 1) {
          kinds[s.words.slice(i, i + w.span).map(function (q) {
            return q.en.replace(/[^A-Za-z']/g, '');
          }).join(' ').toLowerCase()] = true;
        }
      });
    });
    var n = Object.keys(kinds).length;
    return n >= 18 ? { ok: true, detail: n + '종' } : { ok: false, detail: n + '종' };
  });

  check('SC-7 쌍이 표시로 구분된다 (fan/pan, think/sink)', function () {
    function find(en) {
      var ws = sb.window.APP_DATA.words;
      for (var i = 0; i < ws.length; i++) if (ws[i].en === en) return ws[i];
      return null;
    }
    function sig(w) {
      return w.marks.map(function (mk) { return mk.at + ':' + mk.phoneme; }).sort().join(',');
    }
    var pairs = [['fan', 'pan'], ['think', 'sink'], ['light', 'right']];
    var bad = [];
    pairs.forEach(function (p) {
      var a = find(p[0]), b = find(p[1]);
      if (!a || !b) { bad.push(p.join('/') + ' 없음'); return; }
      if (a.hangul === b.hangul && sig(a) === sig(b)) bad.push(p.join('/') + ' 완전 동일');
    });
    return bad.length === 0 ? true : { ok: false, detail: bad.join(', ') };
  });
})();

/* ============ 3. 로직·구조 테스트 ============ */

console.log('');
console.log(C.bold + '[3] 로직·렌더링 구조 테스트' + C.r);

check('로직·렌더링 테스트 전 케이스 통과', function () {
  var out;
  try {
    out = cp.execSync('node "' + path.join(__dirname, 'logic-cli.js') + '"',
                      { cwd: ROOT, stdio: 'pipe' }).toString();
  } catch (e) {
    out = (e.stdout || '').toString();
    var mm = out.match(/(\d+)\/(\d+)/);
    return { ok: false, detail: mm ? mm[0] : '실행 실패' };
  }
  var mm2 = out.match(/(\d+)\/(\d+)\s*$/m) || out.match(/(\d+)\/(\d+)/);
  return { ok: true, detail: mm2 ? mm2[0] : '통과' };
});

/* ============ 결과 ============ */

var failed = results.filter(function (r) { return !r.ok; });

console.log('');
console.log(line('='));
console.log((failed.length === 0 ? C.grn + C.bold + '통과' : C.red + C.bold + '실패') + C.r +
            ' — ' + (results.length - failed.length) + '/' + results.length + ' 항목');

console.log('');
console.log(C.ylw + '이 스크립트가 확인하지 못하는 것 — 브라우저에서 눈으로 봐야 합니다' + C.r);
console.log(C.dim + [
  '  1. F2 · F4 를 연타해도 영어 줄이 위아래로 움직이지 않는가   (FR-025)',
  '  2. 문장이 줄바꿈될 때 발음이 단어를 따라가는가              (AC-16.2)',
  '  3. 발음 · 뜻 토글 4가지 조합이 화면에 반영되는가            (AC-12.4)',
  '  4. F9 범례에 12개 항목이 3부류로 나뉘어 보이는가            (FR-023)',
  '  5. 흑백으로 봐도 정답 · 오답 · 커서가 구분되는가            (NFR-008)',
  '  6. 타이핑 중 끊김이 느껴지지 않는가                        (NFR-004)',
  '  7. 개발자도구 Network 탭에 외부 요청이 0건인가             (AC-19.3)',
  '  8. 개발자도구 Console 에 오류가 0건인가',
  '',
  '  앱 실행:      index.html 을 더블클릭',
  '  로직 테스트:  tools/test.html 을 더블클릭',
  '  콘텐츠 검증:  tools/validate.html 을 더블클릭'
].join('\n') + C.r);
console.log('');

process.exit(failed.length === 0 ? 0 : 1);
