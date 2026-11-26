// 시작 캐릭터: 판마다 여섯 성향 중 셋이 나오고, 하나를 골라 시작한다.
// 성향마다 잘하는 것과 못하는 것이 뚜렷해서, 아무렇게나 골라도 갈 수 있는 엔딩 쪽이 달라진다.
// 처음 셋(장난꾸러기·모범생·조용한 아이)은 친구 셋(지호·서윤·하람)의 성격을 그대로 가져왔다.
import type { FriendKey, StatKey, Talent, Temper } from './types';

export type ArchetypeId = 'rascal' | 'model' | 'quiet' | 'chatter' | 'temple' | 'leader';

export interface Archetype {
  id: ArchetypeId;
  name: string;
  /** 고르는 카드에 쓰는 한 줄 */
  desc: string;
  /** 잘하는 것 / 못하는 것 (카드에 짧게) */
  good: string;
  bad: string;
  temper: Temper;
  talent: Talent;
  /** 시작 능력치. 실제로는 ±3 흔들린다 */
  stats: Record<StatKey, number>;
  /** 잘 느는 능력치(×1.35)와 잘 안 느는 능력치(×0.6) */
  strong: StatKey[];
  weak: StatKey[];
  /** 이 아이에게 어울리는 엔딩: 조건이 맞으면 먼저 나온다 */
  signature: string[];
  /** 이 아이와 닮은 친구: 처음부터 가깝다 */
  friend?: FriendKey;
}

export const STRONG_GAIN = 1.35;
export const WEAK_GAIN = 0.6;

export const ARCHETYPES: Archetype[] = [
  {
    id: 'rascal',
    friend: 'jiho',
    name: '장난꾸러기',
    desc: '피구할 때 제일 신나는 아이. 가만히 앉아 있는 건 3분이 한계예요.',
    good: '건강 · 매력',
    bad: '지능',
    temper: 'active',
    talent: 'sports',
    stats: { health: 52, intellect: 14, charm: 40, mental: 28, leadership: 6, faith: 12 },
    strong: ['health', 'charm'],
    weak: ['intellect'],
    signature: ['athlete', 'firefighter', 'police', 'gukak', 'eternal-student'],
  },
  {
    id: 'model',
    friend: 'seoyun',
    name: '모범생',
    desc: '법문 시간에 맨 앞에 앉는 아이. 숙제는 늘 먼저 끝내요.',
    good: '지능 · 신앙',
    bad: '건강',
    temper: 'calm',
    talent: 'music',
    stats: { health: 18, intellect: 52, charm: 24, mental: 36, leadership: 4, faith: 28 },
    strong: ['intellect', 'faith'],
    weak: ['health'],
    signature: ['professor', 'doctor', 'jongrip', 'developer', 'vet'],
  },
  {
    id: 'quiet',
    friend: 'haram',
    name: '조용한 아이',
    desc: '구석에서 그림을 그리는 아이. 말은 적어도 오래 버텨요.',
    good: '멘탈 · 손재주',
    bad: '매력',
    temper: 'calm',
    talent: 'craft',
    stats: { health: 26, intellect: 32, charm: 12, mental: 50, leadership: 0, faith: 18 },
    strong: ['mental', 'intellect'],
    weak: ['charm'],
    signature: ['webtoon', 'lantern-artisan', 'photographer', 'meditation-app', 'cat-cafe'],
  },
  {
    id: 'chatter',
    name: '수다쟁이',
    desc: '처음 본 친구랑도 5분이면 친해지는 아이. 법회 시간엔 입이 근질근질해요.',
    good: '매력',
    bad: '멘탈 · 신앙',
    temper: 'active',
    talent: 'music',
    stats: { health: 32, intellect: 22, charm: 54, mental: 18, leadership: 8, faith: 8 },
    strong: ['charm'],
    weak: ['mental', 'faith'],
    signature: ['youtuber', 'pianist', 'marry', 'eternal-student', 'convert'],
  },
  {
    id: 'temple',
    name: '절집 아이',
    desc: '할머니 손 잡고 걸음마 때부터 절에 다닌 아이. 반야심경을 외워요.',
    good: '신앙 · 멘탈',
    bad: '매력',
    temper: 'calm',
    talent: 'craft',
    stats: { health: 26, intellect: 26, charm: 16, mental: 40, leadership: 2, faith: 42 },
    strong: ['faith', 'mental'],
    weak: ['charm'],
    signature: ['monk', 'kid-teacher', 'temple-chef', 'jongrip', 'chongmuwon'],
  },
  {
    id: 'leader',
    name: '반장감',
    desc: '줄 서라고 하면 맨 앞에서 줄을 세우는 아이. 지는 건 못 참아요.',
    good: '리더십 · 매력',
    bad: '신앙',
    temper: 'active',
    talent: 'sports',
    stats: { health: 32, intellect: 30, charm: 38, mental: 24, leadership: 22, faith: 8 },
    strong: ['leadership', 'charm'],
    weak: ['faith'],
    signature: ['politician', 'st-teacher', 'chongmuwon', 'startup', 'police'],
  },
];

export const archetypeOf = (id: string | undefined) => ARCHETYPES.find((a) => a.id === id);

/** 이번에 보여 줄 세 아이 (겹치지 않게) */
export function rollArchetypes(rng: () => number, n = 3): Archetype[] {
  const pool = [...ARCHETYPES];
  const out: Archetype[] = [];
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  return out;
}
