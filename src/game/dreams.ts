// 꿈: 어린이회를 졸업할 때 하나 고른다. 수첩에 계속 떠 있고, 엔딩에서 이뤘는지 보여 준다.
// 꿈에 든 엔딩은 조건이 맞으면 무엇보다 먼저 나온다 (시작 성향보다도).
import type { StatKey } from './types';

export type DreamId = 'temple' | 'teacher' | 'helper' | 'sports' | 'artist' | 'boss';

export interface Dream {
  id: DreamId;
  name: string;
  /** 고를 때 한 줄 */
  desc: string;
  /** 키워야 하는 스탯 */
  need: StatKey[];
  /** 이 꿈을 이뤘다고 치는 엔딩 */
  endings: string[];
}

export const DREAM_BONUS = 60;

export const DREAMS: Dream[] = [
  {
    id: 'temple',
    name: '절에서 일하는 사람',
    desc: '스님처럼, 아니면 절 살림을 맡는 어른처럼.',
    need: ['faith', 'mental'],
    endings: ['monk', 'temple-chef', 'chongmuwon', 'lantern-artisan', 'jongrip'],
  },
  {
    id: 'teacher',
    name: '선생님',
    desc: '지솔 쌤처럼 누군가를 가르치는 사람.',
    need: ['intellect', 'faith'],
    endings: ['professor', 'jongrip', 'kid-teacher', 'st-teacher', 'counselor'],
  },
  {
    id: 'helper',
    name: '사람을 살리는 일',
    desc: '아픈 사람, 다친 동물, 위험한 사람을 돕는 일.',
    need: ['intellect', 'health'],
    endings: ['doctor', 'vet', 'firefighter', 'police', 'counselor'],
  },
  {
    id: 'sports',
    name: '운동선수',
    desc: '피구할 때 제일 행복했으니까.',
    need: ['health', 'mental'],
    endings: ['athlete', 'firefighter', 'police', 'gukak'],
  },
  {
    id: 'artist',
    name: '무언가를 만드는 사람',
    desc: '노래든 그림이든 사진이든.',
    need: ['charm', 'mental'],
    endings: ['pianist', 'gukak', 'webtoon', 'photographer', 'lantern-artisan', 'youtuber'],
  },
  {
    id: 'boss',
    name: '사장님',
    desc: '내 가게, 내 회사, 내 판을 벌이는 사람.',
    need: ['leadership', 'intellect'],
    endings: ['startup', 'cat-cafe', 'meditation-app', 'developer', 'politician'],
  },
];

export const dreamOf = (flags: string[]) => {
  const id = flags.find((f) => f.startsWith('dream:'))?.slice(6);
  return DREAMS.find((d) => d.id === id);
};
