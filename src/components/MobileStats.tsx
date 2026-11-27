import { ChevronDown, ChevronUp } from 'lucide-react';
import { openStats } from '../game/engine';
import { STAT_LABEL, type GameState } from '../game/types';
import { dreamOf } from '../game/dreams';

/**
 * 휴대폰 화면에서만 보이는 위쪽 스탯 줄. 가로 막대로 한눈에 보고,
 * 사람·출석 같은 수첩은 버튼으로 펼친다 (넓은 화면에서는 옆 수첩이 그대로 있다).
 */
export function MobileStats({ game, open, onToggle }: { game: GameState; open: boolean; onToggle: () => void }) {
  const keys = openStats(game.grade);
  return (
    <div className="mstats" aria-label="나의 스탯">
      <ul>
        {keys.map((k) => (
          <li key={k}>
            <span className="lbl">{STAT_LABEL[k]}</span>
            <span className="bar" aria-hidden="true">
              <i style={{ transform: `scaleX(${Math.min(100, Math.max(0, game.stats[k])) / 100})` }} />
            </span>
            <b className="tabular">{game.stats[k]}</b>
          </li>
        ))}
      </ul>
      {dreamOf(game.flags) && (
        <p className="mstats-dream">
          꿈: {dreamOf(game.flags)!.name} ({dreamOf(game.flags)!.need.map((k) => STAT_LABEL[k]).join('·')})
        </p>
      )}
      <button className="textlink mstats-toggle" onClick={onToggle} aria-expanded={open}>
        {open ? '수첩 접기' : '사람·출석 수첩'}
        {open ? <ChevronUp className="tag-icon" size={14} strokeWidth={1.75} aria-hidden="true" /> : <ChevronDown className="tag-icon" size={14} strokeWidth={1.75} aria-hidden="true" />}
      </button>
    </div>
  );
}
