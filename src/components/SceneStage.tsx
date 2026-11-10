import type { CSSProperties } from 'react';
import { POSE_FRAME, SPRITES, type Actor, type Staging } from '../art/scene';

const BASE = import.meta.env.BASE_URL;
/** 어린이 주인공(서 있기 칸 높이)이 장면 높이의 이만큼을 차지한다 */
const HERO_HEIGHT = 0.5;
const REF_H = SPRITES['kid/hero-f']?.h ?? 213;
/** 시트마다 그려진 크기가 조금씩 달라서 맞춰 준다 */
const SIZE_FIX: Record<string, number> = { 'kid/monk': 1.12 };

/** 주인공은 왼쪽, 나머지는 오른쪽에서 주인공을 바라본다 */
function placeX(i: number, n: number) {
  if (i === 0) return n === 1 ? 50 : 26;
  const others = n - 1;
  const from = others === 1 ? 66 : 54;
  const to = 84;
  return others === 1 ? from : from + ((to - from) * (i - 1)) / (others - 1);
}

function Sprite({ actor, i, n }: { actor: Actor; i: number; n: number }) {
  const meta = SPRITES[actor.sprite];
  if (!meta) return null;
  const h = (meta.h / REF_H) * HERO_HEIGHT * (SIZE_FIX[actor.sprite] ?? 1) * 100;
  const frame = POSE_FRAME[actor.pose];
  const step = 100 / (meta.frames - 1);
  const box = { left: `${placeX(i, n)}%`, height: `${h}%`, aspectRatio: `${meta.w} / ${meta.h}` } as CSSProperties;
  const style = {
    backgroundImage: `url(${BASE}art/sprites/${actor.sprite}.webp)`,
    backgroundSize: `${meta.frames * 100}% 100%`,
    backgroundPositionX: `${frame * step}%`,
    '--f0': '0%',
    '--f1': `${step}%`,
    // 사람마다 둠칫 박자를 살짝 어긋나게
    animationDelay: `${-i * 0.37}s`,
  } as CSSProperties;
  return (
    <div className={`actor pose-${actor.pose}`} style={box}>
      <span className="shadow" />
      <span className={i > 0 ? 'body flip' : 'body'} style={style} />
    </div>
  );
}

/** 어둡게 깐 배경 위에 인물을 선명하게 세운 장면 */
export function SceneStage({ staging, alt }: { staging: Staging; alt: string }) {
  const { bg, night, actors } = staging;
  return (
    <figure className={night ? 'stage night' : 'stage'} role="img" aria-label={alt}>
      <img className="stage-bg" src={`${BASE}art/bg/${bg}.webp`} alt="" draggable={false} />
      <div className="stage-cast">
        {actors.map((a, i) => (
          <Sprite key={a.key} actor={a} i={i} n={actors.length} />
        ))}
      </div>
    </figure>
  );
}
