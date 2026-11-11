import { useEffect, useState, type CSSProperties } from 'react';
import { frameFor, SPRITES, type Pose } from '../art/scene';
import { attendRate } from '../game/engine';
import { catName, personName, seniorName } from '../game/names';
import { stageOf, type GameState } from '../game/types';

const BASE = import.meta.env.BASE_URL;

/** 6년 동안 한 일 중 하나를 소품으로 든다. 위에 있을수록 먼저. */
const PROPS: { prop: string; size: number; when: (g: GameState) => boolean }[] = [
  { prop: 'moktak', size: 0.2, when: (g) => g.flags.includes('president') },
  { prop: 'ocarina', size: 0.15, when: (g) => (g.records.ocarina_success ?? 0) + (g.records.song_solo ?? 0) > 0 },
  { prop: 'ball', size: 0.2, when: (g) => (g.records.dodgeball_win ?? 0) > 0 },
  { prop: 'lantern', size: 0.3, when: (g) => (g.records.lantern_dance ?? 0) + (g.records.lantern_craft ?? 0) > 0 },
  { prop: 'beads', size: 0.18, when: (g) => (g.records.beads_made ?? 0) > 0 },
];

/**
 * 사진 아래 지솔 쌤의 한마디. 잘 놀리고, 사진 집착하고, 늘 졸업 준비로 피곤한 쌤.
 * 그 아이가 6년 동안 가장 크게 남긴 것으로 고르고, 같은 갈래 안에서는 판마다 다른 말을 한다.
 */
function jisolNote(g: GameState): string {
  const r = (k: string) => g.records[k] ?? 0;
  const cried = g.seen.filter((id) => id.startsWith('story-cry')).length;
  const cat = catName(g);
  const lines: string[] = g.flags.includes('president')
    ? ['목탁 박자 놓친 거 쌤이 다 찍어 놨다. 너 결혼식 때 튼다.', '회장님, 마지막으로 사인 한 장만. 나중에 비싸질 것 같아서.']
    : r('ocarina_success') + r('song_solo') > 0
      ? ['오카리나 삑사리 모음집 3분짜리 있다. 졸업 선물로 줄까?', '독주 때 손 덜덜 떨던 거, 쌤 폰에 고화질로 있다. 지워 달라고 해도 안 지워.']
      : r('dodgeball_win') > 0
        ? ['피구 때 쌤 얼굴 정통으로 맞힌 거, 일부러였지? 다 알아.', '피구왕 은퇴식이다. 공은 쌤이 압수한다.']
        : r('helped_kid') >= 2 || g.flags.includes('mentored_kid')
          ? ['동생들이 쌤 말고 너만 찾아서 쌤 일자리 위태로웠다. 진짜로.', '너 학생회 가면 동생들은 누가 챙기냐. 쌤? 쌤 졸업 준비해야 돼…']
          : g.flags.includes('chased_elephant')
            ? ['1학년 때 코끼리 연등 쫓아가서 쌤 수명 10년 줄었다. 갚아라.']
            : cried >= 2
              ? ['6년 동안 우는 사진만 폴더 하나다. 오늘은 웃어서 다행이다… 아 쌤이 울고 있네.']
              : g.flags.includes('cat_cared') || g.flags.includes('kittens')
                ? [`솔직히 ${cat} 사진이 너 사진보다 많다. 비밀이다.`]
                : attendRate(g) >= 0.95
                  ? ['6년 개근 실화냐. 쌤은 시험 기간에 빠졌는데. 존경한다.', '일요일마다 와 줘서 쌤 주말이 없었다. 고맙다… 이제 좀 자자.']
                  : attendRate(g) < 0.5
                    ? ['얼굴 까먹을 뻔했다. 사진이라도 박제해 둔다.', '자주는 못 봤는데 올 때마다 간식은 제일 많이 먹더라.']
                    : [
                        '사진 2,847장 중에 너 눈 감은 게 2,000장이다. 이게 제일 잘 나온 거야.',
                        '쌤 과제 미루고 찍은 사진이다. 소중히 해라.',
                        '학생회 가서도 놀러 와. 쌤 졸업 못 하면 아직 여기 있을 거야.',
                      ];
  let h = 5;
  for (const c of g.name + Object.values(g.friends).join('')) h = (h * 41 + c.charCodeAt(0)) >>> 0;
  return lines[h % lines.length];
}

