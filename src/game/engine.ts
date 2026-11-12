// 게임 규칙. React와 무관한 순수 함수라서 시뮬레이션 스크립트에서도 그대로 쓴다.
import programsData from '../data/programs.json';
import statusData from '../data/status.json';
import sundayData from '../data/sunday.json';
import annualData from '../data/annual.json';
import epilogueData from '../data/epilogue.json';
import endingsData from '../data/endings.json';
import sideData from '../data/side-choices.json';
import storiesData from '../data/stories.json';
import charactersData from '../data/characters.json';
import stProgramsData from '../data/student/programs.json';
import stStoriesData from '../data/student/stories.json';
import stSundayData from '../data/student/sunday.json';
import stAnnualData from '../data/student/annual.json';
import stStatusData from '../data/student/status.json';
import unProgramsData from '../data/university/programs.json';
import unStoriesData from '../data/university/stories.json';
import unSundayData from '../data/university/sunday.json';
import unAnnualData from '../data/university/annual.json';
import unStatusData from '../data/university/status.json';
import { CHAPTERS, LAST_CHAPTER, SEASON_LINES, STAGE_FIRST_CHAPTER } from './calendar';

const KIDS_LAST_GRADE = 6;
const STUDENT_LAST_GRADE = 12;
import { catName, seniorName, uniBuddy } from './names';
import {
  REL_KEYS,
  STAT_KEYS,
  type Choice,
  type Cond,
  type Deltas,
  type Effects,
  type FriendKey,
  FRIEND_KEYS,
  type GameEvent,
  type GameState,
  type Gender,
  type MinigameKind,
  type Stage,
  stageOf,
  type Outcome,
  type RelKey,
  type StatKey,
  type Traits,
  type YearReport,
} from './types';

export type Rng = () => number;

/** 학생회 데이터는 src/data/student/ 에 따로 두고, 불러올 때 stage를 붙인다 */
const asStage = (stage: Stage) => (arr: unknown) => (arr as GameEvent[]).map((e) => ({ ...e, stage }));
const asStudent = asStage('student');
const asUniv = asStage('university');
const PROGRAMS = [...(programsData as GameEvent[]), ...asStudent(stProgramsData), ...asUniv(unProgramsData)];
const STATUS = [...(statusData as GameEvent[]), ...asStudent(stStatusData), ...asUniv(unStatusData)];
const ATTENDS = [
  ...(sundayData.attend as unknown as GameEvent[]),
  ...asStudent(stSundayData.attend),
  ...asUniv(unSundayData.attend),
];
const RETURNS: Record<Stage, GameEvent | null> = {
  kid: sundayData.return as GameEvent,
  student: { ...(stSundayData.return as unknown as GameEvent), stage: 'student' },
  university: { ...(unSundayData.return as unknown as GameEvent), stage: 'university' },
};
const ANNUAL: Record<string, GameEvent[]> = { ...(annualData as unknown as Record<string, GameEvent[]>) };
for (const [data, tag] of [[stAnnualData, asStudent], [unAnnualData, asUniv]] as const)
  for (const [k, v] of Object.entries(data as unknown as Record<string, GameEvent[]>)) ANNUAL[k] = [...(ANNUAL[k] ?? []), ...tag(v)];
const STORIES = [...(storiesData as unknown as GameEvent[]), ...asStudent(stStoriesData), ...asUniv(unStoriesData)];

/** 출석한 일요일에 프로그램 대신 이야기 이벤트가 나올 확률 (조건 맞는 게 있을 때) */
const STORY_CHANCE = 0.5;
/** 기억 표시로 열린 '돌아오는 장면'이 나올 확률 */
const CALLBACK_CHANCE = 0.85;
/** 맡은 역할(학년 대표, 회장 등)의 장면이 그 주 프로그램 대신 나올 확률 */
const ROLE_CHANCE = 0.6;
/** 대학생 간사가 되면 일요일은 거의 다시 어린이회·학생회에서 보낸다 */
const GANSA_ROLE_CHANCE = 0.85;
/** 갈림길(투표)이 있는 일정. 빠르게 넘기기도 여기서는 멈춘다 */
/** 최근에 본 장면은 이만큼 지나야 다시 나온다 */
const RECENT_WINDOW = 14;

/** 어린이회 때 열려 있는 스탯 (리더십은 학생회부터) */
export const OPEN_STATS: StatKey[] = ['health', 'intellect', 'charm', 'mental', 'faith'];
export function openStats(grade: number): StatKey[] {
  return grade <= KIDS_LAST_GRADE ? OPEN_STATS : ['health', 'intellect', 'charm', 'mental', 'leadership', 'faith'];
}

