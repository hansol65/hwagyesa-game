// 땅, 계단, 나무, 산, 연등을 만든다.
import * as THREE from 'three';
import { BUILDINGS, GROUND, type Ground, type Surface } from './layout';
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
  const top = (z: number) => (g.kind === 'flat' ? g.y : g.y0 + ((z - g.z0) / (g.z1 - g.z0)) * (g.y1 - g.y0));
  const { x0, x1, z0, z1 } = g;
  const v = [
    [x0, top(z0), z0],
    [x1, top(z0), z0],
    [x1, top(z1), z1],
    [x0, top(z1), z1],
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
    const len = g.z1 - g.z0;
    for (let i = 0; i < n; i++) {
      const z = g.z0 + (len / n) * (i + 0.5);
      const y = top(z);
      const step = new THREE.Mesh(new THREE.BoxGeometry(g.x1 - g.x0, 0.32, len / n + 0.02), mat('#c9c2b0'));
      step.position.set((g.x0 + g.x1) / 2, y - 0.16, z);
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
  // 마당 근처는 마당보다 조금 낮게, 북쪽(-z)으로 산비탈, 남쪽(진입로)으로 내리막
  return -1 + Math.min(Math.max(0, -z - 10), 90) * 0.24 - Math.max(0, z - 20) * 0.22 + Math.sin(x * 0.07) * 0.6;
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
    [-160, -230, 70, 110],
    [-60, -260, 90, 140],
    [60, -250, 80, 120],
    [170, -220, 60, 100],
    [120, -300, 120, 160],
  ];
  for (const [x, z, h, r] of ridge) {
    const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 9), mat('#4f7d4b'));
    m.position.set(x, 12 + h / 2, z);
    scene.add(m);
  }
  // 바위 봉우리
  const peak = new THREE.Mesh(new THREE.ConeGeometry(14, 40, 6), mat('#b9b6ad'));
  peak.position.set(150, 12 + 70 + 14, -310);
  scene.add(peak);

  // 나무: 걷는 곳과 건물을 피해서
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 260; i++) {
    const x = -90 + rnd() * 180;
    const z = -130 + rnd() * 200;
    if (walkable(x, z) || inBuilding(x, z)) continue;
    const y = hillY(x, z) - 0.6;
    const s = 0.8 + rnd() * 0.7;
    scene.add(rnd() < 0.65 ? pine(x, y, z, s) : broadleaf(x, y, z, s));
  }
  // 마당 가장자리 큰 나무 몇 그루
  scene.add(broadleaf(-18, 0, 17, 1.3));
  scene.add(pine(12, 4.5, -31, 1.1));

  // 마당 위 연등 줄
  const colors = ['#d9443a', '#e9b23a', '#f1ece0', '#4f9b6e', '#d46a9a', '#4a78b5'];
  const lanternGeo = new THREE.SphereGeometry(0.32, 10, 8);
  for (let row = 0; row < 5; row++) {
    const z = -6 + row * 5;
    const x0 = -19;
    const x1 = 12;
    const n = 26;
    const line = new THREE.BufferGeometry().setFromPoints(
      Array.from({ length: n + 1 }, (_, i) => {
        const t = i / n;
        return new THREE.Vector3(x0 + (x1 - x0) * t, 9.5 - Math.sin(t * Math.PI) * 0.8, z);
      }),
    );
    scene.add(new THREE.Line(line, new THREE.LineBasicMaterial({ color: '#5a4a3a' })));
    for (let i = 1; i < n; i++) {
      const t = i / n;
      const l = new THREE.Mesh(lanternGeo, new THREE.MeshLambertMaterial({ color: colors[(i + row) % colors.length], emissive: colors[(i + row) % colors.length], emissiveIntensity: 0.25 }));
      l.scale.y = 1.2;
      l.position.set(x0 + (x1 - x0) * t, 9.5 - Math.sin(t * Math.PI) * 0.8 - 0.45, z);
      scene.add(l);
    }
  }

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
  mireuk.position.set(40, 0, -18);
  scene.add(mireuk);
  return solids;
}
