// 땅, 계단, 나무, 산, 연등을 만든다.
import * as THREE from 'three';
import { BUILDINGS, GROUND, heightOf, type Ground, type Surface } from './layout';
import { buildBuilding, mat } from './hanok';

const SURFACE: Record<Surface, string> = {
  asphalt: '#8d8c88',
  road: '#7f7e7a',
  stone: '#b9b2a2',
  dirt: '#cdbd98',
};
const BOTTOM = -12;

/** 윗면 네 모서리 높이를 따로 주는 덩어리 (평지·비탈 공용) */
function slab(g: Ground) {
  const top = (x: number, z: number) => heightOf(g, x, z);
  const { x0, x1, z0, z1 } = g;
  const v = [
    [x0, top(x0, z0), z0],
    [x1, top(x1, z0), z0],
    [x1, top(x1, z1), z1],
    [x0, top(x0, z1), z1],
    [x0, BOTTOM, z0],
    [x1, BOTTOM, z0],
    [x1, BOTTOM, z1],
    [x0, BOTTOM, z1],
  ];
  // 윗면은 따로 (색이 다르다), 옆면은 축대 돌색
  const topGeo = new THREE.BufferGeometry();
  topGeo.setAttribute('position', new THREE.Float32BufferAttribute([...v[0], ...v[3], ...v[2], ...v[0], ...v[2], ...v[1]], 3));
  topGeo.computeVertexNormals();
  const sideIdx = [
    [0, 1, 5, 4],
    [1, 2, 6, 5],
    [2, 3, 7, 6],
    [3, 0, 4, 7],
  ];
  const sp: number[] = [];
  for (const [a, b, c, d] of sideIdx) sp.push(...v[a], ...v[b], ...v[c], ...v[a], ...v[c], ...v[d]);
  const sideGeo = new THREE.BufferGeometry();
  sideGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  sideGeo.computeVertexNormals();
  const group = new THREE.Group();
  const topMesh = new THREE.Mesh(topGeo, mat(SURFACE[g.surface], { side: THREE.DoubleSide }));
  topMesh.receiveShadow = true;
  const side = new THREE.Mesh(sideGeo, mat('#9a9486', { side: THREE.DoubleSide }));
  side.receiveShadow = true;
  group.add(topMesh, side);
  // 계단이면 디딤판을 얹는다
  if (g.kind === 'ramp' && g.steps) {
    const n = Math.round(Math.abs(g.y1 - g.y0) / 0.32);
    const alongX = g.axis === 'x';
    const len = alongX ? g.x1 - g.x0 : g.z1 - g.z0;
    for (let i = 0; i < n; i++) {
      const t = (len / n) * (i + 0.5);
      const x = alongX ? g.x0 + t : (g.x0 + g.x1) / 2;
      const z = alongX ? (g.z0 + g.z1) / 2 : g.z0 + t;
      const y = top(x, z);
      const geo = alongX ? new THREE.BoxGeometry(len / n + 0.02, 0.32, g.z1 - g.z0) : new THREE.BoxGeometry(g.x1 - g.x0, 0.32, len / n + 0.02);
      const step = new THREE.Mesh(geo, mat('#c9c2b0'));
      step.position.set(x, y - 0.16, z);
      step.receiveShadow = true;
      group.add(step);
    }
  }
  return group;
}

function pine(x: number, y: number, z: number, s: number) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * s, 0.28 * s, 3 * s, 6), mat('#6b4a30'));
  trunk.position.y = 1.5 * s;
  g.add(trunk);
  const greens = ['#2f5b3c', '#3d6e47', '#4c7f4f'];
  for (let i = 0; i < 3; i++) {
    const c = new THREE.Mesh(new THREE.ConeGeometry((2.2 - i * 0.55) * s, 2.2 * s, 7), mat(greens[i]));
    c.position.y = (3 + i * 1.3) * s;
    c.castShadow = true;
    g.add(c);
  }
  g.position.set(x, y, z);
  return g;
}

function broadleaf(x: number, y: number, z: number, s: number) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * s, 0.3 * s, 3 * s, 6), mat('#6b4a30'));
  trunk.position.y = 1.5 * s;
  g.add(trunk);
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(2.4 * s, 0), mat('#5d8a4a'));
  crown.position.y = 4 * s;
  crown.castShadow = true;
  g.add(crown);
  g.position.set(x, y, z);
  return g;
}

function walkable(x: number, z: number) {
  return GROUND.some((g) => x >= g.x0 - 2 && x <= g.x1 + 2 && z >= g.z0 - 2 && z <= g.z1 + 2);
}

function inBuilding(x: number, z: number) {
  return BUILDINGS.some((b) => Math.abs(x - b.x) < b.w / 2 + 3 && Math.abs(z - b.z) < b.d / 2 + 3);
}

/** 땅 높이를 대략 (나무를 산비탈에 심을 때) */
function hillY(x: number, z: number) {
  // 절 마당 언저리는 마당 높이, 서쪽(-x)·북쪽(-z)으로 산비탈, 동쪽 일주문 쪽으로 내리막
  const west = Math.min(Math.max(0, -x - 20), 120) * 0.22;
  const north = Math.min(Math.max(0, -z - 30), 120) * 0.16;
  const east = Math.max(0, x - 20) * 0.11;
  return -1 + west + north - east + Math.sin(z * 0.07) * 0.6;
}