/** 한 판이 장면 30개 남짓이라 한 장면에서 오르는 폭을 크게 둔다 */
const GAIN_SCALE = 3;
/** 잃는 쪽도 크게: 무언가를 고르면 확실히 다른 무언가를 놓친다 */
const LOSS_SCALE = 2.4;
/** 사람과의 정도 선택에 따라 크게 움직인다 */
const REL_SCALE = 1.3;
/** 단계별 스탯 목표치. 이 근처에 가까워질수록 오르는 폭이 줄어든다 */
const SOFT_CAP: Record<Stage, number> = { kid: 48, student: 62, university: 75 };
const STAGE_GAIN: Record<Stage, number> = { kid: 1, student: 1, university: 1 };
/** 스탯마다 오르는 빠르기: 매력·멘탈·신앙은 장면 곳곳에서 오르니 느리게, 나머지는 빠르게 (끝 스탯이 고르게 퍼지도록) */
const STAT_GAIN: Record<StatKey, number> = { health: 1.25, intellect: 1.25, charm: 0.7, mental: 0.55, leadership: 1.4, faith: 0.8 };
/** 일요일 법회에 나가기만 해도 쌓이는 정 */
const SUNDAY_REL = 2;
const STATUS_THRESHOLD = 30;
/** 신앙은 원래 낮게 시작하는 스탯이라 기준을 따로 둔다 */
const FAITH_STATUS_THRESHOLD = 12;
const STATUS_CHANCE = 0.55;
const RETURN_AFTER_ABSENCES = 3;

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
const pick = <T,>(arr: T[], rng: Rng): T => arr[Math.floor(rng() * arr.length)];
const emptyDeltas = (): Deltas => ({ stats: {}, rel: {} });

// ---------- 시작 ----------

function rollTraits(rng: Rng): Traits {
  return {
    temper: rng() < 0.5 ? 'active' : 'calm',
    talent: pick(['music', 'sports', 'craft'] as const, rng),
    lateFaith: rng() < 0.2,
  };
}

export function newGame(name: string, gender: Gender, rng: Rng): GameState {
  const r = (base: number, spread: number) => Math.round(base + rng() * spread);
  const stats = {
    health: r(30, 12),
    intellect: r(25, 12),
    charm: r(25, 12),
    mental: r(32, 10),
    leadership: 0,
    faith: r(14, 8),
  };
  const state: GameState = {
    phase: 'play',
    name: name.trim() || '나',
    gender,
    friends: pickFriendNames(rng),
    seen: [],
    // 이번 판의 고양이 (세 마리 중 하나)
    flags: [`cat:${1 + Math.floor(rng() * 3)}`],
    traits: rollTraits(rng),
    stats,
    rel: { jiho: 30, seoyun: 25, haram: 25, gansa: 35, teacher: 35, monk: 20 },
    grade: CHAPTERS[0].slots[0].grade,
    chapter: 0,
    slotIndex: 0,
    event: null,
    eventText: '',
    result: null,
    carry: null,
    prelude: null,
    lastNote: null,
    records: {},
    attendance: { yearWent: 0, yearTotal: 0, went: 0, total: 0 },
    absentStreak: 0,
    recentPrograms: [],
    yearHighlights: [],
    yearStartStats: { ...stats },
    yearReport: null,
    log: [],
  };
  return prepareSlot(state, rng);
}

// ---------- 장면 고르기 ----------

export function currentSlot(state: GameState) {
  return CHAPTERS[state.chapter ?? 0].slots[state.slotIndex];
}

/** 이번 판 친구 이름 뽑기 (셋이 겹치지 않게) */
function pickFriendNames(rng: Rng): Record<FriendKey, string> {
  const used = new Set<string>();
  const out = {} as Record<FriendKey, string>;
  for (const k of FRIEND_KEYS) {
    const pool = ((charactersData as Record<string, { pool?: string[] }>)[k].pool ?? []).filter((n) => !used.has(n));
    out[k] = pick(pool, rng);
    used.add(out[k]);
  }
  return out;
}

/** 받침이 있는 이름은 "서윤이"처럼 '이'를 붙여 부른다. 그래서 뒤에 오는 조사는 늘 받침 없는 꼴(가/는/를/와)이 맞는다. */
export function friendlyName(name: string): string {
  return hasFinal(name) ? name + '이' : name;
}

function hasFinal(name: string): boolean {
  const code = name.charCodeAt(name.length - 1) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 !== 0;
}

/** 부르는 말: 받침이 있으면 "한솔아", 없으면 "지호야" */
function callName(name: string): string {
  const code = name.charCodeAt(name.length - 1) - 0xac00;
  const hasFinal = code >= 0 && code <= 11171 && code % 28 !== 0;
  return name + (hasFinal ? '아' : '야');
}

