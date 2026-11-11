// 엔딩이 고르게 나오도록 조건 숫자를 맞춘다: npx tsx scripts/tune-endings.ts
//
// 엔딩은 판이 끝난 뒤의 상태로만 정해지니, 여러 방식으로 끝까지 한 판들을 한 번 모아 두고
// 엔딩마다 스탯·정 기준을 조금씩 올리고 내리며 목표 비율에 맞춘다. 결과는 src/data/endings.json에 쓴다.
// 출가는 아주 드물게(0.5%), 아무 조건 없는 '일요일의 회사원'은 남는 몫(4판에 1번쯤)을 받는다.
import fs from 'node:fs';
import path from 'node:path';
import { advance, choose, ENDINGS, enterStudent, enterUniversity, newGame, startNextYear, type Ending } from '../src/game/engine';
import { CHAPTERS } from '../src/game/calendar';
import { STAT_KEYS, type Choice, type Cond, type GameState, type RelKey, type StatKey } from '../src/game/types';

type Policy = (s: GameState) => number;
const randomPolicy: Policy = (s) => Math.floor(Math.random() * s.event!.choices.length);
const statPolicy = (stat: StatKey, focus: number): Policy => (s) => {
  if (Math.random() > focus) return randomPolicy(s);
  const score = (c: Choice) => {
    let v = c.effects?.stats?.[stat] ?? 0;
    if (c.roll) v += ((c.roll.success.effects?.stats?.[stat] ?? 0) + (c.roll.fail.effects?.stats?.[stat] ?? 0)) / 2;
    return v + Math.random() * 0.1;
  };
  return s.event!.choices.map((c, i) => ({ v: score(c), i })).sort((a, b) => b.v - a.v)[0].i;
};
/** 두 스탯을 섞어 키우는 플레이 (사람은 보통 이렇게 한다) */
const twoStatPolicy = (a: StatKey, b: StatKey): Policy => (s) => statPolicy(Math.random() < 0.5 ? a : b, 0.8)(s);

function play(policy: Policy): GameState {
  let s = newGame('t', Math.random() < 0.5 ? 'male' : 'female', Math.random);
  for (let i = 0; i < 500; i++) {
    if (s.phase === 'graduated') {
      const st = CHAPTERS[s.chapter].stage;
      if (st === 'kid') s = enterStudent(s, Math.random);
      else if (st === 'student') s = enterUniversity(s, Math.random);
      else return s;
      continue;
    }
    if (s.phase === 'yearEnd') { s = startNextYear(s, Math.random); continue; }
    if (s.phase === 'result') { s = advance(s, Math.random); continue; }
    s = choose(s, policy(s), Math.random);
  }
  throw new Error('끝나지 않음');
}

// 플레이 방식 섞기: 무작위, 한 스탯 몰아주기(세게·약하게), 두 스탯 섞기
const policies: Policy[] = [randomPolicy, randomPolicy];
for (const k of STAT_KEYS) policies.push(statPolicy(k, 0.85), statPolicy(k, 0.5));
for (let i = 0; i < STAT_KEYS.length; i++) for (let j = i + 1; j < STAT_KEYS.length; j++) policies.push(twoStatPolicy(STAT_KEYS[i], STAT_KEYS[j]));
const N = Number(process.argv[2] ?? 6000);
const states: GameState[] = [];
for (let i = 0; i < N; i++) states.push(play(policies[i % policies.length]));
console.log(`${N}판 모음`);

