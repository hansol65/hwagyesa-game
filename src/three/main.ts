// 3D 화계사: 진입로에서 출발해 마당, 대적광전, 범종각, 돌계단, 윗마당까지 걸어 다닌다.
import * as THREE from 'three';
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import './three.css';
import { BUILDINGS, DOORS, groundAt, insideBuilding } from './layout';
import { buildWorld } from './world';

const canvas = document.getElementById('cv') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#bcd6e6');
scene.fog = new THREE.Fog('#bcd6e6', 90, 320);

const sun = new THREE.DirectionalLight('#fff3df', 2.2);
sun.position.set(-60, 90, 50);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
const sc = sun.shadow.camera;
sc.left = -90;
sc.right = 90;
sc.top = 90;
sc.bottom = -90;
sc.far = 300;
scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight('#dfefff', '#6b7a4a', 1.4));

const solids = buildWorld(scene);
const ray = new THREE.Raycaster();

// ---------- 주인공 ----------
const hero = new THREE.Group();
{
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 1.1, 10), new THREE.MeshLambertMaterial({ color: '#4f7fbf' }));
  body.position.y = 0.75;
  const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.4, 10), new THREE.MeshLambertMaterial({ color: '#3a3a44' }));
  legs.position.y = 0.2;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.48, 16, 12), new THREE.MeshLambertMaterial({ color: '#f1c9a0' }));
  head.position.y = 1.65;
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), new THREE.MeshLambertMaterial({ color: '#2e2622' }));
  hair.position.y = 1.7;
  hair.rotation.x = -0.25;
  for (const m of [body, legs, head, hair]) m.castShadow = true;
  hero.add(body, legs, head, hair);
}
scene.add(hero);

const START = { x: 1, z: 40 };
const P = { x: START.x, z: START.z, y: groundAt(START.x, START.z)!.y, yaw: Math.PI, walk: 0 };
let camYaw = 0; // 카메라가 바라보는 방향 (0 = 북쪽, -z)
let camPitch = 0.38;
let camDist = 11;

const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 900);

// ---------- 입력 ----------
const keys = new Set<string>();
addEventListener('keydown', (e) => {
  keys.add(e.key.toLowerCase());
  if (e.key.startsWith('Arrow')) e.preventDefault();
});
addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => keys.clear());

// 화면 끌기: 카메라 돌리기 (마우스·터치 모두). 터치 왼쪽 아래는 조이스틱.
const stick = { active: false, id: -1, ox: 0, oy: 0, dx: 0, dy: 0 };
const drag = { id: -1, x: 0, y: 0 };
const knob = document.getElementById('knob')!;
const pad = document.getElementById('pad')!;
canvas.addEventListener('pointerdown', (e) => {
  const isTouch = e.pointerType !== 'mouse';
  if (isTouch && e.clientX < innerWidth * 0.45 && e.clientY > innerHeight * 0.45 && !stick.active) {
    stick.active = true;
    stick.id = e.pointerId;
    stick.ox = e.clientX;
    stick.oy = e.clientY;
    stick.dx = stick.dy = 0;
    pad.style.left = `${e.clientX - 60}px`;
    pad.style.top = `${e.clientY - 60}px`;
    pad.hidden = false;
  } else if (drag.id === -1) {
    drag.id = e.pointerId;
    drag.x = e.clientX;
    drag.y = e.clientY;
  }
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (e.pointerId === stick.id) {
    let dx = e.clientX - stick.ox;
    let dy = e.clientY - stick.oy;
    const len = Math.hypot(dx, dy);
    if (len > 50) {
      dx = (dx / len) * 50;
      dy = (dy / len) * 50;
    }
    stick.dx = dx / 50;
    stick.dy = dy / 50;
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
  } else if (e.pointerId === drag.id) {
    camYaw -= (e.clientX - drag.x) * 0.006;
    camPitch = Math.min(1.2, Math.max(0.05, camPitch + (e.clientY - drag.y) * 0.004));
    drag.x = e.clientX;
    drag.y = e.clientY;
  }
});
const release = (e: PointerEvent) => {
  if (e.pointerId === stick.id) {
    stick.active = false;
    stick.id = -1;
    stick.dx = stick.dy = 0;
    knob.style.transform = '';
    pad.hidden = true;
  }
  if (e.pointerId === drag.id) drag.id = -1;
};
canvas.addEventListener('pointerup', release);
canvas.addEventListener('pointercancel', release);
canvas.addEventListener(
  'wheel',
  (e) => {
    camDist = Math.min(60, Math.max(4, camDist + e.deltaY * 0.01));
    e.preventDefault();
  },
  { passive: false },
);

// ---------- 이름표 ----------
const placeEl = document.getElementById('place')!;
const tagEl = document.getElementById('tag')!;
const POINTS = [
  ...BUILDINGS.map((b) => ({ name: b.name, note: b.note, x: b.x, z: b.z, y: b.y + b.stories * b.storyH + 1.5, r: Math.max(b.w, b.d) / 2 + 7 })),
  ...DOORS.map((d) => ({ name: d.name, note: '', x: d.x, z: d.z, y: d.y + 3, r: 5 })),
];

