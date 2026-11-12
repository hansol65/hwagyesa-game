import characters from '../data/characters.json';
import { FRIEND_KEYS, type FriendKey, type GameState, type RelKey } from './types';

type Person = { name: string; role: string; desc: string };
const CHARS = characters as unknown as Record<RelKey, Person> & {
  student: Partial<Record<RelKey, Person>>;
  university: Partial<Record<RelKey, Person>>;
};

/** 학생회에서는 간사 쌤과 지도 선생님이 다른 사람이다. 대학생회에서는 그 두 자리가 지솔 쌤·영민 쌤(선배)이 된다 */
function who(key: RelKey, grade?: number): Person {
  if (grade && grade > 12) return CHARS.university[key] ?? CHARS.student[key] ?? CHARS[key];
  if (grade && grade > 6) return CHARS.student[key] ?? CHARS[key];
  return CHARS[key];
}

/**
 * 대학생회에서 지솔·영민은 쌤이 아니라 같은 대학생회 선배다(둘 다 아직 졸업을 못 했다).
 * 지솔은 여자 선배라 언니·누나, 영민은 남자 선배라 오빠·형.
 */
export function seniorName(key: 'gansa' | 'teacher', gender: GameState['gender'] | undefined): string {
  const female = gender !== 'male';
  return key === 'gansa' ? `지솔 ${female ? '언니' : '누나'}` : `영민 ${female ? '오빠' : '형'}`;
}

/** 이번 판에서 이 사람을 부르는 이름. 친구 셋은 매판 뽑힌 이름, 나머지는 고정. */
export function personName(
  key: RelKey,
  game: (Pick<GameState, 'friends' | 'grade'> & Partial<Pick<GameState, 'gender'>>) | null | undefined,
): string {
  if (game && (FRIEND_KEYS as RelKey[]).includes(key)) return game.friends[key as FriendKey];
  if (game && game.grade > 12 && (key === 'gansa' || key === 'teacher')) return seniorName(key, game.gender);
  return who(key, game?.grade).name;
}

/**
 * 대학생회에서도 꼬박꼬박 나오는 친구 하나. 나머지 둘은 행사 때만 온다.
 * 대학생회에 올라갈 때 가장 가까웠던 친구로 정해진다 (flag 'buddy:<key>').
 */
export function uniBuddy(game: Pick<GameState, 'flags' | 'rel'>): FriendKey {
  const f = game.flags.find((x) => x.startsWith('buddy:'));
  if (f) return f.slice(6) as FriendKey;
  return FRIEND_KEYS.reduce((a, b) => (game.rel[b] > game.rel[a] ? b : a));
}

export function personRole(key: RelKey, grade?: number) {
  const p = who(key, grade);
  return { role: p.role, desc: p.desc };
}

/** 받침에 따라 '와/과' */
export function withWa(name: string) {
  const code = name.charCodeAt(name.length - 1) - 0xac00;
  return name + (code >= 0 && code <= 11171 && code % 28 !== 0 ? '과' : '와');
}

/** 받침에 따라 '은/는' (영어 등 한글이 아니면 '는') */
export function withEunNeun(name: string) {
  const code = name.charCodeAt(name.length - 1) - 0xac00;
  return name + (code >= 0 && code <= 11171 && code % 28 !== 0 ? '은' : '는');
}

/** 공양간 뒤 고양이 이름. 판마다 하나로 정해진다 (그 판 친구 이름으로 고르니 한 판 안에서는 늘 같다). */
/**
 * 공양간 뒤 고양이. 판마다 세 마리 중 한 마리가 무작위로 정해지고(flag 'cat:1'~'cat:3'),
 * 그림과 이름이 짝이다: 1 치즈 무늬 지장이, 2 삼색 보살이, 3 고등어 무늬 미륵이.
 * 세 마리를 다 키워 보는 건 칭호 모음(○○의 집사)으로 모은다.
 */
export const CAT_NAMES = ['지장이', '보살이', '미륵이'];
export function catIndex(game: Pick<GameState, 'friends' | 'name' | 'flags'>): number {
  const f = game.flags?.find((x) => x.startsWith('cat:'));
  if (f) return Number(f.slice(4)) || 1;
  // 예전 저장에는 표시가 없으니 이름으로 고른다
  let h = 11;
  for (const c of Object.values(game.friends).join('') + game.name) h = (h * 37 + c.charCodeAt(0)) >>> 0;
  return (h % CAT_NAMES.length) + 1;
}
export function catName(game: Pick<GameState, 'friends' | 'name' | 'flags'>): string {
  return CAT_NAMES[catIndex(game) - 1];
}