/** 장면을 채우고, 카메라가 뚫고 들어가면 안 되는 것(건물·땅)을 돌려준다 */
export function buildWorld(scene: THREE.Scene): THREE.Object3D[] {
  const solids: THREE.Object3D[] = [];
  // 바닥 (산자락)
  const hill = new THREE.Mesh(new THREE.PlaneGeometry(600, 600, 60, 60), mat('#5f8a4c'));
  hill.rotation.x = -Math.PI / 2;
  const hp = hill.geometry.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < hp.count; i++) {
    const x = hp.getX(i);
    const z = -hp.getY(i);
    hp.setZ(i, hillY(x, z) - 0.5);
  }
  hill.geometry.computeVertexNormals();
  hill.receiveShadow = true;
  scene.add(hill);

  for (const g of GROUND) {
    const o = slab(g);
    scene.add(o);
    solids.push(o);
  }
  for (const b of BUILDINGS) {
    const o = buildBuilding(b);
    scene.add(o);
    solids.push(o);
  }

  // 뒷산 (삼각산 능선)
  const ridge = [
    [-240, 140, 60, 100],
    [-270, 30, 90, 140],
    [-250, -90, 80, 120],
    [-200, -200, 70, 110],
    [-320, -160, 120, 160],
  ];
  for (const [x, z, h, r] of ridge) {
    const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 9), mat('#4f7d4b'));
    m.position.set(x, 12 + h / 2, z);
    scene.add(m);
  }
  // 바위 봉우리
  const peak = new THREE.Mesh(new THREE.ConeGeometry(14, 40, 6), mat('#b9b6ad'));
  peak.position.set(-330, 12 + 70 + 14, -180);
  scene.add(peak);

  // 나무: 걷는 곳과 건물을 피해서
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 260; i++) {
    const x = -140 + rnd() * 230;
    const z = -110 + rnd() * 190;
    if (walkable(x, z) || inBuilding(x, z)) continue;
    const y = hillY(x, z) - 0.6;
    const s = 0.8 + rnd() * 0.7;
    scene.add(rnd() < 0.65 ? pine(x, y, z, s) : broadleaf(x, y, z, s));
  }
  // 마당 가장자리 큰 나무 몇 그루
  scene.add(broadleaf(15, 0, 38, 1.3));
  scene.add(pine(-17.5, 4.5, 10.5, 1.0));

  // 연등 줄: 사진처럼 줄마다 색이 이어지는 무지개 연등을 촘촘히
  lanternRows(scene, { x0: -15, x1: 19, z0: -4, z1: 10, rows: 8, y: 9.5 });
  lanternRows(scene, { x0: -2, x1: 15, z0: 14, z1: 38, rows: 9, y: 9.5 });
  // 윗마당: 대웅전과 보화루 사이
  lanternRows(scene, { x0: -61, x1: -50, z0: 14, z1: 34, rows: 9, y: 18.5 });

  // 미륵전: 오른쪽 위 축대 위 하얀 아치 (멀리서 보이는 정도)
  const mireuk = new THREE.Group();
  const platform = new THREE.Mesh(new THREE.BoxGeometry(18, 8, 14), mat('#a7a294'));
  platform.position.set(0, 2, 0);
  mireuk.add(platform);
  const arch = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.5, 8, 20, Math.PI), mat('#f3f1ea'));
  arch.position.set(0, 6, -3);
  mireuk.add(arch);
  const statue = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1, 3.4, 8), mat('#e9e5da'));
  statue.position.set(0, 7.7, -3);
  mireuk.add(statue);
  mireuk.position.set(-26, hillY(-26, -62) + 4, -62);
  scene.add(mireuk);
  return solids;
}

const LANTERN = ['#ec5b8f', '#f3c43a', '#4fb06d', '#4a86d0', '#f08a3a', '#d9443a', '#9a6cc8', '#f6f1e4'];

function lanternRows(scene: THREE.Scene, o: { x0: number; x1: number; z0: number; z1: number; rows: number; y: number }) {
  const n = Math.round((o.x1 - o.x0) / 0.85);
  const geo = new THREE.SphereGeometry(0.32, 10, 8);
  geo.scale(1, 1.2, 1);
  const lamp = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  const inst = new THREE.InstancedMesh(geo, lamp, o.rows * (n - 1));
  const m = new THREE.Matrix4();
  const col = new THREE.Color();
  let k = 0;
  for (let row = 0; row < o.rows; row++) {
    const z = o.z0 + ((o.z1 - o.z0) / Math.max(1, o.rows - 1)) * row;
    const sag = (t: number) => o.y - Math.sin(t * Math.PI) * 0.8;
    const line = new THREE.BufferGeometry().setFromPoints(
      Array.from({ length: n + 1 }, (_, i) => new THREE.Vector3(o.x0 + ((o.x1 - o.x0) * i) / n, sag(i / n), z)),
    );
    scene.add(new THREE.Line(line, new THREE.LineBasicMaterial({ color: '#5a4a3a' })));
    for (let i = 1; i < n; i++) {
      const t = i / n;
      m.makeTranslation(o.x0 + (o.x1 - o.x0) * t, sag(t) - 0.45, z);
      inst.setMatrixAt(k, m);
      // 한 줄은 거의 한 색, 줄마다 색이 바뀐다 (가끔 섞임)
      const c = LANTERN[(row + (i % 7 === 0 ? 3 : 0)) % LANTERN.length];
      inst.setColorAt(k, col.set(c));
      k++;
    }
  }
  scene.add(inst);
}
