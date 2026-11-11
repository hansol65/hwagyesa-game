// 대학생회(대1~대4) 장면 데이터 생성: node scripts/university-data.cjs → src/data/university/*.json
//
// 고증 메모 (기획자 확인):
// - 대학생회는 우리가 직접 꾸리지만 무슨 부, 무슨 부 같은 부서는 없다. "오늘은 내가 목탁", "SNS 관리 부탁받음" 같은 식으로 그때그때 맡는다.
// - 활동은 명상이 많고, 끝나면 밥·술·카페에 자주 간다. 외부 절 탐방과 연합법회도 있다.
// - 지솔·영민은 대학생회에서 선배(언니·누나 / 오빠·형)다. 둘 다 아직도 대학교를 졸업 못 했다.
// - 친구 셋 중 하나({buddy})만 꼬박꼬박 나오고, 나머지는 행사 때만 온다.
// - 간사 제의를 받아들이면 일요일은 다시 어린이회(또는 학생회)에서 보낸다.
//
// 토큰: {jisol} 지솔 언니·누나, {youngmin} 영민 오빠·형 (뒤 조사는 받침 없는 꼴로 쓰면 알아서 바뀐다),
//       {nuna} 언니·누나, {hyung} 오빠·형, {buddy} 꼬박꼬박 나오는 친구
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..') + '/';
const OUT = ROOT + 'src/data/university/';
fs.mkdirSync(OUT, { recursive: true });
const E = (stats, rel) => ({ ...(stats ? { stats } : {}), ...(rel ? { rel } : {}) });
const go = (label, eff, extra = {}) => ({ label, attend: true, next: 'program', effects: eff, ...extra });
const stay = (label, text, eff, extra = {}) => ({ label, attend: false, text, effects: eff, ...extra });
const R = (chance, stat, success, fail, extra = {}) => ({ chance, stat, success, fail, ...extra });
/** 간사 제의를 받는 정의 기준 */
const OFFER = 40;
const KG = 'uni:kid_gansa';
const SG = 'uni:st_gansa';
/** 간사가 아닌 사람의 대학생회 일요일 아침 */
const NOT_GANSA = { notFlags: [KG, SG] };

// ───────── 일요일 아침 ─────────
const attend = [
  {
    id: 'un-am-basic', title: '일요일 아침', requires: NOT_GANSA,
    text: ['{season} 자취방 알람이 울려요. 대학생회는 아무도 깨워 주지 않아요. {buddy}한테서 "오늘 와?" 하나만 와 있어요.', '{season} 대학생회 단톡방에 {jisol}가 "오늘 명상하고 밥 먹자~"를 올렸어요. 읽은 사람 수는 많은데 답은 {buddy}뿐이에요.'],
    choices: [go('세수만 하고 절로 간다', E({ faith: 2 })), stay('"오늘은 패스" 하고 다시 잔다', '푹 잤어요. 단톡방에 {buddy}랑 {jisol} 둘이 찍은 셀카가 올라왔어요.', E({ health: 3, faith: -4 }))],
  },
  {
    id: 'un-am-mt', title: '과 MT 다음 날', requires: NOT_GANSA,
    text: ['어젯밤 과 MT에서 새벽 네 시까지 놀았어요. 목이 다 쉬었어요.'],
    choices: [go('쉰 목으로 명상이라도 하러 간다', E({ faith: 3, health: -3 })), stay('해장국 먹고 하루 종일 잔다', '오후 다섯 시에 일어났어요. 하루가 증발했어요.', E({ health: 4, faith: -4 }))],
  },
  {
    id: 'un-am-parttime', title: '주말 알바', requires: NOT_GANSA,
    text: ['카페 알바 사장님이 "이번 주 일요일 오전만 대타 좀" 하세요.', '편의점 주말 알바가 일요일 오전으로 바뀌었어요. 이번 달 월세가 빠듯해요.'],
    choices: [go('사장님께 오후로 바꿔 달라고 하고 법회에 간다', E({ faith: 3, mental: -1 })), stay('알바를 간다', '월세는 벌었어요. 대학생회 단톡방은 못 본 척했어요.', E({ intellect: 1, mental: 2, faith: -4 }))],
  },
  {
    id: 'un-am-assignment', title: '팀플 마감', requires: NOT_GANSA,
    text: ['팀플 발표가 내일이에요. 조원 하나가 잠수를 탔어요. 피피티가 반밖에 없어요.'],
    choices: [
      go('노트북 들고 법회에 간다. 끝나고 카페에서 한다', E({ faith: 2, mental: -2 })),
      stay('하루 종일 팀플한다', '피피티를 혼자 다 만들었어요. 발표는 잠수 탄 조원이 했어요.', E({ intellect: 5, mental: -3, faith: -3 })),
    ],
  },
  {
    id: 'un-am-exam', title: '시험 기간', months: [4, 6, 10, 11], requires: NOT_GANSA,
    text: ['중간고사 기간이에요. 도서관 자리 맡으려면 아침 일곱 시엔 가야 해요.', '기말고사가 다음 주예요. 전공 책이 벽돌처럼 두꺼워요.'],
    choices: [
      go('명상만 하고 도서관으로 간다', E({ faith: 3, health: -2, intellect: 1 })),
      stay('도서관에 박혀 있는다', '한 과목을 다 끝냈어요. 대신 하루 종일 아무하고도 말을 안 했어요.', E({ intellect: 7, faith: -4, mental: -2 })),
    ],
  },
  {
    id: 'un-am-date', title: '소개팅', requires: NOT_GANSA,
    text: ['과 동기가 일요일 점심에 소개팅을 잡아 줬어요. 법회 끝나는 시간이랑 딱 겹쳐요.'],
    choices: [
      go('법회 끝나고 뛰어간다', E({ faith: 2, health: -2, charm: 1 })),
      stay('소개팅에 집중한다', '대화는 잘 통했어요. 그런데 "주말엔 보통 뭐 해요?"에 절 얘기를 한참 했어요.', E({ charm: 5, faith: -3 })),
    ],
  },
  {
    id: 'un-am-hangover', title: '어젯밤 뒤풀이', requires: NOT_GANSA,
    text: ['어젯밤 대학생회 사람들이랑 늦게까지 마셨어요. {youngmin}가 마지막에 "다들 내일 법회… 오는 거지…?" 했던 게 기억나요.'],
    choices: [go('약속은 약속. 꾸역꾸역 간다', E({ faith: 3, health: -3 }, { teacher: 2 })), stay('못 일어나겠다', '{youngmin}한테서 "괜찮아? 꿀물 사 갈까…?"가 왔어요. 본인도 못 일어났대요.', E({ health: 2, faith: -3 }))],
  },
  {
    id: 'un-am-job', title: '취업 준비', minGrade: 16, requires: NOT_GANSA,
    text: ['자소서 마감이 사흘 남았어요. "본인이 주도적으로 무언가를 이끈 경험을 쓰시오."', '인적성 시험이 다음 주예요. 스터디 단톡방이 일요일 아침부터 시끄러워요.'],
    choices: [
      go('법회에 가서 머리를 비우고 온다', E({ faith: 4, mental: 3, intellect: -1 })),
      stay('스터디 카페에 간다', '자소서 하나를 끝냈어요. 쓰고 나니 쓸 경험이 절 얘기밖에 없었어요.', E({ intellect: 6, faith: -3, mental: -2 })),
    ],
  },
  {
    id: 'un-am-rain', title: '비 오는 일요일', months: [4, 6, 9], requires: NOT_GANSA,
    text: ['비가 와요. 화계사 올라가는 언덕길이 미끄러워요.'],
    choices: [go('우산 쓰고 올라간다', E({ faith: 2, health: -1 })), stay('빗소리 들으며 자취방에서 뒹군다', '라면 끓여 먹고 영화 두 편을 봤어요.', E({ mental: 5, faith: -4 }))],
  },

  // ── 어린이회 간사의 일요일 아침 ──
  {
    id: 'un-am-kg', title: '어린이회 법회 날', requires: { flags: [KG] },
    text: ['{season} 어린이회는 아침 열 시. 간사는 아홉 시까지 가서 방석을 깔아야 해요. 1학년 때는 몰랐어요. 쌤들이 이렇게 일찍 와 있었던 걸.', '{season} 알람 세 개를 껐어요. 오늘 어린이회 간식은 내가 사 가기로 했어요. 아이들이 "쌤 오늘 뭐 사 와요?" 하고 단톡방 대신 부모님 휴대폰으로 물어봤어요.'],
    choices: [
      go('간식 봉지를 들고 뛰어간다', E({ faith: 2, health: -1 }, { gansa: 1 })),
      stay('{jisol}한테 "오늘만 부탁해요…" 보낸다', '{jisol}가 "ㅋㅋ 간사 3주 만에 땡땡이?" 하고 대신 갔어요. 아이들이 "새 쌤 어디 갔어요?" 했대요.', E({ health: 3, faith: -3, leadership: -2 }, { gansa: -3 })),
    ],
  },
  {
    id: 'un-am-kg2', title: '아이들 단톡 대신 부모님 문자', requires: { flags: [KG] },
    text: ['토요일 밤, 어린이회 학부모님 문자가 와요. "쌤~ 내일 우리 애 감기라 못 가요ㅠ" "내일 몇 시에 끝나요?" "혹시 우리 애 사진 있어요?" 지솔 쌤이 왜 늘 피곤했는지 알 것 같아요.'],
    choices: [
      go('답장 다 하고 일찍 자서 아침에 간다', E({ leadership: 2, faith: 1 })),
      go('사진까지 골라 보내 드리고 새벽에 잔다', E({ charm: 2, health: -3 }, { gansa: 2 })),
    ],
  },

  // ── 학생회 간사의 일요일 아침 ──
  {
    id: 'un-am-sg', title: '학생회 법회 날', requires: { flags: [SG] },
    text: ['{season} 학생회 단톡방에 공지를 올려야 해요. "내일 법회 와요~" 썼다가 너무 가벼운가 싶어 지웠어요. 6년 전 영민 쌤이 이랬어요.', '{season} 학생회 후배가 토요일 밤 열두 시에 "쌤 내일 꼭 가야 돼요? 시험인데…"를 보냈어요.'],
    choices: [
      go('공지 올리고 일찍 가서 악기를 꺼내 둔다', E({ faith: 2, leadership: 1 }, { teacher: 1 })),
      stay('"이번 주는 쉬자" 공지하고 나도 쉰다', '후배들이 "쌤 최고"를 보냈어요. {youngmin}는 "…그래도 돼…?"를 보냈다가 지웠어요.', E({ mental: 3, faith: -3, leadership: -2 }, { teacher: -2 })),
    ],
  },
];

