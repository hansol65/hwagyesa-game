import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { advance, choose, enterStudent, enterUniversity, newGame, startNextYear } from './game/engine';
import type { GameState, Gender } from './game/types';
import type { ArchetypeId } from './game/archetypes';
import type { DreamId } from './game/dreams';

const rng = Math.random;

interface Store {
  game: GameState | null;
  /** type: 시작할 때 고른 아이의 성향 */
  start: (name: string, gender: Gender, type?: ArchetypeId) => void;
  /** played: 미니게임을 직접 한 결과 */
  choose: (index: number, played?: { success: boolean }) => void;
  next: () => void;
  nextYear: () => void;
  /** 어린이회 졸업 뒤 학생회로 이어 간다. 이때 꿈을 하나 고른다 */
  toStudent: (dream?: DreamId) => void;
  /** 학생회 졸업 뒤 대학생회로 이어 간다 */
  toUniversity: () => void;
  /** 엔딩을 한 번 정하면 판에 적어 둔다 (새로고침해도 같은 엔딩) */
  fixEnding: (id: string) => void;
  reset: () => void;
}

export const useGame = create<Store>()(
  persist(
    (set) => ({
      game: null,
      start: (name, gender, type) => set({ game: newGame(name, gender, rng, type) }),
      choose: (index, played) => set((s) => (s.game ? { game: choose(s.game, index, rng, played) } : s)),
      next: () => set((s) => (s.game ? { game: advance(s.game, rng) } : s)),
      nextYear: () => set((s) => (s.game ? { game: startNextYear(s.game, rng) } : s)),
      toStudent: (dream) => set((s) => (s.game ? { game: enterStudent(s.game, rng, dream) } : s)),
      toUniversity: () => set((s) => (s.game ? { game: enterUniversity(s.game, rng) } : s)),
      fixEnding: (id) =>
        set((s) => (s.game && !s.game.flags.some((f) => f.startsWith('ending:')) ? { game: { ...s.game, flags: [...s.game.flags, `ending:${id}`] } } : s)),
      reset: () => set({ game: null }),
    }),
    {
      name: 'hwagyesa-story-save',
      storage: createJSONStorage(() => localStorage),
      // 저장 형식이 바뀌면 version을 올린다. 예전 저장은 새로 시작한다.
      version: 6,
      migrate: () => ({ game: null }) as unknown as Store,
    },
  ),
);
