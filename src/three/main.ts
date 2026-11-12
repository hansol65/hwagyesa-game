// 3D 화계사: 일주문에서 화계사길을 올라 마당, 보륜당, 오르막, 범종각, 돌계단, 법당 앞, 윗마당까지 걸어 다닌다.
// 실내는 두 곳: 대적광전 3층 법당(법문을 들으며 앉아 있기), 보륜당(음악을 들으며 명상).
import * as THREE from 'three';
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import './three.css';
import { BUILDINGS, DOORS, groundAt, insideBuilding } from './layout';
import { buildWorld } from './world';
import { buildBeopdang, buildBoryun, type Room, type Seat } from './interior';
import { isMuted, play, setMuted, type Track } from './audio';

const canvas = document.getElementById('cv') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// ---------- 바깥 ----------
const outdoor = new THREE.Scene();
outdoor.background = new THREE.Color('#bcd6e6');
outdoor.fog = new THREE.Fog('#bcd6e6', 90, 320);
const sun = new THREE.DirectionalLight('#fff3df', 2.2);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -90, right: 90, top: 90, bottom: -90, far: 300 });
outdoor.add(sun, sun.target);
outdoor.add(new THREE.HemisphereLight('#dfefff', '#6b7a4a', 1.4));
const outdoorSolids = buildWorld(outdoor);

// ---------- 실내 ----------
type PlaceId = 'outdoor' | 'beopdang' | 'boryun';
const rooms: Record<Exclude<PlaceId, 'outdoor'>, Room & { track: Track; sitText: string; meditate: boolean }> = {
  beopdang: { ...buildBeopdang(), track: 'dharma', sitText: '법문이 흘러나와요. 가만히 들어 보세요.', meditate: false },
  boryun: { ...buildBoryun(), track: 'calm', sitText: '숨을 따라가 보세요.', meditate: true },
};
/** 바깥의 문: 다가가면 '들어가기' */
const ENTRANCES: { room: Exclude<PlaceId, 'outdoor'>; x: number; z: number; y: number; label: string; out: { x: number; z: number; yaw: number } }[] = [
  // 법당: 대적광전 서쪽 법당 앞에서 3층으로. 보륜당: 길 쪽(남쪽) 문
  { room: 'beopdang', x: -26.6, z: 30, y: 9, label: '법당 들어가기', out: { x: -28.4, z: 30, yaw: -Math.PI / 2 } },
  { room: 'boryun', x: -8, z: -14.6, y: 0.4, label: '보륜당 들어가기', out: { x: -8, z: -12.8, yaw: 0 } },
];

let place: PlaceId = 'outdoor';
const sceneOf = () => (place === 'outdoor' ? outdoor : rooms[place].scene);
const solidsOf = () => (place === 'outdoor' ? outdoorSolids : rooms[place].solids);

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
outdoor.add(hero);

// 일주문 안쪽 화계사길에서 서쪽(절 쪽)을 보고 출발
const START = { x: 58, z: -18 };
const P = { x: START.x, z: START.z, y: groundAt(START.x, START.z)!.y, yaw: -Math.PI / 2, walk: 0 };
let camYaw = Math.PI / 2; // 0이면 카메라가 남쪽(+z)에서 북쪽을, π/2면 동쪽에서 서쪽을 본다
let camPitch = 0.38;
let camDist = 11;
let sitting: Seat | null = null;
let sitTime = 0;

const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 900);

// ---------- 입력 ----------
const keys = new Set<string>();
addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  keys.add(k);
  if (e.key.startsWith('Arrow') || k === ' ') e.preventDefault();
  if ((k === 'e' || k === ' ' || k === 'enter') && !e.repeat) act();
});
addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => keys.clear());