const ret = {
  id: 'un-return',
  title: '오랜만에 왔네?',
  text: ['법회실 문을 여니 {buddy}가 "어, 살아 있었네?" 하며 웃어요.', '오랜만에 왔더니 {jisol}가 휴대폰부터 들어요. "가만있어 봐, 복귀 기념 사진."'],
  choices: [
    { label: '멋쩍게 웃으며 앉는다', text: '아무도 뭐라 하지 않았어요. 명상 시간 내내 마음이 편했어요.', effects: E({ faith: 2, mental: 2 }), highlight: '한동안 빠졌다가 다시 대학생회에 돌아왔어요.' },
    { label: '"요즘 좀 힘들었어" 하고 털어놓는다', text: '끝나고 카페에서 {buddy}가 두 시간을 들어 줬어요.', effects: E({ mental: 5 }) },
  ],
};

// ───────── 상태 이벤트 ─────────
const status = [
  { id: 'un-low-health', lowStat: 'health', title: '편의점 도시락 3주째', text: ['삼각김밥이랑 컵라면으로 버틴 지 3주째예요. 계단만 올라도 숨이 차요.'], choices: [go('절 공양간 밥 먹으러라도 간다', E({ health: 5, faith: 3 })), stay('하루 종일 잔다', '열네 시간을 잤어요. 그래도 몸이 무거워요.', E({ health: 6, faith: -2 }))] },
  { id: 'un-low-mental', lowStat: 'mental', title: '번아웃', text: ['과제, 알바, 사람. 다 하다 보니 아무것도 하기 싫어졌어요.'], choices: [go('법회 가서 명상만 하고 온다', E({ mental: 7, faith: 3 })), stay('휴대폰도 끄고 누워 있는다', '천장만 봤어요. 그래도 조금 나아졌어요.', E({ mental: 4, charm: -2 }))] },
  { id: 'un-low-intellect', lowStat: 'intellect', title: '학사 경고 위기', text: ['성적 알림이 떴어요. 전공 하나가 D예요.'], choices: [go('법회 갔다가 바로 도서관', E({ faith: 2, intellect: 3, health: -2 })), stay('재수강 계획부터 짠다', '계획표를 새로 짰어요.', E({ intellect: 7, faith: -3 }))] },
  { id: 'un-low-charm', lowStat: 'charm', title: '아싸가 된 기분', text: ['과 단톡방에서 나만 모르는 얘기가 오가요.'], choices: [go('법회 끝나고 밥 먹자고 먼저 말한다', E({ charm: 5, mental: -1 })), stay('혼자 있는다', '혼자가 편했어요. 조금 외로웠어요.', E({ mental: -2, charm: -1 }))] },
  { id: 'un-low-faith', lowStat: 'faith', title: '나는 왜 아직 절에 다닐까', text: ['동기가 묻어요. "너 아직도 절 다녀? 어릴 때부터?" 대답이 바로 안 나와요.'], choices: [go('그 질문을 들고 스님을 찾아간다', E({ faith: 7, intellect: 1 }, { monk: 3 })), stay('이번 주는 쉰다', '그 질문이 계속 맴돌았어요.', E({ mental: 1, faith: -3 }))] },
  { id: 'un-low-leadership', lowStat: 'leadership', title: '아무도 안 하는 일', text: ['다음 주 법회 공지를 아무도 안 올렸어요. 다들 누가 하겠지 하는 눈치예요.'], choices: [go('내가 올린다', E({ leadership: 6, mental: -2 })), go('그냥 법회만 나간다', E({ faith: 2 }))] },
];

