import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { frameFor, SPRITES, type Pose } from '../art/scene';
import type { GameState, MinigameKind } from '../game/types';

const BASE = import.meta.env.BASE_URL;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** 짧은 소리. 소리를 못 내는 환경이면 조용히 넘어간다 */
function useBeep() {
  const ctx = useRef<AudioContext | null>(null);
  return useCallback((freq: number, len = 0.08) => {
    try {
      ctx.current ??= new AudioContext();
      const c = ctx.current;
      const o = c.createOscillator();
      const g = c.createGain();
      o.frequency.value = freq;
      o.type = 'triangle';
      g.gain.setValueAtTime(0.12, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + len);
      o.connect(g).connect(c.destination);
      o.start();
      o.stop(c.currentTime + len);
    } catch {
      /* 소리 없이 진행 */
    }
  }, []);
}

function Kid({ sprite, pose, x, flip, h }: { sprite: string; pose: Pose; x: number; flip?: boolean; h: number }) {
  if (!SPRITES[sprite]) return null;
  const { sprite: s, frame } = frameFor(sprite, pose);
  const meta = SPRITES[s];
  const step = meta.frames > 1 ? 100 / (meta.frames - 1) : 0;
  const box = { left: `${x}%`, height: `${h}%`, aspectRatio: `${meta.w} / ${meta.h}` } as CSSProperties;
  const body = {
    backgroundImage: `url(${BASE}art/sprites/${s}.webp)`,
    backgroundSize: `${meta.frames * 100}% 100%`,
    backgroundPositionX: `${frame * step}%`,
  } as CSSProperties;
  return (
    <div className="actor" style={box}>
      <span className="shadow" />
      <span className={flip ? 'body flip' : 'body'} style={body} />
    </div>
  );
}