const stick = { active: false, id: -1, ox: 0, oy: 0, dx: 0, dy: 0 };
const drag = { id: -1, x: 0, y: 0 };
const knob = document.getElementById('knob')!;
const pad = document.getElementById('pad')!;
canvas.addEventListener('pointerdown', (e) => {
  const isTouch = e.pointerType !== 'mouse';
  if (isTouch && e.clientX < innerWidth * 0.45 && e.clientY > innerHeight * 0.45 && !stick.active) {
    Object.assign(stick, { active: true, id: e.pointerId, ox: e.clientX, oy: e.clientY, dx: 0, dy: 0 });
    pad.style.left = `${e.clientX - 60}px`;
    pad.style.top = `${e.clientY - 60}px`;
    pad.hidden = false;
  } else if (drag.id === -1) {
    Object.assign(drag, { id: e.pointerId, x: e.clientX, y: e.clientY });
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
    Object.assign(stick, { active: false, id: -1, dx: 0, dy: 0 });
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
    camDist = Math.min(place === 'outdoor' ? 60 : 7, Math.max(3, camDist + e.deltaY * 0.01));
    e.preventDefault();
  },
  { passive: false },
);

// ---------- 화면 글자 ----------
const placeEl = document.getElementById('place')!;
const tagEl = document.getElementById('tag')!;
const actBtn = document.getElementById('act') as HTMLButtonElement;
const sitEl = document.getElementById('sit')!;
const sitTextEl = document.getElementById('sit-text')!;
const breathEl = document.getElementById('breath')!;
const breathWord = document.getElementById('breath-word')!;
const sitTimeEl = document.getElementById('sit-time')!;
const muteBtn = document.getElementById('mute') as HTMLButtonElement;
muteBtn.addEventListener('click', () => {
  setMuted(!isMuted());
  muteBtn.textContent = isMuted() ? '소리 켜기' : '소리 끄기';
  muteBtn.setAttribute('aria-pressed', String(isMuted()));
});
actBtn.addEventListener('click', act);
document.getElementById('stand')!.addEventListener('click', stand);

const POINTS = [
  ...BUILDINGS.filter((b) => !b.quiet).map((b) => ({ name: b.name, note: b.note, x: b.x, z: b.z, y: b.y + b.stories * b.storyH + 1.5, r: Math.max(b.w, b.d) / 2 + 7 })),
  ...DOORS.map((d) => ({ name: d.name, note: '', x: d.x, z: d.z, y: d.y + 3, r: 5 })),
];

// ---------- 근처에서 할 수 있는 일 ----------
type Action = { label: string; run: () => void } | null;
function nearAction(): Action {
  if (sitting) return null;
  if (place === 'outdoor') {
    for (const d of ENTRANCES) {
      if (Math.hypot(d.x - P.x, d.z - P.z) < 2.6 && Math.abs(d.y - P.y) < 1) return { label: d.label, run: () => enter(d.room) };
    }
    return null;
  }
  const r = rooms[place];
  let best: Seat | null = null;
  let bestD = 1.1;
  for (const s of r.seats) {
    const d = Math.hypot(s.x - P.x, s.z - P.z);
    if (d < bestD) {
      best = s;
      bestD = d;
    }
  }
  if (best) {
    const seat = best;
    return { label: r.meditate ? '앉아서 명상하기' : '앉아서 법문 듣기', run: () => sit(seat) };
  }
  if (Math.hypot(r.exit.x - P.x, r.exit.z - P.z) < 1.5) return { label: '나가기', run: leave };
  return null;
}
function act() {
  if (sitting) return stand();
  nearAction()?.run();
}

function moveHeroTo(scene: THREE.Scene) {
  hero.removeFromParent();
  scene.add(hero);
}

function enter(id: Exclude<PlaceId, 'outdoor'>) {
  const r = rooms[id];
  place = id;
  moveHeroTo(r.scene);
  Object.assign(P, { x: r.entry.x, z: r.entry.z, y: 0, yaw: r.entry.yaw });
  camYaw = r.entry.yaw - Math.PI;
  // 방 안은 좁아서 조금 위에서 내려다본다
  camPitch = 0.62;
  camDist = 5;
  play(r.track);
}
function leave() {
  const from = place as Exclude<PlaceId, 'outdoor'>;
  const d = ENTRANCES.find((e) => e.room === from)!;
  place = 'outdoor';
  moveHeroTo(outdoor);
  const g = groundAt(d.out.x, d.out.z)!;
  Object.assign(P, { x: d.out.x, z: d.out.z, y: g.y, yaw: d.out.yaw });
  // 등 뒤는 방금 나온 건물이라, 카메라는 앞쪽에서 문을 나서는 모습을 본다
  camYaw = d.out.yaw;
  camPitch = 0.42;
  camDist = 10;
  play(null);
}
function sit(s: Seat) {
  sitting = s;
  sitTime = 0;
  Object.assign(P, { x: s.x, z: s.z, yaw: s.yaw });
  const r = rooms[place as Exclude<PlaceId, 'outdoor'>];
  sitTextEl.textContent = r.sitText;
  breathEl.hidden = !r.meditate;
  sitEl.hidden = false;
  document.body.classList.add('sitting');
}
function stand() {
  sitting = null;
  sitEl.hidden = true;
  document.body.classList.remove('sitting');
}

// ---------- 걷기 ----------
function canStand(x: number, z: number): { y: number } | null {
  if (place === 'outdoor') {
    const g = groundAt(x, z);
    if (!g || Math.abs(g.y - P.y) > 0.9 || insideBuilding(x, z, g.y)) return null;
    return g;
  }
  const r = rooms[place];
  const f = r.floor;
  if (x < f.x0 || x > f.x1 || z < f.z0 || z > f.z1) return null;
  if (r.blocks.some((b) => x > b.x0 - 0.3 && x < b.x1 + 0.3 && z > b.z0 - 0.3 && z < b.z1 + 0.3)) return null;
  return { y: 0 };
}

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
  if (sitting) stand();
  if (len > 1) {
    fx /= len;
    fz /= len;
  }
  const speed = (keys.has('shift') ? 9 : place === 'outdoor' ? 5.5 : 3) * dt;
  const fwdX = -Math.sin(camYaw);
  const fwdZ = -Math.cos(camYaw);
  const rightX = Math.cos(camYaw);
  const rightZ = -Math.sin(camYaw);
  const mx = (fwdX * fz + rightX * fx) * speed;
  const mz = (fwdZ * fz + rightZ * fx) * speed;
  const tryStep = (nx: number, nz: number) => {
    const g = canStand(nx, nz);
    if (!g) return false;
    Object.assign(P, { x: nx, z: nz, y: g.y });
    return true;
  };
  if (!tryStep(P.x + mx, P.z + mz)) tryStep(P.x + mx, P.z) || tryStep(P.x, P.z + mz);
  P.yaw = Math.atan2(mx, mz);
  P.walk += dt;
}

