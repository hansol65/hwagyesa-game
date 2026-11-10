/**
 * art-src의 원본 그림을 게임에서 쓸 파일로 만든다.  npm run art
 *
 *   art-src/backgrounds/<이름>.png      → public/art/bg/<이름>.webp  (용량만 줄인다)
 *   art-src/sprites/<단계>/<인물>.png   → public/art/sprites/<단계>/<인물>.webp
 *   art-src/props/props.png             → public/art/props/<소품>.webp
 *
 * 스프라이트 시트(투명 배경, 동작 6개가 한 줄)는 비어 있는 세로줄을 찾아 동작마다 자르고,
 * 같은 크기 칸 6개를 가로로 붙인 띠 한 장으로 다시 저장한다.
 * 동작마다 위아래 위치는 그대로 둔다(서 있기 B가 살짝 낮은 게 둠칫둠칫이 된다).
 * 칸 크기는 src/art/sprites.json에 적는다.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'art-src');
const OUT = path.join(ROOT, 'public/art');
const ALPHA = 40; // 이보다 불투명한 칸만 그림으로 본다
const PAD = 4;
/** 원본 시트는 도트 한 칸이 3~4px라 반으로 줄여도 화면에서 충분히 또렷하다 */
const SPRITE_SCALE = 0.5;
/**
 * 감정 그림(울기·화내기). 한 장에 여러 사람이 있어도 되고, 왼쪽부터 out 순서대로 자른다.
 * 각 그림은 그 사람의 서 있기(기본 시트 1번 칸)와 키·발끝 위치가 같아지게 맞춰서
 * public/art/sprites/<단계>/<인물>-<감정>.webp 한 칸짜리로 저장한다.
 */
const EMOTES: { file: string; stage: string; out: string[] }[] = [
  { file: 'kids-cry.webp', stage: 'kid', out: ['hero-f-cry', 'hero-m-cry', 'friend-a-cry', 'friend-b-cry', 'friend-c-cry'] },
  { file: 'teacher-angry.png', stage: 'kid', out: ['teacher-angry'] },
  { file: 'gansa-angry-cry.webp', stage: 'kid', out: ['gansa-angry', 'gansa-cry'] },
];

type Meta = Record<string, { frames: number; w: number; h: number }>;

/** 기본 시트에서 서 있기 칸의 그림 위·아래 (줄인 뒤 픽셀) */
async function idleBox(stripFile: string, frameW: number) {
  const img = await load(stripFile);
  let y0 = img.h, y1 = 0;
  for (let y = 0; y < img.h; y++) {
    for (let x = 0; x < frameW; x++) {
      if (img.data[(y * img.w + x) * 4 + 3] > ALPHA) { y0 = Math.min(y0, y); y1 = Math.max(y1, y + 1); }
    }
  }
  return { y0, y1 };
}

