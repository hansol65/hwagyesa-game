// 한옥 전각을 코드로 만든다: 돌 기단, 빨간 기둥, 벽, 단청 띠, 처마가 들린 기와지붕.
import * as THREE from 'three';
import type { Building } from './layout';

const C = {
  stone: '#a7a294',
  stoneDark: '#8c877a',
  pillar: '#a8372a',
  wall: '#eee3c8',
  frame: '#2f8a74',
  band: '#2f8a74',
  bandRed: '#c2412d',
  roof: '#3f4752',
  roofEdge: '#2a2f36',
  rail: '#b8342a',
  glass: '#9cc3cf',
};

const mats = new Map<string, THREE.Material>();
export function mat(color: string, opts: { side?: THREE.Side } = {}) {
  const key = color + (opts.side ?? '');
  let m = mats.get(key);
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color, side: opts.side ?? THREE.FrontSide });
    mats.set(key, m);
  }
  return m;
}

function box(w: number, h: number, d: number, color: string, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  m.position.set(x, y + h / 2, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/**
 * 우진각(사방으로 흐르는) 기와지붕. 처마 끝은 모서리로 갈수록 살짝 들린다.
 * w·d는 처마까지 포함한 크기, h는 처마에서 용마루까지 높이.
 */
export function hipRoof(w: number, d: number, h: number, ridgeRatio = 0.5, curl = 0.9) {
  const N = 10;
  const pos: number[] = [];
  const idx: number[] = [];
  const R = w * ridgeRatio;
  // 비탈 한 면을 격자로: eave(t=0) → ridge(t=1)
  const face = (eave: (s: number) => [number, number], ridge: (s: number) => [number, number]) => {
    const base = pos.length / 3;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      for (let j = 0; j <= N; j++) {
        const s = j / N;
        const [ex, ez] = eave(s);
        const [rx, rz] = ridge(s);
        const corner = Math.pow(Math.abs(s - 0.5) * 2, 3);
        // 지붕선은 오목하게(처마 쪽이 완만), 모서리 처마는 들린다
        const y = h * Math.pow(t, 1.6) + curl * corner * Math.pow(1 - t, 2);
        pos.push(ex + (rx - ex) * t, y, ez + (rz - ez) * t);
      }
    }
    for (let i = 0; i < N; i++)
      for (let j = 0; j < N; j++) {
        const a = base + i * (N + 1) + j;
        const b = a + 1;
        const c = a + N + 1;
        const e = c + 1;
        idx.push(a, c, b, b, c, e);
      }
  };
  const W = w / 2;
  const D = d / 2;
  // 앞·뒤 큰 면
  face((s) => [-W + s * w, D], (s) => [-R / 2 + s * R, 0]);
  face((s) => [W - s * w, -D], (s) => [R / 2 - s * R, 0]);
  // 양옆 삼각 면 (용마루 끝 한 점으로 모인다)
  face((s) => [W, D - s * d], () => [R / 2, 0]);
  face((s) => [-W, -D + s * d], () => [-R / 2, 0]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const roof = new THREE.Mesh(g, mat(C.roof, { side: THREE.DoubleSide }));
  roof.castShadow = true;
  roof.receiveShadow = true;
  const group = new THREE.Group();
  group.add(roof);
  // 용마루
  const ridge = box(R + 0.6, 0.45, 0.6, C.roofEdge, 0, h - 0.1, 0);
  group.add(ridge);
  return group;
}

/** 한 층: 기둥, 벽, 단청 띠 */
function story(w: number, d: number, h: number, wall: string) {
  const g = new THREE.Group();
  g.add(box(w - 0.5, h * 0.82, d - 0.5, wall, 0, 0, 0));
  // 창살 느낌의 초록 틀 (앞뒤 면)
  const bays = Math.max(2, Math.round(w / 3));
  for (let i = 0; i < bays; i++) {
    const x = -w / 2 + (w / bays) * (i + 0.5);
    for (const z of [d / 2 - 0.22, -d / 2 + 0.22]) {
      const frame = box(w / bays - 1.1, h * 0.5, 0.08, C.frame, x, h * 0.16, z);
      frame.castShadow = false;
      g.add(frame);
    }
  }
  // 기둥
  const pillarGeo = new THREE.CylinderGeometry(0.22, 0.26, h, 8);
  const cols = Math.max(2, Math.round(w / 3.2));
  const rows = Math.max(2, Math.round(d / 3.2));
  const put = (x: number, z: number) => {
    const p = new THREE.Mesh(pillarGeo, mat(C.pillar));
    p.position.set(x, h / 2, z);
    p.castShadow = true;
    g.add(p);
  };
  for (let i = 0; i <= cols; i++) {
    const x = -w / 2 + (w / cols) * i;
    put(x, d / 2);
    put(x, -d / 2);
  }
  for (let j = 1; j < rows; j++) {
    const z = -d / 2 + (d / rows) * j;
    put(w / 2, z);
    put(-w / 2, z);
  }
  // 단청 띠
  g.add(box(w + 0.3, 0.55, d + 0.3, C.band, 0, h - 0.55, 0));
  g.add(box(w + 0.32, 0.12, d + 0.32, C.bandRed, 0, h - 0.62, 0));
  return g;
}

function balcony(w: number, d: number, y: number) {
  const g = new THREE.Group();
  const rail = (len: number, x: number, z: number, along: 'x' | 'z') => {
    const top = along === 'x' ? box(len, 0.12, 0.12, C.rail, x, y + 1, z) : box(0.12, 0.12, len, C.rail, x, y + 1, z);
    g.add(top);
    const n = Math.round(len / 1.2);
    for (let i = 0; i <= n; i++) {
      const t = -len / 2 + (len / n) * i;
      g.add(along === 'x' ? box(0.1, 1, 0.1, C.rail, x + t, y, z) : box(0.1, 1, 0.1, C.rail, x, y, z + t));
    }
  };
  rail(w + 1.6, 0, d / 2 + 0.8, 'x');
  g.add(box(w + 1.6, 0.2, 1.2, C.stoneDark, 0, y - 0.2, d / 2 + 0.3));
  return g;
}

/** 범종각: 기둥만 있는 2층 누각, 안에 종 */
function pavilion(b: Building) {
  const g = new THREE.Group();
  g.add(box(b.w + 1, 0.8, b.d + 1, C.stone));
  const h = b.storyH * b.stories;
  const pillarGeo = new THREE.CylinderGeometry(0.24, 0.28, h, 8);
  for (const [x, z] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ]) {
    const p = new THREE.Mesh(pillarGeo, mat(C.pillar));
    p.position.set((x * b.w) / 2, 0.8 + h / 2, (z * b.d) / 2);
    p.castShadow = true;
    g.add(p);
  }
  // 아래층은 막힌 벽, 위층은 열린 누각
  g.add(box(b.w - 0.6, b.storyH * 0.9, b.d - 0.6, '#e9d27a', 0, 0.8, 0));
  g.add(box(b.w + 0.3, 0.3, b.d + 0.3, C.stoneDark, 0, 0.8 + b.storyH, 0));
  g.add(balcony(b.w - 1.6, b.d - 1.6, 0.8 + b.storyH + 0.3));
  // 종
  const bellPts = [
    new THREE.Vector2(0.05, 1.6),
    new THREE.Vector2(0.55, 1.5),
    new THREE.Vector2(0.75, 1.1),
    new THREE.Vector2(0.85, 0.3),
    new THREE.Vector2(1.0, 0),
  ];
  const bell = new THREE.Mesh(new THREE.LatheGeometry(bellPts, 16), mat('#6f5a32', { side: THREE.DoubleSide }));
  bell.position.set(0, 0.8 + b.storyH + 0.6, 0);
  bell.castShadow = true;
  g.add(bell);
  g.add(box(b.w + 0.3, 0.5, b.d + 0.3, C.band, 0, 0.8 + h - 0.5, 0));
  const roof = hipRoof(b.w + 3, b.d + 3, 2.6, 0.25, 1.0);
  roof.position.y = 0.8 + h;
  g.add(roof);
  return g;
}

function gate(b: Building) {
  const g = new THREE.Group();
  const h = b.storyH;
  const pillarGeo = new THREE.CylinderGeometry(0.3, 0.34, h, 10);
  for (const x of [-b.w / 2 + 0.6, b.w / 2 - 0.6]) {
    const p = new THREE.Mesh(pillarGeo, mat(C.pillar));
    p.position.set(x, h / 2, 0);
    p.castShadow = true;
    g.add(p);
    g.add(box(1, 0.5, 1, C.stone, x, 0, 0));
  }
  g.add(box(b.w, 0.7, 1.1, C.band, 0, h - 0.7, 0));
  const roof = hipRoof(b.w + 2.4, 3.2, 1.8, 0.55, 0.8);
  roof.position.y = h;
  g.add(roof);
  return g;
}

/** 카페 같은 요즘 건물: 흰 벽 + 큰 유리창 + 낮은 기와 */
function modern(b: Building) {
  const g = new THREE.Group();
  g.add(box(b.w, b.storyH, b.d, '#f2ede2'));
  g.add(box(b.w * 0.7, b.storyH * 0.55, 0.1, C.glass, 0, 0.6, b.d / 2 + 0.02));
  const roof = hipRoof(b.w + 1.6, b.d + 1.6, 1.4, 0.4, 0.4);
  roof.position.y = b.storyH;
  g.add(roof);
  return g;
}

/** 전각 하나. 층마다 조금씩 좁아지고, 층 사이에 처마가 한 겹씩 둘린다 */
export function buildBuilding(b: Building): THREE.Group {
  let g: THREE.Group;
  if (b.kind === 'pavilion') g = pavilion(b);
  else if (b.kind === 'gate') g = gate(b);
  else if (b.kind === 'modern') g = modern(b);
  else {
    g = new THREE.Group();
    const baseH = 0.7;
    g.add(box(b.w + 1.2, baseH, b.d + 1.2, C.stone));
    let y = baseH;
    for (let i = 0; i < b.stories; i++) {
      const shrink = 1 - i * 0.05;
      const w = b.w * shrink;
      const d = b.d * shrink;
      const s = story(w, d, b.storyH, b.wall ?? C.wall);
      s.position.y = y;
      g.add(s);
      if (b.balcony && i === 1) g.add(balcony(w, d, y + 0.2));
      const last = i === b.stories - 1;
      // 층 사이 처마(작고 낮음) / 맨 위 지붕(크고 높음)
      const over = last ? 2.6 : 1.6;
      const roof = last
        ? hipRoof(w + over * 2, d + over * 2, Math.min(6, 1.6 + w * 0.18), 0.55, 1.1)
        : hipRoof(w + over * 2, d + over * 2, 1.2, 0.92, 0.7);
      roof.position.y = y + b.storyH - 0.1;
      g.add(roof);
      y += b.storyH;
    }
  }
  g.position.set(b.x, b.y, b.z);
  return g;
}
