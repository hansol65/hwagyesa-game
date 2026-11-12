// 3D 화계사 배치. 단위는 미터, x는 동쪽, z는 남쪽, y는 높이. 원점은 마당(주차장) 가운데.
// 위성사진(art-src/reference/21-aerial)을 1px ≈ 0.2m로 옮기고, 배치도 표시(29-map-annotated)와 거리뷰로 높이를 맞췄다.
//
// 동쪽 일주문에서 화계사길을 따라 서쪽으로 올라오면
//   오른쪽(북) 축대 위에 국제선원, 왼쪽(남)에 마당(주차장), 마당 남쪽에 대적광전(정면이 동쪽 주차장을 본다).
//   길 북쪽에 보륜당(1층 해우소·안내소, 2층 보륜당). 길은 보륜당 앞을 지나 서쪽으로 오르막.
//   오르막 위 윗주차장 → 동쪽으로 범종각 길(마당보다 한 층 높은 축대) → 대적광전 2층.
//   윗주차장에서 남쪽 돌계단 → 법당 앞(대적광전 3층 입구) · 오른편 보화루 → 보화루 뒤 윗마당(대웅전·명부전).
//   미륵전은 윗주차장 북쪽 산비탈 위.

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
      /** axis 쪽 시작(x0 또는 z0)의 높이 → 끝(x1 또는 z1)의 높이 */
      y0: number;
      y1: number;
      /** 기울어지는 방향. 기본 z */
      axis?: 'x' | 'z';
      surface: Surface;
      steps?: boolean;
    };
export type Surface = 'asphalt' | 'stone' | 'dirt' | 'road';

/** 그 땅의 (x, z) 높이 */
export function heightOf(g: Ground, x: number, z: number) {
  if (g.kind === 'flat') return g.y;
  const t = g.axis === 'x' ? (x - g.x0) / (g.x1 - g.x0) : (z - g.z0) / (g.z1 - g.z0);
  return g.y0 + Math.min(1, Math.max(0, t)) * (g.y1 - g.y0);
}

// x0 < x1, z0 < z1 로 적는다.
export const GROUND: Ground[] = [
  // 일주문(동쪽 아래)에서 올라오는 화계사길
  { kind: 'ramp', name: '화계사길', x0: 14, x1: 72, z0: -22, z1: -14, y0: 0, y1: -6, axis: 'x', surface: 'road' },
  // 길 북쪽 축대 위 국제선원 (길에서 바로는 못 올라간다)
  { kind: 'flat', name: '국제선원', x0: 8, x1: 44, z0: -56, z1: -23, y: 2.5, surface: 'dirt' },
  // 보륜당 앞 길 (마당 북쪽)
  { kind: 'flat', name: '보륜당 앞', x0: -4, x1: 14, z0: -22, z1: -6, y: 0, surface: 'asphalt' },
  // 마당 = 주차장. 대적광전 정면(동쪽)을 따라 남쪽으로 이어진다
  { kind: 'flat', name: '마당', x0: -16, x1: 20, z0: -6, z1: 12, y: 0, surface: 'asphalt' },
  { kind: 'flat', name: '마당', x0: -3, x1: 16, z0: 12, z1: 40, y: 0, surface: 'asphalt' },
  // 보륜당 앞에서 서쪽으로 오르는 길
  { kind: 'ramp', name: '오르막', x0: -36, x1: -4, z0: -14, z1: -6, y0: 4.5, y1: 0, axis: 'x', surface: 'asphalt' },
  // 오르막 위
  { kind: 'flat', name: '윗주차장', x0: -52, x1: -36, z0: -32, z1: 0, y: 4.5, surface: 'asphalt' },
  { kind: 'flat', name: '요사채 앞', x0: -74, x1: -52, z0: -36, z1: 0, y: 4.5, surface: 'dirt' },
  // 마당보다 한 층 높은 축대 위. 범종각을 지나 대적광전 2층으로
  { kind: 'flat', name: '범종각 길', x0: -36, x1: -16, z0: -6, z1: 12.5, y: 4.5, surface: 'stone' },
  // 윗주차장에서 남쪽으로 올라가는 돌계단
  { kind: 'ramp', name: '돌계단', x0: -46, x1: -38, z0: 0, z1: 8, y0: 4.5, y1: 9, surface: 'stone', steps: true },
  // 대적광전 3층(법당) 입구가 있는 서쪽 축대
  { kind: 'flat', name: '법당 앞', x0: -50, x1: -27, z0: 8, z1: 15, y: 9, surface: 'stone' },
  { kind: 'flat', name: '법당 앞', x0: -36, x1: -27, z0: 15, z1: 48, y: 9, surface: 'stone' },
  // 보화루 북쪽 계단으로 윗마당
  { kind: 'ramp', name: '윗계단', x0: -58, x1: -50, z0: 8, z1: 15, y0: 12, y1: 9, axis: 'x', surface: 'stone', steps: true },
  { kind: 'flat', name: '윗마당', x0: -86, x1: -58, z0: 0, z1: 48, y: 12, surface: 'dirt' },
  // 대웅전과 보화루 사이 (연등 다는 곳). 보화루 2층이 이 마당 높이와 맞닿는다
  { kind: 'flat', name: '윗마당', x0: -58, x1: -49.5, z0: 15.5, z1: 48, y: 12, surface: 'dirt' },
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
  /** x 방향 길이 */
  w: number;
  /** z 방향 길이 */
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
  /** 이름표를 띄우지 않는다 (같은 건물의 다른 동) */
  quiet?: boolean;
};

