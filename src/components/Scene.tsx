import { useEffect, useRef, useState } from 'react';
import { currentSlot, TURNING_POINTS, YEAR_MODE_LABEL, type YearMode } from '../game/engine';
import { FESTIVE_KINDS, gradeLabel, slotsForGrade } from '../game/calendar';
import type { GameState } from '../game/types';
import { useGame } from '../store';
import { Deltas } from './Deltas';
import { SceneStage } from './SceneStage';
import { staging } from '../art/scene';
import { Arrow, BrushLine, InkCircle, LanternRow, TrackMark } from './Ink';

function YearTrack({ game }: { game: GameState }) {
  const slots = slotsForGrade(game.grade);
  return (
    <ol className="track" aria-label={`올해 일정 ${slots.length}개 중 ${game.slotIndex + 1}번째`}>
      {slots.map((s, i) => (
        <li key={i} className={i < game.slotIndex ? 'past' : i === game.slotIndex ? 'now' : ''} title={s.label}>
          <TrackMark event={FESTIVE_KINDS.includes(s.kind)} filled={i <= game.slotIndex} />
        </li>
      ))}
    </ol>
  );
}

export function Scene({ game }: { game: GameState }) {
  const { choose, next, fastForward } = useGame();
  const [ffOpen, setFfOpen] = useState(false);
  const slot = currentSlot(game);
  const festive = FESTIVE_KINDS.includes(slot.kind);
  const isResult = game.phase === 'result' && !!game.result;
  const canFastForward = game.phase === 'play' && !TURNING_POINTS.includes(slot.kind);
  const choices = game.event?.choices ?? [];
  const bodyRef = useRef<HTMLDivElement>(null);
  const eventId = game.event?.id;
  // 결과가 나오면 주인공 표정이 바뀐다: 크게 얻으면 기뻐하고, 크게 잃으면 놀란다
  const statSum = Object.values(game.result?.deltas.stats ?? {}).reduce((a, b) => a + (b ?? 0), 0);
  const mood = isResult ? (statSum >= 4 ? 'happy' : statSum <= -3 ? 'surprised' : undefined) : undefined;
  const scene =
    game.event &&
    staging({
      id: game.event.id,
      slotKind: slot.kind,
      isProgram: !!game.prelude,
      text: `${game.event.title} ${game.eventText}`,
      game,
      mood,
      alone: slot.kind === 'sunday' && !game.prelude,
    });
  // 간다를 고른 뒤: 위에 남는 아침 장면은 집, 주인공 혼자
  const preludeScene =
    game.prelude &&
    staging({ id: game.prelude.id, slotKind: slot.kind, isProgram: false, text: game.prelude.text, game, alone: true });

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
      if (!isResult) {
        const n = Number(e.key);
        if (n >= 1 && n <= choices.length) {
          e.preventDefault();
          choose(n - 1);
        }
      } else if (e.key === 'Enter' && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isResult, choices.length, choose, next]);

  return (
    <section className={festive ? 'page festive' : 'page'} aria-live="polite">
      {festive && <LanternRow />}
      <div className="dateline">
        <p className="when">
          {gradeLabel(game.grade)}, {slot.label}
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
          {scene && <SceneStage staging={scene} alt={game.event.title} />}
          {game.prelude ? (
            <h3 className="sub-title">{game.event.title}</h3>
          ) : (
            <>
              <h2 className="scene-title">{game.event.title}</h2>
              <BrushLine width={festive ? 200 : 140} />
            </>
          )}

          {!isResult && (
            <>
              <p className="story">{game.eventText}</p>
              <ol className="choices">
                {choices.map((c, i) => (
                  <li key={i} className={c.attend === false ? 'stay' : undefined}>
                    {c.attend === false && choices[i - 1]?.attend !== false && <p className="or">법회에 안 간다면</p>}
                    <button className="choice" onClick={() => choose(i)}>
                      <span className="key" aria-hidden="true">{i + 1}</span>
                      <span className="label">{c.label}</span>
                      {(c.effects?.stats || c.roll) && (
                        <span className="meta">
                          <Deltas effects={c.effects} showRel={false} luck={!!c.roll} />
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

      {canFastForward && (
        <div className="ff">
          {!ffOpen ? (
            <button className="textlink" onClick={() => setFfOpen(true)}>
              올해는 빠르게 넘기기
            </button>
          ) : (
            <>
              <span className="lead">올해는</span>
              {(Object.keys(YEAR_MODE_LABEL) as YearMode[]).map((m) => (
                <button
                  key={m}
                  className="textlink"
                  onClick={() => {
                    setFfOpen(false);
                    fastForward(m);
                  }}
                >
                  {YEAR_MODE_LABEL[m]}
                </button>
              ))}
              <button className="textlink" onClick={() => setFfOpen(false)}>
                그만두기
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
