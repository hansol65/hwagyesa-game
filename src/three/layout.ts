// 3D 화계사 배치. 단위는 미터, x는 동쪽(오른쪽), z는 남쪽(화면 앞쪽), y는 높이.
// 진입로로 올라와 북쪽(-z)을 보면: 오른쪽 국제선원, 앞에 마당, 왼쪽 대적광전.
// 마당 오른쪽 오르막 → 범종각 길(대적광전 2층) → 돌계단 → 3층 법당·보화루·카페 → 윗마당(대웅전).

/** 걸을 수 있는 땅. flat은 평평, ramp는 한쪽으로 오르는 비탈(계단 포함) */
export type Ground =
  | { kind: 'flat'; name: string; x0: number; x1: number; z0: number; z1: number; y: number; surface: Surface }
  | {
      kind: 'ramp';
      name: string;
      x0: number;
      x1: number;
      z0: number;
      z1: number;
      /** z0 쪽 높이 → z1 쪽 높이 (z 방향으로 오른다) */
      y0: number;
      y1: number;
      surface: Surface;
      steps?: boolean;
    };
export type Surface = 'asphalt' | 'stone' | 'dirt' | 'road';

// z0 < z1 로 적는다. ramp는 z0에서 y0, z1에서 y1.
export const GROUND: Ground[] = [
  { kind: 'ramp', name: '진입로', x0: -4, x1: 6, z0: 20, z1: 62, y0: 0, y1: -7, surface: 'road' },
  { kind: 'flat', name: '마당', x0: -22, x1: 14, z0: -10, z1: 20, y: 0, surface: 'asphalt' },
  { kind: 'flat', name: '국제선원 앞', x0: 14, x1: 40, z0: 8, z1: 34, y: 0, surface: 'dirt' },
  { kind: 'flat', name: '보륜당 앞', x0: 14, x1: 24, z0: -14, z1: 8, y: 0, surface: 'asphalt' },
  { kind: 'ramp', name: '오르막', x0: 6, x1: 13, z0: -23, z1: -10, y0: 4.875, y1: 0, surface: 'asphalt' },
  { kind: 'flat', name: '범종각 길', x0: -22, x1: 14, z0: -32, z1: -22, y: 4.5, surface: 'stone' },
  { kind: 'ramp', name: '돌계단', x0: -15, x1: -9, z0: -38, z1: -32, y0: 9, y1: 4.5, surface: 'stone', steps: true },
  { kind: 'flat', name: '법당 앞', x0: -22, x1: 16, z0: -50, z1: -38, y: 9, surface: 'stone' },
  { kind: 'ramp', name: '윗계단', x0: -7, x1: -1, z0: -56, z1: -50, y0: 14, y1: 9, surface: 'stone', steps: true },
  { kind: 'flat', name: '윗마당', x0: -32, x1: 34, z0: -76, z1: -56, y: 14, surface: 'dirt' },
];

export type Building = {
  id: string;
  name: string;
  /** 다가가면 뜨는 설명 */
  note: string;
  kind: 'hall' | 'pavilion' | 'gate' | 'modern';
  x: number;
  z: number;
  /** 바닥 높이 */
  y: number;
  w: number;
  d: number;
  stories: number;
  storyH: number;
  /** 2층 난간 같은 꾸밈 */
  balcony?: boolean;
  /** 벽 색 */
  wall?: string;
  /** 현판 글씨 (한자, 오른쪽부터 읽힌다) */
  sign?: string;
  /** 정면이 보는 쪽. 현판이 이 면에 걸린다 (기본 +z, 남쪽) */
  face?: '+x' | '-x' | '+z' | '-z';
};

