// 방마다 흐르는 소리.
// public/audio/dharma.mp3 (법당 법문), public/audio/calm.mp3 (보륜당 음악)이 있으면 그 파일을 반복해서 틀고,
// 없으면 코드로 만든 소리를 대신 튼다: 법당은 낮은 울림 + 가끔 종소리와 목탁, 보륜당은 잔잔한 화음 + 싱잉볼.
export type Track = 'dharma' | 'calm';

const BASE = import.meta.env.BASE_URL;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
let current: { track: Track; stop: () => void } | null = null;

function audio() {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return { ctx, master: master! };
}

export function setMuted(m: boolean) {
  muted = m;
  if (master && ctx) master.gain.setTargetAtTime(m ? 0 : 1, ctx.currentTime, 0.2);
}
export const isMuted = () => muted;

/** 파일이 있으면 그 파일, 없으면 만든 소리. 사용자가 누른 직후에 불러야 소리가 난다 */
export function play(track: Track | null) {
  if (current?.track === track) return;
  current?.stop();
  current = null;
  if (!track) return;
  const { ctx, master } = audio();
  const bus = ctx.createGain();
  bus.gain.value = 0;
  bus.connect(master);
  bus.gain.setTargetAtTime(1, ctx.currentTime, 0.8);
  let stopGenerated: (() => void) | null = null;
  const el = new Audio(`${BASE}audio/${track}.mp3`);
  el.loop = true;
  el.crossOrigin = 'anonymous';
  let usingFile = false;
  el.addEventListener('canplay', () => {
    if (usingFile || !current || current.track !== track) return;
    usingFile = true;
    stopGenerated?.();
    stopGenerated = null;
    const src = ctx.createMediaElementSource(el);
    src.connect(bus);
    void el.play().catch(() => {});
  });
  el.addEventListener('error', () => {
    if (!stopGenerated && !usingFile) stopGenerated = track === 'dharma' ? dharma(ctx, bus) : calm(ctx, bus);
  });
  // 파일을 찾는 동안에도 조용하지 않게, 잠깐 뒤에 만든 소리부터 시작
  const t = setTimeout(() => {
    if (!usingFile && !stopGenerated) stopGenerated = track === 'dharma' ? dharma(ctx, bus) : calm(ctx, bus);
  }, 400);
  current = {
    track,
    stop() {
      clearTimeout(t);
      bus.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
      setTimeout(() => {
        el.pause();
        stopGenerated?.();
        bus.disconnect();
      }, 2500);
    },
  };
}

function bell(ctx: AudioContext, out: AudioNode, at: number, gain = 0.5) {
  const parts: [number, number, number][] = [
    [64, 1, 9],
    [64.8, 0.8, 9],
    [128, 0.5, 7],
    [171, 0.35, 5],
    [256, 0.25, 4],
    [389, 0.12, 2.5],
  ];
  for (const [f, g, d] of parts) {
    const o = ctx.createOscillator();
    const gn = ctx.createGain();
    o.frequency.value = f * 1.5;
    gn.gain.setValueAtTime(0.0001, at);
    gn.gain.exponentialRampToValueAtTime(g * gain, at + 0.02);
    gn.gain.exponentialRampToValueAtTime(0.0001, at + d);
    o.connect(gn).connect(out);
    o.start(at);
    o.stop(at + d + 0.1);
  }
}

function knock(ctx: AudioContext, out: AudioNode, at: number) {
  for (const [f, g] of [
    [540, 0.35],
    [1180, 0.08],
  ]) {
    const o = ctx.createOscillator();
    const gn = ctx.createGain();
    o.frequency.setValueAtTime(f, at);
    o.frequency.exponentialRampToValueAtTime(f * 0.82, at + 0.12);
    gn.gain.setValueAtTime(g, at);
    gn.gain.exponentialRampToValueAtTime(0.0001, at + 0.16);
    o.connect(gn).connect(out);
    o.start(at);
    o.stop(at + 0.2);
  }
}

/** 법당: 낮게 깔리는 울림, 천천히 치는 목탁, 가끔 종 */
function dharma(ctx: AudioContext, out: AudioNode) {
  const drone = ctx.createGain();
  drone.gain.value = 0.06;
  drone.connect(out);
  const oscs = [55, 82.5, 110.4].map((f) => {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = f;
    o.connect(drone);
    o.start();
    return o;
  });
  let next = ctx.currentTime + 0.5;
  let beat = 0;
  const timer = setInterval(() => {
    while (next < ctx.currentTime + 1) {
      knock(ctx, out, next);
      beat++;
      if (beat % 24 === 0) bell(ctx, out, next + 0.6, 0.4);
      next += 1.1;
    }
  }, 300);
  bell(ctx, out, ctx.currentTime + 0.2, 0.45);
  return () => {
    clearInterval(timer);
    oscs.forEach((o) => o.stop());
  };
}

/** 보륜당: 오음계 화음이 천천히 겹치고, 가끔 싱잉볼 */
function calm(ctx: AudioContext, out: AudioNode) {
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 1400;
  const delay = ctx.createDelay();
  delay.delayTime.value = 0.45;
  const fb = ctx.createGain();
  fb.gain.value = 0.35;
  delay.connect(fb).connect(delay);
  lp.connect(out);
  lp.connect(delay);
  delay.connect(out);
  const notes = [196, 220, 261.6, 293.7, 329.6, 392, 440];
  let next = ctx.currentTime + 0.3;
  const timer = setInterval(() => {
    while (next < ctx.currentTime + 1.5) {
      const f = notes[Math.floor(Math.random() * notes.length)];
      for (const mult of [1, 2]) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = mult === 1 ? 'triangle' : 'sine';
        o.frequency.value = f * mult;
        g.gain.setValueAtTime(0.0001, next);
        g.gain.exponentialRampToValueAtTime(mult === 1 ? 0.07 : 0.025, next + 1.4);
        g.gain.exponentialRampToValueAtTime(0.0001, next + 5);
        o.connect(g).connect(lp);
        o.start(next);
        o.stop(next + 5.2);
      }
      if (Math.random() < 0.12) bell(ctx, lp, next + 0.5, 0.18);
      next += 1.8 + Math.random() * 1.6;
    }
  }, 400);
  return () => clearInterval(timer);
}