/** 매 프레임 시간을 흘린다 */
function useClock(running: boolean) {
  const [now, setNow] = useState(0);
  const start = useRef(0);
  useEffect(() => {
    if (!running) return;
    start.current = performance.now();
    setNow(0);
    let raf = 0;
    const tick = () => {
      setNow(performance.now() - start.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);
  return { now, elapsed: () => performance.now() - start.current };
}

type Flash = { word: string; good: boolean; at: number };

// ───────────────────────── 피구 ─────────────────────────
// 친구가 공을 던질 때마다 게이지의 바늘이 왔다갔다한다. 공이 오기 전에
// 바늘이 가운데 칸에 있을 때 눌러야 받는다. 던지는 척(빨간 게이지)에는 누르면 안 된다.
// 건강이 높을수록 가운데 칸이 넓고 바늘이 느리다.

interface Throw {
  fake: boolean;
  /** 던지기 시작 시각 */
  at: number;
  /** 공이 날아오는 시간 (이 안에 눌러야 한다) */
  flight: number;
  /** 바늘이 한쪽 끝에서 다른 끝까지 가는 시간 */
  sweep: number;
  /** 바늘 시작 위치(0~1)와 방향 */
  phase: number;
}

function dodgeTuning(g: GameState) {
  const h = g.stats.health;
  const sports = g.traits.talent === 'sports';
  return {
    // 가운데 칸 너비(게이지의 %): 건강 30이면 8%, 60이면 13%, 90이면 18%
    zone: clamp(8 + h * 0.2 + (sports ? 4 : 0), 12, 28),
    // 건강이 낮으면 바늘이 빠르다
    speed: clamp(1.15 - h / 200 - (sports ? 0.08 : 0), 0.7, 1.1),
  };
}

function makeThrows(speed: number): Throw[] {
  const n = 7;
  // 2~7번째 중 두 번은 던지는 척
  const fakes = new Set<number>();
  while (fakes.size < 2) fakes.add(1 + Math.floor(Math.random() * (n - 1)));
  let t = 400;
  return Array.from({ length: n }, (_, i) => {
    const fake = fakes.has(i);
    const th: Throw = {
      fake,
      at: t,
      flight: fake ? 1200 : clamp(1900 - i * 120, 1100, 1900),
      // 바늘이 칸을 지나는 시간: 건강 25면 0.11→0.07초, 80이면 0.15→0.10초
      sweep: clamp(850 - i * 50, 550, 850) * speed,
      phase: Math.random(),
    };
    t += th.flight + rand(700, 1100);
    return th;
  });
}

/** 바늘 위치 0~1 (왔다갔다) */
function needle(th: Throw, t: number) {
  const u = (t - th.at) / th.sweep + th.phase;
  const k = u % 2;
  return k < 1 ? k : 2 - k;
}

function Dodgeball({ game, onEnd }: { game: GameState; onEnd: (hits: number, total: number) => void }) {
  const tune = useMemo(() => dodgeTuning(game), [game]);
  const [throws] = useState(() => makeThrows(tune.speed));
  const real = throws.filter((t) => !t.fake).length;
  const [res, setRes] = useState<('ok' | 'bad' | null)[]>(() => throws.map(() => null));
  const resRef = useRef(res);
  resRef.current = res;
  const [flash, setFlash] = useState<Flash | null>(null);
  const { now, elapsed } = useClock(true);
  const beep = useBeep();
  const done = useRef(false);

  const current = throws.findIndex((th, i) => res[i] === null && now >= th.at);
  const th = current >= 0 ? throws[current] : null;

  const judge = useCallback(
    (i: number, ok: boolean, word: string) => {
      setRes((r) => r.map((v, j) => (j === i ? (ok ? 'ok' : 'bad') : v)));
      setFlash({ word, good: ok, at: elapsed() });
      beep(ok ? 560 : 140, ok ? 0.08 : 0.18);
    },
    [beep, elapsed],
  );

  // 시간이 다 되면: 진짜 공은 맞고, 던지는 척은 잘 참은 것
  useEffect(() => {
    if (!th || current < 0) return;
    if (now > th.at + th.flight) judge(current, th.fake, th.fake ? '안 속았다!' : '맞았다…');
  }, [now, th, current, judge]);

  useEffect(() => {
    const last = throws[throws.length - 1];
    if (!done.current && res.every((v) => v !== null) && now > last.at + last.flight + 600) {
      done.current = true;
      onEnd(res.filter((v, i) => v === 'ok' && !throws[i].fake).length - res.filter((v, i) => v === 'bad' && throws[i].fake).length, real);
    }
  }, [now, res, throws, real, onEnd]);

  const press = useCallback(() => {
    const t = elapsed();
    const i = throws.findIndex((x, j) => resRef.current[j] === null && t >= x.at && t <= x.at + x.flight);
    if (i < 0) return;
    const x = throws[i];
    if (x.fake) return judge(i, false, '속았다!');
    const pos = needle(x, t) * 100;
    const inZone = Math.abs(pos - 50) <= tune.zone / 2;
    judge(i, inZone, inZone ? '받았다!' : '놓쳤다…');
  }, [elapsed, throws, judge, tune.zone]);

  const hits = res.filter((v, i) => v === 'ok' && !throws[i].fake).length;
  const fooled = res.filter((v, i) => v === 'bad' && throws[i].fake).length;
  const recent = flash && now - flash.at < 500 ? flash : null;
  const hero = game.gender === 'male' ? 'kid/hero-m' : 'kid/hero-f';
  const p = th ? clamp((now - th.at) / th.flight, 0, 1) : 0;

  return (
    <Shell
      kind="dodgeball"
      bg="courtyard"
      press={press}
      score={`${Math.max(0, hits - fooled)} / ${real}`}
      flash={recent}
      cast={
        <>
          <Kid sprite={hero} pose={recent ? (recent.good ? 'happy' : 'surprised') : 'idle'} x={14} h={50} />
          <Kid sprite="kid/friend-a" pose={th ? (th.fake ? 'idle' : 'run') : 'idle'} x={88} flip h={50} />
          {th && !th.fake && (
            <img className="mg-note" src={`${BASE}art/props/ball.webp`} alt="" style={{ left: `${88 - 70 * p}%`, bottom: `${30 + Math.sin(p * Math.PI) * 16}%` }} />
          )}
          {th && th.fake && <span className="mg-call">던지는 척~ 기다려!</span>}
          {th && (
            <div className={`mg-gauge${th.fake ? ' fake' : ''}`}>
              <span className="zone" style={{ width: `${tune.zone}%` }} />
              <span className="needle" style={{ left: `${needle(th, now) * 100}%` }} />
            </div>
          )}
        </>
      }
    />
  );
}

// ───────────────────────── 율동 ─────────────────────────
// 연등이 박자에 맞춰 점선으로 온다. 박자가 빠르고, 반 박·엇박이 섞인다.
// 아무것도 없을 때 누르면 '삐끗'으로 한 점 깎인다. 매력·음악 재능이 높을수록 판정이 넓다.

function danceTuning(g: GameState) {
  return clamp(
    80 + Math.max(0, (g.stats.charm - 30) * 0.7) + (g.traits.talent === 'music' ? 25 : 0) + (g.traits.temper === 'active' ? 10 : 0),
    80,
    140,
  );
}

/** 4박 단위 패턴. 1 = 그 칸에 박자 (8분음표 칸) */
const PATTERNS = [
  [1, 0, 1, 0, 1, 0, 1, 0],
  [1, 0, 1, 1, 0, 1, 1, 0],
  [1, 1, 0, 1, 1, 0, 1, 0],
  [0, 1, 1, 0, 1, 0, 1, 1],
  [1, 0, 0, 1, 1, 0, 1, 1],
];

function makeBeats(): number[] {
  const eighth = 260; // 약 115bpm
  const out: number[] = [];
  let t = 1100;
  const order = [0, 1, 2, 3, 4].sort(() => Math.random() - 0.5);
  order.unshift(0); // 첫 마디는 쉽게
  for (const k of order.slice(0, 5)) {
    PATTERNS[k].forEach((on, i) => on && out.push(t + i * eighth));
    t += eighth * 8;
  }
  return out;
}

const DANCE_POSES: Pose[] = ['happy', 'hapjang', 'run', 'happy'];
const HIT_X = 24;
const TRAVEL = 1050;

function Dance({ game, onEnd }: { game: GameState; onEnd: (hits: number, total: number) => void }) {
  const win = useMemo(() => danceTuning(game), [game]);
  const [beats] = useState(makeBeats);
  const [res, setRes] = useState<('hit' | 'miss' | null)[]>(() => beats.map(() => null));
  const resRef = useRef(res);
  resRef.current = res;
  const [slips, setSlips] = useState(0);
  const [combo, setCombo] = useState(0);
  const [flash, setFlash] = useState<Flash | null>(null);
  const { now, elapsed } = useClock(true);
  const beep = useBeep();
  const done = useRef(false);

  useEffect(() => {
    const i = beats.findIndex((b, j) => res[j] === null && now > b + win);
    if (i >= 0) {
      setRes((r) => r.map((v, j) => (j === i ? 'miss' : v)));
      setCombo(0);
      setFlash({ word: '놓쳤다', good: false, at: now });
    }
    if (!done.current && now > beats[beats.length - 1] + win + 700) {
      done.current = true;
      const hits = res.filter((v) => v === 'hit').length;
      onEnd(hits - slips, beats.length);
    }
  }, [now, beats, res, win, slips, onEnd]);

  const press = useCallback(() => {
    const t = elapsed();
    let best = -1;
    let bestD = Infinity;
    beats.forEach((b, i) => {
      if (resRef.current[i] !== null) return;
      const d = Math.abs(t - b);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    if (best >= 0 && bestD <= win) {
      setRes((r) => r.map((v, j) => (j === best ? 'hit' : v)));
      setCombo((c) => c + 1);
      setFlash({ word: bestD < win / 2 ? '딱!' : '좋아', good: true, at: t });
      beep(bestD < win / 2 ? 760 : 620);
    } else {
      // 헛박자: 한 점 깎이고 연속이 끊긴다
      setSlips((s) => s + 1);
      setCombo(0);
      setFlash({ word: '삐끗!', good: false, at: t });
      beep(140, 0.15);
    }
  }, [elapsed, beats, win, beep]);

  const hits = res.filter((v) => v === 'hit').length;
  const recent = flash && now - flash.at < 400 ? flash : null;
  const hero = game.gender === 'male' ? 'kid/hero-m' : 'kid/hero-f';
  const pose: Pose = recent ? (recent.good ? DANCE_POSES[hits % 4] : 'surprised') : 'idle';

  return (
    <Shell
      kind="dance"
      bg="lantern-street"
      night
      press={press}
      score={`${Math.max(0, hits - slips)} / ${beats.length}${combo >= 4 ? ` · ${combo}연속` : ''}`}
      flash={recent}
      cast={
        <>
          <Kid sprite={hero} pose={pose} x={HIT_X - 10} h={50} />
          <Kid sprite="kid/friend-b" pose={recent?.good ? DANCE_POSES[(hits + 1) % 4] : 'idle'} x={86} flip h={44} />
          <span className="mg-line" style={{ left: `${HIT_X}%` }} />
          {beats.map((b, i) => {
            if (res[i] === 'hit') return null;
            const p = 1 - (b - now) / TRAVEL;
            if (p < 0 || p > 1.3) return null;
            return (
              <img
                key={i}
                className={`mg-note${res[i] === 'miss' ? ' missed' : ''}`}
                src={`${BASE}art/props/lantern.webp`}
                alt=""
                style={{ left: `${92 - (92 - HIT_X) * p}%`, bottom: '30%' }}
              />
            );
          })}
        </>
      }
    />
  );
}

// ───────────────────────── 공통 틀 ─────────────────────────

function Shell({
  kind,
  bg,
  night,
  press,
  score,
  flash,
  cast,
}: {
  kind: MinigameKind;
  bg: string;
  night?: boolean;
  press: () => void;
  score: string;
  flash: Flash | null;
  cast: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.key !== ' ' && e.key !== 'Enter') return;
      e.preventDefault();
      e.stopPropagation();
      if (!e.repeat) press();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [press]);
  return (
    <>
      <div
        className={`stage mg-stage mg-${kind}${night ? ' night' : ''}`}
        onPointerDown={(e) => {
          e.preventDefault();
          press();
        }}
      >
        <img className="stage-bg" src={`${BASE}art/bg/${bg}.webp`} alt="" draggable={false} />
        <div className="stage-cast">
          {cast}
          {flash && <span className={`mg-flash${flash.good ? ' good' : ''}`}>{flash.word}</span>}
          <span className="mg-score tabular">{score}</span>
        </div>
      </div>
      <button
        className="mg-button"
        onPointerDown={(e) => {
          e.preventDefault();
          press();
        }}
      >
        {kind === 'dodgeball' ? '받기!' : '짝!'} <small>스페이스바</small>
      </button>
    </>
  );
}

const INFO: Record<MinigameKind, { title: string; how: (g: GameState) => string; need: number }> = {
  dodgeball: {
    title: '피구: 날아오는 공을 받아라!',
    how: (g) =>
      `공이 날아오는 동안 바늘이 왔다갔다해요. 바늘이 가운데 칸에 들어왔을 때 누르면 받아요. 빨간 게이지는 던지는 척이니 누르면 안 돼요! 던질수록 빨라져요. 지금 건강 ${g.stats.health}: ${
        g.stats.health >= 60 ? '몸이 가벼워서 칸이 넓어요.' : g.stats.health >= 40 ? '그럭저럭이에요.' : '몸이 무거워서 칸이 좁고 바늘이 빨라요.'
      }`,
    need: 3,
  },
  dance: {
    title: '율동: 박자에 맞춰라!',
    how: (g) =>
      `연등이 점선에 닿을 때 누르세요. 박자가 빠르고 엇박도 나와요. 아무것도 없을 때 누르면 삐끗해서 한 점 깎여요. 지금 매력 ${g.stats.charm}: ${
        g.stats.charm >= 60 ? '자신감이 넘쳐서 판정이 너그러워요.' : g.stats.charm >= 40 ? '그럭저럭이에요.' : '쭈뼛쭈뼛해서 판정이 깐깐해요.'
      }`,
    need: 15,
  },
};

export function Minigame({
  kind,
  game,
  onDone,
  onAuto,
}: {
  kind: MinigameKind;
  game: GameState;
  onDone: (success: boolean) => void;
  onAuto: () => void;
}) {
  const info = INFO[kind];
  const [phase, setPhase] = useState<'intro' | 'ready' | 'play' | 'done'>('intro');
  const [count, setCount] = useState(3);
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);
  const [round, setRound] = useState(0);
  const success = !!result && result.score >= info.need;

  const begin = () => {
    setResult(null);
    setRound((r) => r + 1);
    setCount(3);
    setPhase('ready');
  };
  // 3, 2, 1, 시작! 뒤에 게임이 돌기 시작한다
  useEffect(() => {
    if (phase !== 'ready') return;
    const t = setTimeout(() => (count > 0 ? setCount(count - 1) : setPhase('play')), count > 0 ? 650 : 450);
    return () => clearTimeout(t);
  }, [phase, count]);
  const end = useCallback((score: number, total: number) => {
    setResult({ score: Math.max(0, score), total });
    setPhase('done');
  }, []);

  useEffect(() => {
    if (phase !== 'intro') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.key !== ' ') return;
      e.preventDefault();
      e.stopPropagation();
      begin();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  });

  const hero = game.gender === 'male' ? 'kid/hero-m' : 'kid/hero-f';

  return (
    <div className={`minigame mg-${kind}`}>
      <p className="mg-title">{info.title}</p>
      {phase === 'play' &&
        (kind === 'dodgeball' ? <Dodgeball key={round} game={game} onEnd={end} /> : <Dance key={round} game={game} onEnd={end} />)}
      {phase !== 'play' && (
        <div className={`stage mg-stage${kind === 'dance' ? ' night' : ''}`}>
          <img className="stage-bg" src={`${BASE}art/bg/${kind === 'dance' ? 'lantern-street' : 'courtyard'}.webp`} alt="" />
          <div className="stage-cast">
            <Kid sprite={hero} pose={phase === 'done' ? (success ? 'happy' : 'cry') : 'idle'} x={30} h={50} />
            {phase === 'ready' && <span className="mg-count" key={count}>{count > 0 ? count : '시작!'}</span>}
            <Kid sprite={kind === 'dance' ? 'kid/friend-b' : 'kid/friend-a'} pose={phase === 'done' && success ? 'happy' : 'idle'} x={70} flip h={kind === 'dance' ? 44 : 50} />
          </div>
        </div>
      )}
      {phase === 'intro' && (
        <div className="mg-intro">
          <p>
            {info.how(game)} 목표 <b>{info.need}점</b>. 실패하면 크게 잃어요.
          </p>
          <div className="mg-actions">
            <button className="seal-btn" onClick={begin} autoFocus>
              시작 <small>스페이스바</small>
            </button>
            <button className="textlink" onClick={onAuto}>
              알아서 하기
            </button>
          </div>
        </div>
      )}
      {phase === 'done' && result && (
        <div className="mg-intro">
          <p>
            <b>
              {result.score}점 / 목표 {info.need}점
            </b>{' '}
            {success ? '해냈어요!' : '아깝다… 실패예요.'}
          </p>
          <div className="mg-actions">
            <button className="seal-btn" onClick={() => onDone(success)} autoFocus>
              결과 보기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
