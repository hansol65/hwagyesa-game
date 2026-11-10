import { personName, withWa } from '../game/names';
import { STAT_LABEL, type Effects, type RelKey, type StatKey } from '../game/types';
import { useGame } from '../store';

/** "신앙 +3 · 건강 −2" — 먹 글씨로, 오르면 솔빛, 내리면 낙관빛 */
export function Deltas({ effects, showRel = true, luck = false }: { effects?: Effects; showRel?: boolean; luck?: boolean }) {
  const game = useGame((s) => s.game);
  const items: { key: string; label: string; v: number }[] = [];
  for (const [k, v] of Object.entries(effects?.stats ?? {}) as [StatKey, number][]) {
    if (v) items.push({ key: k, label: STAT_LABEL[k], v });
  }
  if (showRel) {
    for (const [k, v] of Object.entries(effects?.rel ?? {}) as [RelKey, number][]) {
      if (v) items.push({ key: k, label: `${withWa(personName(k, game))}의 정`, v });
    }
  }
  if (!items.length && !luck) return null;
  return (
    <span className="deltas tabular">
      {items.map((it) => (
        <span key={it.key} className={it.v > 0 ? 'd up' : 'd down'}>
          {it.label} {it.v > 0 ? `+${it.v}` : `−${Math.abs(it.v)}`}
        </span>
      ))}
      {luck && <span className="d luck">결과는 해 봐야 알아요</span>}
    </span>
  );
}
