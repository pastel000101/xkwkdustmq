#!/usr/bin/env node
/* ============================================================
 * validate-cli.js — 콘텐츠 검증 (Node CLI 진입점)
 * ------------------------------------------------------------
 * 사용:  node tools/validate-cli.js
 *
 * 데이터 파일은 브라우저용 전역 변수(window.APP_DATA) 방식이므로
 * Node 에서는 가짜 전역을 만들어 로드한다.
 *
 * 이 진입점은 편의 수단이다. Node 가 없어도
 * tools/validate.html 을 브라우저로 열면 항상 검증할 수 있다.
 * (NFR-003 — 빌드 스텝 없음)
 *
 * 종료 코드:  0 = error 위반 0건,  1 = error 위반 있음 또는 자체 테스트 실패
 * ============================================================ */

'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');

var ROOT = path.resolve(__dirname, '..');
var DATA_FILES = ['phoneme-guide.js', 'words.js', 'sentences.js'];

/* ---- 데이터 로드 ---- */

function loadData() {
  var sandbox = { window: {} };
  sandbox.self = sandbox;
  vm.createContext(sandbox);

  DATA_FILES.forEach(function (f) {
    var p = path.join(ROOT, 'data', f);
    if (!fs.existsSync(p)) {
      console.error('데이터 파일을 찾을 수 없습니다: ' + p);
      process.exit(1);
    }
    vm.runInContext(fs.readFileSync(p, 'utf8'), sandbox, { filename: f });
  });

  return sandbox.window.APP_DATA || {};
}

/* ---- 출력 ---- */

var C = {
  reset: '[0m', red: '[31m', green: '[32m',
  yellow: '[33m', dim: '[2m', bold: '[1m'
};

function line(ch) { return new Array(64).join(ch || '-'); }

/* ---- 실행 ---- */

var Validator = require('./validate-content.js');
var SelfTest = require('./validator-self-test.js');

console.log('');
console.log(C.bold + '콘텐츠 검증' + C.reset);
console.log(line());

/* 1. 자체 테스트 */
console.log('');
console.log(C.bold + '[1] 검증기 자체 테스트' + C.reset);
var st = SelfTest.runAll();
st.details.forEach(function (d) {
  if (d.ok) {
    console.log('  ' + C.green + 'PASS' + C.reset + '  ' + d.name);
  } else {
    console.log('  ' + C.red + 'FAIL' + C.reset + '  ' + d.name);
    console.log('        ' + C.dim + d.reason + C.reset);
  }
});
console.log('  ' + (st.failed === 0 ? C.green : C.red) +
  st.passed + '/' + st.total + ' 통과' + C.reset);

if (st.failed > 0) {
  console.log('');
  console.log(C.red + '자체 테스트가 실패했습니다. 검증 결과를 신뢰할 수 없어 중단합니다.' + C.reset);
  console.log('');
  process.exit(1);
}

/* 2. 데이터 검증 */
console.log('');
console.log(C.bold + '[2] 데이터 검증' + C.reset);

var data = loadData();
var report = Validator.validateAll(data);

console.log('  단어 ' + report.total.words + '개 / 문장 ' + report.total.sentences + '개');
console.log('  난이도: ' + Object.keys(report.byLevel).map(function (k) {
  return k + ' ' + report.byLevel[k];
}).join(' · '));
console.log('  카테고리: ' + Object.keys(report.byCategory).map(function (k) {
  return k + ' ' + report.byCategory[k];
}).join(' · '));

/* 3. 위반 목록 */
console.log('');
console.log(C.bold + '[3] 위반 목록' + C.reset);

if (report.violations.length === 0) {
  console.log('  ' + C.green + '위반 없음' + C.reset);
} else {
  report.violations.forEach(function (v) {
    var color = v.severity === 'error' ? C.red : C.yellow;
    console.log('  ' + color + v.severity.toUpperCase() + C.reset +
      ' ' + C.dim + '[' + v.rule + ']' + C.reset + ' ' + v.message);
  });
}

console.log('');
console.log(line());
if (report.ok) {
  console.log(C.green + C.bold + '통과' + C.reset +
    ' — error 0건' +
    (report.summary.warning > 0 ? ', warning ' + report.summary.warning + '건' : ''));
  console.log('');
  process.exit(0);
} else {
  console.log(C.red + C.bold + '실패' + C.reset +
    ' — error ' + report.summary.error + '건, warning ' + report.summary.warning + '건');
  console.log('');
  process.exit(1);
}
