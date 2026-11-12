// 실내 두 곳: 대적광전 3층 법당, 보륜당. 방마다 걸을 수 있는 바닥, 문, 앉을 자리가 있다.
import * as THREE from 'three';
import { mat } from './hanok';

export type Seat = { x: number; z: number; yaw: number };
export type Room = {
  scene: THREE.Scene;
  solids: THREE.Object3D[];
  /** 걸을 수 있는 바닥 (방 안쪽 사각형) */
  floor: { x0: number; x1: number; z0: number; z1: number };
  /** 막힌 곳 (불단, 탁자 등) */
  blocks: { x0: number; x1: number; z0: number; z1: number }[];
  /** 들어왔을 때 서는 자리와 방향 */
  entry: { x: number; z: number; yaw: number };
  /** 나가는 문 위치 */
  exit: { x: number; z: number };
  seats: Seat[];
  name: string;
  /** 천장 높이 (카메라가 넘지 않게) */
  height: number;
};

function box(w: number, h: number, d: number, color: string, x: number, y: number, z: number, opts: { shadow?: boolean } = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  m.position.set(x, y + h / 2, z);
  m.castShadow = opts.shadow ?? true;
  m.receiveShadow = true;
  return m;
}

/** 바닥·벽·천장이 있는 빈 방. 앞(+z) 벽 가운데에 문 */
function shell(scene: THREE.Scene, w: number, d: number, h: number, colors: { floor: string; wall: string; ceiling: string }) {
  const solids: THREE.Object3D[] = [];
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(colors.floor));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(colors.ceiling, { side: THREE.DoubleSide }));
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = h;
  scene.add(ceil);
  const t = 0.3;
  const walls = [
    box(w + t * 2, h, t, colors.wall, 0, 0, -d / 2 - t / 2, { shadow: false }),
    box(t, h, d, colors.wall, -w / 2 - t / 2, 0, 0, { shadow: false }),
    box(t, h, d, colors.wall, w / 2 + t / 2, 0, 0, { shadow: false }),
    // 앞 벽은 문 자리(가운데 2.4m)를 비운다
    box((w - 2.4) / 2, h, t, colors.wall, -(w + 2.4) / 4, 0, d / 2 + t / 2, { shadow: false }),
    box((w - 2.4) / 2, h, t, colors.wall, (w + 2.4) / 4, 0, d / 2 + t / 2, { shadow: false }),
    box(2.4, h - 2.6, t, colors.wall, 0, 2.6, d / 2 + t / 2, { shadow: false }),
  ];
  for (const m of walls) {
    scene.add(m);
    solids.push(m);
  }
  // 문 밖은 밝은 빛
  const outside = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.6), new THREE.MeshBasicMaterial({ color: '#f4ecd6' }));
  outside.position.set(0, 1.3, d / 2 + t + 0.01);
  outside.rotation.y = Math.PI;
  scene.add(outside);
  return solids;
}

/** 금빛 부처님: 연꽃 좌대, 앉은 몸, 머리, 광배 */
function buddha(scale: number) {
  const g = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({ color: '#d4a640', metalness: 0.65, roughness: 0.35 });
  const lotus = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.8, 0.5, 16), mat('#c4503d'));
  lotus.position.y = 0.25;
  g.add(lotus);
  const petals = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.18, 6, 16), mat('#e08a7a'));
  petals.rotation.x = Math.PI / 2;
  petals.position.y = 0.5;
  g.add(petals);
  // 앉은 몸: 넓게 접은 무릎 → 허리 → 둥근 어깨 → 목 (옆에서 본 윤곽을 돌려 만든다)
  const outline = [
    [0, 0],
    [1.05, 0],
    [1.08, 0.3],
    [0.78, 0.45],
    [0.6, 0.8],
    [0.66, 1.25],
    [0.6, 1.5],
    [0.34, 1.66],
    [0.2, 1.72],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const body = new THREE.Mesh(new THREE.LatheGeometry(outline, 20), gold);
  body.scale.z = 0.8;
  body.position.y = 0.5;
  g.add(body);
  // 무릎 위에 모은 손
  const hands = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), gold);
  hands.scale.set(1.4, 0.6, 1);
  hands.position.set(0, 0.95, 0.55);
  g.add(hands);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 18, 14), gold);
  head.scale.y = 1.1;
  head.position.y = 2.55;
  g.add(head);
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), gold);
  top.position.y = 3.0;
  g.add(top);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.07, 8, 32), gold);
  halo.position.set(0, 2.45, -0.45);
  g.add(halo);
  const aura = new THREE.Mesh(new THREE.CircleGeometry(1.5, 32), mat('#b8463a'));
  aura.position.set(0, 2.2, -0.6);
  g.add(aura);
  g.scale.setScalar(scale);
  g.traverse((o) => (o.castShadow = true));
  return g;
}