function move(dt: number) {
  let fx = 0;
  let fz = 0;
  if (keys.has('w') || keys.has('arrowup')) fz += 1;
  if (keys.has('s') || keys.has('arrowdown')) fz -= 1;
  if (keys.has('a') || keys.has('arrowleft')) fx -= 1;
  if (keys.has('d') || keys.has('arrowright')) fx += 1;
  if (stick.active) {
    fx += stick.dx;
    fz -= stick.dy;
  }
  const len = Math.hypot(fx, fz);
  if (len < 0.05) {
    P.walk = 0;
    return;
  }
  if (len > 1) {
    fx /= len;
    fz /= len;
  }
  const speed = (keys.has('shift') ? 9 : 5.5) * dt;
  // 카메라 기준: 앞 = (sin(-yaw), -cos(yaw))
  const fwdX = -Math.sin(camYaw);
  const fwdZ = -Math.cos(camYaw);
  const rightX = Math.cos(camYaw);
  const rightZ = -Math.sin(camYaw);
  const mx = (fwdX * fz + rightX * fx) * speed;
  const mz = (fwdZ * fz + rightZ * fx) * speed;
  const tryStep = (nx: number, nz: number) => {
    const g = groundAt(nx, nz);
    if (!g || Math.abs(g.y - P.y) > 0.9) return false;
    if (insideBuilding(nx, nz, g.y)) return false;
    P.x = nx;
    P.z = nz;
    P.y = g.y;
    return true;
  };
  if (!tryStep(P.x + mx, P.z + mz)) {
    // 벽에 비스듬히 닿으면 미끄러지듯
    tryStep(P.x + mx, P.z) || tryStep(P.x, P.z + mz);
  }
  P.yaw = Math.atan2(mx, mz);
  P.walk += dt;
}

const v = new THREE.Vector3();
function updateLabels() {
  const g = groundAt(P.x, P.z);
  placeEl.textContent = g?.name ?? '';
  // 가장 가까운 전각·문
  let best: (typeof POINTS)[number] | null = null;
  let bestD = Infinity;
  for (const p of POINTS) {
    const d = Math.hypot(p.x - P.x, p.z - P.z);
    if (d < p.r && d < bestD) {
      best = p;
      bestD = d;
    }
  }
  if (!best) {
    tagEl.hidden = true;
    return;
  }
  v.set(best.x, best.y, best.z).project(camera);
  if (v.z > 1) {
    tagEl.hidden = true;
    return;
  }
  tagEl.hidden = false;
  tagEl.innerHTML = `<b>${best.name}</b>${best.note ? `<span>${best.note}</span>` : ''}`;
  const x = Math.min(innerWidth - 120, Math.max(120, (v.x * 0.5 + 0.5) * innerWidth));
  const y = Math.min(innerHeight - 80, Math.max(70, (-v.y * 0.5 + 0.5) * innerHeight));
  tagEl.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
}

function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  // 세로 화면(폰)은 옆이 좁으니 시야를 넓힌다
  camera.fov = camera.aspect < 1 ? 72 : 55;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

let last = performance.now();
function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  move(dt);
  const bob = P.walk ? Math.abs(Math.sin(P.walk * 10)) * 0.08 : 0;
  hero.position.set(P.x, P.y + bob, P.z);
  hero.rotation.y = P.yaw;
  // 카메라는 주인공 뒤 위에서
  const target = new THREE.Vector3(P.x, P.y + 1.6, P.z);
  const dir = new THREE.Vector3(Math.sin(camYaw) * Math.cos(camPitch), Math.sin(camPitch), Math.cos(camYaw) * Math.cos(camPitch));
  // 건물이나 축대가 사이에 있으면 카메라를 그 앞으로 당긴다
  ray.set(target, dir);
  ray.far = camDist;
  const hit = ray.intersectObjects(solids, true)[0];
  const dist = hit ? Math.max(1.2, hit.distance - 0.4) : camDist;
  camera.position.copy(target).addScaledVector(dir, dist);
  camera.lookAt(target);
  sun.target.position.set(P.x, P.y, P.z);
  sun.position.set(P.x - 60, P.y + 90, P.z + 50);
  updateLabels();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// 개발할 때만: 콘솔에서 위치·카메라를 바꿔 볼 수 있게
if (import.meta.env.DEV) {
  (globalThis as unknown as { __hw: unknown }).__hw = {
    go(x: number, z: number) {
      const g = groundAt(x, z);
      if (g) Object.assign(P, { x, z, y: g.y });
    },
    cam(yaw: number, pitch: number, dist: number) {
      camYaw = yaw;
      camPitch = pitch;
      camDist = dist;
    },
  };
}

document.getElementById('help-close')?.addEventListener('click', () => {
  document.getElementById('help')!.hidden = true;
});
