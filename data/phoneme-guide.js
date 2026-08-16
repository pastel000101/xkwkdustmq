/* ============================================================
 * phoneme-guide.js — 발음 구분 표시 가이드
 * ------------------------------------------------------------
 * 이 파일이 정의하는 12개 키가 시스템 전체의 기준점이다.
 * words.js / sentences.js 의 모든 marks[].phoneme 은
 * 반드시 이 목록의 key 중 하나여야 한다.
 *
 * 원본은 docs/pronunciation-rules.md 8절이다.
 * 이 파일을 고치면 그 문서도 함께 고쳐야 한다.
 *
 * category 필드:
 *   "phoneme"  소리 자체       — 난이도 보정에서 계수 대상
 *   "prosody"  운율(강세)      — 계수 제외
 *   "spelling" 철자 정보       — 계수 제외
 * ============================================================ */

window.APP_DATA = window.APP_DATA || {};

window.APP_DATA.phonemeGuide = {

  f: {
    key: 'f', symbol: 'f', label: '에프', ipa: 'f', category: 'phoneme',
    articulation: '윗니를 아랫입술에 살짝 대고 그 사이로 바람을 낸다.',
    confusedWith: 'ㅍ(p) — p 는 두 입술을 붙였다 터뜨리는 소리',
    example: 'fan 팬 / pan 팬'
  },

  v: {
    key: 'v', symbol: 'v', label: '브이', ipa: 'v', category: 'phoneme',
    articulation: 'f 와 같은 입 모양에서 목을 울린다.',
    confusedWith: 'ㅂ(b) — b 는 두 입술을 붙였다 터뜨리는 소리',
    example: 'vest 베스트 / best 베스트'
  },

  th: {
    key: 'th', symbol: 'θ', label: '무성 th', ipa: 'θ', category: 'phoneme',
    articulation: '혀끝을 윗니와 아랫니 사이에 살짝 내밀고 그 사이로 바람을 낸다. 목은 울리지 않는다.',
    confusedWith: 'ㅆ(s) — s 는 혀가 이 사이로 나오지 않는다',
    example: 'think 씽크 / sink 씽크'
  },

  dh: {
    key: 'dh', symbol: 'ð', label: '유성 th', ipa: 'ð', category: 'phoneme',
    articulation: '무성 th 와 같은 혀 위치에서 목을 울린다.',
    confusedWith: 'ㄷ(d) — d 는 혀끝이 잇몸에 닿는다',
    example: 'this 디스 / the 더'
  },

  r: {
    key: 'r', symbol: 'r', label: '알', ipa: 'ɹ', category: 'phoneme',
    articulation: '혀끝을 어디에도 대지 않고 입천장 쪽으로 말아올린다. 입술도 살짝 둥글게.',
    confusedWith: 'ㄹ(l) — l 은 혀끝이 잇몸에 확실히 닿는다',
    example: 'right 롸이트 / light 라이트'
  },

  l: {
    key: 'l', symbol: 'l', label: '엘', ipa: 'l', category: 'phoneme',
    articulation: '혀끝을 윗니 바로 뒤 잇몸에 확실히 붙이고 소리를 낸다.',
    confusedWith: 'ㄹ(r) — r 은 혀끝이 아무데도 닿지 않는다',
    example: 'light 라이트 / right 롸이트'
  },

  z: {
    key: 'z', symbol: 'z', label: '지', ipa: 'z', category: 'phoneme',
    articulation: 'ㅅ 을 낼 때와 같은 자리에서 목을 울린다. 벌이 나는 소리와 비슷하다.',
    confusedWith: 'ㅈ(j) — j 는 혀가 입천장에 한 번 닿았다 떨어진다',
    example: 'zoo 주 / nose 노우즈'
  },

  zh: {
    key: 'zh', symbol: 'ʒ', label: '즈', ipa: 'ʒ', category: 'phoneme',
    articulation: 'ʃ(쉬) 를 낼 때와 같은 혀 위치에서 목을 울린다.',
    confusedWith: 'ㅈ(j) — j 는 혀가 입천장에 붙었다 떨어진다',
    example: 'vision 비전 / measure 메저'
  },

  sh: {
    key: 'sh', symbol: 'ʃ', label: '쉬', ipa: 'ʃ', category: 'phoneme',
    articulation: '혀를 ㅅ 보다 뒤로 물리고 입술을 살짝 앞으로 내밀며 바람을 낸다.',
    confusedWith: 'ㅅ(s) — s 는 혀가 앞쪽에 있고 입술을 내밀지 않는다',
    example: 'she 시 / sea 씨'
  },

  ae: {
    key: 'ae', symbol: 'æ', label: '애', ipa: 'æ', category: 'phoneme',
    articulation: '입을 옆으로 넓게 벌리고 턱을 내려 "애"와 "아"의 중간 소리를 낸다.',
    confusedWith: 'ㅔ(e) — e 는 입을 덜 벌린다',
    example: 'cat 캣 / bad 밷'
  },

  stress: {
    key: 'stress', symbol: 'ˈ', label: '강세', ipa: null, category: 'prosody',
    articulation: '이 음절을 다른 음절보다 더 길고 세고 높게 발음한다. 영어는 강세 위치가 틀리면 알아듣기 어렵다.',
    confusedWith: null,
    example: 'banana 버내너 (두 번째 음절)'
  },

  flap_t: {
    key: 'flap_t', symbol: 'ᵗ', label: '약화된 t', ipa: 'ɾ', category: 'spelling',
    articulation: '철자는 t 또는 d 지만 미국식 발음에서 ㄹ 에 가깝게 약해진다. 혀끝으로 잇몸을 살짝 튕기듯 친다.',
    confusedWith: null,
    example: 'water 워러 / better 베러 / city 씨리'
  }

};