/** 연등 하나 (천장에 매다는 연꽃등) */
function lanternGeo() {
  return new THREE.SphereGeometry(0.28, 10, 8);
}

/** 대적광전 3층 법당 */
export function buildBeopdang(): Room {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#2a2420');
  const W = 22;
  const D = 16;
  const H = 6.4;
  const solids = shell(scene, W, D, H, { floor: '#b9864f', wall: '#efe3c4', ceiling: '#2f8a74' });

  // 천장 서까래 (단청)
  for (let i = -5; i <= 5; i++) {
    const beam = box(0.35, 0.35, D, '#c2412d', i * 2, H - 0.36, 0, { shadow: false });
    scene.add(beam);
  }
  for (let j = -3; j <= 3; j++) scene.add(box(W, 0.3, 0.3, '#2f8a74', 0, H - 0.7, j * 2.2, { shadow: false }));

  // 기둥
  for (const x of [-7, 7])
    for (const z of [-4, 3]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, H, 12), mat('#a8372a'));
      p.position.set(x, H / 2, z);
      p.castShadow = true;
      scene.add(p);
      solids.push(p);
    }

  // 불단과 부처님 세 분
  const altarZ = -D / 2 + 1.4;
  scene.add(box(15, 1.2, 2.4, '#8e2f25', 0, 0, altarZ));
  scene.add(box(15.4, 0.15, 2.6, '#d9a441', 0, 1.2, altarZ));
  const backdrop = box(16, 5, 0.2, '#7a2a22', 0, 0, -D / 2 + 0.2, { shadow: false });
  scene.add(backdrop);
  ([[-4.6, 0.85], [0, 1.05], [4.6, 0.85]] as const).forEach(([x, s]) => {
    const b = buddha(s);
    b.position.set(x, 1.35, altarZ - 0.3);
    scene.add(b);
  });
  // 초와 향
  for (const x of [-6.5, -2.3, 2.3, 6.5]) {
    scene.add(box(0.14, 0.5, 0.14, '#f3ecda', x, 1.35, altarZ + 0.9, { shadow: false }));
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffd27a' }));
    flame.position.set(x, 1.95, altarZ + 0.9);
    scene.add(flame);
  }
  // 목탁과 경상
  scene.add(box(1.4, 0.4, 0.7, '#6b4a30', 0, 0, altarZ + 2.2));
  const moktak = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), mat('#9a6a3a'));
  moktak.scale.set(1, 0.8, 1.1);
  moktak.position.set(0.3, 0.55, altarZ + 2.2);
  scene.add(moktak);

  // 천장 연등
  const colors = ['#d9443a', '#e9b23a', '#f1ece0', '#4f9b6e', '#d46a9a', '#4a78b5'];
  const lg = lanternGeo();
  let k = 0;
  for (let x = -9; x <= 9; x += 1.5)
    for (let z = -4.5; z <= 6; z += 1.5) {
      const c = colors[k++ % colors.length];
      const l = new THREE.Mesh(lg, new THREE.MeshLambertMaterial({ color: c, emissive: c, emissiveIntensity: 0.35 }));
      l.scale.y = 1.2;
      l.position.set(x, H - 1.1 - ((k * 7) % 3) * 0.15, z);
      scene.add(l);
    }

  // 방석 줄
  const seats: Seat[] = [];
  for (let row = 0; row < 4; row++)
    for (let col = -3; col <= 3; col++) {
      const x = col * 2;
      const z = -1 + row * 2;
      const cushion = box(1.1, 0.16, 1.1, row % 2 ? '#7d4a6b' : '#8a5a3c', x, 0, z, { shadow: false });
      scene.add(cushion);
      seats.push({ x, z, yaw: Math.PI });
    }

  // 빛: 따뜻한 실내
  scene.add(new THREE.HemisphereLight('#ffe9c8', '#4a3a2a', 1.1));
  const front = new THREE.PointLight('#ffd9a0', 60, 30, 1.6);
  front.position.set(0, 5, 2);
  front.castShadow = true;
  scene.add(front);
  const altarLight = new THREE.PointLight('#ffcf80', 40, 14, 1.6);
  altarLight.position.set(0, 3.5, altarZ + 3);
  scene.add(altarLight);

  return {
    scene,
    solids,
    floor: { x0: -W / 2 + 0.5, x1: W / 2 - 0.5, z0: -D / 2 + 0.5, z1: D / 2 - 0.3 },
    blocks: [
      { x0: -7.8, x1: 7.8, z0: -D / 2, z1: altarZ + 1.5 },
      { x0: -0.9, x1: 0.9, z0: altarZ + 1.7, z1: altarZ + 2.7 },
      ...[-7, 7].flatMap((x) => [-4, 3].map((z) => ({ x0: x - 0.5, x1: x + 0.5, z0: z - 0.5, z1: z + 0.5 }))),
    ],
    entry: { x: 0, z: D / 2 - 1.5, yaw: Math.PI },
    exit: { x: 0, z: D / 2 - 0.4 },
    seats,
    name: '대적광전 3층 · 법당',
    height: H,
  };
}