// ───────── 대학생회 일요일: 명상, 그리고 밥·술·카페 ─────────
const programs = [
  {
    id: 'un-moktak', title: '오늘은 내가 목탁',
    text: ['법회 시작 10분 전, {jisol}가 목탁을 쓱 내밀어요. "오늘은 네가 쳐." 대학생회는 그냥 그날 그날 누가 쳐요.'],
    choices: [
      { label: '목탁을 잡는다', minigame: 'moktak', roll: R(0.4, 'faith', { text: '목탁 소리에 염불이 하나로 모였어요. 학생회 때 배운 게 손에 남아 있었어요.', effects: E({ faith: 5, mental: 2 }, { monk: 2 }), record: 'moktak_good' }, { text: '박자가 점점 빨라져서 염불이 랩이 됐어요. {jisol}가 그걸 영상으로 찍었어요.', effects: E({ faith: 1, mental: -2 }, { gansa: 1 }) }) },
      { label: '"{buddy}가 칠래?" 하고 넘긴다', text: '{buddy}가 쳤어요. 박자가 엉망이었어요. 다음 주는 내 차례래요.', effects: E({ charm: -1 }) },
    ],
  },
  {
    id: 'un-mc', title: '오늘 사회 좀 봐 줘',
    text: ['{youngmin}가 쭈뼛쭈뼛 다가와요. "저, 저기… 오늘 법회 사회… 혹시 봐 줄 수 있어…? 내가 하면 또 순서 틀릴 것 같아서…"'],
    choices: [
      { label: '"주세요" 하고 순서지를 받는다', roll: R(0.4, 'leadership', { text: '삼귀의부터 사홍서원까지 한 번도 안 틀렸어요. {youngmin}가 뒤에서 소리 없이 박수 쳤어요.', effects: E({ leadership: 5, faith: 2 }, { teacher: 3 }), record: 'uni_mc', highlight: '대학생회 법회 사회를 봤어요.' }, { text: '반야심경 중간에 어디까지 했는지 까먹었어요. 다 같이 웃으며 다시 처음부터 했어요.', effects: E({ leadership: 1, mental: -2 }) }) },
      { label: '"같이 해요, 옆에 있을게요" 한다', text: '{youngmin}가 순서를 두 번 틀렸는데 둘이 같이 고쳐 가며 끝냈어요.', effects: E({ charm: 2 }, { teacher: 4 }) },
    ],
  },
  {
    id: 'un-sns', title: 'SNS 관리를 부탁받았다',
    text: ['{jisol}가 휴대폰을 내밀어요. "대학생회 인스타 비밀번호 너 줄게. 마지막 게시물이 2년 전이야. 살려 줘."'],
    choices: [
      { label: '오늘 명상 사진부터 올린다', roll: R(0.4, 'charm', { text: '"일요일 아침 명상, 생각보다 할 만함" 게시물에 다른 학교 학생이 DM을 보냈어요. "저도 가 봐도 돼요?"', effects: E({ charm: 4, leadership: 2 }), record: 'uni_sns', highlight: '대학생회 SNS를 살렸어요.' }, { text: '좋아요 7개. 그중 4개는 우리였고, 하나는 {jisol} 부계정이었어요.', effects: E({ charm: 1, mental: -1 }), record: 'uni_sns' }) },
      { label: '"저 그런 거 잘 몰라요…" 하고 돌려준다', text: '{jisol}가 "그럼 누가 해…" 하며 휴대폰을 다시 가져갔어요. 2년 전 게시물은 그대로예요.', effects: E({}, { gansa: -1 }) },
    ],
  },
  {
    id: 'un-meditation', title: '좌선 30분',
    text: ['대학생회 법회의 반은 명상이에요. 오늘은 좌선 30분. 법당이 조용하고, 다리가 저려 와요.'],
    choices: [
      { label: '끝까지 자세를 지킨다', roll: R(0.45, 'mental', { text: '20분쯤 지나니 생각이 조용해졌어요. 종이 울렸을 때 30분이 3분 같았어요.', effects: E({ faith: 4, mental: 5 }), record: 'meditation' }, { text: '다리가 완전히 저려서 일어나다 넘어졌어요. {buddy}가 웃음을 참느라 어깨를 떨었어요.', effects: E({ faith: 1, mental: -1 }) }, { temper: 'calm' }) },
      { label: '몰래 졸다가 깬다', text: '고개가 툭 떨어지는 순간 깼어요. 스님이 못 본 척해 주셨어요.', effects: E({ health: 2, faith: 1 }) },
    ],
  },
  {
    id: 'un-meditation-walk', title: '걷기 명상',
    text: ['오늘은 삼각산 둘레길을 말없이 걷는 명상이에요. 발바닥이 땅에 닿는 것만 느끼래요.'],
    choices: [
      { label: '한 걸음 한 걸음 집중한다', text: '바람 소리, 낙엽 소리, 내 숨소리. 한 시간이 금방 갔어요.', effects: E({ mental: 5, health: 2, faith: 2 }), record: 'meditation' },
      { label: '{buddy}랑 눈으로 대화한다', text: '말은 안 했는데 표정으로 계속 웃겼어요. 명상인지 몸개그인지 모르겠어요.', effects: E({ charm: 2, mental: 2 }) },
    ],
  },
  {
    id: 'un-meditation-candle', title: '촛불 명상',
    text: ['불을 끈 법당에 촛불 하나. 불꽃만 바라보는 명상이에요. 요즘 머릿속이 너무 시끄러웠어요.'],
    choices: [
      { label: '불꽃만 바라본다', roll: R(0.45, 'mental', { text: '불꽃이 흔들릴 때마다 걱정이 하나씩 내려앉았어요. 끝나고 다들 아무 말 없이 한참 앉아 있었어요.', effects: E({ mental: 6, faith: 3 }), record: 'meditation' }, { text: '불꽃을 보다가 과제 마감이 떠올랐어요. 그 뒤로는 과제만 보였어요.', effects: E({ mental: 1 }) }) },
      { label: '끝나고 소감을 나눈다', text: '"요즘 불안했다"는 말에 다들 고개를 끄덕였어요. 나만 그런 게 아니었어요.', effects: E({ mental: 4, charm: 1 }) },
    ],
  },
  {
    id: 'un-108', title: '대학생회 108배',
    text: ['시험 끝난 기념으로 108배를 하기로 했어요. {jisol}가 "{nuna}는 이거 한 지 15년째야" 하며 제일 앞에 섰어요.'],
    choices: [
      { label: '끝까지 한다', roll: R(0.45, 'health', { text: '108번째에 일어나니 다리는 후들거리는데 머리는 맑았어요.', effects: E({ faith: 5, health: 2, mental: 3 }), record: 'bows' }, { text: '60배쯤에서 다리가 풀렸어요. 나머지는 마음으로 했어요.', effects: E({ faith: 2, health: -2 }) }) },
      { label: '숫자 세는 걸 맡는다', text: '"쉰셋… 쉰넷…" 세다가 내가 헷갈려서 다들 두 번 더 했어요.', effects: E({ charm: 1, faith: 1 }) },
    ],
  },
  {
    id: 'un-dharma', title: '스님 법문, 그리고 질문',
    text: ['대학생회 법문은 어린이회 때랑 달라요. 스님이 이야기하시고, 끝나면 질문을 받으세요. 오늘 주제는 "집착"이에요.'],
    choices: [
      { label: '손을 들고 질문한다', roll: R(0.4, 'intellect', { text: '"좋아하는 걸 놓으면 그게 좋아하는 거예요?" 스님이 웃으시며 한참 대답해 주셨어요. 다들 받아 적었어요.', effects: E({ intellect: 3, faith: 4 }, { monk: 4 }) }, { text: '질문이 너무 길어서 하다가 무슨 질문인지 까먹었어요. 스님이 "그게 집착이다" 하셨어요.', effects: E({ charm: 1, faith: 1 }, { monk: 1 }) }) },
      { label: '조용히 듣는다', text: '한 구절이 마음에 남았어요. 집에 가는 지하철에서 계속 생각났어요.', effects: E({ faith: 3 }) },
    ],
  },
  {
    id: 'un-teatime', title: '스님과 차담',
    text: ['법회 끝나고 스님이 요사채로 부르셨어요. 찻잔이 작아서 몇 번이고 채워 주세요.'],
    choices: [
      { label: '진로 고민을 여쭌다', text: '스님이 "모르면 모르는 대로 가 봐라. 어릴 때도 몰랐는데 여기까지 왔잖니" 하셨어요.', effects: E({ faith: 4, mental: 4 }, { monk: 5 }) },
      { label: '"스님은 대학생 때 뭐 하셨어요?" 묻는다', text: '스님이 한참 웃으시더니 대학 때 밴드를 하셨대요. 다들 뒤집어졌어요.', effects: E({ charm: 2, mental: 3 }, { monk: 4 }) },
    ],
  },
  {
    id: 'un-meal', title: '법회 끝나고 밥',
    text: ['법회 끝나면 거의 무조건 밥이에요. 오늘은 수유역 순댓국. {jisol}가 "{nuna}가 쏜다! 아 근데 나 학생이지…" 하며 지갑을 다시 넣었어요.'],
    choices: [
      { label: '옛날 얘기를 꺼낸다', text: '"너 1학년 때 피구 하다 울었잖아." {jisol}는 사진까지 갖고 있었어요.', effects: E({ mental: 4, charm: 2 }, { gansa: 3 }) },
      { label: '요즘 고민을 꺼낸다', text: '{youngmin}가 국밥을 앞에 두고 한참 들어 주다가 "나도… 그래…" 했어요. 그게 이상하게 위로가 됐어요.', effects: E({ mental: 5 }, { teacher: 3 }) },
    ],
  },
  {
    id: 'un-drink', title: '뒤풀이',
    text: ['법회 끝나고 밥 먹다가 자연스럽게 2차로 넘어갔어요. {youngmin}가 맥주 한 잔에 얼굴이 새빨개졌어요.'],
    choices: [
      { label: '끝까지 남아 이야기한다', text: '자정이 넘도록 얘기했어요. {youngmin}가 "나 사실… 학생회 간사 할 때 매주 울었어…"를 고백했어요.', effects: E({ charm: 3, health: -3 }, { teacher: 4, gansa: 2 }), record: 'uni_drink' },
      { label: '한 잔만 하고 일어난다', text: '지하철 막차 전에 나왔어요. 단톡방에 2차 사진이 계속 올라왔어요.', effects: E({ health: 1, mental: 1 }) },
      { label: '{jisol} 술주정을 영상으로 찍는다', text: '"너 이거 지워라!!!" 16년 만에 처음으로 {jisol}를 찍는 쪽이 됐어요.', effects: E({ charm: 3 }, { gansa: 2 }), record: 'uni_drink' },
    ],
  },
  {
    id: 'un-cafe', title: '절 앞 카페',
    text: ['법회 끝나고 절 앞 카페. {buddy}랑 둘이 창가에 앉았어요. 학생회 때 오던 그 카페예요.'],
    choices: [
      { label: '과제를 펼친다', text: '둘이 말없이 각자 과제를 했어요. 그게 편했어요.', effects: E({ intellect: 4 }), record: 'uni_cafe' },
      { label: '"다른 애들은 요즘 왜 안 올까" 얘기한다', text: '{buddy}가 "다들 바쁘지 뭐. 행사 때는 오잖아" 했어요. 그래도 단톡방에 "보고 싶다"를 보냈어요.', effects: E({ mental: 2, charm: 2 }), record: 'uni_cafe' },
    ],
  },
  {
    id: 'un-union-dharma', title: '연합법회',
    text: ['이번 달은 다른 절 대학생회들과 연합법회를 해요. 낯선 얼굴이 가득한 법당에서 같이 반야심경을 외워요.'],
    choices: [
      { label: '끝나고 다른 절 사람들과 밥 먹는다', roll: R(0.4, 'charm', { text: '어린이회부터 다녔다고 하니 다들 놀랐어요. 연합 단톡방이 생겼어요.', effects: E({ charm: 4, leadership: 2 }), record: 'uni_union', highlight: '연합법회에서 다른 절 대학생들과 친해졌어요.' }, { text: '어색해서 {buddy} 옆에만 붙어 있었어요.', effects: E({ mental: -1 }) }) },
      { label: '다른 절은 어떻게 하는지 묻는다', text: '다른 절은 법회 끝나고 다 같이 산에 간대요. 수첩에 적었어요.', effects: E({ intellect: 3 }), record: 'uni_union' },
    ],
  },
  {
    id: 'un-senior-talk', title: '선배랑 둘이',
    text: ['법회 끝나고 계단에 {jisol}랑 둘이 앉았어요. "{nuna}는 왜 아직 졸업 안 해요?" 물어봤어요.'],
    choices: [
      { label: '진지하게 듣는다', text: '"졸업하면 애들 못 볼까 봐." 장난인 줄 알았는데 표정이 진지했어요.', effects: E({ mental: 3, faith: 2 }, { gansa: 5 }) },
      { label: '"그거 핑계죠" 하고 놀린다', text: '"야!!!" 어린이회 때랑 똑같이 쫓아왔어요. 마당을 두 바퀴 돌았어요.', effects: E({ charm: 3, health: 1 }, { gansa: 3 }) },
    ],
  },

  // ── 어린이회 간사: 다시 어린이회로 ──
  {
    id: 'un-kg-dodge', title: '어린이회 피구 시간', requires: { flags: [KG] },
    text: ['어린이회 피구 시간. 1학년 꼬마가 공을 들고 눈을 반짝이며 외쳐요. "쌤도 들어와요!" 십몇 년 전 내가 지솔 쌤한테 했던 말이에요.'],
    choices: [
      { label: '동생들 편에 들어가 같이 뛴다', minigame: 'dodgeball', roll: R(0.45, 'health', { text: '끝까지 살아남아 동생들을 지켰어요. "쌤 최고!" 소리에 귀가 빨개졌어요.', effects: E({ health: 3, charm: 3, leadership: 2 }), record: 'kg_play', highlight: '어린이회 동생들과 피구를 했어요.' }, { text: '1학년 꼬마 공에 정통으로 맞았어요. 꼬마가 세상 다 가진 얼굴로 뛰어다녔어요.', effects: E({ charm: 2, mental: -1 }), record: 'kg_play' }, { talent: 'sports' }) },
      { label: '심판을 본다', text: '"선 밟았어!" 동생들이 "쌤 너무해!"라며 아우성이에요. 지솔 쌤이 왜 그렇게 신나 했는지 알겠어요.', effects: E({ leadership: 3 }) },
    ],
  },
  {
    id: 'un-kg-dance', title: '율동 가르치기', requires: { flags: [KG] },
    text: ['부처님오신날 율동 연습. 이번엔 내가 앞에 서서 가르쳐요. 1학년 때 이 동작 하나 외우느라 울었던 게 생각나요.'],
    choices: [
      { label: '시범을 보인다', minigame: 'dance', roll: R(0.45, 'charm', { text: '내 동작을 따라 아이들이 하나둘 맞추기 시작했어요. 맨 뒤의 꼬마까지 손을 흔들었어요.', effects: E({ charm: 4, leadership: 3 }), record: 'kg_teach', highlight: '어린이회 동생들에게 율동을 가르쳤어요.' }, { text: '시범 보이다 동작을 까먹었어요. 아이들이 "쌤 틀렸어요!" 하며 신나 했어요.', effects: E({ charm: 1, mental: -1 }) }) },
      { label: '못 따라오는 아이 옆에 붙어 준다', text: '한 동작씩 같이 했어요. 그 아이가 끝나고 "쌤 손 잡고 해서 안 무서웠어요" 했어요.', effects: E({ mental: 3, charm: 2 }), record: 'kg_comfort' },
    ],
  },
  {
    id: 'un-kg-photo', title: '간사의 사진첩', requires: { flags: [KG] },
    text: ['아이들이 오카리나 연습을 하는데 너무 귀여워서 나도 모르게 휴대폰을 들었어요. 지솔 쌤이 왜 그렇게 사진을 찍었는지 알 것 같아요.'],
    choices: [
      { label: '한 명도 빠짐없이 찍는다', text: '사진첩이 남의 집 아이들 사진으로 가득 찼어요. {jisol}한테 보냈더니 "드디어 너도 걸렸구나" 했어요.', effects: E({ charm: 3, mental: 2 }, { gansa: 4 }), record: 'kg_photo' },
      { label: '휴대폰을 넣고 같이 분다', text: '삑사리가 났어요. 아이들이 "쌤 삑사리!" 하며 깔깔 웃었어요. 놀림받는 게 이런 기분이구나.', effects: E({ charm: 2, mental: 2 }), record: 'kg_play' },
    ],
  },
  {
    id: 'un-kg-cry', title: '우는 동생', requires: { flags: [KG] },
    text: ['법회 중에 2학년 둘이 싸우다 한 명이 엉엉 울어요. 다른 아이들이 다 나만 쳐다봐요.'],
    choices: [
      { label: '단호하게 둘 다 혼낸다', text: '"법당에서 싸우는 건 안 돼. 둘 다 이리 와." 목소리를 낮게 깔았더니 울음이 뚝 그쳤어요. 정 선생님 무서운 목소리가 나한테서 나왔어요.', effects: E({ leadership: 5, charm: -1 }), record: 'kg_scold' },
      { label: '우는 동생부터 데리고 나간다', text: '마당 계단에 앉아 한참 얘기를 들어 줬어요. 다음 주에 그 아이가 내 옆에만 앉았어요.', effects: E({ mental: 2, charm: 3 }), record: 'kg_comfort' },
    ],
  },
  {
    id: 'un-kg-tease', title: '놀리고 놀림받기', requires: { flags: [KG] },
    text: ['아이들이 "쌤 남친(여친) 있어요?" "쌤 몇 살이에요? 할머니예요?" 하며 몰려와요.'],
    choices: [
      { label: '"응, 백 살이야" 하고 같이 놀린다', text: '아이들이 "거짓말!" 하며 매달렸어요. 다음 주엔 "백 살 쌤"이라고 불렸어요.', effects: E({ charm: 4, mental: 2 }), record: 'kg_play' },
      { label: '"법회 집중!" 하고 넘긴다', text: '아이들이 "재미없어~" 했어요. 그래도 법회는 잘 됐어요.', effects: E({ leadership: 2 }) },
    ],
  },
  {
    id: 'un-kg-sleepy', title: '법문 시간에 조는 아이들', requires: { flags: [KG] },
    text: ['스님 법문 시간. 앞줄 셋이 고개를 꾸벅꾸벅해요. 나도 1학년 때 저 자리에서 졸았어요.'],
    choices: [
      { label: '살짝 어깨를 톡톡 친다', text: '깜짝 놀라 깬 아이가 침을 닦았어요. 스님이 웃으셨어요.', effects: E({ leadership: 2 }, { monk: 2 }) },
      { label: '못 본 척하고 사진을 찍는다', text: '졸업사진 때 보여 줄 증거 사진이 생겼어요. 지솔 쌤의 수법이에요.', effects: E({ charm: 2 }), record: 'kg_photo' },
    ],
  },
  {
    id: 'un-kg-snack', title: '간식 시간', requires: { flags: [KG] },
    text: ['법회 끝나고 간식 시간. 초코파이가 하나 모자라요. 아이들 눈이 일제히 나를 봐요.'],
    choices: [
      { label: '내 몫을 준다', text: '아이가 반을 쪼개서 다시 줬어요. 이게 뭐라고 감동이었어요.', effects: E({ mental: 3, faith: 1 }), record: 'kg_comfort' },
      { label: '"가위바위보 하자!" 한다', text: '법당이 떠나가게 시끄러워졌어요. 진 아이가 울었어요. 다음부턴 넉넉히 사 오기로 했어요.', effects: E({ charm: 2, mental: -1 }), record: 'kg_play' },
    ],
  },
  {
    id: 'un-kg-cat', title: '고양이 보러 가요', requires: { flags: [KG, 'kittens'] },
    text: ['아이들이 "쌤, 공양간 뒤에 고양이 있대요!" 하며 손을 잡아끌어요. {cat}의 손주들이에요.'],
    choices: [{ label: '"할머니 이름은 {cat}였어" 하고 알려 준다', text: '아이들이 그 이름을 따라 불렀어요. 고양이가 꼬리를 세웠어요.', effects: E({ mental: 5, faith: 2 }), record: 'kg_play', highlight: '{cat}의 손주들을 어린이회 아이들에게 소개했어요.' }],
  },
  {
    id: 'un-kg-president', title: '6학년 회장의 목탁', requires: { flags: [KG] },
    text: ['올해 6학년 회장이 예불 때 처음 목탁을 쳐요. 손이 덜덜 떨려요. "쌤, 저 틀리면 어떡해요?" 나도 6학년 때 이랬을까요.'],
    choices: [
      { label: '먼저 쳐 보인다', minigame: 'moktak', roll: R(0.45, 'faith', { text: '똑, 똑, 똑. 내 소리를 듣고 아이가 따라 쳤어요. 첫 예불을 무사히 마쳤어요.', effects: E({ faith: 4, leadership: 3 }), record: 'kg_teach' }, { text: '나도 긴장해서 박자가 빨라졌어요. 아이가 "쌤도 떨어요?" 했어요.', effects: E({ faith: 1, mental: -2 }) }) },
      { label: '"틀려도 돼. 쌤도 틀렸었어" 한다', text: '아이가 웃었어요. 그날 예불은 조금 틀렸지만 아무도 신경 안 썼어요.', effects: E({ mental: 3, charm: 2 }), record: 'kg_comfort' },
    ],
  },

  // ── 학생회 간사: 다시 학생회로 ──
  {
    id: 'un-sg-pungmul', title: '풍물 가르치기', requires: { flags: [SG] },
    text: ['학생회 중1 후배들이 처음 악기를 잡았어요. 6년 전 영민 쌤이 해 준 것처럼, 이제 내가 장단을 가르쳐요.'],
    choices: [
      { label: '시범을 보인다', minigame: 'pungmul', roll: R(0.45, 'health', { text: '내 장단을 따라 후배들이 하나둘 맞추기 시작했어요. "쌤 멋있어요!" 소리에 귀가 빨개졌어요.', effects: E({ leadership: 4, charm: 3 }, { teacher: 3 }), record: 'sg_teach', highlight: '학생회 후배들에게 풍물을 가르쳤어요.' }, { text: '시범을 보이다 채를 떨어뜨렸어요. 영민 쌤이 왜 그렇게 자주 떨어뜨렸는지 알 것 같아요.', effects: E({ charm: 1, mental: -2 }) }, { talent: 'music' }) },
      { label: '한 명씩 손을 잡고 박자를 센다', text: '"덩, 기덕, 쿵, 더러러러." 후배 손이 점점 풀렸어요.', effects: E({ leadership: 3 }), record: 'sg_teach' },
    ],
  },
  {
    id: 'un-sg-chat', title: '학생회 단톡방 공지', requires: { flags: [SG] },
    text: ['학생회 단톡방에 이번 주 공지를 써야 해요. 써 놓고 보니 너무 딱딱한 것 같아요.'],
    choices: [
      { label: '이모티콘을 잔뜩 붙여서 올린다', text: '후배들이 "쌤 갑자기 왜 귀여워요"래요.', effects: E({ charm: 3 }), record: 'sg_chat' },
      { label: '썼다 지웠다를 다섯 번 한다', text: '"(삭제된 메시지입니다)"가 다섯 줄 쌓였어요. {youngmin}한테서 "ㅋㅋㅋ 너도구나"가 왔어요.', effects: E({ mental: -1, charm: 1 }, { teacher: 4 }), record: 'sg_chat' },
    ],
  },
  {
    id: 'un-sg-moktak', title: '학생회장의 목탁', requires: { flags: [SG] },
    text: ['이번에 학생회장이 된 고2 후배가 목탁을 처음 잡았어요. "쌤, 저 망하면 어떡해요?"'],
    choices: [
      { label: '먼저 쳐 보인다', minigame: 'moktak', roll: R(0.45, 'faith', { text: '똑, 똑, 똑. 후배가 따라 쳤어요. 첫 예불을 무사히 마쳤어요.', effects: E({ faith: 4, leadership: 3 }), record: 'sg_teach' }, { text: '나도 긴장해서 박자가 빨라졌어요.', effects: E({ faith: 1, mental: -2 }) }) },
      { label: '"망해도 돼. 나도 망했었어" 한다', text: '후배가 웃었어요. 조금 틀렸지만 아무도 신경 안 썼어요.', effects: E({ mental: 3, charm: 2 }) },
    ],
  },
  {
    id: 'un-sg-reels', title: '후배들 릴스 찍기', requires: { flags: [SG] },
    text: ['학생회 후배들이 릴스를 찍재요. "쌤도 나와요!" 삼각대를 세우는데 거꾸로 세웠어요. 영민 쌤이 했던 그 실수예요.'],
    choices: [
      { label: '주인공으로 나선다', text: '쌤 등장 컷이 조회수 최고가 됐어요. 후배들이 "쌤 밈 됐어요"래요.', effects: E({ charm: 4 }), record: 'sg_care' },
      { label: '편집을 맡아 준다', text: '밤새 자막을 달았어요. 후배들이 바나나우유를 놓고 갔어요.', effects: E({ intellect: 3, health: -2 }), record: 'sg_care' },
    ],
  },
  {
    id: 'un-sg-karaoke', title: '학생회 노래방 따라가기', requires: { flags: [SG] },
    text: ['법회 끝나고 후배들이 노래방을 간대요. "쌤도 가요! 쌤 계산… 아 아니에요 농담이에요."'],
    choices: [
      { label: '따라가서 계산까지 한다', text: '후배들이 "쌤 최고"를 외쳤어요. 이번 달 용돈이 사라졌어요.', effects: E({ charm: 3, mental: 2 }), record: 'sg_care' },
      { label: '"간사는 여기까지" 하고 보낸다', text: '"쌤 재미없어요~" 하면서도 다들 손을 흔들었어요.', effects: E({ leadership: 1 }) },
    ],
  },
  {
    id: 'un-sg-csat', title: '고3 후배 응원', requires: { flags: [SG] },
    text: ['수능을 앞둔 고3 후배들이 법회에 와서 다 지친 얼굴로 앉아 있어요.'],
    choices: [
      { label: '찹쌀떡이랑 손편지를 돌린다', text: '후배 하나가 편지를 읽다 울었어요. 나도 고3 때 받았던 그 편지가 생각났어요.', effects: E({ charm: 3, mental: 2 }, { teacher: 3 }), record: 'sg_care' },
      { label: '"오늘은 명상만 하고 가자" 한다', text: '20분 동안 아무 말 없이 앉아 있었어요. 후배들 얼굴이 조금 풀렸어요.', effects: E({ faith: 3, leadership: 2 }), record: 'sg_care' },
    ],
  },
];

