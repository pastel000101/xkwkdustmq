#!/usr/bin/env node
/* ============================================================
 * logic-cli.js — 로직 테스트 (Node CLI 진입점)
 * ------------------------------------------------------------
 * 사용:  node tools/logic-cli.js
 *
 * 브라우저 없이 로직과 렌더링 구조를 확인한다.
 * 렌더링 구조 확인을 위해 최소한의 DOM 흉내를 낸다 —
 * 실제 화면 모양은 이것으로 알 수 없으므로,
 * tools/test.html 과 index.html 을 눈으로 여는 것을 대체하지 않는다.
 *
 * 종료 코드:  0 = 전부 통과,  1 = 실패 있음
 * ============================================================ */

'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');

var ROOT = path.resolve(__dirname, '..');

/* ---------- 최소 DOM 흉내 ---------- */

function makeElement(tag) {
  var el = {
    tagName: String(tag).toUpperCase(),
    className: '',
    childNodes: [],
    _attrs: {},
    _text: '',
    appendChild: function (c) { this.childNodes.push(c); return c; },
    setAttribute: function (k, v) { this._attrs[k] = String(v); },
    getAttribute: function (k) {
      return Object.prototype.hasOwnProperty.call(this._attrs, k) ? this._attrs[k] : null;
    },
    addEventListener: function () {},
    removeEventListener: function () {},
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    closest: function () { return null; },
    blur: function () {},
    classList: {
      add: function () {}, remove: function () {}, contains: function () { return false; }
    }
  };
  Object.defineProperty(el, 'children', { get: function () { return this.childNodes; } });
  Object.defineProperty(el, 'textContent', {
    get: function () {
      if (this.childNodes.length === 0) return this._text;
      return this.childNodes.map(function (c) { return c.textContent; }).join('');
    },
    set: function (v) { this.childNodes = []; this._text = String(v); }
  });
  return el;
}

var sandbox = { console: console };
sandbox.window = sandbox;
sandbox.self = sandbox;
sandbox.document = {
  createElement: makeElement,
  getElementById: function () { return null; },
  addEventListener: function () {},
  activeElement: null
};
vm.createContext(sandbox);

/* ---------- 로드 ---------- */

var FILES = [
  'data/phoneme-guide.js', 'data/words.js', 'data/sentences.js',
  'js/app-state.js', 'js/content-store.js', 'js/typing-engine.js', 'js/stats-tracker.js',
  'js/practice-layout.js', 'js/text-renderer.js', 'js/annotation-renderer.js',
  'js/result-view.js', 'js/control-panel.js', 'js/legend-view.js', 'js/input-handler.js',
  'js/settings-service.js', 'js/practice-session-service.js', 'js/bootstrap-service.js',
  'tools/app-logic-test.js'
];

var loadFailed = false;
FILES.forEach(function (f) {
  var p = path.join(ROOT, f);
  if (!fs.existsSync(p)) {
    console.error('파일 없음: ' + f);
    loadFailed = true;
    return;
  }
  try {
    vm.runInContext(fs.readFileSync(p, 'utf8'), sandbox, { filename: f });
  } catch (e) {
    console.error('로드 실패: ' + f + ' — ' + e.message);
    loadFailed = true;
  }
});
if (loadFailed) process.exit(1);

/* ---------- 실행 ---------- */

var C = { reset: '[0m', red: '[31m', green: '[32m',
          dim: '[2m', bold: '[1m' };

var r = sandbox.App.LogicTest.runAll();

console.log('');
console.log(C.bold + 'Unit 2 로직 · 렌더링 구조 테스트' + C.reset);
console.log(new Array(64).join('-'));

r.details.forEach(function (d) {
  if (d.ok) {
    console.log('  ' + C.green + 'PASS' + C.reset + '  ' + d.name);
  } else {
    console.log('  ' + C.red + 'FAIL' + C.reset + '  ' + d.name);
    console.log('        ' + C.dim + d.reason + C.reset);
  }
});

console.log(new Array(64).join('-'));
console.log((r.failed === 0 ? C.green + C.bold + '통과' : C.red + C.bold + '실패') +
            C.reset + ' — ' + r.passed + '/' + r.total);
console.log('');
console.log(C.dim + '주의: 이 테스트는 DOM 을 흉내 낸 것이라 실제 화면 모양은 확인하지 못한다.' + C.reset);
console.log(C.dim + '      index.html 을 브라우저로 열어 눈으로 확인해야 한다.' + C.reset);
console.log('');

process.exit(r.failed === 0 ? 0 : 1);