// ---------- 이름표·버튼 ----------
const v = new THREE.Vector3();
function updateHud() {
  placeEl.textContent = place === 'outdoor' ? (groundAt(P.x, P.z)?.name ?? '') : rooms[place].name;
  const a = nearAction();
  actBtn.hidden = !a;
  if (a) actBtn.textContent = a.label;
  tagEl.hidden = true;
  if (place !== 'outdoor') return;
  let best: (typeof POINTS)[number] | null = null;
  let bestD = Infinity;
  for (const p of POINTS) {
    const d = Math.hypot(p.x - P.x, p.z - P.z);
    if (d < p.r && d < bestD) {
      best = p;
      bestD = d;
    }
  }
  if (!best) return;
  v.set(best.x, best.y, best.z).project(camera);
  if (v.z > 1) return;
  tagEl.hidden = false;
  tagEl.innerHTML = `<b>${best.name}</b>${best.note ? `<span>${best.note}</span>` : ''}`;
  const x = Math.min(innerWidth - 120, Math.max(120, (v.x * 0.5 + 0.5) * innerWidth));
  const y = Math.min(innerHeight - 80, Math.max(70, (-v.y * 0.5 + 0.5) * innerHeight));
  tagEl.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
}

/** 명상 숨: 4초 들이쉬고 6초 내쉬기 */
function updateSitting(dt: number) {
  if (!sitting) return;
  sitTime += dt;
  const m = Math.floor(sitTime / 60);
  const s = Math.floor(sitTime % 60);
  sitTimeEl.textContent = `${m}:${String(s).padStart(2, '0')}`;
  const c = sitTime % 10;
  const inhale = c < 4;
  const k = inhale ? c / 4 : 1 - (c - 4) / 6;
  breathEl.style.setProperty('--k', String(0.55 + k * 0.45));
  breathWord.textContent = inhale ? '들이쉬고' : '내쉬고';
}