// ───────── 이야기 ─────────
const stories = [
  {
    id: 'un-story-friends-fade', title: '줄어든 일요일',
    text: ['어린이회부터 같이 온 친구 셋. 대학생이 되니 일요일에 오는 건 이제 {buddy}랑 나뿐이에요. 단톡방은 그대로인데 법당 방석은 두 개만 깔려요.'],
    choices: [
      { label: '"행사 때라도 와" 하고 단톡방에 쓴다', text: '"부처님오신날엔 갈게!" 답장이 왔어요. 진짜로 행사 때는 다 왔어요.', effects: E({ charm: 2 }, { jiho: 2, seoyun: 2, haram: 2 }) },
      { label: '{buddy}한테 "우리라도 잘 나오자" 한다', text: '{buddy}가 새끼손가락을 내밀었어요. 유치했는데 좋았어요.', effects: E({ mental: 3 }), highlight: '대학생이 되어서도 {buddy}와 일요일마다 절에 갔어요.' },
    ],
  },
  {
    id: 'un-story-jisol-forever', title: '{jisol}는 아직도',
    text: ['{jisol}가 학사 일정표를 보며 한숨을 쉬어요. "이번 학기엔 진짜 졸업한다." 1학년 때도 들은 말 같아요.'],
    choices: [
      { label: '"이번엔 진짜죠?" 하고 묻는다', text: '"…아마?" 둘 다 웃음이 터졌어요. 그리고 {jisol}가 나를 한 장 찍었어요. "이건 내가 졸업 못 한 증거로 쓸 거야."', effects: E({ charm: 2, mental: 2 }, { gansa: 5 }) },
      { label: '졸업 요건을 같이 확인해 준다', roll: R(0.4, 'intellect', { text: '학점 계산을 해 보니 교양 2학점이 모자랐어요. {jisol}가 "너 없었으면 또 못 할 뻔했다"며 끌어안았어요.', effects: E({ intellect: 3 }, { gansa: 7 }) }, { text: '계산할수록 모자란 게 늘어났어요. 둘이 조용히 휴대폰을 덮었어요.', effects: E({ mental: -1 }, { gansa: 3 }) }) },
    ],
  },
  {
    id: 'un-story-youngmin-shy', title: '{youngmin}의 고백',
    text: ['{youngmin}가 법회 끝나고 쭈뼛쭈뼛 다가와요. "저, 저기… 너 학생회 때… 나 진짜 많이 의지했어. 그 말 하고 싶었는데… 6년 걸렸네…"'],
    choices: [
      { label: '"저도요" 하고 웃는다', text: '{youngmin}가 눈이 빨개져서 고개를 돌렸어요. 단톡방에 "고마워"를 썼다가, 이번엔 안 지웠어요.', effects: E({ mental: 4 }, { teacher: 7 }) },
      { label: '"{hyung} 지금 울어요?" 하고 놀린다', text: '"아, 아니야!!" 하는데 이미 울고 있었어요. 다 같이 웃었어요.', effects: E({ charm: 3 }, { teacher: 4 }) },
    ],
  },
  {
    id: 'un-story-jiho-army', title: '{jiho}의 입대',
    text: ['요즘 법회엔 안 나오던 {jiho}가 단톡방에 "나 다음 주 군대 간다"를 올렸어요.'],
    choices: [
      { label: '입대 전날 다 같이 밥을 먹는다', text: '오랜만에 넷이 모였어요. {jiho}가 "나 없는 동안 피구왕 하지 마라" 했어요. 다들 웃다가 조금 울었어요.', effects: E({ mental: 2 }, { jiho: 7, seoyun: 2, haram: 2 }), flag: 'jiho_sendoff' },
      { label: '훈련소에 편지를 보낸다', text: '"어린이회 때 네가 피구공으로 나 맞힌 거 아직 안 잊었다." 답장이 꼭 올 것 같아요.', effects: E({ charm: 1 }, { jiho: 5 }), flag: 'jiho_sendoff' },
    ],
  },
  {
    id: 'un-cb-jiho-back', title: '{jiho}가 돌아왔다', minGrade: 15, requires: { flags: ['jiho_sendoff'] },
    text: ['머리를 짧게 깎은 {jiho}가 법당 문을 열었어요. "나 왔다. 피구 하자."'],
    choices: [{ label: '마당으로 공을 들고 나간다', text: '둘이 공을 주고받기만 했는데 해가 졌어요. 그날 이후로 {jiho}도 가끔 나와요.', effects: E({ health: 3, mental: 5 }, { jiho: 6 }), highlight: '{jiho}가 군대에서 돌아왔어요.' }],
  },
  {
    id: 'un-story-seoyun-abroad', title: '{seoyun}의 교환학생',
    text: ['{seoyun}가 한 학기 교환학생을 간대요. "거기도 절이 있을까?"'],
    choices: [
      { label: '단주를 선물한다', text: '{seoyun}가 손목에 차고 "이거 보면 화계사 생각날 것 같아" 했어요.', effects: E({ mental: 2 }, { seoyun: 6 }), flag: 'seoyun_beads' },
      { label: '"꼭 사진 보내" 한다', text: '한 달 뒤, 낯선 나라 작은 절 앞에서 찍은 사진이 왔어요.', effects: E({ faith: 2 }, { seoyun: 4 }) },
    ],
  },
  {
    id: 'un-story-haram-show', title: '{haram}의 졸업 전시', minGrade: 15,
    text: ['{haram}가 졸업 전시를 한대요. 초대장 그림이 화계사 대웅전이에요.'],
    choices: [
      { label: '{buddy}랑 같이 보러 간다', text: '전시장 한쪽에 어린이회 때 우리를 그린 그림이 있었어요. 피구공, 연등, 고양이까지.', effects: E({ mental: 5 }, { haram: 7 }), highlight: '{haram}의 졸업 전시에 어린이회 우리가 걸려 있었어요.' },
      { label: '꽃만 보낸다', text: '{haram}가 꽃 사진에 하트를 열 개 달았어요.', effects: E({}, { haram: 3 }) },
    ],
  },
  {
    id: 'un-story-cry-burnout', title: '다 내려놓고 싶은 날',
    text: ['과제, 알바, 사람까지 겹친 주. 명상 시간에 눈을 감았는데 갑자기 눈물이 터졌어요. 소리를 참으려니 어깨가 떨려요.'],
    choices: [
      { label: '그냥 운다', text: '명상이 끝날 때까지 아무도 말을 안 걸었어요. 끝나자 {buddy}가 휴지를 내밀고, {jisol}가 "밥 먹으러 가자" 했어요. 그게 다였는데 다 괜찮아졌어요.', effects: E({ mental: 6 }, { gansa: 3 }), highlight: '대학생회 명상 시간에 처음으로 울었어요.' },
      { label: '눈물을 닦고 버틴다', text: '끝나고 혼자 마당 계단에 앉았어요. 스님이 지나가다 "그만큼 했으면 됐다" 하셨어요.', effects: E({ faith: 3, mental: -2 }, { monk: 4 }) },
    ],
  },
  {
    id: 'un-story-cat', title: '공양간 뒤 고양이', requires: { flags: ['kittens'], notFlags: [KG] },
    text: ['공양간 뒤에 {cat}를 꼭 닮은 고양이 가족이 살아요. 몇 대째인지 모르겠어요.'],
    choices: [{ label: '옆에 쪼그려 앉는다', text: '고양이가 나를 한참 보더니 발목에 몸을 비볐어요.', effects: E({ mental: 5, faith: 2 }), highlight: '{cat}의 손주들을 만났어요.' }],
  },
  {
    id: 'un-story-jung', title: '정 선생님을 만났다',
    text: ['부처님오신날 준비하다 정 선생님을 만났어요. 머리가 하얘지셨어요. "아이고, 이게 누구야! 다 컸네, 다 컸어!"'],
    choices: [
      { label: '"선생님 아재 개그 아직 하세요?" 묻는다', text: '"절에서 제일 빠른 사람? 부처님. 왜? 불이 나니까!" 하나도 안 변하셨어요.', effects: E({ charm: 2, mental: 4 }) },
      { label: '어린이회 때 혼났던 얘기를 꺼낸다', text: '"내가? 그렇게 무서웠어?" 선생님이 진심으로 놀라셨어요. 우리는 다 기억하는데.', effects: E({ mental: 3 }) },
    ],
  },
  {
    id: 'un-cb-dream', title: '그때 말한 꿈', minGrade: 15, requires: { flags: ['said_dream'] },
    text: ['고등학생 때 카페에서 {haram}한테 말했던 꿈. 지금 나는 그 길 근처에 와 있을까요?'],
    choices: [
      { label: '{haram}한테 그 얘기를 다시 꺼낸다', text: '"너 그때 진짜 진지했어." {haram}가 그날 일을 나보다 더 잘 기억하고 있었어요.', effects: E({ mental: 5, intellect: 2 }, { haram: 5 }), highlight: '고등학생 때 말한 꿈을 다시 떠올렸어요.' },
      { label: '혼자 조용히 생각해 본다', text: '조금 돌아왔지만, 아주 멀리 오지는 않았어요.', effects: E({ mental: 3, faith: 2 }) },
    ],
  },
];

