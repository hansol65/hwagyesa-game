import { STAT_LABEL, type StatKey } from '../game/types';

interface Props {
  stats: Record<StatKey, number>;
  /** 그릴 스탯 (어린이회는 리더십을 뺀 다섯 개라 오각형) */
  keys: StatKey[];
  size?: number;
}

/** 열린 스탯만으로 다각형을 그린다. 먹선 한 줄로, 꼭짓점에 먹점. */
export function StatHex({ stats, keys, size = 230 }: Props) {
  const c = size / 2;
  const R = size / 2 - 38;
  const n = keys.length;
  const pt = (i: number, r: number) => {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / n;
    return [c + Math.cos(a) * r, c + Math.sin(a) * r] as const;
  };
  const ring = (r: number) => keys.map((_, i) => pt(i, r).join(',')).join(' ');
  const shape = keys.map((k, i) => pt(i, (R * stats[k]) / 100).join(',')).join(' ');
  const summary = keys.map((k) => `${STAT_LABEL[k]} ${stats[k]}`).join(', ');

  return (
    <svg className="chart" viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`스탯: ${summary}`}>
      {[0.33, 0.66, 1].map((f) => (
        <polygon key={f} points={ring(R * f)} className="grid" />
      ))}
      {keys.map((_, i) => {
        const [x, y] = pt(i, R);
        return <line key={i} x1={c} y1={c} x2={x} y2={y} className="grid" />;
      })}
      <polygon points={shape} className="shape" />
      {keys.map((k, i) => {
        const [x, y] = pt(i, (R * stats[k]) / 100);
        return <circle key={k} cx={x} cy={y} r="2.4" className="dot" />;
      })}
      {keys.map((k, i) => {
        const [x, y] = pt(i, R + 20);
        return (
          <g key={k}>
            <text x={x} y={y - 1} textAnchor="middle">{STAT_LABEL[k]}</text>
            <text x={x} y={y + 13} textAnchor="middle" className="val">{stats[k]}</text>
          </g>
        );
      })}
    </svg>
  );
}
