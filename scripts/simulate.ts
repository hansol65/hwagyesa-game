// 무작위 플레이 수천 번으로 밸런스와 오류를 확인한다: npm run sim
import { advance, autoYear, computeEnding, attendRate, startNextYear, choose, type YearMode } from '../src/game/engine';
import { newGame } from '../src/game/engine';
import { STAT_KEYS, type Choice, type GameState, type StatKey } from '../src/game/types';

function playThrough(mode: YearMode): GameState {
  let s = newGame('테스트', Math.random() < 0.5 ? 'male' : 'female', Math.random);
  for (let i = 0; i < 500; i++) {
    if (s.phase === 'graduated') return s;
    if (s.phase === 'yearEnd') { s = startNextYear(s, Math.random); continue; }
    if (s.phase === 'result') { s = advance(s, Math.random); continue; }
    const before = s;
    s = autoYear(s, mode, Math.random);
    if (s === before || (s.phase === 'play' && s.event?.id === 'kids-graduation')) {
      s = choose(s, 0, Math.random);
    }
  }
  throw new Error('끝나지 않음');
}

const N = 2000;
for (const mode of ['eager', 'normal', 'rare'] as YearMode[]) {
  const sums: Record<string, number> = {};
  const titleCount: Record<string, number> = {};
  const cardCount: Record<string, number> = {};
  let rate = 0;
  let statusSeen = 0;
  let distinct = 0;
  let worstRepeat = 0;
  let stories = 0;
  let callbacks = 0;
  let addenda = 0;
  for (let i = 0; i < N; i++) {
    const s = playThrough(mode);
    for (const k of STAT_KEYS) sums[k] = (sums[k] ?? 0) + s.stats[k];
    rate += attendRate(s);
    // 반복 측정: 결과가 나온 장면 제목 기준
    const counts: Record<string, number> = {};
    s.log.forEach((l) => (counts[l.title] = (counts[l.title] ?? 0) + 1));
    distinct += Object.keys(counts).length;
    worstRepeat += Math.max(...Object.values(counts));
    stories += s.seen.filter((id) => id.startsWith('story-')).length;
    callbacks += s.seen.filter((id) => id.startsWith('cb-')).length;
    addenda += ['chased_elephant', 'haram_stayed', 'haram_letter', 'haram_silent', 'asked_monk_pizza', 'asked_monk_hair', 'asked_monk_angry', 'kittens', 'mentor_ocarina'].filter((f) => s.flags.includes(f)).length;
    statusSeen += s.log.filter((l) => /으슬|하기 싫|받아쓰기|친한 것|귀찮/.test(l.title)).length;
    const end = computeEnding(s);
    end.titles.forEach((t) => (titleCount[t] = (titleCount[t] ?? 0) + 1));
    end.cards.forEach((c) => (cardCount[c.slice(0, 14)] = (cardCount[c.slice(0, 14)] ?? 0) + 1));
  }
  console.log(`\n=== ${mode} (${N}판) 출석률 ${(rate / N * 100).toFixed(0)}% · 상태 이벤트 평균 ${(statusSeen / N).toFixed(1)}회`);
  console.log(`한 판에 서로 다른 장면 평균 ${(distinct / N).toFixed(1)}개 · 가장 많이 반복된 장면 평균 ${(worstRepeat / N).toFixed(1)}번 · 이야기 이벤트 평균 ${(stories / N).toFixed(1)}개`);
  console.log('졸업 때 평균 스탯', Object.fromEntries(STAT_KEYS.map((k) => [k, Math.round(sums[k] / N)])));
  console.log('칭호 비율', Object.fromEntries(Object.entries(titleCount).map(([k, v]) => [k, `${Math.round(v / N * 100)}%`])));
  console.log('후일담 카드 비율', Object.fromEntries(Object.entries(cardCount).map(([k, v]) => [k, `${Math.round(v / N * 100)}%`])));
  console.log(`돌아오는 장면(기억) 평균 ${(callbacks / N).toFixed(1)}개 · 졸업식 회상 문장 평균 ${(addenda / N).toFixed(1)}개`);
}

// ---- 한 스탯에 몰아준 플레이: 선택이 결과를 크게 가르는지 확인 ----
function bestFor(s: GameState, stat: StatKey): number {
  const score = (c: Choice) => {
    const base = c.effects?.stats?.[stat] ?? 0;
    const roll = c.roll ? ((c.roll.success.effects?.stats?.[stat] ?? 0) + (c.roll.fail.effects?.stats?.[stat] ?? 0)) / 2 : 0;
    const go = c.attend === false ? -3 : 0;
    return base + roll + go;
  };
  const cs = s.event!.choices;
  return cs.reduce((bi, c, i) => (score(c) > score(cs[bi]) ? i : bi), 0);
}
function playFocused(stat: StatKey): GameState {
  let s = newGame('테스트', 'female', Math.random);
  for (let i = 0; i < 800; i++) {
    if (s.phase === 'graduated') return s;
    if (s.phase === 'yearEnd') { s = startNextYear(s, Math.random); continue; }
    if (s.phase === 'result') { s = advance(s, Math.random); continue; }
    s = choose(s, bestFor(s, stat), Math.random);
  }
  throw new Error('끝나지 않음');
}
console.log('\n=== 한 스탯에 몰아준 플레이 (각 500판 평균) ===');
for (const stat of ['faith', 'charm', 'health', 'intellect', 'mental'] as StatKey[]) {
  const sum: Record<string, number> = {};
  for (let i = 0; i < 500; i++) { const s = playFocused(stat); for (const k of STAT_KEYS) sum[k] = (sum[k] ?? 0) + s.stats[k]; }
  console.log(`${stat} 몰아주기 →`, Object.fromEntries(STAT_KEYS.filter((k) => k !== 'leadership').map((k) => [k, Math.round(sum[k] / 500)])));
}