// ───────── 큰 행사 (친구들도 이때는 다 온다) ─────────
const offerKid = { label: '어린이회 간사를 맡는다', text: '{jisol}가 "됐다!!!" 하더니 호루라기를 목에 걸어 줬어요. 1학년 때 처음 본 그 호루라기예요. "다음 주부터 아홉 시까지 와. 방석 깔아야 돼."', effects: E({ leadership: 4, charm: 2 }, { gansa: 8 }), flag: KG, record: 'gansa_years', highlight: '어린이회 간사가 되었어요. 다시 어린이회로 돌아가요.' };
const offerSt = { label: '학생회 간사를 맡는다', text: '{youngmin}가 "지, 진짜…? 고마워…!" 하더니 학생회 단톡방 방장을 넘겨줬어요. 넘기다 실수로 방을 나갔다 다시 들어왔어요.', effects: E({ leadership: 4, faith: 2 }, { teacher: 8 }), flag: SG, record: 'gansa_years', highlight: '학생회 간사가 되었어요. 다시 학생회로 돌아가요.' };
const annual = {
  welcome: [
    {
      id: 'un-welcome', title: '대학생회 첫날',
      text: ['대학생회 첫 법회. 법당 문을 여니 낯익은 얼굴이 둘 있어요. 지솔 쌤이랑 영민 쌤이에요. 둘 다 아직도 대학생이래요. "이제 쌤 아니야. 대학생회에선 선배야. 이제부터 {nuna}, {hyung} 해." 간사도 지도 선생님도 없이, 명상하고 밥 먹고, 그날그날 누가 목탁 치고 누가 공지 올리는 곳이래요.'],
      choices: [
        { label: '"…{jisol}!" 하고 불러 본다', text: '{jisol}가 "으아 소름!" 하며 웃었어요. 그리고 바로 사진을 찍었어요. 대학생회 첫날 기념이래요.', effects: E({ charm: 2 }, { gansa: 3 }) },
        { label: '입에 붙은 대로 "쌤!" 해 버린다', text: '{youngmin}가 "쌤… 아니야… {hyung}…" 하며 귀가 빨개졌어요. 결국 한 달 동안 쌤이라고 불렀어요.', effects: E({ mental: 1 }, { teacher: 3 }) },
        { label: '{buddy}랑 맨 뒤에 앉는다', text: '"우리 이제 대학생회다." {buddy}가 작게 하이파이브를 했어요.', effects: E({ mental: 2 }) },
      ],
    },
  ],
  offer: [
    {
      id: 'un-offer-both', title: '두 선배의 부탁', requires: { rel: { gansa: OFFER, teacher: OFFER } },
      text: ['3월, 법회 끝나고 {jisol}가 불러요. "나 이번 학기엔 진짜 졸업해야 돼. 진짜야. 어린이회 간사 네가 맡아 줄래? 너 말고는 맡길 사람이 없어." 그 말이 끝나자마자 {youngmin}가 쭈뼛쭈뼛 다가와요. "저, 저기… 나도… 학생회 간사… 혹시… 아니면 괜찮아…! (진짜 괜찮아)"'],
      choices: [
        offerKid,
        offerSt,
        { label: '둘 다 정중히 거절한다', text: '"제 공부도 벅차서요." 두 선배 다 "그래, 네가 제일 중요해" 했어요. 그래도 조금 아쉬워 보였어요.', effects: E({ mental: 2 }, { gansa: -2, teacher: -2 }), flag: 'uni:declined' },
      ],
    },
    {
      id: 'un-offer-jisol', title: '{jisol}의 부탁', requires: { rel: { gansa: OFFER }, relBelow: { teacher: OFFER } },
      text: ['3월, 법회 끝나고 {jisol}가 계단에 앉으라고 해요. "나 이번 학기엔 진짜 졸업해야 돼. 어린이회 간사 네가 맡아 줄래? 너 1학년 때부터 내가 다 찍어 놨잖아. 너 말고는 맡길 사람이 없어."'],
      choices: [
        offerKid,
        { label: '"생각해 볼게요" 하고 결국 거절한다', text: '{jisol}가 "그래, 그럼 나 졸업 한 학기 더 미룬다" 했어요. 농담인지 진담인지 모르겠어요.', effects: E({ mental: 1 }, { gansa: -2 }), flag: 'uni:declined' },
      ],
    },
    {
      id: 'un-offer-youngmin', title: '{youngmin}의 부탁', requires: { rel: { teacher: OFFER }, relBelow: { gansa: OFFER } },
      text: ['3월, {youngmin}한테서 카톡이 왔어요. "혹시 학생회 간사 해 줄 수 있어?"가 올라왔다가 지워지고, 다시 올라왔다가 지워지고, 결국 전화가 왔어요. "저, 저기… 너라면… 아, 아니면 진짜 괜찮아!"'],
      choices: [
        offerSt,
        { label: '미안하다고 거절한다', text: '"아, 아냐! 괜찮아! 진짜로!" {youngmin}가 세 번 말했어요. 진짜 괜찮은 것 같진 않았어요.', effects: E({ mental: 1 }, { teacher: -2 }), flag: 'uni:declined' },
      ],
    },
    {
      id: 'un-offer-none', title: '새 간사', requires: { relBelow: { gansa: OFFER, teacher: OFFER } },
      text: ['3월, {jisol}가 단톡방에 "어린이회 새 간사 구했다! 이제 나 진짜 졸업한다!"를 올렸어요. 내 이름은 아니었어요. 조금 아쉬웠어요. 근데 {jisol}는 다음 학기에도 졸업을 못 했어요.'],
      choices: [
        { label: '새 간사한테 축하 메시지를 보낸다', text: '"어린이회 잘 부탁해요." 진심이었어요.', effects: E({ mental: 2, charm: 1 }) },
        { label: '{jisol}한테 "{nuna} 졸업 축하… 아직이죠?" 보낸다', text: '"닥쳐ㅋㅋ" 답장이 0.5초 만에 왔어요.', effects: E({ charm: 2 }, { gansa: 2 }) },
      ],
    },
  ],
  lantern: [
    {
      id: 'un-lantern', title: '대학생 연합 연등행렬', maxGrade: 14, requires: { notFlags: [KG, SG] },
      text: ['연등회 날. 평소엔 안 나오던 {jiho}, {seoyun}, {haram}까지 다 왔어요. 대학생 연합 행렬에서 율동을 춰요. 어린이회 때 그 율동의 어른 버전이에요.'],
      choices: [
        { label: '율동을 춘다', minigame: 'dance', roll: R(0.4, 'charm', { text: '몸이 기억하고 있었어요. 종로 한복판에서 넷이 동작이 딱 맞았어요.', effects: E({ charm: 4, health: 2 }, { jiho: 2, seoyun: 2, haram: 2 }), record: 'lantern_dance', highlight: '대학생 연합 연등행렬에서 친구들과 율동을 췄어요.' }, { text: '동작이 어린이회 버전이랑 섞여서 혼자 다른 춤을 췄어요. 넷이 웃느라 행렬이 밀렸어요.', effects: E({ charm: -1, mental: 1 }) }) },
        { label: '연등을 들고 묵묵히 걷는다', text: '종로의 불빛 사이를 걸었어요. 1학년 때 이 길이 엄청 길었는데.', effects: E({ faith: 3, mental: 2 }) },
      ],
    },
    {
      id: 'un-lantern-2', title: '연등회 뒤풀이', minGrade: 15, requires: { notFlags: [KG, SG] },
      text: ['연등행렬이 끝나고 종로 골목. 오랜만에 친구 넷이 다 모였어요. 연등을 든 채로 포장마차에 들어갔어요.'],
      choices: [
        { label: '옛날 얘기로 밤을 새운다', text: '"우리 처음 만난 거 기억나?" 누구는 피구, 누구는 연등, 누구는 고양이를 기억했어요.', effects: E({ mental: 5, charm: 2, health: -2 }, { jiho: 3, seoyun: 3, haram: 3 }), highlight: '연등회 날 친구 넷이 다 모였어요.' },
        { label: '연등 사진을 찍어 단톡방에 올린다', text: '"내년에도 넷이 걷자." 다들 하트를 눌렀어요.', effects: E({ charm: 2 }, { jiho: 2, seoyun: 2, haram: 2 }) },
      ],
    },
    {
      id: 'un-lantern-kg', title: '어린이회 연등행렬 인솔', requires: { flags: [KG] },
      text: ['연등회 날, 이번엔 어린이회 맨 앞에서 아이들을 이끌어요. 코끼리 연등을 든 1학년이 자꾸 대열을 벗어나요.'],
      choices: [
        { label: '아이들 율동을 앞에서 이끈다', minigame: 'dance', roll: R(0.45, 'charm', { text: '내 동작을 보고 아이들이 한 몸처럼 따라왔어요. 구경하던 사람들이 박수를 쳤어요.', effects: E({ charm: 4, leadership: 3 }), record: 'kg_teach', highlight: '어린이회 연등행렬을 앞에서 이끌었어요.' }, { text: '앞을 보느라 뒤를 못 봤어요. 아이 둘이 솜사탕 앞에 서 있었어요.', effects: E({ leadership: -1, mental: -2 }) }) },
        { label: '맨 뒤에서 처지는 아이를 지킨다', text: '연등이 무거워 우는 아이 연등을 같이 들었어요. 지솔 쌤이 그때 내 연등을 들어 줬었어요.', effects: E({ mental: 3, faith: 2 }), record: 'kg_comfort' },
      ],
    },
    {
      id: 'un-lantern-sg', title: '학생회 풍물 인솔', requires: { flags: [SG] },
      text: ['연등회 날, 학생회 풍물패를 따라 걸어요. 이번엔 내가 맨 앞에서 신호를 줘요. 중1 후배들이 내 손만 봐요.'],
      choices: [
        { label: '같이 장단을 친다', minigame: 'pungmul', roll: R(0.45, 'health', { text: '종로 한복판에서 장단이 하나로 맞았어요. 후배들이 끝나고 "쌤 미쳤어요" 했어요.', effects: E({ charm: 3, leadership: 3 }, { teacher: 3 }), record: 'sg_teach', highlight: '학생회 풍물패를 이끌고 연등회를 걸었어요.' }, { text: '신호를 늦게 줘서 후배들이 우왕좌왕했어요. {youngmin}가 옆에서 손으로 박자를 세 줬어요.', effects: E({ leadership: -1, mental: -2 }, { teacher: 2 }) }, { talent: 'music' }) },
        { label: '후배들 물을 챙긴다', text: '생수 스무 병을 들고 따라 걸었어요. 팔이 빠질 것 같았어요.', effects: E({ health: -1, leadership: 2 }), record: 'sg_care' },
      ],
    },
  ],
  buddha: [
    {
      id: 'un-buddha', title: '부처님오신날 봉사', requires: { notFlags: [KG, SG] },
      text: ['부처님오신날. 평소엔 안 오던 친구들도 이날은 다 왔어요. 마당은 사람으로 꽉 찼고, 어린이회 오카리나 소리가 들려요.'],
      choices: [
        { label: '안내 봉사를 한다', text: '길을 물어보시는 할머니를 대웅전까지 모셔다 드렸어요. 열 번쯤요.', effects: E({ faith: 4, health: -1 }) },
        { label: '학생회 부스를 도와준다', text: '떡볶이를 저었어요. 고등학생 때 내가 서 있던 자리예요. 후배가 "선배 간 맞춰 주세요" 했어요.', effects: E({ charm: 2, intellect: 1 }) },
        { label: '친구들이랑 연등 아래서 사진을 찍는다', text: '넷이 연등 아래 섰어요. {jisol}가 어디선가 나타나 "1학년 때랑 같은 자리다!" 하고 찍어 줬어요.', effects: E({ mental: 4 }, { jiho: 2, seoyun: 2, haram: 2, gansa: 2 }), highlight: '부처님오신날, 친구 넷이 연등 아래서 사진을 찍었어요.' },
      ],
    },
    {
      id: 'un-buddha-kg', title: '어린이회 율동 무대 뒤', requires: { flags: [KG] },
      text: ['부처님오신날 무대 뒤. 어린이회 아이들이 한복 입고 줄 서 있어요. 한 명이 "쌤, 저 무대 무서워요" 하며 울먹여요.'],
      choices: [
        { label: '"쌤도 1학년 때 무서웠어" 하고 손을 잡아 준다', text: '아이가 무대에 올라가 끝까지 춤췄어요. 내려와서 나한테 제일 먼저 뛰어왔어요.', effects: E({ charm: 3, mental: 3 }), record: 'kg_comfort', highlight: '부처님오신날, 무서워하던 아이를 무대에 올려 보냈어요.' },
        { label: '"자, 무대에선 웃는 거야!" 하고 단호하게 올려 보낸다', text: '아이가 울음을 꾹 참고 올라갔어요. 생각보다 잘했어요. {jisol}가 옆에서 "너 나랑 똑같다" 했어요.', effects: E({ leadership: 4 }, { gansa: 3 }), record: 'kg_scold' },
      ],
    },
    {
      id: 'un-buddha-sg', title: '학생회 부스 감독', requires: { flags: [SG] },
      text: ['부처님오신날, 학생회 떡볶이 부스. 이번엔 내가 감독이에요. 후배들이 고추장을 통째로 넣으려고 해요.'],
      choices: [
        { label: '간을 직접 맞춘다', roll: R(0.45, 'intellect', { text: '두 시간 만에 완판! 후배들이 헹가래를 치려다 포기했어요.', effects: E({ intellect: 3, leadership: 3 }), record: 'booth_sold' }, { text: '너무 매워서 어르신들이 물만 찾으셨어요. 후배들이 "쌤 탓"이래요.', effects: E({ mental: -2 }) }) },
        { label: '후배들한테 맡기고 지켜본다', text: '엉망진창이었지만 다 팔았어요. 후배들이 뿌듯해했어요.', effects: E({ leadership: 3 }), record: 'sg_care' },
      ],
    },
  ],
  vacation: [
    {
      id: 'un-vac-temple-tour', title: '외부 절 탐방', requires: { notFlags: [KG, SG] },
      text: ['방학, 대학생회가 지방의 오래된 절로 탐방을 갔어요. {jisol}가 운전하고 {youngmin}가 길을 잘못 알려 줬어요.'],
      choices: [
        { label: '새벽 예불에 나간다', roll: R(0.45, 'health', { text: '별이 쏟아지는 산사 마당에서 예불을 드렸어요. 화계사랑은 또 다른 소리였어요.', effects: E({ faith: 6, mental: 3 }), record: 'temple_tour', highlight: '외부 절 탐방에서 새벽 예불을 드렸어요.' }, { text: '못 일어났어요. {jisol}가 자는 사진을 찍어 놨어요.', effects: E({ faith: 1, health: 2 }) }) },
        { label: '스님께 절의 역사를 여쭌다', text: '천 년 된 탑 이야기를 들었어요. 수첩 두 쪽을 채웠어요.', effects: E({ intellect: 4, faith: 2 }), record: 'temple_tour' },
        { label: '산사 앞 카페에서 쉰다', text: '창밖이 온통 산이었어요. {buddy}랑 아무 말 없이 한 시간을 앉아 있었어요.', effects: E({ mental: 5 }) },
      ],
    },
    {
      id: 'un-vac-union', title: '연합 수련회',
      requires: { notFlags: [KG, SG] },
      text: ['여름방학, 전국 대학생 불자 연합 수련회에 갔어요. 수백 명이 한 법당에서 명상해요.'],
      choices: [
        { label: '조별 활동에 적극적으로 나선다', roll: R(0.4, 'leadership', { text: '조장이 됐어요. 처음 본 사람들이 마지막 날 울면서 번호를 교환했어요.', effects: E({ leadership: 5, charm: 3 }), record: 'uni_union' }, { text: '낯을 가려서 조원 이름도 다 못 외웠어요.', effects: E({ mental: -2 }) }) },
        { label: '명상 시간에 집중한다', text: '수백 명이 숨 쉬는 소리만 들렸어요. 이상하게 혼자가 아닌 것 같았어요.', effects: E({ faith: 5, mental: 3 }), record: 'meditation' },
      ],
    },
    {
      id: 'un-vac-temple-tour2', title: '겨울 사찰 순례', minGrade: 15, requires: { notFlags: [KG, SG] },
      text: ['겨울방학, 눈 덮인 산사 세 곳을 도는 순례를 갔어요. 이번엔 행사라 친구들도 다 왔어요.'],
      choices: [
        { label: '눈길을 끝까지 걷는다', text: '마지막 절에 도착했을 때 다들 말이 없었어요. 좋아서요.', effects: E({ health: 3, faith: 4 }, { jiho: 2, seoyun: 2, haram: 2 }), record: 'temple_tour' },
        { label: '숙소에서 넷이 수다 떤다', text: '"우리 이러다 할머니 할아버지 돼서도 같이 오겠다." 다들 웃었는데 진심이었어요.', effects: E({ mental: 5 }, { jiho: 3, seoyun: 3, haram: 3 }) },
      ],
    },
    {
      id: 'un-vac-kidcamp', title: '물놀이캠프, 이번엔 간사', requires: { flags: [KG] },
      text: ['어린이회 물놀이캠프. 마당에 큰 물놀이 기구가 들어왔어요. 이번엔 내가 호루라기를 물었어요. 학생회 후배들이 봉사하러 왔어요.'],
      choices: [
        { label: '호루라기를 불며 안전을 지킨다', text: '"미끄럼틀은 한 명씩!" 아이들이 투덜대도 아무도 안 다쳤어요. 지솔 쌤이 왜 그렇게 호루라기를 불었는지 알겠어요.', effects: E({ leadership: 5 }, { gansa: 4 }), record: 'kg_camp', highlight: '간사로 어린이회 물놀이캠프를 꾸렸어요.' },
        { label: '물총 과녁이 되어 준다', text: '온몸이 젖었어요. 아이들이 "쌤 항복해!" 했어요. 항복했어요.', effects: E({ charm: 4, health: 2 }), record: 'kg_play' },
        { label: '밤에 무서운 이야기를 해 준다', text: '1학년 때 지솔 쌤한테 들었던 그 이야기예요. 아이들이 비명을 지르다 내 옆에 붙어 잤어요.', effects: E({ charm: 3, health: -1 }), record: 'kg_play' },
      ],
    },
    {
      id: 'un-vac-stcamp', title: '학생회 템플스테이 인솔', requires: { flags: [SG] },
      text: ['학생회 템플스테이에 간사로 따라왔어요. 새벽 3시 반, 후배들을 깨워야 해요. 다들 이불 속에서 꿈틀거려요.'],
      choices: [
        { label: '"기상!" 하고 이불을 걷는다', text: '후배들이 "쌤 윤 선생님 같아요"래요. 칭찬인지 모르겠어요.', effects: E({ leadership: 4, faith: 2 }), record: 'sg_care' },
        { label: '한 명씩 조용히 깨운다', text: '"일어나…? 아니면 5분만 더…?" 후배들이 웃으며 일어났어요. 영민 쌤 말투가 나왔어요.', effects: E({ charm: 3 }, { teacher: 4 }), record: 'sg_care', highlight: '간사로 학생회 템플스테이를 인솔했어요.' },
      ],
    },
    {
      id: 'un-vac-stski', title: '학생회 스키캠프 인솔', requires: { flags: [SG] },
      text: ['겨울, 학생회 스키캠프에 간사로 따라왔어요. 중1 후배가 리프트 앞에서 얼어 있어요.'],
      choices: [
        { label: '같이 리프트를 탄다', roll: R(0.4, 'health', { text: '초보 코스를 손잡고 내려왔어요. 후배가 처음 혼자 내려오자 같이 소리 질렀어요.', effects: E({ health: 3, leadership: 3 }), record: 'sg_teach' }, { text: '같이 넘어졌어요. 리프트 앞에서. 둘 다.', effects: E({ health: -2, charm: 1 }) }) },
        { label: '숙소에서 컵라면을 끓여 준다', text: '후배들이 "쌤 엄마 같아요"래요.', effects: E({ charm: 2 }), record: 'sg_care' },
      ],
    },
  ],
  newyear: [
    {
      id: 'un-newyear', title: '제야의 종', maxGrade: 15,
      text: ['12월 31일 밤. 대학생회는 범종각 타종 행사를 도와요. 평소엔 안 오던 친구들도 이날은 다 왔어요.'],
      choices: [
        { label: '줄 안내를 한다', text: '목이 쉬도록 안내했어요. 자정 종소리가 울리자 넷이 서로 껴안았어요.', effects: E({ leadership: 2, faith: 3 }, { jiho: 2, seoyun: 2, haram: 2 }), record: 'st_bell' },
        { label: '따뜻한 차를 나눠 드린다', text: '종이컵 300개를 다 썼어요. 손은 시려도 마음은 따뜻했어요.', effects: E({ faith: 3, mental: 2 }), record: 'st_bell' },
      ],
    },
    {
      id: 'un-newyear-kids', title: '어린이회 아이들과 제야', minGrade: 14, maxGrade: 15,
      text: ['12월 31일 밤. 어린이회 아이들이 부모님 손을 잡고 타종을 보러 왔어요. "{senior}! 저도 종 쳐 봐도 돼요?"'],
      choices: [
        { label: '아이를 안아 올려 종 줄을 잡게 해 준다', text: '"댕—" 아이가 자기가 친 종소리에 깜짝 놀라 울다가 웃었어요.', effects: E({ charm: 3, faith: 2 }), record: 'st_bell' },
        { label: '아이들 손난로를 챙겨 준다', text: '주머니에 손난로 열 개를 넣어 왔는데 5분 만에 다 나갔어요.', effects: E({ leadership: 2, mental: 2 }), record: 'st_bell' },
      ],
    },
    {
      id: 'un-newyear-last', title: '마지막 제야', minGrade: 16,
      text: ['대학생회로 맞는 마지막 제야. 종소리를 들으며 친구 넷이 범종각 계단에 앉았어요. 초등학생 때도 여기 앉아 있었어요.'],
      choices: [
        { label: '소원지에 "다들 오래 보자" 쓴다', text: '친구들이 그 밑에 다 이름을 적었어요. 어린이회 때랑 똑같이.', effects: E({ mental: 4 }, { jiho: 3, seoyun: 3, haram: 3 }), record: 'st_bell' },
        { label: '종소리에 맞춰 합장한다', text: '108번째 종소리가 오래 남았어요.', effects: E({ faith: 5 }), record: 'st_bell' },
      ],
    },
  ],
  president: [
    {
      id: 'un-election', title: '대학생회 회장',
      text: ['대3, 대학생회 회장을 정하는 날. 회장이라 해 봐야 단톡방 공지 올리고 연합 모임 나가는 사람이에요. {jisol}가 "나는 졸업해야 돼서 안 돼(진짜야)" 하며 다들 쳐다봐요.'],
      choices: [
        { label: '"제가 할게요" 한다', roll: { chance: -0.55, stat: 'leadership', statWeight: 0.008, stat2: 'charm', friends: true, friendsWeight: 0.4, success: { text: '박수로 정해졌어요. 스님이 "이제 잔소리는 네가 해라" 하셨어요.', effects: E({ leadership: 6, charm: 2 }, { monk: 3 }), flag: 'uni_president', highlight: '대학생회 회장이 되었어요.' }, fail: { text: '{buddy}가 동시에 손을 들었어요. 가위바위보에서 졌어요.', effects: E({ mental: -2 }), flag: 'uni_president_lost' } } },
        { label: '{buddy}를 민다', text: '{buddy}가 회장이 됐어요. "너 부회장 해." 그런 자리는 원래 없는데 생겼어요.', effects: E({ leadership: 2 }), record: 'uni_member' },
        { label: '조용히 눈을 피한다', text: '{youngmin}가 떠밀려 또 회장이 됐어요. 졸업은 또 미뤄졌어요.', effects: E({ mental: 1 }, { teacher: 1 }), record: 'uni_member' },
      ],
    },
  ],
  graduation: [
    {
      id: 'un-graduation', title: '대학교 졸업, 대학생회 졸업',
      text: ['대학교 졸업식 다음 일요일. 대학생회 마지막 법회예요. 초등학교 1학년 때 처음 온 화계사를 16년 만에 졸업해요. 그런데 {jisol}랑 {youngmin}는 아직도 졸업을 못 했어요. 내가 먼저 졸업해요.'],
      choices: [
        { label: '스님께 큰절을 올린다', text: '스님이 "졸업은 무슨. 일요일에 또 와라" 하셨어요.', effects: E({ faith: 5 }, { monk: 5 }) },
        { label: '오늘은 내가 목탁을 친다', text: '마지막 예불 목탁. 똑, 똑, 똑. 16년이 이 소리 안에 다 있었어요.', effects: E({ faith: 4, mental: 3 }) },
        { label: '두 선배한테 "먼저 갑니다" 인사한다', text: '{jisol}가 "배신자!!!" 하면서 울었어요. {youngmin}는 말을 더듬다 그냥 꽉 안아 줬어요.', effects: E({ mental: 4 }, { gansa: 6, teacher: 6 }) },
      ],
      addenda: [
        { flags: [KG], text: '어린이회 아이들이 "쌤 졸업하지 마요!" 하며 다리에 매달렸어요.', group: 'role' },
        { flags: [SG], text: '학생회 후배들이 풍물로 졸업 축하 장단을 쳐 줬어요.', group: 'role' },
        { flags: ['uni_president'], text: '회장 때 쓰던 단톡방 방장을 후배에게 넘겼어요.', group: 'role2' },
        { flags: ['jiho_sendoff'], text: '{jiho}가 "피구왕은 내가 가져간다" 하며 웃었어요.', group: 'jiho' },
        { flags: ['kittens'], text: '공양간 쪽에서 {cat}의 손주들이 울었어요.', group: 'cat' },
      ],
    },
  ],
};

