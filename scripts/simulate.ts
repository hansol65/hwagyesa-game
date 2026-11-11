// 무작위 플레이 수천 번으로 밸런스와 오류를 확인한다: npm run sim
import { advance, choose, computeEnding, ENDINGS, enterStudent, enterUniversity, newGame, startNextYear } from '../src/game/engine';
import { CHAPTERS } from '../src/game/calendar';
import { STAT_KEYS, type Choice, type GameState, type StatKey } from '../src/game/types';

type Policy = (s: GameState) => number;

/** 끝까지 한 판. policy가 선택지를 고른다 */
function playThrough(policy: Policy): { s: GameState; screens: number } {
  let s = newGame('테스트', Math.random() < 0.5 ? 'male' : 'female', Math.random);
  let screens = 0;
  for (let i = 0; i < 500; i++) {
    if (s.phase === 'graduated') {
      const stage = CHAPTERS[s.chapter].stage;
      if (stage === 'kid') s = enterStudent(s, Math.random);
      else if (stage === 'student') s = enterUniversity(s, Math.random);
      else return { s, screens };
      continue;
    }
    if (s.phase === 'yearEnd') { s = startNextYear(s, Math.random); continue; }
    if (s.phase === 'result') { s = advance(s, Math.random); continue; }
    screens++;
    s = choose(s, policy(s), Math.random);
  }
  throw new Error('끝나지 않음');
}

const randomPolicy: Policy = (s) => Math.floor(Math.random() * s.event!.choices.length);
const attendBias = (p: number): Policy => (s) => {
  const cs = s.event!.choices;
  if (cs.some((c) => c.attend !== undefined)) {
    const want = Math.random() < p;
    const opts = cs.map((c, i) => ({ c, i })).filter(({ c }) => (c.attend ?? true) === want);
    if (opts.length) return opts[Math.floor(Math.random() * opts.length)].i;
  }
  return randomPolicy(s);
};
/** 한 스탯에 몰아주는 플레이 */
const statPolicy = (stat: StatKey): Policy => (s) => {
  const score = (c: Choice) => {
    let v = c.effects?.stats?.[stat] ?? 0;
    if (c.roll) v += ((c.roll.success.effects?.stats?.[stat] ?? 0) + (c.roll.fail.effects?.stats?.[stat] ?? 0)) / 2;
    return v + Math.random() * 0.1;
  };
  const cs = s.event!.choices;
  return cs.map((c, i) => ({ v: score(c), i })).sort((a, b) => b.v - a.v)[0].i;
};

const N = 3000;
const endingCount: Record<string, number> = {};
const sums: Record<string, number> = {};
let screens = 0;
const policies: [string, Policy][] = [
  ['random', randomPolicy],
  ['eager', attendBias(0.95)],
  ['rare', attendBias(0.2)],
  ...STAT_KEYS.map((k) => [`max-${k}`, statPolicy(k)] as [string, Policy]),
];
const perPolicy: Record<string, Record<string, number>> = {};
for (const [name, pol] of policies) {
  perPolicy[name] = {};
  for (let i = 0; i < N / policies.length; i++) {
    const { s, screens: sc } = playThrough(pol);
    screens += sc;
    for (const k of STAT_KEYS) sums[k] = (sums[k] ?? 0) + s.stats[k];
    const e = computeEnding(s).ending.id;
    endingCount[e] = (endingCount[e] ?? 0) + 1;
    perPolicy[name][e] = (perPolicy[name][e] ?? 0) + 1;
  }
}
const total = Object.values(endingCount).reduce((a, b) => a + b, 0);
console.log(`한 판 평균 선택 화면 ${(screens / total).toFixed(1)}개`);
console.log('끝 스탯 평균', Object.fromEntries(STAT_KEYS.map((k) => [k, Math.round(sums[k] / total)])));
console.log('\n엔딩 비율 (전체)');
for (const e of ENDINGS) console.log(`  ${e.name.padEnd(12)} ${((100 * (endingCount[e.id] ?? 0)) / total).toFixed(1)}%`);
console.log('\n플레이 방식별 가장 많은 엔딩');
for (const [name, m] of Object.entries(perPolicy)) {
  const top = Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => `${ENDINGS.find((e) => e.id === k)?.name} ${v}`);
  console.log(`  ${name}: ${top.join(', ')}`);
}
