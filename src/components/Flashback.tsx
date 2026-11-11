import { useEffect, useMemo, useState } from 'react';
import { staging } from '../art/scene';
import { shortGrade } from '../game/calendar';
import type { GameState, LogEntry } from '../game/types';

const BASE = import.meta.env.BASE_URL;
/** 한 장면이 머무는 시간(ms). 앞쪽은 천천히, 뒤로 갈수록 빨라진다 */
const HOLD = [1500, 1300, 1150, 1000, 900, 800, 700, 650, 600];
const OUTRO = 1800;

type Frame = { bg: string; when: string; title: string; choice: string };

/** 지나온 장면 가운데 아홉 개쯤을 고르게 뽑는다 (어린이회부터 대학생회까지 고루) */
function pickFrames(game: GameState): Frame[] {
  const log = game.log.filter((e): e is LogEntry & { id: string } => !!e.id);
  const n = Math.min(HOLD.length, log.length);
  const picked = Array.from({ length: n }, (_, i) => log[Math.round((i * (log.length - 1)) / Math.max(1, n - 1))]);
  return [...new Set(picked)].map((e) => {
    const st = staging({ id: e.id, slotKind: e.kind ?? 'sunday', isProgram: true, text: e.text, game: { ...game, grade: e.grade }, alone: true });
    return { bg: st.bg, when: shortGrade(e.grade), title: e.title, choice: e.choice };
  });
}

/**
 * 주마등: 졸업 사진 뒤 "10년 뒤" 를 누르면, 지나온 일요일들이 빠르게 스치고 하얗게 바랜 뒤 엔딩이 나온다.
 * 아무 데나 누르면 건너뛴다.
 */
export function Flashback({ game, onDone }: { game: GameState; onDone: () => void }) {
  const frames = useMemo(() => pickFrames(game), [game]);
  const [i, setI] = useState(0);
  const outro = i >= frames.length;

  useEffect(() => {
    const t = setTimeout(() => (outro ? onDone() : setI(i + 1)), outro ? OUTRO : HOLD[i] ?? 600);
    return () => clearTimeout(t);
  }, [i, outro, onDone]);

  return (
    <div className="flashback" role="presentation" onClick={onDone}>
      {frames.map((f, k) => (
        <figure key={k} className={k === i ? 'fb-frame on' : k < i ? 'fb-frame past' : 'fb-frame'} aria-hidden={k !== i}>
          <img src={`${BASE}art/bg/${f.bg}.webp`} alt="" draggable={false} />
          <figcaption>
            <span className="fb-when">{f.when}</span>
            <span className="fb-title">{f.title}</span>
            <span className="fb-choice">{f.choice}</span>
          </figcaption>
        </figure>
      ))}
      <div className={outro ? 'fb-outro on' : 'fb-outro'}>
        <p>10년 뒤</p>
      </div>
      <button className="fb-skip" onClick={onDone}>
        건너뛰기
      </button>
    </div>
  );
}