// ───────── 칭호·후일담 ─────────
const U = 'stage:university';
const titles = [
  { id: 'un-kid-gansa', name: '어린이회 간사', when: { flags: [KG] } },
  { id: 'un-st-gansa', name: '학생회 간사', when: { flags: [SG] } },
  { id: 'un-president', name: '대학생회 회장', when: { flags: ['uni_president'] } },
  { id: 'un-mc', name: '목탁 당번', when: { flags: [U], records: { moktak_good: 3 } } },
  { id: 'un-meditation', name: '명상 고수', when: { flags: [U], records: { meditation: 4 } } },
  { id: 'un-sns', name: '대학생회 SNS 지킴이', when: { records: { uni_sns: 2 } } },
  { id: 'un-tour', name: '산사 순례자', when: { records: { temple_tour: 2 } } },
  { id: 'un-sixteen', name: '16년 개근', when: { flags: [U], attendRate: 1 } },
];
const cards = [
  { id: 'un-c-kid-gansa', priority: 9, when: { flags: [U, KG] }, text: '어린이회 간사로 몇 해를 보냈다. 휴대폰 사진첩은 남의 집 아이들 사진으로 가득 찼고, 어느 날 거울 속 내가 지솔 쌤처럼 웃고 있었다.' },
  { id: 'un-c-st-gansa', priority: 9, when: { flags: [U, SG] }, text: '학생회 간사로 몇 해를 보냈다. 단톡방에 쓴 공지를 몇 번이고 지웠고, 영민 쌤은 그걸 볼 때마다 "ㅋㅋㅋ 너도구나"를 보냈다.' },
  { id: 'un-c-declined', priority: 6, when: { flags: [U, 'uni:declined'] }, text: '간사 제의를 거절한 걸 가끔 생각한다. 그래도 그해 일요일마다 대학생회 방석은 빠짐없이 깔았다.' },
  { id: 'un-c-president', priority: 8, when: { flags: [U, 'uni_president'] }, text: '대학생회 회장이라고 해 봐야 공지 올리는 사람이었다. 그래도 그 공지 덕에 명상 시간이 한 번도 비지 않았다.' },
  { id: 'un-c-buddy', priority: 7, when: { flags: [U], attendRate: 0.7 }, text: '{buddy}와는 대학생이 되어서도 일요일마다 절에서 만났다. 나머지 둘은 행사 때만 왔지만, 행사 때는 꼭 왔다.' },
  { id: 'un-c-jisol', priority: 7, when: { flags: [U], rel: { gansa: 90 } }, text: '지솔 {nuna}는 결국 내가 졸업하고 한 학기 뒤에 졸업했다. 졸업식 사진은 내가 찍어 줬다. 16년 만에 처음으로.' },
  { id: 'un-c-youngmin', priority: 7, when: { flags: [U], rel: { teacher: 90 } }, text: '{youngmin}는 아직도 대학생회 단톡방에 "다들 잘 지내…?"를 쓴다. 이제는 안 지운다.' },
  { id: 'un-c-jiho', priority: 6, when: { flags: [U, 'jiho_sendoff'] }, text: '{jiho}는 제대하고 대학생회 피구 모임을 만들었다. 세 명으로 시작해서 아직 세 명이다.' },
  { id: 'un-c-seoyun', priority: 6, when: { flags: [U, 'seoyun_beads'] }, text: '{seoyun}는 아직도 그 단주를 찬다. 낯선 나라 출장지에서도 절을 찾아 사진을 보낸다.' },
  { id: 'un-c-default', priority: 3, when: { flags: [U] }, text: '초등학교 1학년 때 처음 간 화계사를, 대학교를 졸업하며 함께 졸업했다. 일요일 아침이 되면 아직도 몸이 먼저 수유역으로 향한다.' },
];