function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.fov = camera.aspect < 1 ? 72 : 55;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

const ray = new THREE.Raycaster();
let last = performance.now();
function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  move(dt);
  updateSitting(dt);
  const bob = P.walk ? Math.abs(Math.sin(P.walk * 10)) * 0.08 : 0;
  hero.position.set(P.x, P.y + bob - (sitting ? 0.45 : 0), P.z);
  hero.scale.y = sitting ? 0.82 : 1;
  hero.rotation.y = P.yaw;

  const eye = sitting ? 1.0 : 1.6;
  const target = new THREE.Vector3(P.x, P.y + eye, P.z);
  // 앉아 있으면 카메라가 천천히 등 뒤 낮은 자리로
  if (sitting) {
    camYaw += (wrap(P.yaw - Math.PI - camYaw) * Math.min(1, dt * 1.5));
    camPitch += (0.35 - camPitch) * Math.min(1, dt * 1.5);
    camDist += (3.2 - camDist) * Math.min(1, dt * 1.5);
  }
  const dir = new THREE.Vector3(Math.sin(camYaw) * Math.cos(camPitch), Math.sin(camPitch), Math.cos(camYaw) * Math.cos(camPitch));
  ray.set(target, dir);
  ray.far = camDist;
  const hit = ray.intersectObjects(solidsOf(), true)[0];
  const dist = hit ? Math.max(1.0, hit.distance - 0.3) : camDist;
  camera.position.copy(target).addScaledVector(dir, dist);
  if (place !== 'outdoor') {
    // 방 안에서는 카메라가 벽·천장 밖으로 나가지 않게
    const r = rooms[place];
    camera.position.x = Math.min(r.floor.x1 + 0.2, Math.max(r.floor.x0 - 0.2, camera.position.x));
    camera.position.z = Math.min(r.floor.z1, Math.max(r.floor.z0 - 0.2, camera.position.z));
    camera.position.y = Math.min(r.height - 0.4, Math.max(0.4, camera.position.y));
  }
  camera.lookAt(target);
  // 앉아 있으면 내 눈으로: 몸은 감추고, 앉은 방향(불단·초)을 조금 내려다본다
  hero.visible = !sitting;
  if (sitting) {
    const fx = Math.sin(P.yaw);
    const fz = Math.cos(P.yaw);
    camera.position.set(P.x - fx * 0.2, 1.15, P.z - fz * 0.2);
    camera.lookAt(P.x + fx * 4, 0.9, P.z + fz * 4);
  }
  if (place === 'outdoor') {
    sun.target.position.set(P.x, P.y, P.z);
    sun.position.set(P.x - 60, P.y + 90, P.z + 50);
  }
  updateHud();
  renderer.render(sceneOf(), camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

function wrap(a: number) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

// 개발할 때만: 콘솔에서 위치·카메라·방을 바꿔 볼 수 있게
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
    enter,
    leave,
    act,
    P,
  };
}

document.getElementById('help-close')?.addEventListener('click', () => {
  document.getElementById('help')!.hidden = true;
});
