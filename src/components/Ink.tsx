// 먹과 붓으로 그린 작은 그림들. 모두 currentColor를 따르므로 테마 토큰 색이 그대로 적용된다.

/** 제목 아래 붓으로 그은 한 획 */
export function BrushLine({ width = 160 }: { width?: number }) {
  return (
    <svg className="brushline" width={width} height="10" viewBox="0 0 160 10" aria-hidden="true">
      <path
        d="M2 6.2 C 30 3.4, 62 4.6, 96 4.2 S 140 3.6, 158 5.4 L 157 6.6 C 128 6.8, 96 7.4, 60 7.2 S 18 7.6, 3 7.4 Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** 오른쪽 화살표 (다음으로) */
export function Arrow() {
  return (
    <svg width="22" height="12" viewBox="0 0 22 12" aria-hidden="true">
      <path d="M1 6h19M15 1.5 20 6l-5 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 고른 답에 치는 먹 동그라미 */
export function InkCircle() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10.5 2.2c4.6.3 7.6 3.6 7.2 7.9-.4 4.4-4.2 7.6-8.6 7.4C4.6 17.3 2 14 2.4 9.9 2.8 5.6 6.3 2.4 11.2 2.9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** 일정 표시: 평범한 일요일은 먹점, 행사 날은 작은 연등 */
export function TrackMark({ event, filled }: { event: boolean; filled: boolean }) {
  if (event) {
    return (
      <svg width="12" height="16" viewBox="0 0 12 16" aria-hidden="true">
        <path d="M6 0v2.5" stroke="currentColor" strokeWidth="1" />
        <ellipse cx="6" cy="8.5" rx="5" ry="5.5" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.3" />
        <path d="M6 14v2" stroke="currentColor" strokeWidth="1" />
      </svg>
    );
  }
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <circle cx="5" cy="5" r="3.6" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

const LANTERN_COLORS = ['var(--lantern-red)', 'var(--lantern-gold)', 'var(--lantern-pink)', 'var(--lantern-green)'];

/** 연등 하나 */
function Lantern({ color }: { color: string }) {
  return (
    <svg width="22" height="38" viewBox="0 0 22 38" aria-hidden="true">
      <line x1="11" y1="0" x2="11" y2="6" stroke="var(--ink-faint)" strokeWidth="1" />
      <rect x="7" y="5" width="8" height="2.5" rx="1" fill="var(--ink-soft)" />
      <ellipse cx="11" cy="17.5" rx="10" ry="11" fill={color} opacity="0.93" />
      <path d="M6 8.5 Q 11 17.5 6 26.5 M16 8.5 Q 11 17.5 16 26.5 M11 6.5 V 28.5" fill="none" stroke="rgba(255,255,255,0.42)" strokeWidth="1" />
      <line x1="11" y1="28.5" x2="11" y2="37" stroke={color} strokeWidth="1.6" />
    </svg>
  );
}

/** 행사 날 페이지 위에 걸리는 연등 줄. 줄은 늘어나고, 연등은 제 모양 그대로 매달린다. */
export function LanternRow({ count = 11 }: { count?: number }) {
  return (
    <div className="lanterns" aria-hidden="true">
      <svg className="string" viewBox="0 0 100 20" preserveAspectRatio="none">
        <path d="M0 2 Q 50 22 100 2" fill="none" stroke="var(--ink-faint)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </svg>
      <ul>
        {Array.from({ length: count }, (_, i) => {
          const t = (i + 0.5) / count;
          const sag = 4 * 10 * t * (1 - t);
          return (
            <li key={i} style={{ marginTop: `${sag}px` }}>
              <Lantern color={LANTERN_COLORS[i % LANTERN_COLORS.length]} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** 출석 도장: 간 날은 붉은 '출' 도장, 빠진 날은 빈 동그라미 */
export function AttendStamp({ went, tilt }: { went: boolean; tilt: number }) {
  if (!went) {
    return (
      <svg viewBox="0 0 46 46" width="46" height="46" role="img" aria-label="결석">
        <circle cx="23" cy="23" r="19" fill="none" stroke="var(--rule)" strokeWidth="1.5" strokeDasharray="3 4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 46 46" width="46" height="46" role="img" aria-label="출석" style={{ transform: `rotate(${tilt}deg)` }}>
      <circle cx="23" cy="23" r="19" fill="none" stroke="var(--seal)" strokeWidth="2.4" />
      <circle cx="23" cy="23" r="15.5" fill="none" stroke="var(--seal)" strokeWidth="0.8" opacity="0.7" />
      <text x="23" y="29.5" textAnchor="middle" fontFamily="var(--serif)" fontWeight="700" fontSize="17" fill="var(--seal)">
        출
      </text>
    </svg>
  );
}