// ───────── 연출 ─────────
const kids = (n, pose) => ({ stage: 'kid', n, ...(pose ? { pose } : {}) });
const studs = (n, pose) => ({ stage: 'student', n, ...(pose ? { pose } : {}) });
const scenes = {
  'un-am-kg': { bg: 'home', cast: [] },
  'un-am-kg2': { bg: 'home', cast: [] },
  'un-am-sg': { bg: 'home', cast: [] },
  'un-moktak': { pose: 'hapjang', cast: ['gansa'] },
  'un-mc': { cast: ['teacher'] },
  'un-sns': { cast: ['gansa'] },
  'un-meditation': { pose: 'hapjang' },
  'un-meditation-walk': { bg: 'outdoor-buddha', pose: 'hapjang' },
  'un-meditation-candle': { night: true, pose: 'hapjang' },
  'un-108': { pose: 'hapjang', cast: ['gansa'] },
  'un-dharma': { pose: 'hapjang', cast: ['monk'] },
  'un-teatime': { pose: 'hapjang', cast: ['monk'] },
  'un-meal': { bg: 'lantern-street', night: true },
  'un-drink': { bg: 'lantern-street', night: true, cast: ['teacher', 'gansa'] },
  'un-cafe': { bg: 'lantern-street' },
  'un-union-dharma': { pose: 'hapjang' },
  'un-senior-talk': { bg: 'courtyard', cast: ['gansa'] },
  'un-kg-dodge': { bg: 'courtyard', pose: 'run', cast: [], juniors: kids(3, 'run') },
  'un-kg-dance': { bg: 'kids-room', pose: 'happy', cast: [], juniors: kids(3, 'happy') },
  'un-kg-photo': { bg: 'kids-room', pose: 'happy', cast: [], juniors: kids(3) },
  'un-kg-cry': { bg: 'kids-room', pose: 'angry', cast: [], juniors: kids(2, 'cry') },
  'un-kg-tease': { bg: 'kids-room', pose: 'happy', cast: [], juniors: kids(3, 'happy') },
  'un-kg-sleepy': { bg: 'kids-room', cast: ['monk'], juniors: kids(2, 'hapjang') },
  'un-kg-snack': { bg: 'kids-room', cast: [], juniors: kids(3) },
  'un-kg-cat': { bg: 'bell-yard', cat: true, kittens: 2, cast: [], juniors: kids(2, 'happy') },
  'un-kg-president': { bg: 'kids-room', pose: 'hapjang', cast: [], juniors: kids(1, 'hapjang') },
  'un-sg-pungmul': { bg: 'courtyard', cast: [], juniors: studs(3) },
  'un-sg-chat': { cast: ['teacher'] },
  'un-sg-moktak': { pose: 'hapjang', cast: [], juniors: studs(1, 'hapjang') },
  'un-sg-reels': { bg: 'courtyard', pose: 'happy', cast: [], juniors: studs(3, 'happy') },
  'un-sg-karaoke': { bg: 'lantern-street', night: true, pose: 'happy', cast: [], juniors: studs(3, 'happy') },
  'un-sg-csat': { cast: [], juniors: studs(2) },
  'un-story-friends-fade': {},
  'un-story-jisol-forever': { cast: ['gansa'] },
  'un-story-youngmin-shy': { cast: ['teacher'] },
  'un-story-cry-burnout': { pose: 'cry' },
  'un-story-cat': { bg: 'bell-yard', cat: true, kittens: 2, cast: [] },
  'un-story-jung': { bg: 'lantern-temple', cast: [] },
  'un-cb-jiho-back': { bg: 'courtyard', pose: 'happy', cast: ['jiho'] },
  'un-welcome': { cast: ['gansa', 'teacher'] },
  'un-offer-both': { bg: 'courtyard', cast: ['gansa', 'teacher'] },
  'un-offer-jisol': { bg: 'courtyard', cast: ['gansa'] },
  'un-offer-youngmin': { bg: 'home', cast: ['teacher'] },
  'un-offer-none': { cast: ['gansa'] },
  'un-lantern': { bg: 'lantern-street', night: true, pose: 'happy', cast: ['jiho', 'seoyun', 'haram'] },
  'un-lantern-2': { bg: 'lantern-street', night: true, cast: ['jiho', 'seoyun', 'haram'] },
  'un-lantern-kg': { bg: 'lantern-street', night: true, pose: 'run', cast: [], juniors: kids(3, 'run') },
  'un-lantern-sg': { bg: 'lantern-street', night: true, pose: 'run', cast: [], juniors: studs(3, 'run') },
  'un-buddha': { bg: 'lantern-temple', cast: ['jiho', 'seoyun', 'haram'] },
  'un-buddha-kg': { bg: 'lantern-temple', cast: [], juniors: kids(2) },
  'un-buddha-sg': { bg: 'lantern-temple', cast: [], juniors: studs(2) },
  'un-vac-temple-tour': { bg: 'outdoor-buddha', pose: 'hapjang', cast: ['gansa', 'teacher'] },
  'un-vac-union': { pose: 'hapjang' },
  'un-vac-temple-tour2': { bg: 'outdoor-buddha', cast: ['jiho', 'seoyun', 'haram'] },
  'un-vac-kidcamp': { bg: 'water-camp', pose: 'run', cast: [], juniors: kids(3, 'run') },
  'un-vac-stcamp': { bg: 'students-room', night: true, cast: [], juniors: studs(3) },
  'un-vac-stski': { bg: 'courtyard', cast: [], juniors: studs(1, 'surprised') },
  'un-newyear': { bg: 'bell-yard', night: true, cast: ['jiho', 'seoyun', 'haram'] },
  'un-newyear-kids': { bg: 'bell-yard', night: true, pose: 'happy', cast: [], juniors: kids(2, 'happy') },
  'un-newyear-last': { bg: 'bell-yard', night: true, pose: 'hapjang', cast: ['jiho', 'seoyun', 'haram'] },
  'un-election': { cast: ['gansa', 'teacher'] },
  'un-graduation': { bg: 'students-room', cast: ['gansa', 'teacher', 'monk'], castPose: { gansa: 'cry', teacher: 'cry' } },
};