/**
 * 대학생회 졸업사진 아래 지솔 쌤의 한마디. 16년 동안 찍어 온 사진의 마지막 장.
 * 간사를 물려받았으면 그 얘기, 아니면 16년 이야기.
 */
function uniNote(g: GameState): string {
  const lines: string[] = g.flags.includes('uni:kid_gansa')
    ? ['너 1학년 때 사진이랑 오늘 사진 나란히 놓고 보니까 쌤 늙은 것만 보인다. 어린이회 맡아 줘서 고맙다.', '이제 네 사진첩도 남의 애들 사진으로 꽉 찼지? 그거 못 지운다. 쌤이 해 봐서 안다.']
    : g.flags.includes('uni:st_gansa')
      ? ['영민이 대신 학생회 맡아 줬다며. 걔 울면서 나한테 전화했다. 고맙다고. 세 번 끊겼다.', '학생회 간사 하느라 고생했다. 근데 너 먼저 졸업하냐? 배신이다.']
      : g.flags.includes('uni_president')
        ? ['회장님, 1학년 때 피구 하다 울던 그 꼬마 맞습니까? 증거 사진 있습니다.']
        : attendRate(g) >= 0.95
          ? ['16년 개근. 쌤은 회사도 이렇게 못 다닌다. 존경한다, 진짜로.']
          : [
              '16년 치 사진, USB에 다 담아 놨다. 결혼식 때 튼다. 이번엔 진짜로.',
              '1학년 꼬마가 나보다 먼저 대학 졸업하는 거 실화냐. 사진으로 증거 남긴다.',
              '처음 왔을 때 키가 쌤 허리였는데. 이제 쌤이 올려다본다. 기분 이상하다.',
            ];
  let h = 7;
  for (const c of g.name + Object.values(g.friends).join('')) h = (h * 47 + c.charCodeAt(0)) >>> 0;
  return lines[h % lines.length];
}

type Person = { key: string; sprite: string; pose: Pose; x: number; back?: boolean; flip?: boolean; edge?: boolean };

/** 졸업 날이라 친구 중 한 명은 결국 운다. 누가 울지는 판마다 다르다 (한 판 안에서는 같다). */
function crier(g: GameState): string {
  let h = 3;
  for (const c of Object.values(g.friends).join('') + g.name) h = (h * 33 + c.charCodeAt(0)) >>> 0;
  return ['haram', 'jiho', 'seoyun'][h % 3];
}

/** 학생회 졸업사진 아래 영민 쌤의 한마디: 착하고 열심인데 수줍고 말끝이 흐려진다 */
function youngminNote(g: GameState): string {
  const r = (k: string) => g.records[k] ?? 0;
  const lines: string[] = g.flags.includes('st_president')
    ? ['회장 하느라… 고생 많았어. 사실 쌤이 제일 많이 의지했어… 진짜로.']
    : r('pungmul_success') >= 2
      ? ['네 장단 들으면… 쌤도 모르게 어깨가 들썩였어.']
      : r('reels_hit') > 0
        ? ['네가 찍은 릴스… 쌤 휴대폰 배경화면이야… 말하지 말까 했는데…']
        : r('volunteer') >= 2
          ? ['동생들이 너만 찾더라… 쌤은 그게 제일 부러웠어.']
          : r('templestay') + r('meditation') >= 3
            ? ['새벽 예불 때 너 한 번도 안 졸았지… 쌤은 졸았어…']
            : attendRate(g) >= 0.95
              ? ['12년 동안… 거의 한 번도 안 빠졌더라. 쌤이 세어 봤어…']
              : ['사진… 흔들렸으면 미안해… 손이 떨려서…', '대학생회에서 보자… 아, 꼭 안 와도 되는데… 와 주면 좋겠어…'];
  let h = 9;
  for (const c of g.name + Object.values(g.friends).join('')) h = (h * 43 + c.charCodeAt(0)) >>> 0;
  return lines[h % lines.length];
}

