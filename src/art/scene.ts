import scenes from './scenes.json';
import sprites from './sprites.json';
import { FRIEND_KEYS, type GameState, type RelKey } from '../game/types';

/** 스프라이트 시트의 동작 순서 (ART_GUIDE.md와 같다) */
export const POSE_FRAME = { idle: 0, idle2: 1, run: 2, hapjang: 3, happy: 4, surprised: 5 } as const;
export type Pose = 'idle' | 'run' | 'hapjang' | 'happy' | 'surprised';

type SceneDef = { bg?: string; night?: boolean; cast?: RelKey[]; pose?: Pose };
const DEFAULTS = scenes.defaults as Record<string, SceneDef>;
const SCENES = scenes.scenes as Record<string, SceneDef>;
export const SPRITES = sprites as Record<string, { frames: number; w: number; h: number }>;

/** 어린이회 → 학생회 → 대학생회. 지금은 어린이회(1~6학년)만 있다. */
export function stageOf(grade: number): 'kid' | 'student' | 'university' {
  return grade <= 6 ? 'kid' : grade <= 12 ? 'student' : 'university';
}

const ROLE_SPRITE: Record<RelKey, string> = {
  jiho: 'friend-a',
  seoyun: 'friend-b',
  haram: 'friend-c',
  gansa: 'gansa',
  teacher: 'teacher',
  monk: 'monk',
};

export interface Actor {
  key: string; // 'hero' 또는 RelKey
  sprite: string; // 'kid/hero-f'
  pose: Pose;
}

export interface Staging {
  bg: string;
  night: boolean;
  actors: Actor[];
}

/** 글에 이름이 나오는 사람을 등장시킨다. 아무도 안 나오면 친구 한둘을 곁에 세운다. */
function autoCast(text: string, game: GameState, seed: string): RelKey[] {
  const found: RelKey[] = [];
  for (const k of FRIEND_KEYS) if (text.includes(game.friends[k])) found.push(k);
  if (text.includes('지솔')) found.push('gansa');
  if (text.includes('정 선생님')) found.push('teacher');
  if (text.includes('스님')) found.push('monk');
  if (found.length) return found.slice(0, 3);
  // 이름이 없으면 장면마다 정해진 친구 한둘 (같은 장면은 늘 같은 친구)
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const a = FRIEND_KEYS[h % 3];
  const b = FRIEND_KEYS[(h + 1 + ((h >> 3) % 2)) % 3];
  return h % 4 === 0 ? [a] : [a, b];
}

const KEYWORD_POSE: [RegExp, Pose][] = [
  [/예불|법문|합장|108배|명상|목탁|기도|소원/, 'hapjang'],
  [/피구|보물찾기|줄넘기|미끄럼|물총|산책|등산|뛰어/, 'run'],
];

export function staging(opts: {
  id: string;
  slotKind: string;
  isProgram: boolean;
  text: string;
  game: GameState;
  mood?: 'happy' | 'surprised';
  alone?: boolean;
}): Staging {
  const { id, slotKind, isProgram, text, game } = opts;
  const def = SCENES[id] ?? {};
  const base = (slotKind === 'sunday' && isProgram ? DEFAULTS.program : DEFAULTS[slotKind]) ?? DEFAULTS.program;
  const stage = stageOf(game.grade);
  let bg = def.bg ?? base.bg ?? 'kids-room';
  if (stage !== 'kid' && bg === 'kids-room') bg = 'students-room';

  const pose: Pose = def.pose ?? KEYWORD_POSE.find(([re]) => re.test(text))?.[1] ?? 'idle';
  const heroPose: Pose = opts.mood ?? pose;
  const cast = opts.alone ? [] : (def.cast ?? autoCast(text, game, id));
  const sp = (name: string) => {
    const key = `${stage}/${name}`;
    return SPRITES[key] ? key : `kid/${name}`;
  };

  return {
    bg,
    night: def.night ?? base.night ?? false,
    actors: [
      { key: 'hero', sprite: sp(game.gender === 'male' ? 'hero-m' : 'hero-f'), pose: heroPose },
      // 다른 사람들은 기뻐하기·놀라기를 따라 하지 않는다
      ...cast.map((k) => ({ key: k, sprite: sp(ROLE_SPRITE[k]), pose: pose === 'happy' || pose === 'surprised' ? 'idle' : pose }) as Actor),
    ],
  };
}