const w = (f, d) => fs.writeFileSync(OUT + f, JSON.stringify(d, null, 2) + '\n');
w('sunday.json', { attend, return: ret });
w('status.json', status);
w('programs.json', programs);
w('stories.json', stories);
w('annual.json', annual);

const ep = ROOT + 'src/data/epilogue.json';
const e = JSON.parse(fs.readFileSync(ep, 'utf8'));
e.titles = [...e.titles.filter((t) => !t.id.startsWith('un-')), ...titles];
e.cards = [...e.cards.filter((c) => !c.id.startsWith('un-')), ...cards];
fs.writeFileSync(ep, JSON.stringify(e, null, 2) + '\n');

const sp = ROOT + 'src/art/scenes.json';
const sc = JSON.parse(fs.readFileSync(sp, 'utf8'));
for (const k of Object.keys(sc.scenes)) if (k.startsWith('un-')) delete sc.scenes[k];
Object.assign(sc.scenes, scenes);
sc.defaults.welcome = { bg: 'students-room' };
sc.defaults.offer = { bg: 'courtyard' };
fs.writeFileSync(sp, JSON.stringify(sc, null, 2) + '\n');

// 대학생회의 두 선배
const cp = ROOT + 'src/data/characters.json';
const ch = JSON.parse(fs.readFileSync(cp, 'utf8'));
ch.university = {
  gansa: { name: '지솔 언니·누나', role: '대학생회 선배', desc: '어린이회 때 지솔 쌤. 아직도 대학교를 졸업 못 했어요("이번 학기엔 진짜"). 대학생회에서는 선배라 언니·누나라고 불러요. 사진 찍는 버릇은 그대로예요.' },
  teacher: { name: '영민 오빠·형', role: '대학생회 선배', desc: '학생회 때 영민 쌤. 이 사람도 아직 졸업을 못 했어요. 여전히 착하고 어리바리하고, 단톡방에 쓴 말을 자주 지워요.' },
  monk: { name: '스님', role: '지도법사 스님', desc: '대학생회 법회에서는 법문하시고 질문을 받아 주세요. 나머지는 "너희가 알아서 해 봐라" 하세요.' },
};
fs.writeFileSync(cp, JSON.stringify(ch, null, 2) + '\n');
console.log({ attend: attend.length, programs: programs.length, stories: stories.length, titles: titles.length, cards: cards.length });
