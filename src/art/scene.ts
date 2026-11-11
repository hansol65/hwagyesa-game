import scenes from './scenes.json';
import sprites from './sprites.json';
import { FRIEND_KEYS, type GameState, type RelKey } from '../game/types';
import { catIndex, uniBuddy } from '../game/names';

/** 스프라이트 시트의 동작 순서 (ART_GUIDE.md와 같다) */
export const POSE_FRAME = { idle: 0, idle2: 1, run: 2, hapjang: 3, happy: 4, surprised: 5 } as const;
export type Pose = 'idle' | 'run' | 'hapjang' | 'happy' | 'surprised' | 'cry' | 'angry';

/** 그릴 시트와 칸. 울기·화내기는 <인물>-cry / <인물>-angry 한 칸짜리 그림. 없으면 울기는 놀라기, 화내기는 서 있기로 대신한다. */
export function frameFor(sprite: string, pose: Pose): { sprite: string; frame: number } {
  if (pose === 'cry' || pose === 'angry') {
    const emote = `${sprite}-${pose}`;
    if (SPRITES[emote]) return { sprite: emote, frame: 0 };
    return { sprite, frame: pose === 'cry' ? POSE_FRAME.surprised : POSE_FRAME.idle };
  }
  return { sprite, frame: POSE_FRAME[pose] };
}

/** castPose: 특정 사람만 다른 동작 (예: 우는 친구 { "haram": "cry" }) */
type SceneDef = {
  bg?: string;
  night?: boolean;
  cast?: RelKey[];
  pose?: Pose;
  castPose?: Partial<Record<RelKey, Pose>>;
  /** 고양이(지장이·보살이·미륵이)가 나오는 장면. kittens는 새끼 수 */
  cat?: boolean;
  kittens?: number;
  /** 대학생 간사 장면에 세우는 동생들: 어린이회(kid) 아이들이나 학생회(student) 후배들 */
  juniors?: { stage: 'kid' | 'student'; n: number; pose?: Pose };
};
const DEFAULTS = scenes.defaults as Record<string, SceneDef>;
const SCENES = scenes.scenes as Record<string, SceneDef>;
export const SPRITES = sprites as Record<string, { frames: number; w: number; h: number }>;

/** 어린이회(초1~6) → 학생회(중1~고3) → 대학생회(대1~4) */
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
  /** 고양이 그림 번호와 새끼 고양이 수 */
  cat?: { n: number; kittens: number };
}


/** 글에 이름이 나오는 사람을 등장시킨다. 아무도 안 나오면 친구 한둘을 곁에 세운다. */
function autoCast(text: string, game: GameState, seed: string): RelKey[] {
  // 어른이 먼저: 자리가 모자라면 친구가 빠진다 (선생님·스님이 너무 안 나와서)
  const found: RelKey[] = [];
  if (text.includes('스님')) found.push('monk');
  if (stageOf(game.grade) === 'university') {
    // 대학생회엔 간사·선생님이 없다. 두 자리는 지솔 쌤(gansa)과 영민 쌤(teacher)
    if (text.includes('지솔')) found.push('gansa');
    if (text.includes('영민')) found.push('teacher');
  } else {
    // '지솔 쌤'은 쌤, 그냥 '선생님'은 지도 선생님(정 선생님)
    if (text.includes('선생님')) found.push('teacher');
    if (text.includes('지솔') || text.includes('영민')) found.push('gansa');
  }
  for (const k of FRIEND_KEYS) if (text.includes(game.friends[k])) found.push(k);
  if (found.length) return [...new Set(found)].slice(0, 3);
  // 대학생회 일요일엔 꼬박꼬박 오는 친구 하나만 곁에 있다
  if (stageOf(game.grade) === 'university') return [uniBuddy(game)];
  // 이름이 없으면 장면마다 정해진 친구 한둘 (같은 장면은 늘 같은 친구)
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const a = FRIEND_KEYS[h % 3];
  // 남은 두 친구 중 하나 (같은 친구가 두 번 서지 않게)
  const rest = FRIEND_KEYS.filter((k) => k !== a);
  const b = rest[(h >>> 3) % 2];
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
  mood?: 'happy' | 'surprised' | 'cry';
  alone?: boolean;
  /** 등장인물 고르기에만 쓰는 글 (선택지 문구 등). 동작은 바꾸지 않는다. */
  castText?: string;
}): Staging {
  const { id, slotKind, isProgram, text, game } = opts;
  const def = SCENES[id] ?? {};
  const base = (slotKind === 'sunday' && isProgram ? DEFAULTS.program : DEFAULTS[slotKind]) ?? DEFAULTS.program;
  const stage = stageOf(game.grade);
  let bg = def.bg ?? base.bg ?? 'kids-room';
  // 학생회부터는 법회실이 바뀐다 (장면에 어린이회 법회실을 콕 집었으면 그대로: 대학생 간사가 어린이회에 갈 때)
  if (stage !== 'kid' && bg === 'kids-room' && def.bg !== 'kids-room') bg = 'students-room';

  const pose: Pose = def.pose ?? KEYWORD_POSE.find(([re]) => re.test(text))?.[1] ?? 'idle';
  const heroPose: Pose = opts.mood ?? pose;
  const cast = opts.alone ? [] : (def.cast ?? autoCast(`${text} ${opts.castText ?? ''}`, game, id));
  const sp = (name: string) => {
    const key = `${stage}/${name}`;
    return SPRITES[key] ? key : `kid/${name}`;
  };
  // 대학생회에서 지솔 쌤은 어린이회 때 그림, 영민 쌤은 학생회 때 그림 그대로
  const roleSprite = (k: RelKey) =>
    stage === 'university' && k === 'gansa' ? 'kid/gansa' : stage === 'university' && k === 'teacher' ? 'student/gansa' : sp(ROLE_SPRITE[k]);

  return {
    bg,
    night: def.night ?? base.night ?? false,
    cat: def.cat ? { n: catIndex(game), kittens: def.kittens ?? 0 } : undefined,
    actors: [
      { key: 'hero', sprite: sp(game.gender === 'male' ? 'hero-m' : 'hero-f'), pose: heroPose },
      // 다른 사람들은 기뻐하기·놀라기·울기를 따라 하지 않는다.
      // 아이가 울면 쌤과 선생님은 달래지 않고 더 단호해진다(화내기).
      ...cast.map((k) => {
        const adult = k === 'gansa' || k === 'teacher';
        const p: Pose =
          heroPose === 'cry' && adult ? 'angry' : pose === 'happy' || pose === 'surprised' || pose === 'cry' ? 'idle' : pose;
        return { key: k, sprite: roleSprite(k), pose: def.castPose?.[k] ?? p } as Actor;
      }),
      // 동생들: 친구 그림 세 장을 돌려 가며 (어린이회 아이들은 대학생보다 작게 나온다)
      ...Array.from({ length: def.juniors?.n ?? 0 }, (_, i) => ({
        key: `junior-${i}`,
        sprite: `${def.juniors!.stage}/${['friend-a', 'friend-b', 'friend-c'][i % 3]}`,
        pose: def.juniors!.pose ?? (pose === 'hapjang' || pose === 'run' ? pose : 'idle'),
      })),
    ],
  };
}
