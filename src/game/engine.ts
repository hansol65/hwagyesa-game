// 게임 규칙. React와 무관한 순수 함수라서 시뮬레이션 스크립트에서도 그대로 쓴다.
import programsData from '../data/programs.json';
import statusData from '../data/status.json';
import sundayData from '../data/sunday.json';
import annualData from '../data/annual.json';
import epilogueData from '../data/epilogue.json';
import storiesData from '../data/stories.json';
import charactersData from '../data/characters.json';
import { KIDS_LAST_GRADE, SEASON_LINES, slotsForGrade } from './calendar';
import { catName } from './names';
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
  type Outcome,
  type RelKey,
  type StatKey,
  type Traits,
  type YearReport,
} from './types';

export type Rng = () => number;

const PROGRAMS = programsData as GameEvent[];
const STATUS = statusData as GameEvent[];
const ATTENDS = sundayData.attend as unknown as GameEvent[];
const RETURN = sundayData.return as GameEvent;
const ANNUAL = annualData as unknown as Record<string, GameEvent[]>;
const STORIES = storiesData as unknown as GameEvent[];

/** 출석한 일요일에 프로그램 대신 이야기 이벤트가 나올 확률 (조건 맞는 게 있을 때) */
const STORY_CHANCE = 0.5;
/** 기억 표시로 열린 '돌아오는 장면'이 나올 확률 */
const CALLBACK_CHANCE = 0.85;
/** 맡은 역할(학년 대표, 회장 등)의 장면이 그 주 프로그램 대신 나올 확률 */
const ROLE_CHANCE = 0.6;
/** 갈림길(투표)이 있는 일정. 빠르게 넘기기도 여기서는 멈춘다 */
export const TURNING_POINTS = ['rep', 'president', 'graduation'];
/** 최근에 본 장면은 이만큼 지나야 다시 나온다 */
const RECENT_WINDOW = 14;

/** 어린이회 때 열려 있는 스탯 (리더십은 학생회부터) */
export const OPEN_STATS: StatKey[] = ['health', 'intellect', 'charm', 'mental', 'faith'];

/** 1년 장면이 적은 만큼 한 장면에서 오르는 폭을 키운다 */
const GAIN_SCALE = 2.2;
/** 잃는 쪽도 크게: 무언가를 고르면 확실히 다른 무언가를 놓친다 */
const LOSS_SCALE = 1.6;
/** 사람과의 정도 선택에 따라 크게 움직인다 */
const REL_SCALE = 1.5;
/** 단계별 스탯 목표치. 이 근처에 가까워질수록 오르는 폭이 줄어든다 (어린이회 = 60) */
const SOFT_CAP = 60;
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
    flags: [],
    traits: rollTraits(rng),
    stats,
    rel: { jiho: 30, seoyun: 25, haram: 25, gansa: 35, teacher: 35, monk: 20 },
    grade: 1,
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
  return slotsForGrade(state.grade)[state.slotIndex];
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

function withEvent(state: GameState, event: GameEvent, rng: Rng): GameState {
  // 제목에도 {grade} 같은 치환이 들어갈 수 있다
  const shown = {
    ...event,
    title: fillTokens(event.title, state, rng),
    choices: event.choices.map((c) => (c.label.includes('{') ? { ...c, label: fillTokens(c.label, state, rng) } : c)),
  };
  return { ...state, phase: 'play', event: shown, eventText: fillText(event, state, rng), result: null, prelude: null };
}

/** 기준선 아래로 가장 많이 내려간 스탯 (없으면 null) */
function lowestOpenStat(state: GameState): StatKey | null {
  let worst: StatKey | null = null;
  let worstGap = 0;
  for (const k of OPEN_STATS) {
    const gap = (k === 'faith' ? FAITH_STATUS_THRESHOLD : STATUS_THRESHOLD) - state.stats[k];
    if (gap > worstGap) {
      worst = k;
      worstGap = gap;
    }
  }
  return worst;
}

