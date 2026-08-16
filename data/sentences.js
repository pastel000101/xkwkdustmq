/* ============================================================
 * sentences.js — 문장 콘텐츠 데이터
 * ------------------------------------------------------------
 * 문장은 단어마다 발음이 필요하다. 같은 단어가 여러 문장에
 * 반복되므로, 발음 사전 D 를 한 번 정의하고 재사용한다.
 *
 *   d(key)            사전에서 발음을 꺼내 단어 항목을 만든다
 *   d(key, '단어.')    화면에 칠 영어를 바꾼다 (문장 부호 붙일 때)
 *   x('en','한글',[표시], span)   사전에 없는 단어를 직접 적을 때
 *   s(id, en, words, meaning, level, category)
 *
 * 만들어지는 객체는 스키마와 정확히 같다.
 *   { id, en, words:[{en, hangul, marks, span?}], meaning, level, category }
 *
 * 불변식
 *   words 의 en 을 공백으로 이어붙이면 문장의 en 과 정확히 같아야 한다
 *   span 의 합이 words 의 개수와 같아야 한다
 *   span:n (n>1) 뒤 n-1 개 항목의 hangul 은 null 이어야 한다
 *
 * 연음은 docs/pronunciation-rules.md 6절의 18개 목록만 적용한다.
 * 연음 항목은 lz(...) 로 적는다.
 * ============================================================ */

window.APP_DATA = window.APP_DATA || {};