function cast(g: GameState, shot: boolean, holding: boolean): Person[] {
  const st = stageOf(g.grade);
  const smile: Pose = shot ? 'happy' : 'idle';
  const cries = crier(g);
  const friend = (key: string): Pose => (shot && key === cries ? 'cry' : smile);
  // 대학생회 졸업: 선생님 자리엔 영민 쌤(학생회 때 그림, 운다), 뛰어드는 건 여전히 지솔 쌤
  const uni = st === 'university';
  return [
    uni
      ? { key: 'teacher', sprite: 'student/gansa', pose: shot ? 'cry' : 'idle', x: 23, back: true }
      : { key: 'teacher', sprite: `${st}/teacher`, pose: smile, x: 23, back: true },
    { key: 'monk', sprite: SPRITES[`${st}/monk`] ? `${st}/monk` : 'student/monk', pose: shot ? 'hapjang' : 'idle', x: 80, back: true, flip: true },
    { key: 'haram', sprite: `${st}/friend-c`, pose: friend('haram'), x: 12 },
    { key: 'jiho', sprite: `${st}/friend-a`, pose: friend('jiho'), x: 32 },
    { key: 'hero', sprite: `${st}/${g.gender === 'male' ? 'hero-m' : 'hero-f'}`, pose: holding ? 'idle' : smile, x: 50 },
    { key: 'seoyun', sprite: `${st}/friend-b`, pose: friend('seoyun'), x: 67, flip: true },
    // 타이머 맞추고 뛰어든 지솔 쌤: 찍힐 때는 가장자리에 반쯤, 결국 울고 있다
    { key: 'gansa', sprite: uni ? 'kid/gansa' : `${st}/gansa`, pose: shot ? 'cry' : 'run', x: 95, flip: true, edge: true },
  ];
}

const FRONT_H = 42;
const REF_H = SPRITES['kid/hero-f']?.h ?? 213;

function Figure({ p, prop, still }: { p: Person; prop?: { prop: string; size: number }; still: boolean }) {
  const base = SPRITES[p.sprite];
  if (!base) return null;
  const h = (base.h / REF_H) * FRONT_H * (p.back ? 0.92 : 1) * (p.key === 'monk' ? 1.12 : 1);
  // 울기는 한 칸짜리 감정 그림을 쓴다
  const { sprite, frame } = frameFor(p.sprite, p.pose);
  const meta = SPRITES[sprite];
  const step = 100 / (meta.frames - 1);
  const box = {
    left: `${p.x}%`,
    bottom: p.back ? '19%' : '2%',
    height: `${h}%`,
    aspectRatio: `${meta.w} / ${meta.h}`,
    zIndex: p.back ? 1 : 2,
  } as CSSProperties;
  const body = {
    backgroundImage: `url(${BASE}art/sprites/${sprite}.webp)`,
    backgroundSize: `${meta.frames * 100}% 100%`,
    backgroundPositionX: `${meta.frames > 1 ? frame * step : 0}%`,
    '--f0': '0%',
    '--f1': `${step}%`,
  } as CSSProperties;
  return (
    <div className={`actor pose-${still ? 'still' : p.pose}${p.edge ? ' runs-in' : ''}`} style={box}>
      {!still && <span className="shadow" />}
      <span className={p.flip ? 'body flip' : 'body'} style={body} />
      {prop && (
        <img
          className="held-prop"
          src={`${BASE}art/props/${prop.prop}.webp`}
          alt=""
          style={{ height: `${prop.size * 100}%` }}
        />
      )}
    </div>
  );
}

