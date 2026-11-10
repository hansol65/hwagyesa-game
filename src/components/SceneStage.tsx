import type { CSSProperties } from 'react';
import { frameFor, SPRITES, type Actor, type Staging } from '../art/scene';

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
  const base = SPRITES[actor.sprite];
  if (!base) return null;
  // 크기는 늘 기본 시트 기준 (감정 시트가 조금 달라도 키가 같게)
  const h = (base.h / REF_H) * HERO_HEIGHT * (SIZE_FIX[actor.sprite] ?? 1) * 100;
  const { sprite, frame } = frameFor(actor.sprite, actor.pose);
  const meta = SPRITES[sprite];
  const step = 100 / (meta.frames - 1);
  const box = { left: `${placeX(i, n)}%`, height: `${h}%`, aspectRatio: `${meta.w} / ${meta.h}` } as CSSProperties;
  const style = {
    backgroundImage: `url(${BASE}art/sprites/${sprite}.webp)`,
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

/** 고양이: 주인공 오른쪽 바닥에 엎드려 주인공을 본다. 새끼는 작게 그 뒤에 */
function Cats({ n, kittens }: { n: number; kittens: number }) {
  const src = `${BASE}art/props/cat-${n}.webp`;
  return (
    <>
      <img className="cat" src={src} alt="" style={{ left: '68%', height: '15%' }} />
      {Array.from({ length: kittens }, (_, i) => (
        <img key={i} className="cat kitten" src={src} alt="" style={{ left: `${79 + i * 6}%`, height: '8%', animationDelay: `${-i * 0.3}s` }} />
      ))}
    </>
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
        {staging.cat && <Cats {...staging.cat} />}
      </div>
    </figure>
  );
}