export const BUILDINGS: Building[] = [
  {
    id: 'daejeok',
    name: '대적광전',
    note: '제일 큰 건물. 1층 공양간 · 2층 어린이회 · 3층 법당 · 4층 선방',
    kind: 'hall',
    x: -34,
    z: -22,
    y: 0,
    w: 24,
    d: 40,
    stories: 4,
    storyH: 4.5,
    sign: '大寂光殿',
    face: '+x',
  },
  {
    id: 'seonwon',
    name: '국제선원',
    note: '템플스테이 하는 곳',
    kind: 'hall',
    x: 28,
    z: 22,
    y: 0,
    w: 22,
    d: 11,
    stories: 2,
    storyH: 3.6,
    balcony: true,
    sign: '國際禪院',
    face: '-x',
  },
  { id: 'boryun', name: '보륜당', note: '마당 오른쪽 2층 건물', kind: 'hall', x: 20, z: -4, y: 0, w: 7, d: 14, stories: 2, storyH: 3.4, wall: '#e9d27a', sign: '寶輪堂', face: '-x' },
  { id: 'bell', name: '범종각', note: '오르막 올라 왼쪽. 이 길로 가면 대적광전 2층', kind: 'pavilion', x: -3, z: -28.5, y: 4.5, w: 6, d: 6, stories: 2, storyH: 3, sign: '梵鐘閣' },
  { id: 'bohwa', name: '보화루', note: '돌계단 위 오른편', kind: 'hall', x: 4, z: -45, y: 9, w: 11, d: 6, stories: 2, storyH: 3.2, balcony: true, wall: '#e9d27a', sign: '寶華樓' },
  { id: 'cafe', name: '카페', note: '보화루 옆', kind: 'modern', x: 13.5, z: -45, y: 9, w: 6, d: 6, stories: 1, storyH: 3.4 },
  { id: 'daeung', name: '대웅전', note: '윗마당 가운데', kind: 'hall', x: -4, z: -66, y: 14, w: 13, d: 9, stories: 1, storyH: 5, sign: '大雄殿' },
  { id: 'myeongbu', name: '명부전', note: '대웅전 오른쪽', kind: 'hall', x: 12, z: -65, y: 14, w: 9, d: 7, stories: 1, storyH: 4, sign: '冥府殿' },
  { id: 'samsung', name: '삼성각', note: '대웅전 뒤 위쪽', kind: 'hall', x: -16, z: -71, y: 14, w: 6, d: 5, stories: 1, storyH: 3.4, sign: '三聖閣' },
  { id: 'cheonbul', name: '천불오백성전', note: '윗마당 왼쪽', kind: 'hall', x: -26, z: -63, y: 14, w: 8, d: 7, stories: 1, storyH: 3.8, sign: '千佛五百聖殿' },
  { id: 'josil', name: '조실채', note: '스님들 사는 곳', kind: 'hall', x: 22, z: -68, y: 14, w: 8, d: 6, stories: 1, storyH: 3.2 },
  { id: 'yosa', name: '요사채', note: '스님들 사는 곳', kind: 'hall', x: 30, z: -62, y: 14, w: 6, d: 7, stories: 1, storyH: 3.2 },
  { id: 'ilju', name: '일주문', note: '절 입구', kind: 'gate', x: 1, z: 55, y: -6.2, w: 7, d: 2, stories: 1, storyH: 4, sign: '三角山華溪寺' },
];

/** 다가가면 이름이 뜨는 문 (같은 건물의 다른 층으로 들어가는 곳) */
export const DOORS = [
  { x: -21.5, z: -6, y: 0, name: '대적광전 1층 · 공양간' },
  { x: -21.5, z: -27, y: 4.5, name: '대적광전 2층 · 어린이회' },
  { x: -21.5, z: -44, y: 9, name: '대적광전 3층 · 법당' },
];

/** 그 자리의 땅 높이. 걸을 수 없는 곳이면 null */
export function groundAt(x: number, z: number): { y: number; name: string } | null {
  let best: { y: number; name: string } | null = null;
  for (const g of GROUND) {
    if (x < g.x0 || x > g.x1 || z < g.z0 || z > g.z1) continue;
    const y = g.kind === 'flat' ? g.y : g.y0 + ((z - g.z0) / (g.z1 - g.z0)) * (g.y1 - g.y0);
    if (!best || y > best.y) best = { y, name: g.name };
  }
  return best;
}

/** 건물 벽 안쪽이면 true (조금 여유를 둔다) */
export function insideBuilding(x: number, z: number, y: number, pad = 0.5): boolean {
  for (const b of BUILDINGS) {
    if (b.kind === 'gate') continue;
    if (y < b.y - 1.5 || y > b.y + b.stories * b.storyH) continue;
    if (Math.abs(x - b.x) < b.w / 2 + pad && Math.abs(z - b.z) < b.d / 2 + pad) return true;
  }
  return false;
}
