import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { advance, autoYear, choose, newGame, startNextYear, type YearMode } from './game/engine';
import type { GameState, Gender } from './game/types';

const rng = Math.random;

interface Store {
  game: GameState | null;
  start: (name: string, gender: Gender) => void;
  choose: (index: number) => void;
  next: () => void;
  nextYear: () => void;
  fastForward: (mode: YearMode) => void;
  reset: () => void;
}

export const useGame = create<Store>()(
  persist(
    (set) => ({
      game: null,
      start: (name, gender) => set({ game: newGame(name, gender, rng) }),
      choose: (index) => set((s) => (s.game ? { game: choose(s.game, index, rng) } : s)),
      next: () => set((s) => (s.game ? { game: advance(s.game, rng) } : s)),
      nextYear: () => set((s) => (s.game ? { game: startNextYear(s.game, rng) } : s)),
      fastForward: (mode) => set((s) => (s.game ? { game: autoYear(s.game, mode, rng) } : s)),
      reset: () => set({ game: null }),
    }),
    {
      name: 'hwagyesa-story-save',
      storage: createJSONStorage(() => localStorage),
      // 저장 형식이 바뀌면 version을 올린다. 예전 저장은 새로 시작한다.
      version: 5,
      migrate: () => ({ game: null }) as unknown as Store,
    },
  ),
);