// ---- 조건 평가 (engine의 meets와 같은 규칙) ----
function meets(s: GameState, w: Cond): boolean {
  const rate = s.attendance.total ? s.attendance.went / s.attendance.total : 0;
  if (w.bestFriend) {
    const fr: RelKey[] = ['jiho', 'seoyun', 'haram'];
    const best = fr.reduce((a, b) => (s.rel[b] > s.rel[a] ? b : a));
    if (best !== w.bestFriend.key || s.rel[best] < w.bestFriend.min) return false;
  }
  if (w.rel && !Object.entries(w.rel).every(([k, v]) => s.rel[k as RelKey] >= (v ?? 0))) return false;
  if (w.stats && !Object.entries(w.stats).every(([k, v]) => s.stats[k as StatKey] >= (v ?? 0))) return false;
  if (w.statsBelow && !Object.entries(w.statsBelow).every(([k, v]) => s.stats[k as StatKey] < (v ?? 0))) return false;
  if (w.records && !Object.entries(w.records).every(([k, v]) => (s.records[k] ?? 0) >= v)) return false;
  if (w.attendRate !== undefined && rate < w.attendRate) return false;
  if (w.attendRateBelow !== undefined && rate >= w.attendRateBelow) return false;
  if (w.gender && s.gender !== w.gender) return false;
  if (w.flags && !w.flags.every((f) => s.flags.includes(f))) return false;
  if (w.notFlags && w.notFlags.some((f) => s.flags.includes(f))) return false;
  if (w.talent && s.traits.talent !== w.talent) return false;
  if (w.any && !w.any.some((c) => meets(s, c))) return false;
  return true;
}

/** 기준 숫자를 d만큼 어렵게(+) 또는 쉽게(-). 이상 조건은 올리고, 미만 조건은 내린다 */
function shift(w: Cond, d: number): Cond {
  // 너무 낮은 기준(건강 9↑ 같은)은 조건으로서 뜻이 없으니 35 아래로는 안 내린다. 미만 조건도 65 위로는 안 올린다
  const c = (v: number) => Math.max(35, Math.min(97, Math.round(v + d)));
  const out: Cond = { ...w };
  if (w.stats) out.stats = Object.fromEntries(Object.entries(w.stats).map(([k, v]) => [k, c(v!)]));
  if (w.statsBelow) out.statsBelow = Object.fromEntries(Object.entries(w.statsBelow).map(([k, v]) => [k, Math.max(3, Math.min(65, Math.round(v! - d)))]));
  if (w.rel) out.rel = Object.fromEntries(Object.entries(w.rel).map(([k, v]) => [k, c(v!)]));
  if (w.bestFriend) out.bestFriend = { ...w.bestFriend, min: c(w.bestFriend.min) };
  if (w.any) out.any = w.any.map((x) => shift(x, d));
  return out;
}

const base: Ending[] = JSON.parse(JSON.stringify(ENDINGS));
const FALLBACK = 'office';
/** 회사원은 4판에 1번쯤. 나머지 엔딩은 까다로운 조건을 맞춘 판들이 고르게 나눠 갖는다 */
const OFFICE_SHARE = 0.25;
const target = (id: string) => (id === 'monk' ? 0.005 : id === FALLBACK ? OFFICE_SHARE : (1 - 0.005 - OFFICE_SHARE) / (base.length - 2));
const delta: Record<string, number> = Object.fromEntries(base.map((e) => [e.id, 0]));

function distribution(list: Ending[]) {
  const sorted = [...list].sort((a, b) => b.priority - a.priority);
  const count: Record<string, number> = {};
  for (const s of states) {
    const e = sorted.find((x) => meets(s, x.when)) ?? sorted[sorted.length - 1];
    count[e.id] = (count[e.id] ?? 0) + 1;
  }
  return Object.fromEntries(list.map((e) => [e.id, (count[e.id] ?? 0) / states.length]));
}
const build = () => base.map((e) => ({ ...e, when: shift(e.when, delta[e.id]) }));

let step = 4;
for (let round = 0; round < 160; round++) {
  const dist = distribution(build());
  for (const e of base) {
    if (e.id === FALLBACK) continue;
    const r = dist[e.id] / target(e.id);
    if (r > 1.15) delta[e.id] += step;
    else if (r < 0.85) delta[e.id] -= step;
  }
  if (round % 40 === 39) step = Math.max(1, step / 2);
}
const tuned = build();
const dist = distribution(tuned);
for (const e of tuned) console.log(`${e.name.padEnd(12)} ${(dist[e.id] * 100).toFixed(1)}%  (기준 ${delta[e.id] >= 0 ? '+' : ''}${delta[e.id]})`);

if (process.argv.includes('--write')) {
  const out = path.resolve(import.meta.dirname, '..', 'src/data/endings.json');
  fs.writeFileSync(out, JSON.stringify({ endings: tuned }, null, 2) + '\n');
  console.log('→ src/data/endings.json 에 썼어요');
}
