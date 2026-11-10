import { useEffect, useState, type CSSProperties } from 'react';
import { frameFor, SPRITES, type Pose } from '../art/scene';
import { attendRate } from '../game/engine';
import { personName } from '../game/names';
import type { GameState } from '../game/types';

const BASE = import.meta.env.BASE_URL;

/** 6년 동안 한 일 중 하나를 소품으로 든다. 위에 있을수록 먼저. */
const PROPS: { prop: string; size: number; when: (g: GameState) => boolean }[] = [
  { prop: 'moktak', size: 0.2, when: (g) => g.flags.includes('president') },
  { prop: 'ocarina', size: 0.15, when: (g) => (g.records.ocarina_success ?? 0) + (g.records.song_solo ?? 0) > 0 },
  { prop: 'ball', size: 0.2, when: (g) => (g.records.dodgeball_win ?? 0) > 0 },
  { prop: 'lantern', size: 0.3, when: (g) => (g.records.lantern_dance ?? 0) + (g.records.lantern_craft ?? 0) > 0 },
  { prop: 'beads', size: 0.18, when: (g) => (g.records.beads_made ?? 0) > 0 },
];

/** 사진 아래 지솔 쌤의 한마디: 그 아이가 6년 동안 가장 크게 남긴 것 */
function jisolNote(g: GameState): string {
  const r = (k: string) => g.records[k] ?? 0;
  if (g.flags.includes('president')) return '네 목탁 소리, 쌤이 몰래 다 녹음해 놨다?';
  if (r('ocarina_success') + r('song_solo') > 0) return '네 오카리나 독주, 쌤 휴대폰에 영상 다 있다.';
  if (r('helped_kid') >= 2 || g.flags.includes('mentored_kid')) return '동생들 챙기는 건 쌤보다 네가 더 잘하더라.';
  if (r('dodgeball_win') > 0) return '피구할 때 쌤 맞힌 거, 아직 안 잊었다.';
  if (g.flags.includes('chased_elephant')) return '코끼리 연등 쫓아가던 1학년이 벌써 졸업이네.';
  if (attendRate(g) >= 0.9) return '6년 동안 일요일마다 와 줘서 고마워.';
  if (attendRate(g) < 0.5) return '자주는 못 봤어도, 올 때마다 반가웠어.';
  return '6년 동안 제일 많이 웃은 건 너였어.';
}

type Person = { key: string; sprite: string; pose: Pose; x: number; back?: boolean; flip?: boolean; edge?: boolean };

/** 졸업 날이라 친구 중 한 명은 결국 운다. 누가 울지는 판마다 다르다 (한 판 안에서는 같다). */
function crier(g: GameState): string {
  let h = 3;
  for (const c of Object.values(g.friends).join('') + g.name) h = (h * 33 + c.charCodeAt(0)) >>> 0;
  return ['haram', 'jiho', 'seoyun'][h % 3];
}

function cast(g: GameState, shot: boolean, holding: boolean): Person[] {
  const smile: Pose = shot ? 'happy' : 'idle';
  const cries = crier(g);
  const friend = (key: string): Pose => (shot && key === cries ? 'cry' : smile);
  return [
    { key: 'teacher', sprite: 'kid/teacher', pose: smile, x: 23, back: true },
    { key: 'monk', sprite: 'kid/monk', pose: shot ? 'hapjang' : 'idle', x: 80, back: true, flip: true },
    { key: 'haram', sprite: 'kid/friend-c', pose: friend('haram'), x: 12 },
    { key: 'jiho', sprite: 'kid/friend-a', pose: friend('jiho'), x: 32 },
    { key: 'hero', sprite: g.gender === 'male' ? 'kid/hero-m' : 'kid/hero-f', pose: holding ? 'idle' : smile, x: 50 },
    { key: 'seoyun', sprite: 'kid/friend-b', pose: friend('seoyun'), x: 67, flip: true },
    // 타이머 맞추고 뛰어든 지솔 쌤: 찍힐 때는 가장자리에 반쯤, 결국 울고 있다
    { key: 'gansa', sprite: 'kid/gansa', pose: shot ? 'cry' : 'run', x: 95, flip: true, edge: true },
  ];
}