/**
 * 어린이회 졸업사진. 지솔 쌤이 타이머를 맞추고 뛰어 들어오면 찰칵, 밝은 사진 한 장이 남는다.
 * 다들 웃지만 지솔 쌤과 친구 한 명은 운다(관계는 후일담에서). 누르면 바로 찍힌다.
 */
export function GradPhoto({ game }: { game: GameState }) {
  const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [phase, setPhase] = useState<'ready' | 'flash' | 'photo'>(reduce ? 'photo' : 'ready');
  useEffect(() => {
    if (phase === 'photo') return;
    const t = setTimeout(() => setPhase(phase === 'ready' ? 'flash' : 'photo'), phase === 'ready' ? 3200 : 180);
    return () => clearTimeout(t);
  }, [phase]);

  const shot = phase !== 'ready';
  const kid = game.grade <= 6;
  const uni = game.grade > 12;
  // 학생회 졸업에서는 학생회장이었거나 목탁을 잘 쳤으면 목탁을 든다
  const prop = kid
    ? PROPS.find((p) => p.when(game))
    : game.flags.includes('st_president') || (game.records.moktak_good ?? 0) >= 2
      ? PROPS[0]
      : undefined;
  const people = cast(game, shot, shot && !!prop);
  const names = ['haram', 'jiho', 'seoyun'].map((k) => personName(k as 'jiho', game)).join(', ');

  return (
    <figure className={`grad-photo is-${phase}`} onClick={() => phase === 'ready' && setPhase('flash')}>
      <div className="photo-frame">
        <div className="photo">
          <img className="photo-bg" src={`${BASE}art/bg/courtyard.webp`} alt="" draggable={false} />
          {people.map((p) => (
            <Figure key={p.key} p={p} prop={p.key === 'hero' && shot ? prop : undefined} still={shot} />
          ))}
          {phase === 'ready' && <p className="countdown" aria-live="polite">셋, 둘, 하나…</p>}
          <span className="flash" />
        </div>
        <figcaption>
          {shot ? (
            <>
              <b>{kid ? '6학년 2월, 화계사 어린이회 졸업' : uni ? '대4 2월, 화계사 대학생회 졸업' : '고3 2월, 화계사 학생회 졸업'}</b>
              <span>
                찍은 사람: {kid ? '지솔 쌤' : uni ? seniorName('gansa', game.gender) : '영민 쌤'} · “{kid ? jisolNote(game) : uni ? uniNote(game) : youngminNote(game)}”
              </span>
            </>
          ) : (
            <span>
              {kid
                ? '지솔 쌤이 “다들 모여! 사진 찍자!” 하더니 타이머를 맞추고 뛰어와요.'
                : uni
                  ? `${seniorName('gansa', game.gender)}가 “아직 졸업 못 한 내가 너 졸업사진을 찍다니! 다들 모여!” 하더니, 1학년 때 그 삼각대를 펴고 타이머를 맞추고 뛰어와요. ${seniorName('teacher', game.gender)}${game.gender === 'male' ? '은' : '는'} 벌써 울고 있어요.`
                  : '영민 쌤이 “저, 저기… 다들 모여 주세요…!” 하더니 타이머를 맞추다 삼각대를 넘어뜨리고, 다시 세우고, 뛰어와요.'}
            </span>
          )}
        </figcaption>
      </div>
      <p className="sr-only">
        졸업사진: {game.name}, {names}, {kid ? '정 선생님, 스님, 지솔 쌤' : uni ? `${seniorName('teacher', game.gender)}, 스님, ${seniorName('gansa', game.gender)}` : '윤 선생님, 스님, 영민 쌤'}
      </p>
    </figure>
  );
}