export const BUILDINGS: Building[] = [
  {
    id: 'daejeok',
    name: '대적광전',
    note: '제일 큰 건물. 1층 공양간 · 2층 어린이회 · 3층 법당 · 4층 선방',
    kind: 'hall',
    x: -15,
    z: 30,
    y: 0,
    w: 22,
    d: 32,
    stories: 4,
    storyH: 4.5,
    sign: '大寂光殿',
    face: '+x',
  },
  {
    id: 'seonwon',
    name: '국제선원',
    note: '템플스테이 하는 곳. 길 오른쪽 축대 위',
    kind: 'hall',
    x: 27,
    z: -31,
    y: 2.5,
    w: 30,
    d: 12,
    stories: 2,
    storyH: 3.6,
    balcony: true,
    wall: '#e9d27a',
    sign: '國際禪院',
    face: '+z',
  },
  { id: 'seonwon2', name: '국제선원', note: '', kind: 'hall', x: 23, z: -46, y: 2.5, w: 20, d: 14, stories: 2, storyH: 3.6, wall: '#e9d27a', quiet: true },
  {
    id: 'boryun',
    name: '보륜당',
    note: '1층 해우소·안내소, 2층 보륜당',
    kind: 'hall',
    x: -16,
    z: -22,
    y: 0,
    w: 22,
    d: 14,
    stories: 2,
    storyH: 3.6,
    balcony: true,
    wall: '#e9d27a',
    sign: '寶輪堂',
    face: '+z',
  },
  { id: 'bell', name: '범종각', note: '마당 서쪽 축대 위. 이 길로 가면 대적광전 2층', kind: 'pavilion', x: -22, z: 2, y: 4.5, w: 7, d: 7, stories: 2, storyH: 3, sign: '梵鐘閣', face: '+x' },
  { id: 'cafe', name: '카페', note: '범종각 옆 (예전 종무소 자리)', kind: 'modern', x: -31, z: 9, y: 4.5, w: 6, d: 6, stories: 1, storyH: 3.4 },
  { id: 'bohwa', name: '보화루', note: '법당 앞 오른편. 뒤로 윗마당', kind: 'hall', x: -43, z: 31, y: 9, w: 12, d: 30, stories: 2, storyH: 3, wall: '#e9d27a', sign: '寶華樓', face: '+x' },
  { id: 'daeung', name: '대웅전', note: '윗마당 서쪽, 보화루를 마주 본다', kind: 'hall', x: -68, z: 24, y: 12, w: 11, d: 14, stories: 1, storyH: 5, sign: '大雄殿', face: '+x' },
  { id: 'myeongbu', name: '명부전', note: '윗마당 북쪽', kind: 'hall', x: -66, z: 6, y: 12, w: 12, d: 8, stories: 1, storyH: 4, sign: '冥府殿', face: '+z' },
  { id: 'cheonbul', name: '천불오백성전', note: '윗마당 남쪽', kind: 'hall', x: -68, z: 42, y: 12, w: 12, d: 7, stories: 1, storyH: 3.8, sign: '千佛五百聖殿', face: '-z' },
  { id: 'samsung', name: '삼성각', note: '대웅전 뒤 위쪽', kind: 'hall', x: -82, z: 24, y: 12, w: 5, d: 6, stories: 1, storyH: 3.4, sign: '三聖閣', face: '+x' },
  { id: 'josil', name: '조실채', note: '스님들 사는 곳', kind: 'hall', x: -64, z: -26, y: 4.5, w: 14, d: 10, stories: 1, storyH: 3.2 },
  { id: 'yosa', name: '요사채', note: '스님들 사는 곳', kind: 'hall', x: -62, z: -9, y: 4.5, w: 12, d: 9, stories: 1, storyH: 3.2 },
  { id: 'ilju', name: '일주문', note: '절 입구', kind: 'gate', x: 66, z: -18, y: -5.5, w: 7, d: 2, stories: 1, storyH: 4, sign: '三角山華溪寺', face: '+x' },
];

/** 다가가면 이름이 뜨는 문 (같은 건물의 다른 층으로 들어가는 곳) */
export const DOORS = [
  { x: -3.4, z: 30, y: 0, name: '대적광전 1층 · 공양간' },
  { x: -20, z: 13.6, y: 4.5, name: '대적광전 2층 · 어린이회' },
  { x: -26.6, z: 30, y: 9, name: '대적광전 3층 · 법당' },
];

/** 그 자리의 땅 높이. 걸을 수 없는 곳이면 null. 겹치면 높은 쪽 */
export function groundAt(x: number, z: number): { y: number; name: string } | null {
  let best: { y: number; name: string } | null = null;
  for (const g of GROUND) {
    if (x < g.x0 || x > g.x1 || z < g.z0 || z > g.z1) continue;
    const y = heightOf(g, x, z);
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