const FRONT_H = 42;
const REF_H = SPRITES['kid/hero-f']?.h ?? 213;

function Figure({ p, prop, still }: { p: Person; prop?: { prop: string; size: number }; still: boolean }) {
  const base = SPRITES[p.sprite];
  if (!base) return null;
  const h = (base.h / REF_H) * FRONT_H * (p.back ? 0.92 : 1) * (p.key === 'monk' ? 1.12 : 1);
  // 울기는 한 칸짜리 감정 그림을 쓴다
  const { sprite, frame } = frameFor(p.sprite, p.pose);
  const meta = SPRITES[sprite];
  const step = 100 / (meta.frames - 1);
  const box = {
    left: `${p.x}%`,
    bottom: p.back ? '19%' : '2%',
    height: `${h}%`,
    aspectRatio: `${meta.w} / ${meta.h}`,
    zIndex: p.back ? 1 : 2,
  } as CSSProperties;
  const body = {
    backgroundImage: `url(${BASE}art/sprites/${sprite}.webp)`,
    backgroundSize: `${meta.frames * 100}% 100%`,
    backgroundPositionX: `${meta.frames > 1 ? frame * step : 0}%`,
    '--f0': '0%',
    '--f1': `${step}%`,
  } as CSSProperties;
  return (
    <div className={`actor pose-${still ? 'still' : p.pose}${p.edge ? ' runs-in' : ''}`} style={box}>
      {!still && <span className="shadow" />}
      <span className={p.flip ? 'body flip' : 'body'} style={body} />
      {prop && (
        <img
          className="held-prop"
          src={`${BASE}art/props/${prop.prop}.webp`}
          alt=""
          style={{ height: `${prop.size * 100}%` }}
        />
      )}
    </div>
  );
}

/**
 * 어린이회 졸업사진. 지솔 쌤이 타이머를 맞추고 뛰어 들어오면 찰칵, 밝은 사진 한 장이 남는다.
 * 다들 웃지만 지솔 쌤과 친구 한 명은 운다(관계는 후일담에서). 누르면 바로 찍힌다.
 */
export function GradPhoto({ game }: { game: GameState }) {
  const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [phase, setPhase] = useState<'ready' | 'flash' | 'photo'>(reduce ? 'photo' : 'ready');
  useEffect(() => {
    if (phase === 'photo') return;
    const t = setTimeout(() => setPhase(phase === 'ready' ? 'flash' : 'photo'), phase === 'ready' ? 3200 : 180);
    return () => clearTimeout(t);
  }, [phase]);

  const shot = phase !== 'ready';
  const prop = PROPS.find((p) => p.when(game));
  const people = cast(game, shot, shot && !!prop);
  const names = ['haram', 'jiho', 'seoyun'].map((k) => personName(k as 'jiho', game)).join(', ');

  return (
    <figure className={`grad-photo is-${phase}`} onClick={() => phase === 'ready' && setPhase('flash')}>
      <div className="photo-frame">
        <div className="photo">
          <img className="photo-bg" src={`${BASE}art/bg/courtyard.webp`} alt="" draggable={false} />
          {people.map((p) => (
            <Figure key={p.key} p={p} prop={p.key === 'hero' && shot ? prop : undefined} still={shot} />
          ))}
          {phase === 'ready' && <p className="countdown" aria-live="polite">셋, 둘, 하나…</p>}
          <span className="flash" />
        </div>
        <figcaption>
          {shot ? (
            <>
              <b>6학년 2월, 화계사 어린이회 졸업</b>
              <span>
                찍은 사람: 지솔 쌤 · “{jisolNote(game)}”
              </span>
            </>
          ) : (
            <span>지솔 쌤이 “다들 모여! 사진 찍자!” 하더니 타이머를 맞추고 뛰어와요.</span>
          )}
        </figcaption>
      </div>
      <p className="sr-only">
        졸업사진: {game.name}, {names}, 정 선생님, 스님, 지솔 쌤
      </p>
    </figure>
  );
}
