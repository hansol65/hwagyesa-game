import { useEffect, useRef, useState } from 'react';
import { currentSlot } from '../game/engine';
import { CHAPTERS, FESTIVE_KINDS, gradeLabel } from '../game/calendar';
import type { GameState } from '../game/types';
import { useGame } from '../store';
import { Deltas } from './Deltas';
import { SceneStage } from './SceneStage';
import { Minigame } from './Minigame';
import { staging } from '../art/scene';
import { Arrow, BrushLine, InkCircle, LanternRow, TrackMark } from './Ink';

function YearTrack({ game }: { game: GameState }) {
  const slots = CHAPTERS[game.chapter].slots;
  return (
    <ol className="track" aria-label={`이번 장 ${slots.length}장면 중 ${game.slotIndex + 1}번째`}>
      {slots.map((s, i) => (
        <li key={i} className={i < game.slotIndex ? 'past' : i === game.slotIndex ? 'now' : ''} title={s.label}>
          <TrackMark event={FESTIVE_KINDS.includes(s.kind)} filled={i <= game.slotIndex} />
        </li>
      ))}
    </ol>
  );
}

export function Scene({ game }: { game: GameState }) {
  const { choose, next } = useGame();
  /** 미니게임이 붙은 선택지를 고르면 그 자리에서 게임을 한다 */
  const [playing, setPlaying] = useState<number | null>(null);
  const pick = (i: number) => {
    if (choices[i]?.minigame) setPlaying(i);
    else choose(i);
  };
  const slot = currentSlot(game);
  const festive = FESTIVE_KINDS.includes(slot.kind);
  const isResult = game.phase === 'result' && !!game.result;
  const choices = game.event?.choices ?? [];
  const bodyRef = useRef<HTMLDivElement>(null);
  const eventId = game.event?.id;
  // 결과가 나오면 주인공 표정이 바뀐다: 크게 얻으면 기뻐하고, 크게 잃으면 놀란다
  const statSum = Object.values(game.result?.deltas.stats ?? {}).reduce((a, b) => a + (b ?? 0), 0);
  const mood = isResult ? (statSum >= 4 ? 'happy' : statSum <= -6 ? 'cry' : statSum <= -3 ? 'surprised' : undefined) : undefined;
  const scene =
    game.event &&
    staging({
      id: game.event.id,
      slotKind: slot.kind,
      isProgram: !!game.prelude || slot.kind === 'sunday',
      // 선택지에 나오는 사람(선생님께 말씀드린다, 스님께 여쭌다…)도 장면에 세운다
      text: `${game.event.title} ${game.eventText}`,
      castText: choices.map((c) => c.label).join(' '),
      game,
      mood,
      alone: slot.kind === 'morning' && !game.prelude,
    });
  // 간다를 고른 뒤: 위에 남는 아침 장면은 집, 주인공 혼자
  const preludeScene =
    game.prelude &&
    staging({ id: game.prelude.id, slotKind: slot.kind, isProgram: false, text: game.prelude.text, game, alone: true });

  // 장면이 바뀌면 하던 미니게임은 접는다
  useEffect(() => setPlaying(null), [eventId, game.phase]);

  // 간다를 고르면 아래에 펼쳐진 법회로 부드럽게 내려간다
  useEffect(() => {
    if (game.prelude && game.phase === 'play') {
      bodyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [eventId, game.prelude, game.phase]);

  // 숫자키로 고르고, Enter로 넘긴다
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey) return;
      if (playing !== null) return;
      if (!isResult) {
        const n = Number(e.key);
        if (n >= 1 && n <= choices.length) {
          e.preventDefault();
          pick(n - 1);
        }
      } else if (e.key === 'Enter' && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <section className={festive ? 'page festive' : 'page'} aria-live="polite">
      {festive && <LanternRow />}
      <div className="dateline">
        <p className="when">
          {CHAPTERS[game.chapter].title} · {gradeLabel(game.grade)}, {slot.label}
        </p>
        <YearTrack game={game} />
      </div>

      {game.lastNote && (
        <p className="lastnote">
          <span className="when-small">{game.lastNote.label}, 법회 대신</span> {game.lastNote.choice}
          {game.lastNote.text && <span className="note-text"> — {game.lastNote.text}</span>}{' '}
          <Deltas effects={game.lastNote.deltas} showRel={false} />
        </p>
      )}

      {game.prelude && (
        <div className="prelude">
          {preludeScene && <SceneStage staging={preludeScene} alt={game.prelude.title} />}
          <h2 className="scene-title">{game.prelude.title}</h2>
          <BrushLine width={140} />
          <p className="story">{game.prelude.text}</p>
          <p className="picked">
            <InkCircle />
            {game.prelude.choice}
          </p>
        </div>
      )}

      {game.event && (
        <div key={`${game.grade}-${game.slotIndex}-${game.event.id}-${game.phase}`} className="ink-in" ref={bodyRef}>
          {scene && playing === null && <SceneStage staging={scene} alt={game.event.title} />}
          {game.prelude ? (
            <h3 className="sub-title">{game.event.title}</h3>
          ) : (
            <>
              <h2 className="scene-title">{game.event.title}</h2>
              <BrushLine width={festive ? 200 : 140} />
            </>
          )}

          {!isResult && playing !== null && choices[playing]?.minigame && (
            <>
              <p className="picked">
                <InkCircle />
                {choices[playing].label}
              </p>
              <Minigame
                kind={choices[playing].minigame!}
                game={game}
                onDone={(success) => {
                  const i = playing;
                  setPlaying(null);
                  choose(i, { success });
                }}
                onAuto={() => {
                  const i = playing;
                  setPlaying(null);
                  choose(i);
                }}
              />
            </>
          )}

          {!isResult && playing === null && (
            <>
              <p className="story">{game.eventText}</p>
              <ol className="choices">
                {choices.map((c, i) => (
                  <li key={i} className={c.attend === false ? 'stay' : undefined}>
                    {c.attend === false && choices[i - 1]?.attend !== false && <p className="or">법회에 안 간다면</p>}
                    <button className="choice" onClick={() => pick(i)}>
                      <span className="key" aria-hidden="true">{i + 1}</span>
                      {/* 결과(스탯 변화)는 고른 뒤에만 보여 준다 */}
                      <span className="label">{c.label}</span>
                      {c.minigame && (
                        <span className="meta">
                          <span className="mg-tag">🎮 미니게임 · {({ dodgeball: '피구 (건강)', dance: '율동 (매력)', pungmul: '풍물 (건강)', moktak: '목탁 (신앙)' } as const)[c.minigame]}</span>
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ol>
            </>
          )}

          {isResult && game.result && (
            <>
              <p className="picked">
                <InkCircle />
                {game.result.choice}
              </p>
              {game.result.text && <p className="story result-text">{game.result.text}</p>}
              <p className="result-deltas">
                <Deltas effects={game.result.deltas} />
              </p>
              <button className="next" onClick={next} autoFocus>
                다음 장으로 <Arrow />
              </button>
              <p className="hint">Enter 키로도 넘어가요.</p>
            </>
          )}
        </div>
      )}

    </section>
  );
}