function prepareSlot(state: GameState, rng: Rng): GameState {
  const slot = currentSlot(state);
  if (slot.kind === 'sunday') {
    const firstSundays = state.grade === 1 && state.slotIndex < 3;
    const low = firstSundays ? null : lowestOpenStat(state);
    // 일요일은 먼저 "간다 / 안 간다"만 묻는다. 간다를 고르면 같은 화면 아래로 그날 법회가 이어진다.
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

function pickProgram(state: GameState, rng: Rng): { event: GameEvent; state: GameState } {
  if (state.absentStreak >= RETURN_AFTER_ABSENCES) {
    return { event: RETURN, state };
  }
  const base = state;
  // 피구는 어린이회에서 제일 많이 하는 놀이: 법회에 나오면 2학년까지 한 번, 5학년까지 두 번은 꼭 한다
  const dodge = PROGRAMS.find((e) => e.id === 'dodgeball');
  const dodgeNeed = state.grade >= 5 ? 2 : state.grade >= 2 ? 1 : 0;
  if (dodge && state.log.filter((l) => l.title === dodge.title).length < dodgeNeed) {
    return { event: dodge, state: remember(base, dodge.id) };
  }
  const stories = STORIES.filter((e) => !state.seen.includes(e.id) && eligible(e, state));
  // 예전 선택이 돌아오는 장면은 조건이 맞으면 거의 바로 나온다
  const callbacks = stories.filter((e) => e.requires?.flags?.length);
  if (callbacks.length && rng() < CALLBACK_CHANCE) {
    const story = pick(callbacks, rng);
    return { event: story, state: remember(base, story.id) };
  }
  // 학년 대표·회장처럼 지금 맡은 역할의 장면은 자주 나온다 (반복 가능)
  const roleScenes = PROGRAMS.filter((e) => e.requires?.flags?.length && eligible(e, state));
  if (roleScenes.length && rng() < ROLE_CHANCE) {
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
  if (roll.stat) c += (state.stats[roll.stat] - 30) / 200;
  // 투표: 친구들과의 정이 표가 된다
  if (roll.friends) c += ((state.rel.jiho + state.rel.seoyun + state.rel.haram) / 3 - 40) / 150;
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
      v = v * GAIN_SCALE;
      // 체감 성장: 높을수록 덜 오른다 (40 이하 100%, 60 55%, 70 33%, 80 이상 15%).
      // 한쪽에 몰아주면 80까지도 갈 수 있게 넉넉히 두고, 대신 다른 쪽이 깎인다.
      const f = clamp((SOFT_CAP + 25 - state.stats[k]) / 45, 0.15, 1);
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

export function choose(prev: GameState, index: number, rng: Rng): GameState {
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
    outcome = rng() < rollChance(choice.roll, state) ? choice.roll.success : choice.roll.fail;
    addEffects(deltas, outcome.effects, choice, state);
  }
  for (const rec of [choice.record, outcome?.record]) if (rec) records[rec] = (records[rec] ?? 0) + 1;
  const flags = [...state.flags];
  for (const f of [choice.flag, outcome?.flag]) if (f && !flags.includes(f)) flags.push(f);
  for (const h of [choice.highlight, outcome?.highlight]) if (h) highlights.push(fillTokens(h, state, rng));
  let roleNote = '';

  // 일요일 출석 처리
  let attendance = state.attendance;
  let absentStreak = state.absentStreak;
  if (slot.kind === 'sunday' && choice.attend !== undefined) {
    attendance = {
      yearWent: attendance.yearWent + (choice.attend ? 1 : 0),
      yearTotal: attendance.yearTotal + 1,
      went: attendance.went + (choice.attend ? 1 : 0),
      total: attendance.total + 1,
    };
    if (!choice.attend) {
      absentStreak += 1;
      addEffects(deltas, { rel: { jiho: -2, seoyun: -2, haram: -2, gansa: -1, teacher: -1 } }, null, state);
      // 맡은 역할이 있는데 빠지면 대가가 더 크다
      if (flags.includes('president')) {
        addEffects(deltas, { stats: { charm: -3, faith: -2 }, rel: { teacher: -3, monk: -2 } }, null, state);
        roleNote = '회장이 빠진 예불에서는 다른 친구가 서툴게 목탁을 쳤대요.';
      } else if (flags.includes('year:rep')) {
        addEffects(deltas, { stats: { charm: -2 }, rel: { teacher: -2 } }, null, state);
        roleNote = '학년 대표가 없어서 친구들이 우왕좌왕했대요.';
      }
    } else {
      absentStreak = 0;
      // 나가기만 해도 쌓이는 정: 선생님들과 가까워지고, 친구 한 명과 붙어 다닌다
      const buddy = pick(['jiho', 'seoyun', 'haram'] as const, rng);
      addEffects(deltas, { rel: { gansa: 2, teacher: 2, [buddy]: 3 } }, null, state);
    }
  }
  if (slot.kind !== 'sunday') {
    addEffects(deltas, { rel: { jiho: 1, seoyun: 1, haram: 1 } }, null, state);
  }
  if (event.id.startsWith('lantern')) records.lantern_events = (records.lantern_events ?? 0) + 1;

  state = applyDeltas(state, deltas);
  state = { ...state, records, flags, yearHighlights: highlights, attendance, absentStreak };

  if (choice.next === 'program') {
    const picked = pickProgram({ ...state, carry: mergeDeltas(state.carry, deltas) }, rng);
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
      { grade: state.grade, label: slot.label, title: event.title, choice: choice.label, text },
    ].slice(-200),
  };
  // 법회에 안 가면 결과 화면 없이 바로 다음 일정으로. 그날 한 일은 다음 화면 맨 위에 한 줄로 남긴다.
  if (slot.kind === 'sunday' && choice.attend === false) {
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
    grade: state.grade,
    went: state.attendance.yearWent,
    total: state.attendance.yearTotal,
    highlights: [...new Set(state.yearHighlights)],
    statChange,
  };
}

export function advance(state: GameState, rng: Rng): GameState {
  if (state.phase !== 'result') return state;
  const slots = slotsForGrade(state.grade);
  const nextIndex = state.slotIndex + 1;
  if (nextIndex < slots.length) {
    return prepareSlot({ ...state, slotIndex: nextIndex }, rng);
  }
  if (state.grade >= KIDS_LAST_GRADE) {
    return { ...state, phase: 'graduated', event: null, result: null, yearReport: makeYearReport(state) };
  }
  return { ...state, phase: 'yearEnd', event: null, result: null, yearReport: makeYearReport(state) };
}

export function startNextYear(state: GameState, rng: Rng): GameState {
  if (state.phase !== 'yearEnd') return state;
  const next: GameState = {
    ...state,
    grade: state.grade + 1,
    slotIndex: 0,
    yearHighlights: [],
    // 'year:'로 시작하는 기억(올해의 학년 대표 등)은 한 해가 지나면 사라진다
    flags: [
      ...state.flags.filter((f) => !f.startsWith('year:')),
      ...(state.flags.includes('year:rep') ? ['year:rep_before'] : []),
    ],
    yearStartStats: { ...state.stats },
    yearReport: null,
    attendance: { ...state.attendance, yearWent: 0, yearTotal: 0 },
  };
  return prepareSlot(next, rng);
}

// ---------- 한 해 빠르게 넘기기 ----------

export type YearMode = 'eager' | 'normal' | 'rare';
export const YEAR_MODE_LABEL: Record<YearMode, string> = {
  eager: '열심히 나간다',
  normal: '적당히 나간다',
  rare: '거의 안 나간다',
};
const ATTEND_PROB: Record<YearMode, number> = { eager: 0.95, normal: 0.65, rare: 0.2 };

/** 졸업식 같은 전환점이 오면 멈추고, 플레이어가 직접 고르게 둔다 */
export function autoYear(start: GameState, mode: YearMode, rng: Rng): GameState {
  let state = start;
  const grade = state.grade;
  for (let guard = 0; guard < 100; guard++) {
    if (state.grade !== grade) break;
    if (state.phase === 'result') {
      state = advance(state, rng);
      continue;
    }
    if (state.phase !== 'play' || !state.event) break;
    if (TURNING_POINTS.includes(currentSlot(state).kind)) break;
    const choices = state.event.choices;
    const hasAttend = choices.some((c) => c.attend !== undefined);
    let index: number;
    if (hasAttend) {
      const wantGo = rng() < ATTEND_PROB[mode];
      const options = choices.map((c, i) => ({ c, i })).filter(({ c }) => (c.attend ?? true) === wantGo);
      index = options.length ? pick(options, rng).i : 0;
    } else {
      index = Math.floor(rng() * choices.length);
    }
    state = choose(state, index, rng);
  }
  return state;
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
  return true;
}

export function computeEnding(state: GameState) {
  const cards = (epilogueData.cards as { id: string; priority: number; when: Cond; text: string }[])
    .filter((c) => meets(state, c.when))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 6)
    .map((c) => fillTokens(c.text, state, () => 0));
  const titles = (epilogueData.titles as { id: string; name: string; when: Cond }[])
    .filter((t) => meets(state, t.when))
    .map((t) => t.name);
  return { cards: cards.length ? cards : [epilogueData.fallback], titles };
}

export { REL_KEYS };