/** 보륜당: 따뜻한 명상 방 */
export function buildBoryun(): Room {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#2a2420');
  const W = 12;
  const D = 10;
  const H = 3.6;
  const solids = shell(scene, W, D, H, { floor: '#c9a477', wall: '#f3ead6', ceiling: '#e8dcc2' });

  // 나무 서까래
  for (let i = -2; i <= 2; i++) scene.add(box(0.25, 0.25, D, '#8a6240', i * 2.4, H - 0.26, 0, { shadow: false }));

  // 뒤 벽 큰 창: 바깥 숲이 보이는 밝은 판
  const windowGlow = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.8), new THREE.MeshBasicMaterial({ color: '#cfe6c4' }));
  windowGlow.position.set(0, 1.9, -D / 2 + 0.02);
  scene.add(windowGlow);
  for (const x of [-3, -1, 1, 3]) scene.add(box(0.1, 1.9, 0.1, '#7a5a3a', x, 0.95, -D / 2 + 0.06, { shadow: false }));
  scene.add(box(6.2, 0.12, 0.14, '#7a5a3a', 0, 0.9, -D / 2 + 0.06, { shadow: false }));
  scene.add(box(6.2, 0.12, 0.14, '#7a5a3a', 0, 2.8, -D / 2 + 0.06, { shadow: false }));

  // 작은 불상과 싱잉볼이 놓인 낮은 상
  scene.add(box(2.4, 0.5, 0.9, '#6b4a30', 0, 0, -D / 2 + 1.1));
  const b = buddha(0.32);
  b.position.set(0, 0.5, -D / 2 + 1.1);
  scene.add(b);
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#c49a4a', metalness: 0.7, roughness: 0.3, side: THREE.DoubleSide }));
  bowl.position.set(0.8, 0.72, -D / 2 + 1.1);
  scene.add(bowl);

  // 둥근 명상 방석 (둘러앉기)
  const seats: Seat[] = [];
  const n = 8;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const x = Math.sin(a) * 2.6;
    const z = 0.6 + Math.cos(a) * 2.2;
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.48, 0.2, 16), mat(i % 2 ? '#5b7a5e' : '#8a6a4a'));
    c.position.set(x, 0.1, z);
    c.receiveShadow = true;
    scene.add(c);
    // 가운데(초)를 보고 앉는다
    seats.push({ x, z, yaw: Math.atan2(-x, 0.6 - z) });
  }
  // 가운데 초
  scene.add(box(0.5, 0.08, 0.5, '#6b4a30', 0, 0, 0.6, { shadow: false }));
  const candle = box(0.16, 0.3, 0.16, '#f3ecda', 0, 0.08, 0.6, { shadow: false });
  scene.add(candle);
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffd27a' }));
  flame.position.set(0, 0.46, 0.6);
  scene.add(flame);

  // 화분과 책장
  for (const [x, z] of [
    [-5.2, -4.2],
    [5.2, -4.2],
    [-5.2, 4.2],
  ]) {
    scene.add(box(0.6, 0.6, 0.6, '#a86a44', x, 0, z));
    const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 0), mat('#5d8a4a'));
    leaf.position.set(x, 1.1, z);
    scene.add(leaf);
  }
  scene.add(box(0.5, 2, 2.6, '#8a6240', W / 2 - 0.3, 0, 2));
  for (let i = 0; i < 3; i++) scene.add(box(0.35, 0.4, 2.3, ['#c2412d', '#4a78b5', '#e9b23a'][i], W / 2 - 0.35, 0.3 + i * 0.6, 2, { shadow: false }));

  scene.add(new THREE.HemisphereLight('#fff1d8', '#5a4632', 1.0));
  const lamp = new THREE.PointLight('#ffd6a0', 30, 18, 1.5);
  lamp.position.set(0, 3, 1);
  lamp.castShadow = true;
  scene.add(lamp);
  const candleLight = new THREE.PointLight('#ffb860', 6, 5, 2);
  candleLight.position.set(0, 0.7, 0.6);
  scene.add(candleLight);

  return {
    scene,
    solids,
    floor: { x0: -W / 2 + 0.4, x1: W / 2 - 0.4, z0: -D / 2 + 0.4, z1: D / 2 - 0.3 },
    blocks: [
      { x0: -1.4, x1: 1.4, z0: -D / 2, z1: -D / 2 + 1.7 },
      { x0: -0.4, x1: 0.4, z0: 0.2, z1: 1.0 },
      { x0: W / 2 - 0.7, x1: W / 2, z0: 0.6, z1: 3.4 },
    ],
    entry: { x: 0, z: D / 2 - 1.2, yaw: Math.PI },
    exit: { x: 0, z: D / 2 - 0.4 },
    seats,
    name: '보륜당',
    height: H,
  };
}