export function fillTokens(raw: string, state: GameState, rng: Rng): string {
  const slot = currentSlot(state);
  const month = slot?.month ?? 0;
  const season = SEASON_LINES[month] ? pick(SEASON_LINES[month], rng) : '';
  return raw
    .replaceAll('{season}', season)
    .replaceAll('{senior}', state.gender === 'male' ? '형·오빠' : '언니·누나')
    .replaceAll('{month}', String(month))
    .replaceAll('{grade}', String(state.grade))
    .replaceAll('{jiho}', friendlyName(state.friends.jiho))
    .replaceAll('{seoyun}', friendlyName(state.friends.seoyun))
    .replaceAll('{haram}', friendlyName(state.friends.haram))
    .replaceAll('{cat}', catName(state))
    .replaceAll('{buddy}', friendlyName(state.friends[uniBuddy(state)]))
    // 지솔 언니·누나 / 영민 오빠·형: '형'은 받침이 있어서 뒤 조사를 바꿔 준다 (데이터에는 받침 없는 꼴로 쓴다)
    .replace(/\{(jisol|youngmin)\}(가|는|를|랑|와)?/g, (_, who: string, josa?: string) => {
      const n = seniorName(who === 'jisol' ? 'gansa' : 'teacher', state.gender);
      if (!josa) return n;
      const alt: Record<string, string> = { 가: '이', 는: '은', 를: '을', 랑: '이랑', 와: '과' };
      return n + (hasFinal(n) ? alt[josa] : josa);
    })
    .replaceAll('{nuna}', state.gender === 'male' ? '누나' : '언니')
    .replaceAll('{hyung}', state.gender === 'male' ? '형' : '오빠')
    .replaceAll('{nameCall}', callName(state.name))
    .replaceAll('{name}', state.name)
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function fillText(event: GameEvent, state: GameState, rng: Rng): string {
  const raw = Array.isArray(event.text) ? pick(event.text, rng) : event.text;
  // 몇 년 전 선택이 남긴 기억이 있으면 그 장면을 떠올리는 문장을 덧붙인다
  // 같은 사람(group)의 회상은 하나만
  const groups = new Set<string>();
  const memories = (event.addenda ?? [])
    .filter((a) => a.flags.every((f) => state.flags.includes(f)))
    .filter((a) => !a.group || (groups.has(a.group) ? false : (groups.add(a.group), true)))
    .map((a) => fillTokens(a.text, state, rng));
  return [fillTokens(raw, state, rng), ...memories].join('\n');
}

/** 학년·달·조건이 맞는 이벤트인지 */
function eligible(e: GameEvent, state: GameState): boolean {
  if ((e.stage ?? 'kid') !== stageOf(state.grade)) return false;
  if (e.minGrade && state.grade < e.minGrade) return false;
  if (e.maxGrade && state.grade > e.maxGrade) return false;
  const month = currentSlot(state)?.month;
  if (e.months && !e.months.includes(month)) return false;
  if (e.requires && !meets(state, e.requires)) return false;
  return true;
}

/** 최근에 안 본 것 우선, 그중에서도 한 번도 안 본 것 우선 */
function pickFresh(pool: GameEvent[], state: GameState, rng: Rng): GameEvent {
  const notRecent = pool.filter((e) => !state.recentPrograms.includes(e.id));
  const base = notRecent.length ? notRecent : pool;
  const unseen = base.filter((e) => !state.seen.includes(e.id));
  return pick(unseen.length && rng() < 0.7 ? unseen : base, rng);
}

function remember(state: GameState, id: string): GameState {
  return {
    ...state,
    recentPrograms: [...state.recentPrograms.filter((x) => x !== id), id].slice(-RECENT_WINDOW),
    seen: state.seen.includes(id) ? state.seen : [...state.seen, id],
  };
}

// ---------- 덧붙는 선택지 ----------
// 프로그램과 큰 행사 장면에는 원래 선택지 옆에 두 개가 더 붙는다:
// 한 스탯을 크게 올리고 둘을 내리는 선택지, 그리고 모 아니면 도.
// 문구만 봐도 무엇이 오를지 알 수 있게 썼고, 숫자는 고르기 전에 보여 주지 않는다.
type SideLine = { label: string; text: string };
type GambleLine = { label: string; success: string; fail: string };
const SIDE = sideData as unknown as {
  trade: Record<StatKey, Effects>;
  solo: Record<Stage, Partial<Record<StatKey, SideLine[]>>>;
  gamble: Record<Stage, GambleLine[]>;
  gambleUp: number;
  gambleDown: number;
};
const SIDE_KINDS = ['lantern', 'buddha', 'may', 'camp', 'vacation', 'newyear'];
const SIDE_IDS = new Set([
  ...PROGRAMS.map((e) => e.id),
  ...SIDE_KINDS.flatMap((k) => (ANNUAL[k] ?? []).map((e) => e.id)),
]);

function sideChoices(state: GameState, event: GameEvent, rng: Rng): Choice[] {
  if (!SIDE_IDS.has(event.id)) return [];
  const stage = stageOf(state.grade);
  const open = openStats(state.grade);
  // 원래 선택지가 이미 크게 올려 주는 스탯은 피한다
  const covered = new Set(event.choices.flatMap((c) => Object.keys(c.effects?.stats ?? {})));
  const pool = open.filter((k) => SIDE.solo[stage][k]?.length);
  const fresh = pool.filter((k) => !covered.has(k));
  const shuffle = <T,>(a: T[]) => [...a].sort(() => rng() - 0.5);
  const stats = [...shuffle(fresh), ...shuffle(pool.filter((k) => !fresh.includes(k)))];
  const solo = (k: StatKey): Choice => {
    const line = pick(SIDE.solo[stage][k]!, rng);
    return { label: line.label, text: line.text, effects: SIDE.trade[k] };
  };
  // 원래 선택지와 합쳐 다섯 개쯤 (적어도 둘은 덧붙인다)
  const want = Math.max(2, 5 - event.choices.length);
  const out: Choice[] = [];
  if (rng() < 0.55) {
    const g = pick(SIDE.gamble[stage], rng);
    const shuffled = [...open].sort(() => rng() - 0.5);
    const up = Object.fromEntries(shuffled.slice(0, 3).map((k) => [k, SIDE.gambleUp]));
    const down = Object.fromEntries(shuffled.slice(0, 4).map((k) => [k, -SIDE.gambleDown]));
    out.push({
      label: g.label,
      roll: {
        chance: 0.42,
        stat: 'mental',
        success: { text: g.success, effects: { stats: up }, record: 'gamble_win' },
        fail: { text: g.fail, effects: { stats: down }, record: 'gamble_lose' },
      },
    });
  }
  for (const k of stats) {
    if (out.length >= want) break;
    out.unshift(solo(k));
  }
  return out;
}

function withEvent(state: GameState, event: GameEvent, rng: Rng): GameState {
  // 제목에도 {grade} 같은 치환이 들어갈 수 있다
  const shown = {
    ...event,
    title: fillTokens(event.title, state, rng),
    choices: [...event.choices, ...sideChoices(state, event, rng)].map((c) =>
      c.label.includes('{') ? { ...c, label: fillTokens(c.label, state, rng) } : c,
    ),
  };
  return { ...state, phase: 'play', event: shown, eventText: fillText(event, state, rng), result: null, prelude: null };
}

/** 기준선 아래로 가장 많이 내려간 스탯 (없으면 null) */
function lowestOpenStat(state: GameState): StatKey | null {
  let worst: StatKey | null = null;
  let worstGap = 0;
  for (const k of openStats(state.grade)) {
    const gap = (k === 'faith' ? FAITH_STATUS_THRESHOLD : STATUS_THRESHOLD) - state.stats[k];
    if (gap > worstGap) {
      worst = k;
      worstGap = gap;
    }
  }
  return worst;
}

/** 꼭 나오는 장면: 프로그램·이야기·큰 행사 어디에 있든 찾는다 */
function findEvent(id: string): GameEvent | undefined {
  return [...PROGRAMS, ...STORIES, ...Object.values(ANNUAL).flat()].find((e) => e.id === id);
}

function prepareSlot(input: GameState, rng: Rng): GameState {
  const slot = currentSlot(input);
  // 장면마다 학년이 정해져 있다
  let state: GameState = { ...input, grade: slot.grade };
  if (slot.event) {
    const forced = findEvent(slot.event);
    if (forced && !state.seen.includes(forced.id)) {
      state = slot.kind === 'sunday' ? attendSunday(state, rng) : state;
      return withEvent(remember(state, forced.id), forced, rng);
    }
  }
  if (slot.kind === 'sunday') {
    // 일요일: 그날 법회 프로그램이 바로 나온다 (나간 것으로 친다)
    const picked = pickProgram(attendSunday(state, rng), rng);
    return withEvent(picked.state, picked.event, rng);
  }
  if (slot.kind === 'morning') {
    // 갈림길 아침: 법회에 갈까 말까. 스탯이 바닥이면 그 고민이 먼저 나온다
    const low = lowestOpenStat(state);
    if (low && rng() < STATUS_CHANCE) {
      const options = STATUS.filter((e) => e.lowStat === low && eligible(e, state));
      if (options.length) {
        const status = pickFresh(options, state, rng);
        return withEvent(remember(state, status.id), status, rng);
      }
    }
    const morning = pickFresh(ATTENDS.filter((e) => eligible(e, state)), state, rng);
    return withEvent(remember(state, morning.id), morning, rng);
  }
  // 큰 행사: 학년에 맞는 버전 중 아직 안 본 것 먼저 (5월 주간은 연등회와 부처님오신날 중 하나)
  const pool = slot.kind === 'may' ? [...ANNUAL.lantern, ...ANNUAL.buddha] : ANNUAL[slot.kind];
  const variants = pool.filter((e) => eligible(e, state));
  const unseen = variants.filter((e) => !state.seen.includes(e.id));
  const event = pick(unseen.length ? unseen : variants, rng);
  return withEvent(remember(state, event.id), event, rng);
}

/** 일요일 법회에 나간 몫: 출석과, 나가기만 해도 쌓이는 정 */
function attendSunday(state: GameState, rng: Rng): GameState {
  const uni = state.grade > STUDENT_LAST_GRADE;
  const buddy = uni ? uniBuddy(state) : pick(['jiho', 'seoyun', 'haram'] as const, rng);
  const rel = { ...state.rel };
  const add = (k: RelKey, v: number) => (rel[k] = clamp(rel[k] + v));
  add(buddy, SUNDAY_REL);
  add('gansa', uni ? 2 : SUNDAY_REL - 2);
  add('teacher', uni ? 2 : SUNDAY_REL - 2);
  add('monk', 1);
  return {
    ...state,
    rel,
    absentStreak: 0,
    attendance: {
      yearWent: state.attendance.yearWent + 1,
      yearTotal: state.attendance.yearTotal + 1,
      went: state.attendance.went + 1,
      total: state.attendance.total + 1,
    },
  };
}

function pickProgram(state: GameState, rng: Rng): { event: GameEvent; state: GameState } {
  const ret = RETURNS[stageOf(state.grade)];
  if (state.absentStreak >= RETURN_AFTER_ABSENCES && ret) {
    return { event: ret, state };
  }
  const base = state;
  const stories = STORIES.filter((e) => !state.seen.includes(e.id) && eligible(e, state));
  // 예전 선택이 돌아오는 장면은 조건이 맞으면 거의 바로 나온다
  const callbacks = stories.filter((e) => e.requires?.flags?.length);
  if (callbacks.length && rng() < CALLBACK_CHANCE) {
    const story = pick(callbacks, rng);
    return { event: story, state: remember(base, story.id) };
  }
  // 학년 대표·회장처럼 지금 맡은 역할의 장면은 자주 나온다 (반복 가능)
  const roleScenes = PROGRAMS.filter((e) => e.requires?.flags?.length && eligible(e, state));
  const uniGansa = state.flags.includes('uni:kid_gansa') || state.flags.includes('uni:st_gansa');
  if (roleScenes.length && rng() < (uniGansa ? GANSA_ROLE_CHANCE : ROLE_CHANCE)) {
    const ev = pickFresh(roleScenes, state, rng);
    return { event: ev, state: remember(base, ev.id) };
  }
  if (stories.length && rng() < STORY_CHANCE) {
    // 우는 이야기는 두 배로 잘 뽑힌다 (어린이회에선 우는 일이 많다)
    const story = pick([...stories, ...stories.filter((e) => e.id.startsWith('story-cry'))], rng);
    return { event: story, state: remember(base, story.id) };
  }
  const event = pickFresh(PROGRAMS.filter((e) => !e.requires?.flags?.length && eligible(e, state)), state, rng);
  return { event, state: remember(base, event.id) };
}

// ---------- 선택 처리 ----------

/** 성향·재능·스탯에 따라 확률이 오른다 */
export function rollChance(roll: NonNullable<Choice['roll']>, state: GameState): number {
  let c = roll.chance;
  if (roll.talent && roll.talent === state.traits.talent) c += 0.3;
  if (roll.temper && roll.temper === state.traits.temper) c += 0.15;
  if (roll.stat) c += (state.stats[roll.stat] - 30) * (roll.statWeight ?? 1 / 200);
  if (roll.stat2) c += (state.stats[roll.stat2] - 30) * (roll.statWeight ?? 1 / 200);
  // 투표: 친구들과의 정이 표가 된다
  if (roll.friends) c += (((state.rel.jiho + state.rel.seoyun + state.rel.haram) / 3 - 40) / 150) * (roll.friendsWeight ?? 1);
  // 경험: 예를 들어 학년 대표를 해 본 횟수
  if (roll.recordBonus) c += (state.records[roll.recordBonus.key] ?? 0) * roll.recordBonus.per;
  return clamp(c, 0.05, 0.95);
}

function addEffects(target: Deltas, eff: Effects | undefined, choice: Choice | null, state: GameState) {
  if (!eff) return;
  for (const [k, raw] of Object.entries(eff.stats ?? {}) as [StatKey, number][]) {
    let v = raw;
    if (v > 0 && choice?.tag && choice.tag === state.traits.temper) v = Math.round(v * 1.5);
    if (v > 0 && k === 'faith' && state.traits.lateFaith) v = Math.ceil(v * 0.5);
    if (k === 'leadership' && state.grade <= KIDS_LAST_GRADE) continue;
    if (v > 0) {
      v = v * GAIN_SCALE * STAGE_GAIN[stageOf(state.grade)] * STAT_GAIN[k];
      // 체감 성장: 높을수록 덜 오른다 (40 이하 100%, 60 55%, 70 33%, 80 이상 15%).
      // 한쪽에 몰아주면 80까지도 갈 수 있게 넉넉히 두고, 대신 다른 쪽이 깎인다.
      const f = clamp((SOFT_CAP[stageOf(state.grade)] + 25 - state.stats[k]) / 45, 0.15, 1);
      v = Math.max(f >= 0.3 ? 1 : 0, Math.round(v * f));
    } else if (v < 0) {
      v = Math.round(v * LOSS_SCALE);
    }
    target.stats[k] = (target.stats[k] ?? 0) + v;
  }
  for (const [k, v] of Object.entries(eff.rel ?? {}) as [RelKey, number][]) {
    target.rel[k] = (target.rel[k] ?? 0) + Math.round(v * REL_SCALE);
  }
}

function mergeDeltas(a: Deltas | null, b: Deltas): Deltas {
  const out = emptyDeltas();
  for (const d of [a, b]) {
    if (!d) continue;
    for (const [k, v] of Object.entries(d.stats) as [StatKey, number][]) out.stats[k] = (out.stats[k] ?? 0) + v;
    for (const [k, v] of Object.entries(d.rel) as [RelKey, number][]) out.rel[k] = (out.rel[k] ?? 0) + v;
  }
  return out;
}

function applyDeltas(state: GameState, d: Deltas): GameState {
  const stats = { ...state.stats };
  const rel = { ...state.rel };
  for (const [k, v] of Object.entries(d.stats) as [StatKey, number][]) stats[k] = clamp(stats[k] + v);
  for (const [k, v] of Object.entries(d.rel) as [RelKey, number][]) rel[k] = clamp(rel[k] + v);
  return { ...state, stats, rel };
}

/** 미니게임에서 실패하면 원래 실패보다 훨씬 크게 잃는다 */
const MINIGAME_FAIL: Record<MinigameKind, Effects> = {
  dodgeball: { stats: { health: -4, mental: -4, charm: -2 } },
  dance: { stats: { charm: -5, mental: -4 } },
  pungmul: { stats: { charm: -4, mental: -4, health: -2 } },
  moktak: { stats: { faith: -4, mental: -4 } },
};

/**
 * played: 미니게임을 직접 했으면 그 결과. 성공·실패를 확률 대신 정하고, 실패하면 벌이 더 크다.
 * 없으면('알아서 하기' 포함) 예전처럼 확률로 정한다.
 */
export function choose(prev: GameState, index: number, rng: Rng, played?: { success: boolean }): GameState {
  if (prev.phase !== 'play' || !prev.event) return prev;
  const event = prev.event;
  const choice = event.choices[index];
  if (!choice) return prev;
  let state: GameState = { ...prev, lastNote: null };
  const slot = currentSlot(state);
  const deltas = emptyDeltas();
  const records = { ...state.records };
  const highlights = [...state.yearHighlights];

  addEffects(deltas, choice.effects, choice, state);
  let outcome: Outcome | null = null;
  if (choice.roll) {
    const success = played ? played.success : rng() < rollChance(choice.roll, state);
    outcome = success ? choice.roll.success : choice.roll.fail;
    addEffects(deltas, outcome.effects, choice, state);
    if (played && !success && choice.minigame) addEffects(deltas, MINIGAME_FAIL[choice.minigame], choice, state);
  }
  for (const rec of [choice.record, outcome?.record]) if (rec) records[rec] = (records[rec] ?? 0) + 1;
  const flags = [...state.flags];
  for (const f of [choice.flag, outcome?.flag]) if (f && !flags.includes(f)) flags.push(f);
  for (const h of [choice.highlight, outcome?.highlight]) if (h) highlights.push(fillTokens(h, state, rng));
  let roleNote = '';

  // 일요일 출석 처리
  let attendance = state.attendance;
  let absentStreak = state.absentStreak;
  if (slot.kind === 'morning' && choice.attend !== undefined) {
    attendance = {
      yearWent: attendance.yearWent + (choice.attend ? 1 : 0),
      yearTotal: attendance.yearTotal + 1,
      went: attendance.went + (choice.attend ? 1 : 0),
      total: attendance.total + 1,
    };
    if (!choice.attend) {
      absentStreak += 1;
      // 대학생회에선 일요일에 오는 친구가 하나뿐이라, 빠지면 그 친구와만 멀어진다
      const missed =
        state.grade > STUDENT_LAST_GRADE
          ? { [uniBuddy(state)]: -2, gansa: -1, teacher: -1 }
          : { jiho: -2, seoyun: -2, haram: -2, gansa: -1, teacher: -1 };
      addEffects(deltas, { rel: missed }, null, state);
      // 맡은 역할이 있는데 빠지면 대가가 더 크다
      if (flags.includes('president') && state.grade <= KIDS_LAST_GRADE) {
        addEffects(deltas, { stats: { charm: -3, faith: -2 }, rel: { teacher: -3, monk: -2 } }, null, state);
        roleNote = '회장이 빠진 예불에서는 다른 친구가 서툴게 목탁을 쳤대요.';
      } else if (flags.includes('st_president') && state.grade === 11) {
        addEffects(deltas, { stats: { leadership: -4, charm: -2 }, rel: { teacher: -3, gansa: -2 } }, null, state);
        roleNote = '학생회장이 없는 법회에서 부회장이 진땀을 뺐대요.';
      } else if (state.grade > STUDENT_LAST_GRADE && (flags.includes('uni:kid_gansa') || flags.includes('uni:st_gansa'))) {
        const kidSide = flags.includes('uni:kid_gansa');
        addEffects(deltas, { stats: { leadership: -3, faith: -2 }, rel: kidSide ? { gansa: -3 } : { teacher: -3 } }, null, state);
        roleNote = kidSide
          ? '간사가 빠진 어린이회에서 동생들이 법당을 뛰어다녔대요. 지솔 쌤이 회사에 반차를 내고 왔대요.'
          : '간사가 빠진 학생회 단톡방에 "오늘… 누가 진행해요…?"가 올라왔대요.';
      } else if (state.grade > STUDENT_LAST_GRADE) {
        // 대학생회는 우리가 직접 꾸린다: 한 명이 빠지면 그 몫이 남은 사람에게 간다
        addEffects(deltas, { stats: { faith: -1 } }, null, state);
        roleNote = '{buddy}가 "오늘 너 없어서 목탁 내가 쳤다"고 문자를 보냈어요.';
      } else if (flags.includes('year:rep')) {
        addEffects(deltas, { stats: { charm: -2 }, rel: { teacher: -2 } }, null, state);
        roleNote = '학년 대표가 없어서 친구들이 우왕좌왕했대요.';
      }
    } else {
      absentStreak = 0;
    }
  }
  if (slot.kind !== 'sunday' && slot.kind !== 'morning') {
    addEffects(deltas, { rel: { jiho: 1, seoyun: 1, haram: 1 } }, null, state);
  }
  if (event.id.startsWith('lantern')) records.lantern_events = (records.lantern_events ?? 0) + 1;

  state = applyDeltas(state, deltas);
  state = { ...state, records, flags, yearHighlights: highlights, attendance, absentStreak };

  if (choice.next === 'program') {
    // 간다를 고른 아침: 그날 법회가 이어진다 (출석 몫의 정도 여기서)
    const went = attendSunday({ ...state, attendance: prev.attendance }, rng);
    const picked = pickProgram({ ...went, attendance: state.attendance, carry: mergeDeltas(state.carry, deltas) }, rng);
    const next = withEvent(picked.state, picked.event, rng);
    return { ...next, prelude: { id: event.id, title: event.title, text: prev.eventText, choice: choice.label } };
  }

  const text = fillTokens([outcome?.text ?? choice.text ?? '', roleNote].filter(Boolean).join('\n'), state, rng);
  const total = mergeDeltas(state.carry, deltas);
  const done: GameState = {
    ...state,
    phase: 'result',
    carry: null,
    result: { text, deltas: total, choice: choice.label },
    log: [
      ...state.log,
      { grade: state.grade, id: event.id, kind: slot.kind, label: slot.label, title: event.title, choice: choice.label, text },
    ].slice(-200),
  };
  // 법회에 안 가면 결과 화면 없이 바로 다음 일정으로. 그날 한 일은 다음 화면 맨 위에 한 줄로 남긴다.
  if (slot.kind === 'morning' && choice.attend === false) {
    const moved = advance(done, rng);
    return { ...moved, lastNote: { label: slot.label, choice: choice.label, text, deltas: total } };
  }
  return done;
}

// ---------- 다음으로 ----------

function makeYearReport(state: GameState): YearReport {
  const statChange: YearReport['statChange'] = {};
  for (const k of STAT_KEYS) {
    const d = state.stats[k] - state.yearStartStats[k];
    if (d !== 0) statChange[k] = d;
  }
  return {
    chapter: state.chapter,
    grade: state.grade,
    went: state.attendance.yearWent,
    total: state.attendance.yearTotal,
    highlights: [...new Set(state.yearHighlights)],
    statChange,
  };
}

export function advance(state: GameState, rng: Rng): GameState {
  if (state.phase !== 'result') return state;
  const chapter = CHAPTERS[state.chapter];
  const nextIndex = state.slotIndex + 1;
  if (nextIndex < chapter.slots.length) {
    return prepareSlot({ ...state, slotIndex: nextIndex }, rng);
  }
  // 어린이회 졸업·학생회 졸업·대학교 졸업에서 멈춘다. 앞의 둘은 버튼을 눌러 다음 회로 이어 간다
  if (chapter.end === 'graduated') {
    // 그 회의 간사 쌤·지도 선생님과 쌓은 정을 기억해 둔다 (다음 회에서는 다른 사람이 그 자리에 온다)
    const bond: Record<string, number> =
      chapter.stage === 'kid'
        ? { bond_jisol: state.rel.gansa, bond_jung: state.rel.teacher }
        : chapter.stage === 'student'
          ? { bond_youngmin: state.rel.gansa, bond_yoon: state.rel.teacher }
          : {};
    return { ...state, records: { ...state.records, ...bond }, phase: 'graduated', event: null, result: null, yearReport: makeYearReport(state) };
  }
  return { ...state, phase: 'yearEnd', event: null, result: null, yearReport: makeYearReport(state) };
}

/** 다음 장 첫 장면으로: 장에 남은 일들은 비우고, 올해 기억('year:')은 지운다 */
function openChapter(state: GameState, chapter: number, rng: Rng, extra: Partial<GameState> = {}): GameState {
  const next: GameState = {
    ...state,
    ...extra,
    chapter,
    slotIndex: 0,
    grade: CHAPTERS[chapter].slots[0].grade,
    flags: [...(extra.flags ?? state.flags).filter((f) => !f.startsWith('year:'))],
    yearHighlights: [],
    yearStartStats: { ...(extra.stats ?? state.stats) },
    yearReport: null,
    attendance: { ...state.attendance, yearWent: 0, yearTotal: 0 },
  };
  return prepareSlot(next, rng);
}

export function startNextYear(state: GameState, rng: Rng): GameState {
  if (state.phase !== 'yearEnd' || state.chapter >= LAST_CHAPTER) return state;
  return openChapter(state, state.chapter + 1, rng);
}

/**
 * 어린이회 졸업 → 학생회 중1. 친구·스탯·기록은 그대로, 리더십이 열리고
 * 간사 쌤과 지도 선생님은 학생회의 새 사람으로 바뀐다(정은 처음부터).
 */
export function enterStudent(state: GameState, rng: Rng): GameState {
  if (state.phase !== 'graduated' || CHAPTERS[state.chapter].stage !== 'kid') return state;
  const stats = { ...state.stats, leadership: Math.max(state.stats.leadership, 20) };
  return openChapter(state, STAGE_FIRST_CHAPTER.student, rng, {
    stats,
    rel: { ...state.rel, gansa: 30, teacher: 30 },
    flags: [...state.flags, 'stage:student'],
    absentStreak: 0,
  });
}

/**
 * 학생회 졸업 → 대학생회 대1. 간사도 지도 선생님도 없이 우리가 직접 꾸린다.
 * 수첩의 두 자리는 이제 지솔 쌤(어린이회)과 영민 쌤(학생회)이 되고, 예전에 쌓은 정을 그대로 이어 간다.
 */
export function enterUniversity(state: GameState, rng: Rng): GameState {
  if (state.phase !== 'graduated' || CHAPTERS[state.chapter].stage !== 'student') return state;
  const rel = {
    ...state.rel,
    gansa: state.records.bond_jisol ?? 40,
    teacher: state.records.bond_youngmin ?? state.rel.gansa,
  };
  return openChapter(state, STAGE_FIRST_CHAPTER.university, rng, {
    rel,
    flags: [...state.flags, 'stage:university', `buddy:${uniBuddy(state)}`],
    absentStreak: 0,
  });
}

// ---------- 엔딩 ----------

export function attendRate(state: GameState): number {
  return state.attendance.total ? state.attendance.went / state.attendance.total : 0;
}

function meets(state: GameState, when: Cond): boolean {
  const rate = attendRate(state);
  if (when.bestFriend) {
    const friends: RelKey[] = ['jiho', 'seoyun', 'haram'];
    const best = friends.reduce((a, b) => (state.rel[b] > state.rel[a] ? b : a));
    if (best !== when.bestFriend.key || state.rel[best] < when.bestFriend.min) return false;
  }
  if (when.rel && !Object.entries(when.rel).every(([k, v]) => state.rel[k as RelKey] >= (v ?? 0))) return false;
  if (when.relBelow && !Object.entries(when.relBelow).every(([k, v]) => state.rel[k as RelKey] < (v ?? 0))) return false;
  if (when.stats && !Object.entries(when.stats).every(([k, v]) => state.stats[k as StatKey] >= (v ?? 0))) return false;
  if (when.records && !Object.entries(when.records).every(([k, v]) => (state.records[k] ?? 0) >= v)) return false;
  if (when.attendRate !== undefined && rate < when.attendRate) return false;
  if (when.attendRateBelow !== undefined && rate >= when.attendRateBelow) return false;
  if (when.lateFaith !== undefined && state.traits.lateFaith !== when.lateFaith) return false;
  if (when.gender && state.gender !== when.gender) return false;
  if (when.flags && !when.flags.every((f) => state.flags.includes(f))) return false;
  if (when.notFlags && when.notFlags.some((f) => state.flags.includes(f))) return false;
  if (when.statsBelow && !Object.entries(when.statsBelow).every(([k, v]) => state.stats[k as StatKey] < (v ?? 0))) return false;
  if (when.talent && state.traits.talent !== when.talent) return false;
  if (when.any && !when.any.some((c) => meets(state, c))) return false;
  return true;
}

/** 엔딩과 겹치는 후일담 카드 */
const ENDING_OVERLAP: Record<string, string[]> = {
  'kid-teacher': ['un-c-kid-gansa'],
  'st-teacher': ['un-c-st-gansa'],
  'cat-cafe': ['kittens'],
  vet: ['kittens'],
};

export function computeEnding(state: GameState, owned: string[] = []) {
  const ending = pickEnding(state, owned);
  const rank = (c: { priority: number; when: Cond }) =>
    c.priority +
    (state.grade > KIDS_LAST_GRADE && c.when.flags?.includes('stage:student') ? 5 : 0) +
    (state.grade > STUDENT_LAST_GRADE && c.when.flags?.includes('stage:university') ? 10 : 0);
  const cards = (epilogueData.cards as { id: string; priority: number; when: Cond; text: string }[])
    .filter((c) => meets(state, c.when))
    // 엔딩과 같은 얘기를 하는 후일담은 뺀다
    .filter((c) => !(ENDING_OVERLAP[ending.id] ?? []).includes(c.id))
    // 마지막에 마친 회의 후일담이 먼저
    .sort((a, b) => rank(b) - rank(a))
    .slice(0, 6)
    .map((c) => fillTokens(c.text, state, () => 0));
  return { cards: cards.length ? cards : [epilogueData.fallback], ending };
}

export interface Ending {
  id: string;
  priority: number;
  name: string;
  title: string;
  text: string;
  when: Cond;
}
export const ENDINGS = (endingsData as { endings: Ending[] }).endings;

/**
 * 10년 뒤 나는 어떤 어른이 되었나: 조건이 맞는 것 중 하나.
 * 여럿이 맞으면 도감에 아직 없는 것(owned에 없는 것)부터, 그 안에서는 우선순위가 높은 것.
 * 회사원(조건 없음)은 다른 엔딩이 하나도 안 맞을 때만.
 */
export function pickEnding(state: GameState, owned: string[] = []): Ending {
  // 이미 정해 둔 엔딩이 있으면 그대로 (새로고침해도 안 바뀌게)
  const fixed = state.flags.find((f) => f.startsWith('ending:'));
  const fixedEnding = fixed && ENDINGS.find((e) => e.id === fixed.slice(7));
  if (fixedEnding) return fixedEnding;
  const fallback = ENDINGS[ENDINGS.length - 1];
  const fit = ENDINGS.filter((e) => e !== fallback && meets(state, e.when)).sort((a, b) => b.priority - a.priority);
  return fit.find((e) => !owned.includes(e.id)) ?? fit[0] ?? fallback;
}

export { REL_KEYS };