(function () {
  'use strict';

  var S = [];
  function m(at, ph) { return { at: at, phoneme: ph }; }

  /* ---------- 발음 사전 ----------
     [한글, 표시배열] */
  var D = {
    'I':['아이',[]], 'a':['어',[]], 'an':['언',[]], 'the':['더',[m(0,'dh')]],
    'is':['이즈',[m(1,'z')]], 'am':['앰',[m(0,'ae')]], 'are':['아',[m(0,'r')]],
    'was':['워즈',[m(1,'z')]], 'were':['워',[m(0,'r')]], 'be':['비',[]],
    'do':['두',[]], 'does':['더즈',[m(1,'z')]], 'did':['딛',[]],
    'have':['해브',[m(0,'ae'),m(1,'v')]], 'has':['해즈',[m(0,'ae'),m(1,'z')]], 'had':['핻',[m(0,'ae')]],
    'can':['캔',[m(0,'ae')]], 'will':['윌',[m(0,'l')]], 'would':['우드',[]],
    'should':['슈드',[m(0,'sh')]], 'could':['쿠드',[]], 'may':['메이',[]], 'must':['머스트',[]],
    'not':['낫',[]], "don't":['도운트',[]], "doesn't":['더즌트',[m(1,'z')]],
    "didn't":['디든트',[]], "isn't":['이즌트',[m(1,'z')]], "can't":['캔트',[m(0,'ae')]],
    "won't":['워운트',[]], "I'm":['아임',[]], "it's":['잇츠',[]], "that's":['댓츠',[m(0,'dh')]],
    'you':['유',[]], 'he':['히',[]], 'she':['시',[m(0,'sh')]], 'it':['잇',[]],
    'we':['위',[]], 'they':['데이',[m(0,'dh')]], 'me':['미',[]], 'him':['힘',[]],
    'her':['허',[m(0,'r')]], 'us':['어스',[]], 'them':['뎀',[m(0,'dh')]],
    'my':['마이',[]], 'your':['유어',[m(1,'r')]], 'his':['히즈',[m(1,'z')]],
    'our':['아워',[m(1,'r')]], 'their':['데어',[m(0,'dh'),m(1,'r')]],
    'this':['디스',[m(0,'dh')]], 'that':['댓',[m(0,'dh'),m(0,'ae')]],
    'these':['디즈',[m(0,'dh'),m(1,'z')]], 'those':['도우즈',[m(0,'dh'),m(2,'z')]],
    'here':['히어',[m(1,'r')]], 'there':['데어',[m(0,'dh'),m(1,'r')]],
    'what':['웟',[]], 'when':['웬',[]], 'where':['웨어',[m(1,'r')]],
    'who':['후',[]], 'why':['와이',[]], 'how':['하우',[]], 'which':['위치',[]],
    'and':['앤드',[m(0,'ae')]], 'or':['오',[m(0,'r')]], 'but':['벗',[]],
    'so':['쏘우',[]], 'because':['비커즈',[m(1,'stress'),m(2,'z')]],
    'if':['이프',[m(1,'f')]], 'than':['댄',[m(0,'dh'),m(0,'ae')]],
    'to':['투',[]], 'of':['어브',[m(1,'v')]], 'in':['인',[]], 'on':['온',[]],
    'at':['앳',[m(0,'ae')]], 'for':['포',[m(0,'f'),m(0,'r')]], 'with':['위드',[m(1,'dh')]],
    'from':['프뤔',[m(0,'f'),m(1,'r')]], 'by':['바이',[]], 'about':['어바웃',[m(1,'stress')]],
    'after':['애프터',[m(0,'ae'),m(0,'stress'),m(1,'f'),m(2,'r')]],
    'before':['비포',[m(1,'f'),m(1,'stress'),m(1,'r')]],
    'into':['인투',[m(0,'stress')]], 'over':['오우버',[m(0,'stress'),m(2,'v'),m(2,'r')]],
    'under':['언더',[m(0,'stress'),m(1,'r')]], 'up':['업',[]], 'down':['다운',[]],
    'out':['아웃',[]], 'off':['오프',[m(1,'f')]], 'again':['어겐',[m(1,'stress')]],
    'very':['베뤼',[m(0,'v'),m(0,'stress'),m(1,'r')]], 'really':['뤼얼리',[m(0,'r'),m(0,'stress'),m(1,'l'),m(2,'l')]],
    'too':['투',[]], 'also':['올쏘우',[m(0,'stress'),m(0,'l')]], 'always':['올웨이즈',[m(0,'stress'),m(0,'l'),m(3,'z')]],
    'never':['네버',[m(0,'stress'),m(1,'v'),m(1,'r')]], 'often':['오픈',[m(0,'stress'),m(1,'f')]],
    'sometimes':['썸타임즈',[m(0,'stress'),m(3,'z')]], 'now':['나우',[]], 'then':['덴',[m(0,'dh')]],
    'today':['터데이',[m(1,'stress')]], 'tomorrow':['터마로우',[m(1,'stress'),m(2,'r')]],
    'yesterday':['예스터데이',[m(0,'stress'),m(2,'r')]],
    'good':['굳',[]], 'bad':['밷',[m(0,'ae')]], 'big':['빅',[]], 'small':['스몰',[m(1,'l')]],
    'new':['뉴',[]], 'old':['오울드',[m(2,'l')]], 'hot':['핫',[]], 'cold':['코울드',[m(2,'l')]],
    'happy':['해피',[m(0,'ae'),m(0,'stress')]], 'sad':['쌛',[m(0,'ae')]],
    'nice':['나이스',[]], 'great':['그뤠잇',[m(1,'r')]], 'fine':['파인',[m(0,'f')]],
    'busy':['비지',[m(0,'stress'),m(1,'z')]], 'tired':['타이어드',[m(0,'stress'),m(2,'r')]],
    'hungry':['헝그뤼',[m(0,'stress'),m(2,'r')]], 'ready':['뤠리',[m(0,'r'),m(0,'stress'),m(1,'flap_t')]],
    'easy':['이지',[m(0,'stress'),m(1,'z')]], 'hard':['하드',[m(0,'r')]],
    'right':['롸이트',[m(0,'r')]], 'wrong':['뤙',[m(0,'r')]],
    'free':['프뤼',[m(0,'f'),m(1,'r')]], 'late':['레이트',[m(0,'l')]], 'early':['얼리',[m(0,'stress'),m(0,'r'),m(1,'l')]],
    'long':['롱',[m(0,'l')]], 'short':['쇼트',[m(0,'sh'),m(0,'r')]],
    'go':['고우',[]], 'goes':['고우즈',[m(2,'z')]], 'going':['고잉',[]], 'went':['웬트',[]],
    'come':['컴',[]], 'came':['케임',[]], 'coming':['커밍',[m(0,'stress')]],
    'get':['겟',[]], 'got':['갓',[]], 'give':['기브',[m(1,'v')]],
    'take':['테이크',[]], 'took':['툭',[]], 'make':['메이크',[]], 'made':['메이드',[]],
    'see':['씨',[]], 'saw':['쏘',[]], 'look':['룩',[m(0,'l')]], 'watch':['워치',[]],
    'hear':['히어',[m(1,'r')]], 'listen':['리쓴',[m(0,'l'),m(0,'stress')]],
    'say':['쎄이',[]], 'said':['쎋',[]], 'tell':['텔',[m(0,'l')]], 'talk':['톡',[m(0,'l')]],
    'speak':['스픽',[]], 'ask':['애스크',[m(0,'ae')]], 'answer':['앤써',[m(0,'ae'),m(0,'stress'),m(1,'r')]],
    'know':['노우',[]], 'knew':['뉴',[]], 'think':['씽크',[m(0,'th')]],
    'want':['원트',[]], 'need':['니드',[]], 'like':['라이크',[m(0,'l')]],
    'love':['러브',[m(0,'l'),m(1,'v')]], 'hate':['헤이트',[]], 'hope':['호웁',[]],
    'try':['트롸이',[m(1,'r')]], 'help':['헬프',[m(0,'l')]], 'work':['워크',[m(0,'r')]],
    'study':['스터디',[m(1,'stress')]], 'learn':['런',[m(0,'l'),m(0,'r')]],
    'read':['뤼드',[m(0,'r')]], 'write':['롸이트',[m(0,'r')]], 'play':['플레이',[m(0,'l')]],
    'eat':['잇',[]], 'ate':['에이트',[]], 'drink':['드륑크',[m(1,'r')]],
    'cook':['쿡',[]], 'buy':['바이',[]], 'sell':['쎌',[m(0,'l')]], 'pay':['페이',[]],
    'open':['오우픈',[m(0,'stress')]], 'close':['클로우즈',[m(0,'l'),m(3,'z')]],
    'start':['스타트',[m(1,'r')]], 'stop':['스탑',[]], 'finish':['피니시',[m(0,'f'),m(0,'stress'),m(2,'sh')]],
    'wait':['웨이트',[]], 'meet':['밋',[]], 'call':['콜',[m(0,'l')]],
    'live':['리브',[m(0,'l'),m(1,'v')]], 'stay':['스테이',[]], 'leave':['리브',[m(0,'l'),m(1,'v')]],
    'walk':['웍',[]], 'run':['뤈',[m(0,'r')]], 'drive':['드롸이브',[m(1,'r'),m(3,'v')]],
    'sleep':['슬립',[m(0,'l')]], 'wake':['웨이크',[]], 'sit':['씻',[]], 'stand':['스탠드',[m(1,'ae')]],
    'find':['파인드',[m(0,'f')]], 'lose':['루즈',[m(0,'l'),m(1,'z')]], 'keep':['킵',[]],
    'put':['풋',[]], 'bring':['브륑',[m(1,'r')]], 'send':['쎈드',[]], 'use':['유즈',[m(1,'z')]],
    'water':['워러',[m(0,'stress'),m(1,'flap_t'),m(1,'r')]], 'coffee':['커피',[m(0,'stress'),m(1,'f')]],
    'tea':['티',[]], 'food':['푸드',[m(0,'f')]], 'rice':['롸이스',[m(0,'r')]],
    'bread':['브뤧',[m(1,'r')]], 'fish':['피시',[m(0,'f'),m(1,'sh')]], 'meat':['밋',[]],
    'apple':['애플',[m(0,'ae'),m(0,'stress'),m(1,'l')]], 'egg':['엑',[]], 'milk':['밀크',[m(0,'l')]],
    'lunch':['런치',[m(0,'l')]], 'dinner':['디너',[m(0,'stress'),m(1,'r')]],
    'book':['북',[]], 'school':['스쿨',[m(1,'l')]], 'class':['클래스',[m(0,'l'),m(1,'ae')]],
    'teacher':['티처',[m(0,'stress'),m(1,'r')]], 'student':['스투던트',[m(1,'stress')]],
    'friend':['프뤤드',[m(0,'f'),m(1,'r')]], 'family':['패멀리',[m(0,'f'),m(0,'ae'),m(0,'stress'),m(1,'l'),m(2,'l')]],
    'home':['호움',[]], 'house':['하우스',[]], 'room':['룸',[m(0,'r')]],
    'door':['도어',[m(1,'r')]], 'window':['윈도우',[m(0,'stress')]], 'car':['카',[m(0,'r')]],
    'bus':['버스',[]], 'train':['트뤠인',[m(1,'r')]], 'city':['씨리',[m(0,'stress'),m(1,'flap_t')]],
    'work.':['워크',[m(0,'r')]], 'money':['머니',[m(0,'stress')]], 'time':['타임',[]],
    'day':['데이',[]], 'week':['위크',[]], 'year':['이어',[m(1,'r')]],
    'morning':['모닝',[m(0,'stress'),m(0,'r')]], 'night':['나이트',[]],
    'phone':['포운',[m(0,'f')]], 'movie':['무비',[m(0,'stress'),m(1,'v')]],
    'music':['뮤직',[m(0,'stress'),m(1,'z')]], 'weather':['웨더',[m(0,'stress'),m(1,'dh'),m(1,'r')]],
    'rain':['뤠인',[m(0,'r')]], 'sun':['썬',[]], 'snow':['스노우',[]],
    'name':['네임',[]], 'people':['피플',[m(0,'stress'),m(1,'l')]], 'question':['퀘스천',[m(0,'stress')]],
    'problem':['프롸블럼',[m(1,'r'),m(1,'stress'),m(2,'l'),m(3,'l')]],
    'thank':['쌩크',[m(0,'th'),m(0,'ae')]], 'please':['플리즈',[m(1,'l'),m(1,'stress'),m(2,'z')]],
    'sorry':['쏘뤼',[m(0,'stress'),m(1,'r')]], 'yes':['예스',[]], 'no':['노우',[]],
    'one':['원',[]], 'two':['투',[]], 'three':['쓰뤼',[m(0,'th'),m(1,'r')]],
    'first':['펄스트',[m(0,'f'),m(0,'r')]], 'last':['래스트',[m(0,'l'),m(0,'ae')]],
    'next':['넥스트',[]], 'more':['모',[m(0,'r')]], 'most':['모우스트',[]],
    'many':['메니',[m(0,'stress')]], 'much':['머치',[]], 'some':['썸',[]], 'all':['올',[m(0,'l')]],
    'every':['에브뤼',[m(0,'stress'),m(1,'v'),m(2,'r')]], 'other':['어더',[m(0,'stress'),m(1,'dh'),m(1,'r')]],
    'thing':['씽',[m(0,'th')]], 'something':['썸씽',[m(0,'stress'),m(1,'th')]],
    'nothing':['너씽',[m(0,'stress'),m(1,'th')]], 'everything':['에브뤼씽',[m(0,'stress'),m(1,'v'),m(2,'r'),m(3,'th')]]
  };

  /* 사전에서 꺼낸다. enOverride 로 문장 부호를 붙인다 */
  function d(key, enOverride) {
    var e = D[key];
    if (!e) throw new Error('발음 사전에 없는 단어: ' + key);
    return { en: enOverride === undefined ? key : enOverride,
             hangul: e[0], marks: e[1] };
  }
  /* 사전에 없는 단어를 직접 적는다 */
  function x(en, hangul, marks, span) {
    var o = { en: en, hangul: hangul, marks: marks || [] };
    if (span) o.span = span;
    return o;
  }
  /* 연음 — 첫 단어에 span 을 주고, 흡수된 단어는 hangul null */
  function lz(en, hangul, marks, followers) {
    var out = [{ en: en, hangul: hangul, marks: marks || [], span: followers.length + 1 }];
    for (var i = 0; i < followers.length; i++) {
      out.push({ en: followers[i], hangul: null, marks: [] });
    }
    return out;
  }
  function flat(parts) {
    var out = [];
    for (var i = 0; i < parts.length; i++) {
      if (Object.prototype.toString.call(parts[i]) === '[object Array]') {
        for (var j = 0; j < parts[i].length; j++) out.push(parts[i][j]);
      } else out.push(parts[i]);
    }
    return out;
  }
  function s(id, en, parts, meaning, level, category) {
    S.push({ id: id, en: en, words: flat(parts),
             meaning: meaning, level: level, category: category });
  }

  /* ===== 스모크 확인용 기준 문장 (CG-1a) ===== */
  s('s0001','I want to go home.',
    [d('I'), lz('want','워너',[m(0,'stress')],['to']), d('go'), d('home','home.')],
    '나는 집에 가고 싶어.','intermediate','daily');
  s('s0002','What are you doing?',
    [lz('What','워러',[m(1,'flap_t'),m(1,'r')],['are']), d('you'), x('doing?','두잉',[m(0,'stress')])],
    '너 뭐 하고 있어?','intermediate','daily');
  s('s0003','She has a red car.',
    [d('she','She'), d('has'), d('a'), x('red','뤧',[m(0,'r')]), d('car','car.')],
    '그녀는 빨간 차를 가지고 있어.','beginner','daily');
  s('s0004',"I don't like coffee, but I love tea.",
    [d('I'), d("don't"), d('like'), d('coffee','coffee,'), d('but'), d('I'), d('love'), d('tea','tea.')],
    '나는 커피는 안 좋아하지만 차는 좋아해.','intermediate','food');
  s('s0005','The weather is very nice today.',
    [d('the','The'), d('weather'), d('is'), d('very'), d('nice'), d('today','today.')],
    '오늘 날씨가 아주 좋아.','intermediate','nature');
  s('s0006','Please turn off the light before you leave the room.',
    [d('please','Please'), x('turn','턴',[m(0,'r')]), d('off'), d('the'),
     x('light','라이트',[m(0,'l')]), d('before'), d('you'), d('leave'), d('the'), d('room','room.')],
    '방을 나가기 전에 불을 꺼 주세요.','advanced','daily');

  /* ===== daily — 일상 ===== */
  s('s0101','I am very tired today.',[d('I'),d('am'),d('very'),d('tired'),d('today','today.')],'나는 오늘 아주 피곤해.','beginner','daily');
  s('s0102','She goes to school every day.',[d('she','She'),d('goes'),d('to'),d('school'),d('every'),d('day','day.')],'그녀는 매일 학교에 간다.','beginner','daily');
  s('s0103','We live in a small house.',[d('we','We'),d('live'),d('in'),d('a'),d('small'),d('house','house.')],'우리는 작은 집에 산다.','beginner','daily');
  s('s0104','My friend is very kind.',[d('my','My'),d('friend'),d('is'),d('very'),x('kind.','카인드')],'내 친구는 아주 친절해.','beginner','daily');
  s('s0105','Please close the door.',[d('please','Please'),d('close'),d('the'),d('door','door.')],'문을 닫아 주세요.','beginner','daily');
  s('s0106','I have to work today.',[d('I'),lz('have','해프',[m(0,'ae'),m(1,'f')],['to']),d('work'),d('today','today.')],'나는 오늘 일해야 해.','intermediate','daily');
  s('s0107','Did you sleep well last night?',[lz('Did','디쥬',[],['you']),d('sleep'),x('well','웰',[m(0,'l')]),d('last'),x('night?','나이트')],'어젯밤 잘 잤어?','intermediate','daily');
  s('s0108','Let me help you with that.',[lz('Let','렘미',[m(0,'l')],['me']),d('help'),d('you'),d('with'),d('that','that.')],'그거 내가 도와줄게.','intermediate','daily');
  s('s0109','I got to go now.',[d('I'),lz('got','가라',[m(1,'flap_t')],['to']),d('go'),d('now','now.')],'나 이제 가야 해.','intermediate','daily');
  s('s0110','What time do you wake up?',[d('what','What'),d('time'),d('do'),d('you'),d('wake'),x('up?','업')],'너는 몇 시에 일어나?','intermediate','daily');
  s('s0111','The room is very clean.',[d('the','The'),d('room'),d('is'),d('very'),x('clean.','클린',[m(0,'l')])],'방이 아주 깨끗해.','beginner','daily');
  s('s0112','He walks to work every morning.',[d('he','He'),x('walks','웍스'),d('to'),d('work'),d('every'),d('morning','morning.')],'그는 매일 아침 걸어서 출근한다.','intermediate','daily');
  s('s0113','I will call you tomorrow.',[d('I'),d('will'),d('call'),d('you'),d('tomorrow','tomorrow.')],'내일 전화할게.','beginner','daily');
  s('s0114','This is my new phone.',[d('this','This'),d('is'),d('my'),d('new'),d('phone','phone.')],'이건 내 새 전화기야.','beginner','daily');
  s('s0115','Can you open the window?',[d('can','Can'),d('you'),d('open'),d('the'),x('window?','윈도우',[m(0,'stress')])],'창문 좀 열어 줄래?','beginner','daily');
  s('s0116','I need a lot of time.',[d('I'),d('need'),lz('a','얼라러',[m(1,'l'),m(2,'flap_t')],['lot','of']),d('time','time.')],'나는 시간이 많이 필요해.','advanced','daily');
  s('s0117','Would you like some water?',[lz('Would','우쥬',[],['you']),d('like'),d('some'),d('water','water?')],'물 좀 드릴까요?','intermediate','daily');
  s('s0118','My family lives in the city.',[d('my','My'),d('family'),x('lives','리브즈',[m(0,'l'),m(1,'v'),m(2,'z')]),d('in'),d('the'),d('city','city.')],'우리 가족은 도시에 산다.','intermediate','daily');
  s('s0119','I always read before I sleep.',[d('I'),d('always'),d('read'),d('before'),d('I'),d('sleep','sleep.')],'나는 자기 전에 항상 책을 읽는다.','intermediate','daily');
  s('s0120','The car is out of gas.',[d('the','The'),d('car'),d('is'),lz('out','아우러',[m(2,'flap_t')],['of']),x('gas.','개스',[m(0,'ae')])],'차에 기름이 떨어졌어.','advanced','daily');
  s('s0121','Give me a minute please.',[lz('Give','김미',[],['me']),d('a'),x('minute','미닛',[m(0,'stress')]),d('please','please.')],'잠깐만 기다려 주세요.','intermediate','daily');
  s('s0122','I do not know his name.',[d('I'),d('do'),d('not'),d('know'),d('his'),d('name','name.')],'나는 그의 이름을 모른다.','beginner','daily');
  s('s0123','She is talking on the phone.',[d('she','She'),d('is'),x('talking','토킹',[m(0,'stress'),m(0,'l')]),d('on'),d('the'),d('phone','phone.')],'그녀는 전화 통화 중이다.','intermediate','daily');
  s('s0124','We should leave early tomorrow.',[d('we','We'),d('should'),d('leave'),d('early'),d('tomorrow','tomorrow.')],'우리는 내일 일찍 떠나야 해.','intermediate','daily');
  s('s0125','It is too cold outside.',[d('it','It'),d('is'),d('too'),d('cold'),x('outside.','아웃싸이드',[m(2,'stress')])],'밖은 너무 추워.','beginner','daily');
  s('s0126','I like this room very much.',[d('I'),d('like'),d('this'),d('room'),d('very'),d('much','much.')],'나는 이 방이 아주 마음에 들어.','beginner','daily');
  s('s0127','Are you going to the party?',[d('are','Are'),d('you'),lz('going','고나',[],['to']),d('the'),x('party?','파리',[m(0,'stress'),m(0,'r'),m(1,'flap_t')])],'너 파티에 갈 거야?','advanced','daily');
  s('s0128','He never wakes up early.',[d('he','He'),x('never','네버',[m(0,'stress'),m(1,'v'),m(1,'r')]),x('wakes','웨익스'),x('up','업'),d('early','early.')],'그는 절대 일찍 일어나지 않는다.','intermediate','daily');
  s('s0129','The door is not open.',[d('the','The'),d('door'),d('is'),d('not'),d('open','open.')],'문이 열려 있지 않다.','beginner','daily');
  s('s0130','I will stay home this week.',[d('I'),d('will'),d('stay'),d('home'),d('this'),d('week','week.')],'나는 이번 주에 집에 있을 거야.','beginner','daily');

  /* ===== food — 음식 ===== */
  s('s0201','I want to eat some bread.',[d('I'),lz('want','워너',[m(0,'stress')],['to']),d('eat'),d('some'),d('bread','bread.')],'나는 빵을 좀 먹고 싶어.','intermediate','food');
  s('s0202','This coffee is very hot.',[d('this','This'),d('coffee'),d('is'),d('very'),d('hot','hot.')],'이 커피는 아주 뜨거워.','beginner','food');
  s('s0203','She cooks dinner every night.',[d('she','She'),x('cooks','쿡스'),d('dinner'),d('every'),d('night','night.')],'그녀는 매일 밤 저녁을 요리한다.','intermediate','food');
  s('s0204','I do not like fish.',[d('I'),d('do'),d('not'),d('like'),d('fish','fish.')],'나는 생선을 좋아하지 않는다.','beginner','food');
  s('s0205','We had rice for lunch.',[d('we','We'),d('had'),d('rice'),d('for'),d('lunch','lunch.')],'우리는 점심으로 밥을 먹었다.','beginner','food');
  s('s0206','Would you like more water?',[lz('Would','우쥬',[],['you']),d('like'),d('more'),d('water','water?')],'물 더 드릴까요?','intermediate','food');
  s('s0207','The apple tastes very sweet.',[d('the','The'),d('apple'),x('tastes','테이스츠'),d('very'),x('sweet.','스윗')],'그 사과는 아주 달다.','intermediate','food');
  s('s0208','I need to buy some milk.',[d('I'),d('need'),d('to'),d('buy'),d('some'),d('milk','milk.')],'우유를 좀 사야 해.','beginner','food');
  s('s0209','He drinks tea in the morning.',[d('he','He'),x('drinks','드륑크스',[m(1,'r')]),d('tea'),d('in'),d('the'),d('morning','morning.')],'그는 아침에 차를 마신다.','intermediate','food');
  s('s0210','This food is a kind of soup.',[d('this','This'),d('food'),d('is'),lz('a','어카인더',[],['kind','of']),x('soup.','숩')],'이 음식은 일종의 수프다.','advanced','food');
  s('s0211','Do you want some eggs?',[d('do','Do'),d('you'),d('want'),d('some'),x('eggs?','엑스')],'계란 좀 먹을래?','beginner','food');
  s('s0212','The meat is not fresh.',[d('the','The'),d('meat'),d('is'),d('not'),x('fresh.','프뤠시',[m(0,'f'),m(1,'r'),m(2,'sh')])],'고기가 신선하지 않다.','intermediate','food');
  s('s0213','I always eat breakfast at home.',[d('I'),d('always'),d('eat'),x('breakfast','브뤡퍼스트',[m(1,'r'),m(1,'stress'),m(2,'f')]),d('at'),d('home','home.')],'나는 항상 집에서 아침을 먹는다.','advanced','food');
  s('s0214','She has to cook tonight.',[d('she','She'),lz('has','해스',[m(0,'ae')],['to']),d('cook'),x('tonight.','터나이트',[m(1,'stress')])],'그녀는 오늘 밤 요리해야 한다.','intermediate','food');
  s('s0215','This is my favorite food.',[d('this','This'),d('is'),d('my'),x('favorite','페이버뤗',[m(0,'f'),m(0,'stress'),m(2,'v'),m(3,'r')]),d('food','food.')],'이건 내가 제일 좋아하는 음식이야.','intermediate','food');
  s('s0216','We ate lunch at a restaurant.',[d('we','We'),d('ate'),x('lunch','런치',[m(0,'l')]),d('at'),d('a'),x('restaurant.','뤠스터롼트',[m(0,'r'),m(0,'stress'),m(2,'r')])],'우리는 식당에서 점심을 먹었다.','advanced','food');
  s('s0217','I drink water every morning.',[d('I'),d('drink'),d('water'),d('every'),d('morning','morning.')],'나는 매일 아침 물을 마신다.','beginner','food');
  s('s0218','The soup needs more salt.',[d('the','The'),x('soup','숩'),x('needs','니즈',[m(1,'z')]),d('more'),x('salt.','쏠트',[m(0,'l')])],'수프에 소금이 더 필요해.','intermediate','food');
  s('s0219','He does not eat meat.',[d('he','He'),d('does'),d('not'),d('eat'),d('meat','meat.')],'그는 고기를 먹지 않는다.','beginner','food');
  s('s0220','Could you pass the bread?',[lz('Could','쿠쥬',[],['you']),x('pass','패스',[m(0,'ae')]),d('the'),x('bread?','브뤧',[m(1,'r')])],'빵 좀 건네줄래?','intermediate','food');

  /* ===== school — 학교·공부 ===== */
  s('s0301','I study English every day.',[d('I'),d('study'),x('English','잉글리시',[m(0,'stress'),m(1,'l'),m(2,'l'),m(3,'sh')]),d('every'),d('day','day.')],'나는 매일 영어를 공부한다.','intermediate','school');
  s('s0302','The teacher asked a question.',[d('the','The'),d('teacher'),x('asked','애스크트',[m(0,'ae')]),d('a'),d('question','question.')],'선생님이 질문을 하셨다.','intermediate','school');
  s('s0303','This book is very easy.',[d('this','This'),d('book'),d('is'),d('very'),d('easy','easy.')],'이 책은 아주 쉽다.','beginner','school');
  s('s0304','I have to finish my homework.',[d('I'),lz('have','해프',[m(0,'ae'),m(1,'f')],['to']),d('finish'),d('my'),x('homework.','호움워크',[m(0,'stress'),m(3,'r')])],'나는 숙제를 끝내야 한다.','advanced','school');
  s('s0305','She reads three books a week.',[d('she','She'),x('reads','뤼즈',[m(0,'r'),m(1,'z')]),d('three'),x('books','북스'),d('a'),d('week','week.')],'그녀는 일주일에 책 세 권을 읽는다.','intermediate','school');
  s('s0306','Did you finish the test?',[lz('Did','디쥬',[],['you']),d('finish'),d('the'),x('test?','테스트')],'시험 다 봤어?','intermediate','school');
  s('s0307','My class starts at nine.',[d('my','My'),d('class'),x('starts','스타츠',[m(1,'r')]),d('at'),x('nine.','나인')],'내 수업은 아홉 시에 시작한다.','intermediate','school');
  s('s0308','I want to learn more.',[d('I'),lz('want','워너',[m(0,'stress')],['to']),d('learn'),d('more','more.')],'나는 더 배우고 싶다.','intermediate','school');
  s('s0309','The students are very busy.',[d('the','The'),x('students','스투던츠',[m(1,'stress')]),d('are'),d('very'),d('busy','busy.')],'학생들이 아주 바쁘다.','intermediate','school');
  s('s0310','He writes very good essays.',[d('he','He'),x('writes','롸이츠',[m(0,'r')]),d('very'),d('good'),x('essays.','에쎄이즈',[m(0,'stress'),m(3,'z')])],'그는 아주 좋은 글을 쓴다.','advanced','school');
  s('s0311','I read a book every night.',[d('I'),d('read'),d('a'),d('book'),d('every'),d('night','night.')],'나는 매일 밤 책을 읽는다.','beginner','school');
  s('s0312','This question is too hard.',[d('this','This'),d('question'),d('is'),d('too'),d('hard','hard.')],'이 문제는 너무 어렵다.','beginner','school');
  s('s0313','We have a test tomorrow.',[d('we','We'),d('have'),d('a'),x('test','테스트'),d('tomorrow','tomorrow.')],'우리는 내일 시험이 있다.','beginner','school');
  s('s0314','The teacher speaks very slowly.',[d('the','The'),d('teacher'),x('speaks','스픽스'),d('very'),x('slowly.','슬로울리',[m(0,'stress'),m(0,'l'),m(2,'l'),m(3,'l')])],'선생님은 아주 천천히 말씀하신다.','advanced','school');
  s('s0315','I did not understand the lesson.',[d('I'),d('did'),d('not'),x('understand','언더스탠드',[m(1,'r'),m(3,'stress'),m(3,'ae')]),d('the'),x('lesson.','레쓴',[m(0,'l'),m(0,'stress')])],'나는 그 수업을 이해하지 못했다.','advanced','school');
  s('s0316','Study hard and you will pass.',[d('study','Study'),d('hard'),d('and'),d('you'),d('will'),x('pass.','패스',[m(0,'ae')])],'열심히 공부하면 통과할 거야.','intermediate','school');
  s('s0317','What did you learn today?',[d('what','What'),lz('did','디쥬',[],['you']),d('learn'),d('today','today?')],'오늘 뭘 배웠어?','intermediate','school');
  s('s0318','The class is about to start.',[d('the','The'),d('class'),d('is'),d('about'),d('to'),d('start','start.')],'수업이 곧 시작한다.','intermediate','school');
  s('s0319','I forgot my book at home.',[d('I'),x('forgot','퍼갓',[m(0,'f'),m(0,'r'),m(1,'stress')]),d('my'),d('book'),d('at'),d('home','home.')],'책을 집에 두고 왔어.','intermediate','school');
  s('s0320','She is the best student here.',[d('she','She'),d('is'),d('the'),x('best','베스트'),d('student'),d('here','here.')],'그녀가 여기서 최고의 학생이다.','intermediate','school');

  /* ===== work — 직장 ===== */
  s('s0401','I have a meeting at three.',[d('I'),d('have'),d('a'),x('meeting','미링',[m(0,'stress'),m(1,'flap_t')]),d('at'),d('three','three.')],'나는 세 시에 회의가 있다.','intermediate','work');
  s('s0402','He works at a big company.',[d('he','He'),x('works','워크스',[m(0,'r')]),d('at'),d('a'),d('big'),x('company.','컴퍼니',[m(0,'stress')])],'그는 큰 회사에서 일한다.','intermediate','work');
  s('s0403','Did you send the email?',[lz('Did','디쥬',[],['you']),d('send'),d('the'),x('email?','이메일',[m(1,'stress'),m(2,'l')])],'그 이메일 보냈어?','intermediate','work');
  s('s0404','I need to finish this today.',[d('I'),d('need'),d('to'),d('finish'),d('this'),d('today','today.')],'나는 오늘 이걸 끝내야 한다.','intermediate','work');
  s('s0405','The office opens at eight.',[d('the','The'),x('office','오피스',[m(0,'stress'),m(1,'f')]),x('opens','오우픈즈',[m(0,'stress'),m(3,'z')]),d('at'),x('eight.','에이트')],'사무실은 여덟 시에 연다.','intermediate','work');
  s('s0406','We have to work late tonight.',[d('we','We'),lz('have','해프',[m(0,'ae'),m(1,'f')],['to']),d('work'),d('late'),x('tonight.','터나이트',[m(1,'stress')])],'우리는 오늘 밤 늦게까지 일해야 한다.','advanced','work');
  s('s0407','She is a very good manager.',[d('she','She'),d('is'),d('a'),d('very'),d('good'),x('manager.','매니저',[m(0,'ae'),m(0,'stress'),m(2,'r')])],'그녀는 아주 훌륭한 관리자다.','advanced','work');
  s('s0408','I sort of like this job.',[d('I'),lz('sort','소러',[m(0,'r'),m(1,'flap_t')],['of']),d('like'),d('this'),x('job.','잡')],'나는 이 일이 좀 마음에 든다.','advanced','work');
  s('s0409','The meeting starts in ten minutes.',[d('the','The'),x('meeting','미링',[m(0,'stress'),m(1,'flap_t')]),x('starts','스타츠',[m(1,'r')]),d('in'),x('ten','텐'),x('minutes.','미닛츠',[m(0,'stress')])],'회의가 십 분 후에 시작한다.','advanced','work');
  s('s0410','Could you check this file?',[lz('Could','쿠쥬',[],['you']),x('check','첵'),d('this'),x('file?','파일',[m(0,'f'),m(1,'l')])],'이 파일 좀 확인해 줄래?','intermediate','work');
  s('s0411','I will call the client now.',[d('I'),d('will'),d('call'),d('the'),x('client','클라이언트',[m(0,'l'),m(0,'stress'),m(1,'l')]),d('now','now.')],'지금 고객에게 전화할게.','advanced','work');
  s('s0412','He is not in the office.',[d('he','He'),d('is'),d('not'),d('in'),d('the'),x('office.','오피스',[m(0,'stress'),m(1,'f')])],'그는 사무실에 없다.','intermediate','work');
  s('s0413','We need more time for this.',[d('we','We'),d('need'),d('more'),d('time'),d('for'),d('this','this.')],'우리는 이것에 시간이 더 필요하다.','beginner','work');
  s('s0414','The work is almost finished.',[d('the','The'),d('work'),d('is'),x('almost','올모우스트',[m(0,'stress'),m(0,'l')]),x('finished.','피니시트',[m(0,'f'),m(0,'stress'),m(2,'sh')])],'일이 거의 끝났다.','advanced','work');
  s('s0415','I ought to send that today.',[d('I'),lz('ought','오라',[m(1,'flap_t')],['to']),d('send'),d('that'),d('today','today.')],'나는 오늘 그걸 보내야 한다.','advanced','work');
  s('s0416','Please answer the phone.',[d('please','Please'),d('answer'),d('the'),d('phone','phone.')],'전화 좀 받아 주세요.','beginner','work');
  s('s0417','My boss wants to see me.',[d('my','My'),x('boss','보스'),lz('wants','원츠',[],['to']),d('see'),d('me','me.')],'상사가 나를 보자고 한다.','advanced','work');
  s('s0418','They work very hard every day.',[d('they','They'),d('work'),d('very'),d('hard'),d('every'),d('day','day.')],'그들은 매일 아주 열심히 일한다.','intermediate','work');
  s('s0419','I use this computer for work.',[d('I'),d('use'),d('this'),x('computer','컴퓨러',[m(1,'stress'),m(2,'flap_t'),m(2,'r')]),d('for'),d('work','work.')],'나는 일할 때 이 컴퓨터를 쓴다.','advanced','work');
  s('s0420','The problem is not easy.',[d('the','The'),d('problem'),d('is'),d('not'),d('easy','easy.')],'그 문제는 쉽지 않다.','intermediate','work');

  /* ===== travel — 여행 ===== */
  s('s0501','I want to travel this year.',[d('I'),lz('want','워너',[m(0,'stress')],['to']),x('travel','트뢔블',[m(1,'r'),m(1,'ae'),m(1,'stress'),m(2,'l')]),d('this'),d('year','year.')],'나는 올해 여행하고 싶다.','advanced','travel');
  s('s0502','The train leaves at six.',[d('the','The'),d('train'),x('leaves','리브즈',[m(0,'l'),m(1,'v'),m(2,'z')]),d('at'),x('six.','씩스')],'기차는 여섯 시에 떠난다.','intermediate','travel');
  s('s0503','We took a bus to the city.',[d('we','We'),d('took'),d('a'),d('bus'),d('to'),d('the'),d('city','city.')],'우리는 버스를 타고 도시에 갔다.','intermediate','travel');
  s('s0504','Where is the train station?',[d('where','Where'),d('is'),d('the'),d('train'),x('station?','스테이션',[m(1,'stress')])],'기차역이 어디예요?','intermediate','travel');
  s('s0505','I lost my passport yesterday.',[d('I'),x('lost','로스트',[m(0,'l')]),d('my'),x('passport','패스포트',[m(0,'ae'),m(0,'stress'),m(2,'r')]),d('yesterday','yesterday.')],'나는 어제 여권을 잃어버렸다.','advanced','travel');
  s('s0506','The hotel is near the beach.',[d('the','The'),x('hotel','호텔',[m(1,'stress')]),d('is'),x('near','니어',[m(1,'r')]),d('the'),x('beach.','비치')],'호텔은 해변 근처에 있다.','intermediate','travel');
  s('s0507','How long is the flight?',[d('how','How'),d('long'),d('is'),d('the'),x('flight?','플라이트',[m(0,'f'),m(0,'l')])],'비행 시간이 얼마나 되나요?','intermediate','travel');
  s('s0508','I am going to the airport.',[d('I'),d('am'),lz('going','고나',[],['to']),d('the'),x('airport.','에어포트',[m(0,'stress'),m(1,'r'),m(2,'r')])],'나는 공항에 가는 중이다.','advanced','travel');
  s('s0509','This road goes to the sea.',[d('this','This'),x('road','로우드',[m(0,'r')]),d('goes'),d('to'),d('the'),x('sea.','씨')],'이 길은 바다로 이어진다.','intermediate','travel');
  s('s0510','We stayed there for a week.',[d('we','We'),x('stayed','스테이드'),d('there'),d('for'),d('a'),d('week','week.')],'우리는 거기서 일주일 머물렀다.','intermediate','travel');
  s('s0511','The city is very beautiful.',[d('the','The'),d('city'),d('is'),d('very'),x('beautiful.','뷰리플',[m(0,'stress'),m(1,'flap_t'),m(2,'f'),m(2,'l')])],'그 도시는 아주 아름답다.','advanced','travel');
  s('s0512','Do you have a map?',[d('do','Do'),d('you'),d('have'),d('a'),x('map?','맵',[m(0,'ae')])],'지도 있으세요?','beginner','travel');
  s('s0513','I will drive to the mountain.',[d('I'),d('will'),d('drive'),d('to'),d('the'),x('mountain.','마운튼',[m(0,'stress')])],'나는 산까지 운전해서 갈 거야.','intermediate','travel');
  s('s0514','The bus was very late today.',[d('the','The'),d('bus'),d('was'),d('very'),d('late'),d('today','today.')],'버스가 오늘 아주 늦었다.','intermediate','travel');
  s('s0515','We are out of time.',[d('we','We'),d('are'),lz('out','아우러',[m(2,'flap_t')],['of']),d('time','time.')],'우리는 시간이 없다.','advanced','travel');
  s('s0516','I like to walk in the park.',[d('I'),d('like'),d('to'),d('walk'),d('in'),d('the'),x('park.','파크',[m(0,'r')])],'나는 공원에서 걷는 걸 좋아해.','intermediate','travel');
  s('s0517','That river is very long.',[d('that','That'),x('river','뤼버',[m(0,'r'),m(0,'stress'),m(1,'v'),m(1,'r')]),d('is'),d('very'),d('long','long.')],'저 강은 아주 길다.','intermediate','travel');
  s('s0518','Could you call a taxi?',[lz('Could','쿠쥬',[],['you']),d('call'),d('a'),x('taxi?','택씨',[m(0,'ae'),m(0,'stress')])],'택시 좀 불러 줄래요?','intermediate','travel');
  s('s0519','The island is far from here.',[d('the','The'),x('island','아일런드',[m(0,'stress'),m(1,'l'),m(2,'l')]),d('is'),x('far','파',[m(0,'f'),m(0,'r')]),d('from'),d('here','here.')],'그 섬은 여기서 멀다.','advanced','travel');
  s('s0520','I have to leave now.',[d('I'),lz('have','해프',[m(0,'ae'),m(1,'f')],['to']),d('leave'),d('now','now.')],'나는 지금 떠나야 한다.','intermediate','travel');

  /* ===== feeling — 감정·관계 ===== */
  s('s0601','I am very happy today.',[d('I'),d('am'),d('very'),d('happy'),d('today','today.')],'나는 오늘 아주 행복하다.','beginner','feeling');
  s('s0602','She looks a little sad.',[d('she','She'),x('looks','룩스',[m(0,'l')]),d('a'),x('little','리를',[m(0,'l'),m(0,'stress'),m(1,'flap_t'),m(1,'l')]),d('sad','sad.')],'그녀는 조금 슬퍼 보인다.','advanced','feeling');
  s('s0603','I love my family very much.',[d('I'),d('love'),d('my'),d('family'),d('very'),d('much','much.')],'나는 우리 가족을 아주 사랑한다.','intermediate','feeling');
  s('s0604','Thank you for your help.',[d('thank','Thank'),d('you'),d('for'),d('your'),x('help.','헬프',[m(0,'l')])],'도와줘서 고마워요.','beginner','feeling');
  s('s0605','I am sorry about that.',[d('I'),d('am'),d('sorry'),d('about'),d('that','that.')],'그건 미안해요.','beginner','feeling');
  s('s0606','He is kind of shy.',[d('he','He'),d('is'),lz('kind','카인더',[],['of']),x('shy.','샤이',[m(0,'sh')])],'그는 좀 수줍어한다.','intermediate','feeling');
  s('s0607','Do not worry about it.',[d('do','Do'),d('not'),x('worry','워뤼',[m(0,'stress'),m(0,'r'),m(1,'r')]),d('about'),d('it','it.')],'그건 걱정하지 마.','intermediate','feeling');
  s('s0608','I really miss my friend.',[d('I'),d('really'),x('miss','미스'),d('my'),d('friend','friend.')],'나는 친구가 정말 그립다.','intermediate','feeling');
  s('s0609','She was very angry with me.',[d('she','She'),d('was'),d('very'),x('angry','앵그뤼',[m(0,'ae'),m(0,'stress'),m(2,'r')]),d('with'),d('me','me.')],'그녀는 나에게 아주 화가 났었다.','advanced','feeling');
  s('s0610','We are all very tired.',[d('we','We'),d('are'),d('all'),d('very'),d('tired','tired.')],'우리 모두 아주 피곤하다.','beginner','feeling');
  s('s0611','I hope you feel better soon.',[d('I'),d('hope'),d('you'),x('feel','필',[m(0,'f'),m(0,'l')]),x('better','베러',[m(0,'stress'),m(1,'flap_t'),m(1,'r')]),x('soon.','쑨')],'곧 나아지길 바라.','advanced','feeling');
  s('s0612','He does not like loud music.',[d('he','He'),d('does'),d('not'),d('like'),x('loud','라우드',[m(0,'l')]),d('music','music.')],'그는 시끄러운 음악을 좋아하지 않는다.','advanced','feeling');
  s('s0613','My mother is very kind.',[d('my','My'),x('mother','머더',[m(0,'stress'),m(1,'dh'),m(1,'r')]),d('is'),d('very'),x('kind.','카인드')],'우리 어머니는 아주 다정하시다.','intermediate','feeling');
  s('s0614','Do not you like this song?',[d('do','Do'),d('not'),d('you'),d('like'),d('this'),x('song?','쏭')],'너 이 노래 안 좋아해?','intermediate','feeling');
  s('s0615','I feel much better now.',[d('I'),x('feel','필',[m(0,'f'),m(0,'l')]),d('much'),x('better','베러',[m(0,'stress'),m(1,'flap_t'),m(1,'r')]),d('now','now.')],'나는 지금 훨씬 나아졌다.','intermediate','feeling');
  s('s0616','They are very good friends.',[d('they','They'),d('are'),d('very'),d('good'),x('friends.','프뤤즈',[m(0,'f'),m(1,'r'),m(2,'z')])],'그들은 아주 좋은 친구들이다.','intermediate','feeling');
  s('s0617','She never says she is tired.',[d('she','She'),x('never','네버',[m(0,'stress'),m(1,'v'),m(1,'r')]),x('says','쎄즈',[m(1,'z')]),d('she'),d('is'),d('tired','tired.')],'그녀는 피곤하다는 말을 절대 하지 않는다.','advanced','feeling');
  s('s0618','I want to see you again.',[d('I'),lz('want','워너',[m(0,'stress')],['to']),d('see'),d('you'),d('again','again.')],'너를 다시 보고 싶어.','intermediate','feeling');
  s('s0619','He is always very polite.',[d('he','He'),d('is'),d('always'),d('very'),x('polite.','펄라이트',[m(1,'stress'),m(1,'l')])],'그는 언제나 아주 예의 바르다.','advanced','feeling');
  s('s0620','Let me know how you feel.',[lz('Let','렘미',[m(0,'l')],['me']),d('know'),d('how'),d('you'),x('feel.','필',[m(0,'f'),m(0,'l')])],'네 기분이 어떤지 알려 줘.','advanced','feeling');

  /* ===== tech — 기술·IT ===== */
  s('s0701','My computer is very slow.',[d('my','My'),x('computer','컴퓨러',[m(1,'stress'),m(2,'flap_t'),m(2,'r')]),d('is'),d('very'),x('slow.','슬로우',[m(0,'l')])],'내 컴퓨터가 아주 느리다.','advanced','tech');
  s('s0702','Please save the file now.',[d('please','Please'),x('save','쎄이브',[m(2,'v')]),d('the'),x('file','파일',[m(0,'f'),m(1,'l')]),d('now','now.')],'지금 파일을 저장해 주세요.','intermediate','tech');
  s('s0703','Did you send me the link?',[lz('Did','디쥬',[],['you']),d('send'),d('me'),d('the'),x('link?','링크',[m(0,'l')])],'나한테 링크 보냈어?','intermediate','tech');
  s('s0704','The screen is too small.',[d('the','The'),x('screen','스크륀',[m(2,'r')]),d('is'),d('too'),d('small','small.')],'화면이 너무 작다.','intermediate','tech');
  s('s0705','I have to update this app.',[d('I'),lz('have','해프',[m(0,'ae'),m(1,'f')],['to']),x('update','업데이트',[m(1,'stress')]),d('this'),x('app.','앱',[m(0,'ae')])],'이 앱을 업데이트해야 한다.','advanced','tech');
  s('s0706','The internet is not working.',[d('the','The'),x('internet','인터넷',[m(0,'stress'),m(1,'r')]),d('is'),d('not'),x('working.','워킹',[m(0,'stress'),m(0,'r')])],'인터넷이 안 된다.','advanced','tech');
  s('s0707','Can you fix my phone?',[d('can','Can'),d('you'),x('fix','픽스',[m(0,'f')]),d('my'),x('phone?','포운',[m(0,'f')])],'내 전화기 고쳐 줄 수 있어?','intermediate','tech');
  s('s0708','I use this program every day.',[d('I'),d('use'),d('this'),x('program','프로우그뢤',[m(1,'r'),m(1,'stress'),m(3,'r'),m(3,'ae')]),d('every'),d('day','day.')],'나는 매일 이 프로그램을 쓴다.','advanced','tech');
  s('s0709','The battery is almost dead.',[d('the','The'),x('battery','배러뤼',[m(0,'ae'),m(0,'stress'),m(1,'flap_t'),m(2,'r')]),d('is'),x('almost','올모우스트',[m(0,'stress'),m(0,'l')]),x('dead.','뎃')],'배터리가 거의 다 됐다.','advanced','tech');
  s('s0710','Would you like to download it?',[lz('Would','우쥬',[],['you']),d('like'),d('to'),x('download','다운로우드',[m(0,'stress'),m(2,'l')]),d('it','it?')],'그거 내려받으시겠어요?','advanced','tech');
  s('s0711','I will send you the file.',[d('I'),d('will'),d('send'),d('you'),d('the'),x('file.','파일',[m(0,'f'),m(1,'l')])],'파일을 보내 줄게.','intermediate','tech');
  s('s0712','This game is really fun.',[d('this','This'),x('game','게임'),d('is'),d('really'),x('fun.','펀',[m(0,'f')])],'이 게임 정말 재미있다.','intermediate','tech');
  s('s0713','The code has a small bug.',[d('the','The'),x('code','코우드'),d('has'),d('a'),d('small'),x('bug.','벅')],'그 코드에 작은 오류가 있다.','intermediate','tech');
  s('s0714','I need a new keyboard.',[d('I'),d('need'),d('a'),d('new'),x('keyboard.','키보드',[m(0,'stress'),m(2,'r')])],'새 자판이 필요하다.','intermediate','tech');
  s('s0715','Please click the button here.',[d('please','Please'),x('click','클릭',[m(0,'l')]),d('the'),x('button','버튼',[m(0,'stress')]),d('here','here.')],'여기 단추를 눌러 주세요.','intermediate','tech');
  s('s0716','My phone is out of memory.',[d('my','My'),x('phone','포운',[m(0,'f')]),d('is'),lz('out','아우러',[m(2,'flap_t')],['of']),x('memory.','메머뤼',[m(0,'stress'),m(2,'r')])],'내 전화기에 저장 공간이 없다.','advanced','tech');
  s('s0717','The website is very useful.',[d('the','The'),x('website','웹싸이트',[m(0,'stress')]),d('is'),d('very'),x('useful.','유스플',[m(0,'stress'),m(2,'f'),m(2,'l')])],'그 웹사이트는 아주 유용하다.','advanced','tech');
  s('s0718','I forgot my password again.',[d('I'),x('forgot','퍼갓',[m(0,'f'),m(0,'r'),m(1,'stress')]),d('my'),x('password','패스월드',[m(0,'ae'),m(0,'stress'),m(2,'r')]),d('again','again.')],'또 비밀번호를 잊어버렸다.','advanced','tech');
  s('s0719','This machine does not work.',[d('this','This'),x('machine','머신',[m(1,'stress'),m(1,'sh')]),d('does'),d('not'),d('work','work.')],'이 기계는 작동하지 않는다.','advanced','tech');
  s('s0720','Let me check the settings.',[lz('Let','렘미',[m(0,'l')],['me']),x('check','첵'),d('the'),x('settings.','쎄링즈',[m(0,'stress'),m(1,'flap_t'),m(2,'z')])],'설정을 확인해 볼게.','advanced','tech');

  /* ===== nature — 자연·날씨 ===== */
  s('s0801','The sun is very bright today.',[d('the','The'),x('sun','썬'),d('is'),d('very'),x('bright','브롸이트',[m(1,'r')]),d('today','today.')],'오늘 해가 아주 밝다.','intermediate','nature');
  s('s0802','It will rain this afternoon.',[d('it','It'),d('will'),d('rain'),d('this'),x('afternoon.','애프터눈',[m(0,'ae'),m(1,'f'),m(2,'r'),m(3,'stress')])],'오늘 오후에 비가 올 것이다.','advanced','nature');
  s('s0803','I saw a bird in the tree.',[d('I'),d('saw'),d('a'),x('bird','버드',[m(0,'r')]),d('in'),d('the'),x('tree.','트뤼',[m(1,'r')])],'나무에서 새를 봤다.','intermediate','nature');
  s('s0804','The weather is getting cold.',[d('the','The'),d('weather'),d('is'),x('getting','게링',[m(0,'stress'),m(1,'flap_t')]),d('cold','cold.')],'날씨가 추워지고 있다.','advanced','nature');
  s('s0805','Look at those beautiful flowers.',[d('look','Look'),d('at'),d('those'),x('beautiful','뷰리플',[m(0,'stress'),m(1,'flap_t'),m(2,'f'),m(2,'l')]),x('flowers.','플라워즈',[m(0,'f'),m(0,'l'),m(2,'r'),m(3,'z')])],'저 아름다운 꽃들을 봐.','advanced','nature');
  s('s0806','The snow is very deep here.',[d('the','The'),x('snow','스노우'),d('is'),d('very'),x('deep','딥'),d('here','here.')],'여기 눈이 아주 깊다.','intermediate','nature');
  s('s0807','I like to watch the stars.',[d('I'),d('like'),d('to'),d('watch'),d('the'),x('stars.','스타즈',[m(1,'r'),m(2,'z')])],'나는 별 보는 걸 좋아한다.','intermediate','nature');
  s('s0808','The wind is very strong today.',[d('the','The'),x('wind','윈드'),d('is'),d('very'),x('strong','스트뤙',[m(2,'r')]),d('today','today.')],'오늘 바람이 아주 세다.','advanced','nature');
  s('s0809','A lot of birds live here.',[lz('A','얼라러',[m(1,'l'),m(2,'flap_t')],['lot','of']),x('birds','버즈',[m(0,'r'),m(1,'z')]),d('live'),d('here','here.')],'많은 새들이 여기 산다.','advanced','nature');
  s('s0810','The river runs to the sea.',[d('the','The'),x('river','뤼버',[m(0,'r'),m(0,'stress'),m(1,'v'),m(1,'r')]),x('runs','뤈즈',[m(0,'r'),m(1,'z')]),d('to'),d('the'),x('sea.','씨')],'강은 바다로 흐른다.','advanced','nature');
  s('s0811','I love the sound of rain.',[d('I'),d('love'),d('the'),x('sound','싸운드'),d('of'),d('rain','rain.')],'나는 빗소리를 좋아한다.','intermediate','nature');
  s('s0812','The garden is full of flowers.',[d('the','The'),x('garden','가든',[m(0,'stress'),m(0,'r')]),d('is'),x('full','풀',[m(0,'f'),m(0,'l')]),d('of'),x('flowers.','플라워즈',[m(0,'f'),m(0,'l'),m(2,'r'),m(3,'z')])],'정원이 꽃으로 가득하다.','advanced','nature');
  s('s0813','That mountain is very high.',[d('that','That'),x('mountain','마운튼',[m(0,'stress')]),d('is'),d('very'),x('high.','하이')],'저 산은 아주 높다.','intermediate','nature');
  s('s0814','The sky is clear tonight.',[d('the','The'),x('sky','스카이'),d('is'),x('clear','클리어',[m(0,'l'),m(1,'l'),m(2,'r')]),x('tonight.','터나이트',[m(1,'stress')])],'오늘 밤 하늘이 맑다.','advanced','nature');
  s('s0815','We saw a big fish in the lake.',[d('we','We'),d('saw'),d('a'),d('big'),d('fish'),d('in'),d('the'),x('lake.','레이크',[m(0,'l')])],'우리는 호수에서 큰 물고기를 봤다.','advanced','nature');
  s('s0816','The leaves are turning red.',[d('the','The'),x('leaves','리브즈',[m(0,'l'),m(1,'v'),m(2,'z')]),d('are'),x('turning','터닝',[m(0,'stress'),m(0,'r')]),x('red.','뤧',[m(0,'r')])],'잎이 빨갛게 물들고 있다.','advanced','nature');
  s('s0817','It is a beautiful day.',[d('it','It'),d('is'),d('a'),x('beautiful','뷰리플',[m(0,'stress'),m(1,'flap_t'),m(2,'f'),m(2,'l')]),d('day','day.')],'아름다운 날이다.','intermediate','nature');
  s('s0818','I want to see the ocean.',[d('I'),lz('want','워너',[m(0,'stress')],['to']),d('see'),d('the'),x('ocean.','오우션',[m(0,'stress'),m(2,'sh')])],'나는 바다를 보고 싶다.','advanced','nature');
  s('s0819','The trees are very old here.',[d('the','The'),x('trees','트뤼즈',[m(1,'r'),m(2,'z')]),d('are'),d('very'),d('old'),d('here','here.')],'여기 나무들은 아주 오래됐다.','intermediate','nature');
  s('s0820','What are those animals doing?',[lz('What','워러',[m(1,'flap_t'),m(1,'r')],['are']),d('those'),x('animals','애너믈즈',[m(0,'ae'),m(0,'stress'),m(2,'l'),m(3,'z')]),x('doing?','두잉',[m(0,'stress')])],'저 동물들은 뭘 하고 있어?','advanced','nature');

  /* ===== 보충 (초급 중심) ===== */
  s('s0901','I am a student.',[d('I'),d('am'),d('a'),d('student','student.')],'나는 학생이다.','beginner','school');
  s('s0902','She is my friend.',[d('she','She'),d('is'),d('my'),d('friend','friend.')],'그녀는 내 친구다.','beginner','feeling');
  s('s0903','This is a big house.',[d('this','This'),d('is'),d('a'),d('big'),d('house','house.')],'이건 큰 집이다.','beginner','daily');
  s('s0904','He has a new car.',[d('he','He'),d('has'),d('a'),d('new'),d('car','car.')],'그는 새 차가 있다.','beginner','travel');
  s('s0905','We go to school.',[d('we','We'),d('go'),d('to'),d('school','school.')],'우리는 학교에 간다.','beginner','school');
  s('s0906','They live in the city.',[d('they','They'),d('live'),d('in'),d('the'),d('city','city.')],'그들은 도시에 산다.','beginner','travel');
  s('s0907','I like hot coffee.',[d('I'),d('like'),d('hot'),d('coffee','coffee.')],'나는 뜨거운 커피를 좋아한다.','beginner','food');
  s('s0908','The book is very good.',[d('the','The'),d('book'),d('is'),d('very'),d('good','good.')],'그 책은 아주 좋다.','beginner','school');
  s('s0909','My room is small.',[d('my','My'),d('room'),d('is'),d('small','small.')],'내 방은 작다.','beginner','daily');
  s('s0910','I read every night.',[d('I'),d('read'),d('every'),d('night','night.')],'나는 매일 밤 읽는다.','beginner','school');
  s('s0911','She works very hard.',[d('she','She'),x('works','워크스',[m(0,'r')]),d('very'),d('hard','hard.')],'그녀는 아주 열심히 일한다.','beginner','work');
  s('s0912','We eat rice for lunch.',[d('we','We'),d('eat'),d('rice'),d('for'),d('lunch','lunch.')],'우리는 점심으로 밥을 먹는다.','beginner','food');
  s('s0913','The water is cold.',[d('the','The'),d('water'),d('is'),d('cold','cold.')],'물이 차갑다.','beginner','food');
  s('s0914','I have two friends.',[d('I'),d('have'),d('two'),x('friends.','프뤤즈',[m(0,'f'),m(1,'r'),m(2,'z')])],'나는 친구가 둘 있다.','beginner','feeling');
  s('s0915','He is very busy today.',[d('he','He'),d('is'),d('very'),d('busy'),d('today','today.')],'그는 오늘 아주 바쁘다.','beginner','work');
  s('s0916','Open the window please.',[d('open','Open'),d('the'),x('window','윈도우',[m(0,'stress')]),d('please','please.')],'창문 좀 열어 주세요.','beginner','daily');
  s('s0917','I want more time.',[d('I'),d('want'),d('more'),d('time','time.')],'나는 시간이 더 필요하다.','beginner','daily');
  s('s0918','The sun is hot.',[d('the','The'),x('sun','썬'),d('is'),d('hot','hot.')],'해가 뜨겁다.','beginner','nature');
  s('s0919','She has a small dog.',[d('she','She'),d('has'),d('a'),d('small'),x('dog.','독')],'그녀는 작은 개가 있다.','beginner','nature');
  s('s0920','I love my family.',[d('I'),d('love'),d('my'),d('family','family.')],'나는 내 가족을 사랑한다.','beginner','feeling');
  s('s0921','We need new books.',[d('we','We'),d('need'),d('new'),x('books.','북스')],'우리는 새 책이 필요하다.','beginner','school');
  s('s0922','He goes home early.',[d('he','He'),d('goes'),d('home'),d('early','early.')],'그는 일찍 집에 간다.','beginner','daily');
  s('s0923','The class is easy.',[d('the','The'),d('class'),d('is'),d('easy','easy.')],'그 수업은 쉽다.','beginner','school');
  s('s0924','I can see the sea.',[d('I'),d('can'),d('see'),d('the'),x('sea.','씨')],'나는 바다가 보인다.','beginner','travel');
  s('s0925','They are very happy.',[d('they','They'),d('are'),d('very'),d('happy','happy.')],'그들은 아주 행복하다.','beginner','feeling');
  s('s0926','My phone is new.',[d('my','My'),d('phone'),d('is'),d('new','new.')],'내 전화기는 새것이다.','beginner','tech');
  s('s0927','I work in a big city.',[d('I'),d('work'),d('in'),d('a'),d('big'),d('city','city.')],'나는 큰 도시에서 일한다.','beginner','work');
  s('s0928','The food is very good.',[d('the','The'),d('food'),d('is'),d('very'),d('good','good.')],'음식이 아주 좋다.','beginner','food');
  s('s0929','She reads many books.',[d('she','She'),x('reads','뤼즈',[m(0,'r'),m(1,'z')]),d('many'),x('books.','북스')],'그녀는 책을 많이 읽는다.','beginner','school');
  s('s0930','We stay at home.',[d('we','We'),d('stay'),d('at'),d('home','home.')],'우리는 집에 있다.','beginner','daily');
  s('s0931','I drink tea every morning.',[d('I'),d('drink'),d('tea'),d('every'),d('morning','morning.')],'나는 매일 아침 차를 마신다.','beginner','food');
  s('s0932','The car is very fast.',[d('the','The'),d('car'),d('is'),d('very'),x('fast.','패스트',[m(0,'f'),m(0,'ae')])],'그 차는 아주 빠르다.','beginner','travel');
  s('s0933','He can speak English.',[d('he','He'),d('can'),d('speak'),x('English.','잉글리시',[m(0,'stress'),m(1,'l'),m(2,'l'),m(3,'sh')])],'그는 영어를 할 수 있다.','beginner','school');
  s('s0934','I need some water.',[d('I'),d('need'),d('some'),d('water','water.')],'나는 물이 좀 필요하다.','beginner','food');
  s('s0935','The door is open.',[d('the','The'),d('door'),d('is'),d('open','open.')],'문이 열려 있다.','beginner','daily');
  s('s0936','She is a good teacher.',[d('she','She'),d('is'),d('a'),d('good'),d('teacher','teacher.')],'그녀는 좋은 선생님이다.','beginner','school');
  s('s0937','We watch a movie tonight.',[d('we','We'),d('watch'),d('a'),d('movie'),x('tonight.','터나이트',[m(1,'stress')])],'우리는 오늘 밤 영화를 본다.','intermediate','daily');
  s('s0938','I keep my money here.',[d('I'),d('keep'),d('my'),d('money'),d('here','here.')],'나는 돈을 여기 둔다.','beginner','work');
  s('s0939','The bus is very slow.',[d('the','The'),d('bus'),d('is'),d('very'),x('slow.','슬로우',[m(0,'l')])],'버스가 아주 느리다.','beginner','travel');
  s('s0940','He likes cold water.',[d('he','He'),x('likes','라익스',[m(0,'l')]),d('cold'),d('water','water.')],'그는 찬물을 좋아한다.','beginner','food');
  s('s0941','I will learn more.',[d('I'),d('will'),d('learn'),d('more','more.')],'나는 더 배울 것이다.','beginner','school');
  s('s0942','The people are very kind.',[d('the','The'),d('people'),d('are'),d('very'),x('kind.','카인드')],'사람들이 아주 친절하다.','intermediate','feeling');
  s('s0943','She came home late.',[d('she','She'),d('came'),d('home'),d('late','late.')],'그녀는 늦게 집에 왔다.','beginner','daily');
  s('s0944','I made this for you.',[d('I'),d('made'),d('this'),d('for'),d('you','you.')],'이거 널 위해 만들었어.','beginner','feeling');
  s('s0945','We took the train.',[d('we','We'),d('took'),d('the'),d('train','train.')],'우리는 기차를 탔다.','beginner','travel');
  s('s0946','The night is very long.',[d('the','The'),d('night'),d('is'),d('very'),d('long','long.')],'밤이 아주 길다.','beginner','nature');
  s('s0947','He said something nice.',[d('he','He'),d('said'),d('something'),d('nice','nice.')],'그는 좋은 말을 했다.','intermediate','feeling');
  s('s0948','I know nothing about it.',[d('I'),d('know'),d('nothing'),d('about'),d('it','it.')],'나는 그것에 대해 아무것도 모른다.','intermediate','daily');
  s('s0949','She gave me a book.',[d('she','She'),x('gave','게이브',[m(2,'v')]),d('me'),d('a'),d('book','book.')],'그녀가 나에게 책을 주었다.','intermediate','school');
  s('s0950','They will come tomorrow.',[d('they','They'),d('will'),d('come'),d('tomorrow','tomorrow.')],'그들은 내일 올 것이다.','beginner','daily');
  s('s0951','I put the book there.',[d('I'),d('put'),d('the'),d('book'),d('there','there.')],'나는 책을 거기 두었다.','beginner','school');
  s('s0952','The apple is very sweet.',[d('the','The'),d('apple'),d('is'),d('very'),x('sweet.','스윗')],'그 사과는 아주 달다.','beginner','food');
  s('s0953','He works with my friend.',[d('he','He'),x('works','워크스',[m(0,'r')]),d('with'),d('my'),d('friend','friend.')],'그는 내 친구와 함께 일한다.','intermediate','work');
  s('s0954','I want to go there.',[d('I'),lz('want','워너',[m(0,'stress')],['to']),d('go'),d('there','there.')],'나는 거기 가고 싶다.','intermediate','travel');
  s('s0955','We are all very busy.',[d('we','We'),d('are'),d('all'),d('very'),d('busy','busy.')],'우리 모두 아주 바쁘다.','beginner','work');
  s('s0956','She never eats meat.',[d('she','She'),x('never','네버',[m(0,'stress'),m(1,'v'),m(1,'r')]),x('eats','잇츠'),d('meat','meat.')],'그녀는 고기를 절대 먹지 않는다.','intermediate','food');
  s('s0957','The room is very hot.',[d('the','The'),d('room'),d('is'),d('very'),d('hot','hot.')],'방이 아주 덥다.','beginner','daily');
  s('s0958','I often walk to work.',[d('I'),d('often'),d('walk'),d('to'),d('work','work.')],'나는 자주 걸어서 출근한다.','intermediate','work');
  s('s0959','He is not at home.',[d('he','He'),d('is'),d('not'),d('at'),d('home','home.')],'그는 집에 없다.','beginner','daily');
  s('s0960','We had a great time.',[d('we','We'),d('had'),d('a'),d('great'),d('time','time.')],'우리는 아주 즐거운 시간을 보냈다.','intermediate','feeling');
  s('s0961','I use my phone every day.',[d('I'),d('use'),d('my'),d('phone'),d('every'),d('day','day.')],'나는 매일 전화기를 쓴다.','intermediate','tech');
  s('s0962','The music is too loud.',[d('the','The'),d('music'),d('is'),d('too'),x('loud.','라우드',[m(0,'l')])],'음악이 너무 시끄럽다.','intermediate','feeling');
  s('s0963','She asked a good question.',[d('she','She'),x('asked','애스크트',[m(0,'ae')]),d('a'),d('good'),d('question','question.')],'그녀는 좋은 질문을 했다.','intermediate','school');
  s('s0964','I saw him this morning.',[d('I'),d('saw'),d('him'),d('this'),d('morning','morning.')],'나는 오늘 아침 그를 봤다.','beginner','daily');
  s('s0965','They eat dinner together.',[d('they','They'),d('eat'),d('dinner'),x('together.','터게더',[m(1,'stress'),m(2,'dh'),m(2,'r')])],'그들은 함께 저녁을 먹는다.','intermediate','food');
  s('s0966','The weather is very cold.',[d('the','The'),d('weather'),d('is'),d('very'),d('cold','cold.')],'날씨가 아주 춥다.','intermediate','nature');
  s('s0967','I will send it today.',[d('I'),d('will'),d('send'),d('it'),d('today','today.')],'오늘 그것을 보낼게.','beginner','work');
  s('s0968','He always helps me.',[d('he','He'),d('always'),x('helps','헬프스',[m(0,'l')]),d('me','me.')],'그는 항상 나를 도와준다.','intermediate','feeling');
  s('s0969','We meet every week.',[d('we','We'),d('meet'),d('every'),d('week','week.')],'우리는 매주 만난다.','beginner','feeling');
  s('s0970','The city is very big.',[d('the','The'),d('city'),d('is'),d('very'),d('big','big.')],'그 도시는 아주 크다.','beginner','travel');
  s('s0971','I like this song very much.',[d('I'),d('like'),d('this'),x('song','쏭'),d('very'),d('much','much.')],'나는 이 노래가 아주 좋다.','intermediate','feeling');
  s('s0972','She wants to study English.',[d('she','She'),lz('wants','원츠',[],['to']),d('study'),x('English.','잉글리시',[m(0,'stress'),m(1,'l'),m(2,'l'),m(3,'sh')])],'그녀는 영어를 공부하고 싶어 한다.','advanced','school');
  s('s0973','The train is always late.',[d('the','The'),d('train'),d('is'),d('always'),d('late','late.')],'그 기차는 항상 늦는다.','intermediate','travel');
  s('s0974','I have some good news.',[d('I'),d('have'),d('some'),d('good'),x('news.','뉴즈',[m(1,'z')])],'좋은 소식이 있어.','intermediate','daily');
  s('s0975','He does not know me.',[d('he','He'),d('does'),d('not'),d('know'),d('me','me.')],'그는 나를 모른다.','beginner','feeling');
  s('s0976','We will start at nine.',[d('we','We'),d('will'),d('start'),d('at'),x('nine.','나인')],'우리는 아홉 시에 시작할 것이다.','intermediate','work');
  s('s0977','The teacher is very busy.',[d('the','The'),d('teacher'),d('is'),d('very'),d('busy','busy.')],'선생님은 아주 바쁘시다.','intermediate','school');
  s('s0978','I want a cup of coffee.',[d('I'),d('want'),d('a'),x('cup','컵'),d('of'),d('coffee','coffee.')],'커피 한 잔 마시고 싶다.','intermediate','food');
  s('s0979','She is reading a book.',[d('she','She'),d('is'),x('reading','뤼딩',[m(0,'r'),m(0,'stress')]),d('a'),d('book','book.')],'그녀는 책을 읽고 있다.','intermediate','school');
  s('s0980','They came here last year.',[d('they','They'),d('came'),d('here'),d('last'),d('year','year.')],'그들은 작년에 여기 왔다.','intermediate','travel');
  s('s0981','I do not have much time.',[d('I'),d('do'),d('not'),d('have'),d('much'),d('time','time.')],'나는 시간이 많지 않다.','intermediate','daily');
  s('s0982','The work is very hard.',[d('the','The'),d('work'),d('is'),d('very'),d('hard','hard.')],'그 일은 아주 힘들다.','beginner','work');
  s('s0983','He will call you later.',[d('he','He'),d('will'),d('call'),d('you'),x('later.','레이러',[m(0,'l'),m(0,'stress'),m(2,'flap_t'),m(2,'r')])],'그가 나중에 전화할 거야.','advanced','daily');
  s('s0984','We need to finish this.',[d('we','We'),d('need'),d('to'),d('finish'),d('this','this.')],'우리는 이것을 끝내야 한다.','intermediate','work');
  s('s0985','I saw a beautiful bird.',[d('I'),d('saw'),d('a'),x('beautiful','뷰리플',[m(0,'stress'),m(1,'flap_t'),m(2,'f'),m(2,'l')]),x('bird.','버드',[m(0,'r')])],'나는 아름다운 새를 봤다.','advanced','nature');
  s('s0986','She lives near the school.',[d('she','She'),x('lives','리브즈',[m(0,'l'),m(1,'v'),m(2,'z')]),x('near','니어',[m(1,'r')]),d('the'),d('school','school.')],'그녀는 학교 근처에 산다.','intermediate','travel');
  s('s0987','The room has a big window.',[d('the','The'),d('room'),d('has'),d('a'),d('big'),x('window.','윈도우',[m(0,'stress')])],'그 방에는 큰 창문이 있다.','intermediate','daily');
  s('s0988','I think this is right.',[d('I'),d('think'),d('this'),d('is'),d('right','right.')],'나는 이게 맞다고 생각해.','intermediate','daily');
  s('s0989','He gave me his phone number.',[d('he','He'),x('gave','게이브',[m(2,'v')]),d('me'),d('his'),d('phone'),x('number.','넘버',[m(0,'stress'),m(1,'r')])],'그가 나에게 전화번호를 줬다.','advanced','tech');
  s('s0990','We can meet after lunch.',[d('we','We'),d('can'),d('meet'),d('after'),d('lunch','lunch.')],'점심 후에 만날 수 있다.','intermediate','work');
  s('s0991','The store opens at ten.',[d('the','The'),x('store','스토',[m(1,'r')]),x('opens','오우픈즈',[m(0,'stress'),m(3,'z')]),d('at'),x('ten.','텐')],'가게는 열 시에 연다.','intermediate','work');
  s('s0992','I will wait for you here.',[d('I'),d('will'),d('wait'),d('for'),d('you'),d('here','here.')],'여기서 널 기다릴게.','intermediate','daily');
  s('s0993','She looks very tired today.',[d('she','She'),x('looks','룩스',[m(0,'l')]),d('very'),d('tired'),d('today','today.')],'그녀는 오늘 아주 피곤해 보인다.','intermediate','feeling');
  s('s0994','They are learning English now.',[d('they','They'),d('are'),x('learning','러닝',[m(0,'l'),m(0,'stress'),m(0,'r')]),x('English','잉글리시',[m(0,'stress'),m(1,'l'),m(2,'l'),m(3,'sh')]),d('now','now.')],'그들은 지금 영어를 배우고 있다.','advanced','school');
  s('s0995','I have to go now.',[d('I'),lz('have','해프',[m(0,'ae'),m(1,'f')],['to']),d('go'),d('now','now.')],'나 지금 가야 해.','intermediate','daily');
  s('s0996','The food here is very good.',[d('the','The'),d('food'),d('here'),d('is'),d('very'),d('good','good.')],'여기 음식은 아주 맛있다.','intermediate','food');
  s('s0997','He is my best friend.',[d('he','He'),d('is'),d('my'),x('best','베스트'),d('friend','friend.')],'그는 내 가장 친한 친구다.','beginner','feeling');
  s('s0998','We went to the sea last week.',[d('we','We'),d('went'),d('to'),d('the'),x('sea','씨'),d('last'),d('week','week.')],'우리는 지난주에 바다에 갔다.','advanced','travel');
  s('s0999','I need to buy a new computer.',[d('I'),d('need'),d('to'),d('buy'),d('a'),d('new'),x('computer.','컴퓨러',[m(1,'stress'),m(2,'flap_t'),m(2,'r')])],'새 컴퓨터를 사야 한다.','advanced','tech');
  s('s1000','The morning air is very fresh.',[d('the','The'),d('morning'),x('air','에어',[m(1,'r')]),d('is'),d('very'),x('fresh.','프뤠시',[m(0,'f'),m(1,'r'),m(2,'sh')])],'아침 공기가 아주 상쾌하다.','advanced','nature');
  s('s1001','Could you help me with this?',[lz('Could','쿠쥬',[],['you']),d('help'),d('me'),d('with'),d('this','this?')],'이것 좀 도와줄래요?','intermediate','feeling');
  s('s1002','Do not you want to come?',[d('do','Do'),d('not'),d('you'),lz('want','워너',[m(0,'stress')],['to']),d('come','come?')],'너 안 오고 싶어?','advanced','feeling');
  s('s1003','I should have called you.',[d('I'),d('should'),d('have'),x('called','콜드',[m(0,'l')]),d('you','you.')],'너에게 전화했어야 했는데.','advanced','feeling');
  s('s1004','She is going to the store.',[d('she','She'),d('is'),lz('going','고나',[],['to']),d('the'),x('store.','스토',[m(1,'r')])],'그녀는 가게에 가는 중이다.','advanced','travel');
  s('s1005','What are they talking about?',[lz('What','워러',[m(1,'flap_t'),m(1,'r')],['are']),d('they'),x('talking','토킹',[m(0,'stress'),m(0,'l')]),d('about','about?')],'그들은 무엇에 대해 이야기하고 있어?','advanced','daily');

  /* ===== 보충 2 ===== */
  s('s1101','I ate an apple today.',[d('I'),d('ate'),d('an'),d('apple'),d('today','today.')],'나는 오늘 사과를 먹었다.','beginner','food');
  s('s1102','He is a very good cook.',[d('he','He'),d('is'),d('a'),d('very'),d('good'),d('cook','cook.')],'그는 요리를 아주 잘한다.','intermediate','food');
  s('s1103','We should study together.',[d('we','We'),d('should'),d('study'),x('together.','터게더',[m(1,'stress'),m(2,'dh'),m(2,'r')])],'우리 같이 공부하자.','intermediate','school');
  s('s1104','The window is not open.',[d('the','The'),d('window'),d('is'),d('not'),d('open','open.')],'창문이 열려 있지 않다.','beginner','daily');
  s('s1105','She sent me a long email.',[d('she','She'),x('sent','쎈트'),d('me'),d('a'),d('long'),x('email.','이메일',[m(1,'stress'),m(2,'l')])],'그녀가 나에게 긴 이메일을 보냈다.','advanced','tech');
  s('s1106','I will keep this book.',[d('I'),d('will'),d('keep'),d('this'),d('book','book.')],'나는 이 책을 간직할 것이다.','beginner','school');
  s('s1107','They work at the same office.',[d('they','They'),d('work'),d('at'),d('the'),x('same','쎄임'),x('office.','오피스',[m(0,'stress'),m(1,'f')])],'그들은 같은 사무실에서 일한다.','advanced','work');
  s('s1108','Do you know the answer?',[d('do','Do'),d('you'),d('know'),d('the'),d('answer','answer?')],'답을 아세요?','intermediate','school');
  s('s1109','The rain stopped this morning.',[d('the','The'),d('rain'),x('stopped','스탑트'),d('this'),d('morning','morning.')],'오늘 아침에 비가 그쳤다.','intermediate','nature');
  s('s1110','I really want to learn this.',[d('I'),d('really'),lz('want','워너',[m(0,'stress')],['to']),d('learn'),d('this','this.')],'나는 이걸 정말 배우고 싶다.','advanced','school');
  s('s1111','She takes the bus every day.',[d('she','She'),x('takes','테익스'),d('the'),d('bus'),d('every'),d('day','day.')],'그녀는 매일 버스를 탄다.','intermediate','travel');
  s('s1112','He put his phone on the table.',[d('he','He'),d('put'),d('his'),d('phone'),d('on'),d('the'),x('table.','테이블',[m(0,'stress'),m(2,'l')])],'그는 전화기를 탁자 위에 놓았다.','advanced','daily');
  s('s1113','We had a long meeting today.',[d('we','We'),d('had'),d('a'),d('long'),x('meeting','미링',[m(0,'stress'),m(1,'flap_t')]),d('today','today.')],'우리는 오늘 긴 회의를 했다.','advanced','work');
  s('s1114','The snow will stop soon.',[d('the','The'),x('snow','스노우'),d('will'),d('stop'),x('soon.','쑨')],'눈이 곧 그칠 것이다.','intermediate','nature');
  s('s1115','I like reading in the park.',[d('I'),d('like'),x('reading','뤼딩',[m(0,'r'),m(0,'stress')]),d('in'),d('the'),x('park.','파크',[m(0,'r')])],'나는 공원에서 책 읽는 걸 좋아한다.','advanced','travel');
  s('s1116','My father works very hard.',[d('my','My'),x('father','파더',[m(0,'f'),m(0,'stress'),m(1,'dh'),m(1,'r')]),x('works','워크스',[m(0,'r')]),d('very'),d('hard','hard.')],'우리 아버지는 아주 열심히 일하신다.','advanced','feeling');
  s('s1117','Please write your name here.',[d('please','Please'),d('write'),d('your'),d('name'),d('here','here.')],'여기에 이름을 써 주세요.','intermediate','school');
  s('s1118','The class starts in five minutes.',[d('the','The'),d('class'),x('starts','스타츠',[m(1,'r')]),d('in'),x('five','파이브',[m(0,'f'),m(2,'v')]),x('minutes.','미닛츠',[m(0,'stress')])],'수업이 오 분 후에 시작한다.','advanced','school');
  s('s1119','I could not find my key.',[d('I'),d('could'),d('not'),d('find'),d('my'),x('key.','키')],'나는 열쇠를 찾을 수 없었다.','intermediate','daily');
  s('s1120','She loves music very much.',[d('she','She'),x('loves','러브즈',[m(0,'l'),m(1,'v'),m(2,'z')]),d('music'),d('very'),d('much','much.')],'그녀는 음악을 아주 좋아한다.','advanced','feeling');
  s('s1121','We are going to eat now.',[d('we','We'),d('are'),lz('going','고나',[],['to']),d('eat'),d('now','now.')],'우리는 이제 먹으러 간다.','advanced','food');
  s('s1122','The bird flew over the house.',[d('the','The'),x('bird','버드',[m(0,'r')]),x('flew','플루',[m(0,'f'),m(0,'l')]),d('over'),d('the'),d('house','house.')],'새가 집 위로 날아갔다.','advanced','nature');
  s('s1123','He always answers my calls.',[d('he','He'),d('always'),x('answers','앤써즈',[m(0,'ae'),m(0,'stress'),m(1,'r'),m(2,'z')]),d('my'),x('calls.','콜즈',[m(0,'l'),m(1,'z')])],'그는 항상 내 전화를 받는다.','advanced','feeling');
  s('s1124','I want to buy that car.',[d('I'),lz('want','워너',[m(0,'stress')],['to']),d('buy'),d('that'),d('car','car.')],'나는 저 차를 사고 싶다.','intermediate','travel');
  s('s1125','This program is very easy to use.',[d('this','This'),x('program','프로우그뢤',[m(1,'r'),m(1,'stress'),m(3,'r'),m(3,'ae')]),d('is'),d('very'),d('easy'),d('to'),d('use','use.')],'이 프로그램은 쓰기 아주 쉽다.','advanced','tech');
  s('s1126','The students read many books.',[d('the','The'),x('students','스투던츠',[m(1,'stress')]),d('read'),d('many'),x('books.','북스')],'학생들은 책을 많이 읽는다.','advanced','school');

  window.APP_DATA.sentences = S;
  window.APP_DATA._sentenceHelpers = { D: D, d: d, x: x, lz: lz, s: s, m: m };
})();