async function buildEmotes(meta: Meta) {
  const dir = path.join(SRC, 'emote-raw');
  for (const e of EMOTES) {
    const file = path.join(dir, e.file);
    if (!fs.existsSync(file)) continue;
    const img = await load(file);
    const frames = findFrames(img, 12, e.out.length);
    if (frames.length !== e.out.length) console.warn(`  ! ${e.file}: ${frames.length}명 (${e.out.length}명이어야 함)`);
    for (const [i, f] of frames.entries()) {
      const name = e.out[i];
      if (!name) continue;
      const baseKey = `${e.stage}/${name.replace(/-(cry|angry)$/, '')}`;
      const base = meta[baseKey];
      if (!base) { console.warn(`  ! 기본 시트 없음: ${baseKey}`); continue; }
      const idle = await idleBox(path.join(OUT, 'sprites', `${baseKey}.webp`), base.w);
      const figH = idle.y1 - idle.y0;
      const fw = Math.max(1, Math.round(((f.x1 - f.x0) * figH) / (f.y1 - f.y0)));
      const fig = await sharp(file)
        .extract({ left: f.x0, top: f.y0, width: f.x1 - f.x0, height: f.y1 - f.y0 })
        .resize(fw, figH, { kernel: 'lanczos3' })
        .png()
        .toBuffer();
      const w = fw + 4;
      const key = `${e.stage}/${name}`;
      await sharp({ create: { width: w, height: base.h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
        .composite([{ input: fig, left: 2, top: idle.y0 }])
        .webp({ quality: 90, alphaQuality: 100 })
        .toFile(path.join(OUT, 'sprites', `${key}.webp`));
      meta[key] = { frames: 1, w, h: base.h };
      console.log('emote', key, meta[key]);
    }
  }
}

const PROP_NAMES = ['lantern', 'ball', 'moktak', 'ocarina', 'beads', 'broom', 'watergun'];

type Box = { x0: number; x1: number; y0: number; y1: number };

async function load(file: string) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

/** 세로줄마다 그림이 있는지 보고, 이어진 덩어리를 동작 하나로 묶는다. 너무 가까운 덩어리는 합친다. */
function findFrames(img: { data: Buffer; w: number; h: number }, minGap = 12, want = 0): Box[] {
  const { data, w, h } = img;
  const filled = (x: number, y: number) => data[(y * w + x) * 4 + 3] > ALPHA;
  const colCount: number[] = [];
  for (let x = 0; x < w; x++) {
    let n = 0;
    for (let y = 0; y < h; y++) if (filled(x, y)) n++;
    colCount.push(n);
  }
  const colHas = colCount.map((n) => n > 1);
  const runs: [number, number][] = [];
  for (let x = 0; x < w; x++) {
    if (!colHas[x]) continue;
    const s = x;
    while (x < w && colHas[x]) x++;
    const last = runs[runs.length - 1];
    if (last && s - last[1] < minGap) last[1] = x;
    else runs.push([s, x]);
  }
  const kept = runs.filter(([a, b]) => b - a > 20); // 먼지 같은 점은 버린다
  // 손끝이 닿아 두 동작이 붙었으면, 가장 넓은 덩어리를 가운데쯤 가장 얇은 세로줄에서 가른다
  while (want && kept.length && kept.length < want) {
    const i = kept.reduce((m, r, j) => (r[1] - r[0] > kept[m][1] - kept[m][0] ? j : m), 0);
    const [a, b] = kept[i];
    let cut = a, min = Infinity;
    for (let x = a + Math.round((b - a) * 0.3); x < a + Math.round((b - a) * 0.7); x++) {
      if (colCount[x] < min) { min = colCount[x]; cut = x; }
    }
    kept.splice(i, 1, [a, cut], [cut, b]);
  }
  return kept
    .map(([x0, x1]) => {
      let y0 = h, y1 = 0;
      for (let y = 0; y < h; y++) for (let x = x0; x < x1; x++) if (filled(x, y)) { y0 = Math.min(y0, y); y1 = Math.max(y1, y + 1); }
      return { x0, x1, y0, y1 };
    });
}

async function buildSprite(file: string, outFile: string) {
  const img = await load(file);
  const frames = findFrames(img, 12, 6);
  if (frames.length !== 6) console.warn(`  ! ${path.relative(SRC, file)}: 동작 ${frames.length}개 (6개여야 함)`);
  const top = Math.min(...frames.map((f) => f.y0)) - PAD;
  const bottom = Math.max(...frames.map((f) => f.y1)) + PAD;
  const fw = Math.max(...frames.map((f) => f.x1 - f.x0)) + PAD * 2;
  const fh = bottom - top;
  const comps = await Promise.all(
    frames.map(async (f, i) => ({
      input: await sharp(file).extract({ left: f.x0, top, width: f.x1 - f.x0, height: fh }).toBuffer(),
      left: i * fw + Math.round((fw - (f.x1 - f.x0)) / 2),
      top: 0,
    })),
  );
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  const strip = await sharp({ create: { width: fw * frames.length, height: fh, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(comps)
    .png()
    .toBuffer();
  const w = Math.round(fw * SPRITE_SCALE);
  const h = Math.round(fh * SPRITE_SCALE);
  await sharp(strip).resize(w * frames.length, h, { kernel: 'lanczos3' }).webp({ quality: 90, alphaQuality: 100 }).toFile(outFile);
  return { frames: frames.length, w, h };
}

async function main() {
  // 배경
  const bgDir = path.join(SRC, 'backgrounds');
  fs.mkdirSync(path.join(OUT, 'bg'), { recursive: true });
  for (const f of fs.readdirSync(bgDir).filter((f) => f.endsWith('.png'))) {
    await sharp(path.join(bgDir, f)).webp({ quality: 86 }).toFile(path.join(OUT, 'bg', f.replace('.png', '.webp')));
    console.log('bg', f);
  }

  // 인물
  const meta: Record<string, { frames: number; w: number; h: number }> = {};
  const spDir = path.join(SRC, 'sprites');
  for (const stage of fs.readdirSync(spDir)) {
    for (const f of fs.readdirSync(path.join(spDir, stage)).filter((f) => f.endsWith('.png'))) {
      const key = `${stage}/${f.replace('.png', '')}`;
      meta[key] = await buildSprite(path.join(spDir, stage, f), path.join(OUT, 'sprites', `${key}.webp`));
      console.log('sprite', key, meta[key]);
    }
  }
  await buildEmotes(meta);
  fs.writeFileSync(path.join(ROOT, 'src/art/sprites.json'), JSON.stringify(meta, null, 2) + '\n');

  // 소품: 하나씩 잘라 따로 저장
  const propFile = path.join(SRC, 'props/props.png');
  if (fs.existsSync(propFile)) {
    const img = await load(propFile);
    const frames = findFrames(img, 6);
    fs.mkdirSync(path.join(OUT, 'props'), { recursive: true });
    for (const [i, f] of frames.entries()) {
      const name = PROP_NAMES[i] ?? `prop-${i}`;
      await sharp(propFile)
        .extract({ left: f.x0, top: f.y0, width: f.x1 - f.x0, height: f.y1 - f.y0 })
        .webp({ lossless: true })
        .toFile(path.join(OUT, 'props', `${name}.webp`));
    }
    console.log('props', frames.length);
  }

  // 고양이: 한 장에 여러 마리. 판마다 한 마리를 골라 쓴다 (이름은 names.ts의 catName)
  const catFile = path.join(SRC, 'props/cats.webp');
  if (fs.existsSync(catFile)) {
    const img = await load(catFile);
    const frames = findFrames(img, 12);
    fs.mkdirSync(path.join(OUT, 'props'), { recursive: true });
    for (const [i, f] of frames.entries()) {
      await sharp(catFile)
        .extract({ left: f.x0, top: f.y0, width: f.x1 - f.x0, height: f.y1 - f.y0 })
        .resize({ height: Math.round((f.y1 - f.y0) * SPRITE_SCALE) })
        .webp({ quality: 90, alphaQuality: 100 })
        .toFile(path.join(OUT, 'props', `cat-${i + 1}.webp`));
    }
    console.log('cats', frames.length);
  }
}

main();
