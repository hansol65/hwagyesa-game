import characters from '../data/characters.json';
import { FRIEND_KEYS, type FriendKey, type GameState, type RelKey } from './types';

const CHARS = characters as unknown as Record<RelKey, { name: string; role: string; desc: string }>;

/** 이번 판에서 이 사람을 부르는 이름. 친구 셋은 매판 뽑힌 이름, 나머지는 고정. */
export function personName(key: RelKey, game: Pick<GameState, 'friends'> | null | undefined): string {
  if (game && (FRIEND_KEYS as RelKey[]).includes(key)) return game.friends[key as FriendKey];
  return CHARS[key].name;
}

export function personRole(key: RelKey) {
  return { role: CHARS[key].role, desc: CHARS[key].desc };
}

/** 받침에 따라 '와/과' */
export function withWa(name: string) {
  const code = name.charCodeAt(name.length - 1) - 0xac00;
  return name + (code >= 0 && code <= 11171 && code % 28 !== 0 ? '과' : '와');
}

/** 공양간 뒤 고양이 이름. 판마다 하나로 정해진다 (그 판 친구 이름으로 고르니 한 판 안에서는 늘 같다). */
const CAT_NAMES = ['지장이', '보살이', '미륵이'];
export function catName(game: Pick<GameState, 'friends' | 'name'>): string {
  let h = 11;
  for (const c of Object.values(game.friends).join('') + game.name) h = (h * 37 + c.charCodeAt(0)) >>> 0;
  return CAT_NAMES[h % CAT_NAMES.length];
}
