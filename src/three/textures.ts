// 캔버스로 그리는 무늬: 꽃살 창호, 단청 띠, 현판.
// 화계사 사진 참고: 초록(뇌록) 바탕 단청, 빨간 기둥, 창호는 초록 살에 흰 창호지,
// 현판은 흰 바탕에 검은 글씨, 테두리는 초록·빨강 단청. 글은 오른쪽에서 왼쪽으로 쓴다.
import * as THREE from 'three';

function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!] as const;
}

function tex(c: HTMLCanvasElement, rx = 1, ry = 1) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.anisotropy = 4;
  return t;
}

let latticeCanvas: HTMLCanvasElement | null = null;
/** 문 한 짝: 초록 문틀 안에 격자 살, 사이로 흰 창호지 */
function lattice() {
  if (latticeCanvas) return latticeCanvas;
  const [c, g] = canvas(128, 192);
  g.fillStyle = '#efe6cf';
  g.fillRect(0, 0, 128, 192);
  g.strokeStyle = '#2f7a66';
  g.lineWidth = 4;
  for (let x = 12; x < 128; x += 14) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, 150);
    g.stroke();
  }
  for (let y = 10; y < 150; y += 14) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(128, y);
    g.stroke();
  }
  // 아래 궁판 (막힌 판)
  g.fillStyle = '#2f7a66';
  g.fillRect(0, 150, 128, 42);
  g.fillStyle = '#c2412d';
  g.fillRect(14, 160, 100, 22);
  // 문틀
  g.lineWidth = 10;
  g.strokeStyle = '#25604f';
  g.strokeRect(5, 5, 118, 182);
  latticeCanvas = c;
  return c;
}

const doorMats = new Map<number, THREE.Material>();
/** 문 n짝이 나란한 창호 재질 */
export function doorMat(n: number) {
  n = Math.max(1, Math.round(n));
  let m = doorMats.get(n);
  if (!m) {
    m = new THREE.MeshLambertMaterial({ map: tex(lattice(), n, 1) });
    doorMats.set(n, m);
  }
  return m;
}

let bandCanvas: HTMLCanvasElement | null = null;
/** 창방 단청: 초록 바탕, 마디마다 머리초(빨강·파랑·흰 겹 무늬) */
function band() {
  if (bandCanvas) return bandCanvas;
  const [c, g] = canvas(256, 64);
  g.fillStyle = '#2f8a74';
  g.fillRect(0, 0, 256, 64);
  g.fillStyle = '#1f5f52';
  g.fillRect(0, 0, 256, 6);
  g.fillRect(0, 58, 256, 6);
  // 마디 양끝 머리초
  for (const cx of [0, 256]) {
    const rings: [string, number][] = [
      ['#f4efe2', 46],
      ['#c2412d', 38],
      ['#3f6fb0', 28],
      ['#f4efe2', 20],
      ['#e2a33a', 12],
    ];
    for (const [col, r] of rings) {
      g.fillStyle = col;
      g.beginPath();
      g.ellipse(cx, 32, r, 24 * (r / 46), 0, 0, Math.PI * 2);
      g.fill();
    }
  }
  // 가운데 작은 꽃
  g.fillStyle = '#f4efe2';
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    g.beginPath();
    g.arc(128 + Math.cos(a) * 9, 32 + Math.sin(a) * 9, 6, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = '#c2412d';
  g.beginPath();
  g.arc(128, 32, 6, 0, Math.PI * 2);
  g.fill();
  bandCanvas = c;
  return c;
}

const bandMats = new Map<number, THREE.Material>();
/** 단청 띠 재질. n은 길이를 따라 무늬가 되풀이되는 횟수 */
export function bandMat(n: number) {
  n = Math.max(1, Math.round(n));
  let m = bandMats.get(n);
  if (!m) {
    m = new THREE.MeshLambertMaterial({ map: tex(band(), n, 1) });
    bandMats.set(n, m);
  }
  return m;
}

const FONT = '"Batang", "Noto Serif KR", "Noto Serif CJK KR", "Nanum Myeongjo", serif';
const signs: { c: HTMLCanvasElement; t: THREE.CanvasTexture; text: string }[] = [];

function drawSign(c: HTMLCanvasElement, text: string) {
  const g = c.getContext('2d')!;
  const W = c.width;
  const H = c.height;
  // 바깥 테두리: 초록 → 빨강 → 금빛 선
  g.fillStyle = '#25604f';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#c2412d';
  g.fillRect(14, 14, W - 28, H - 28);
  g.fillStyle = '#e2a33a';
  g.fillRect(22, 22, W - 44, H - 44);
  g.fillStyle = '#f6f1e4';
  g.fillRect(28, 28, W - 56, H - 56);
  // 글은 오른쪽부터
  const chars = [...text].reverse();
  const inner = W - 80;
  const size = Math.min(H - 70, (inner / chars.length) * 0.9);
  g.fillStyle = '#1b1712';
  g.font = `700 ${size}px ${FONT}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  chars.forEach((ch, i) => {
    g.fillText(ch, 40 + (inner / chars.length) * (i + 0.5), H / 2 + size * 0.04);
  });
}

/** 현판 판자 하나 (글자 수에 맞춰 길이가 정해진다). 앞면이 +z */
export function signboard(text: string, height = 1.1) {
  const n = [...text].length;
  const [c] = canvas(Math.round(140 * n + 80), 220);
  drawSign(c, text);
  const t = tex(c);
  signs.push({ c, t, text });
  const w = height * (c.width / c.height);
  const front = new THREE.MeshLambertMaterial({ map: t });
  const edge = new THREE.MeshLambertMaterial({ color: '#25604f' });
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, height, 0.14), [edge, edge, edge, edge, front, edge]);
  return m;
}

// 글꼴이 늦게 들어오면 다시 그린다
if (typeof document !== 'undefined' && document.fonts) {
  void document.fonts.ready.then(() => {
    for (const s of signs) {
      drawSign(s.c, s.text);
      s.t.needsUpdate = true;
    }
  });
}
