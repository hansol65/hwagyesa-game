# 화계사 이야기 — 아트 가이드

장면은 **배경 한 장 + 인물 스프라이트 몇 개**를 게임 안에서 겹쳐 만든다.
그림은 ChatGPT로 만들고, 도트 변환 없이 그대로 쓴다.

## 그림 넣는 법

```
art-src/
  backgrounds/<이름>.png         배경 (3:2, 1536×1024)
  sprites/<단계>/<인물>.png      kid · student · university 스프라이트 시트
  emote-raw/*.png|webp           울기·화내기 그림
  props/props.png                소품 시트
  endings/<엔딩 id>.png          엔딩 카드 그림 (3:2)
  concept/<단계>.png             단계별 단체 그림. 생김새 기준으로만 쓰고 게임에는 안 나온다
```

1. 원본을 위 자리에 넣는다.
2. `npm run art` → `public/art/`에 게임용 webp가 만들어진다.
3. 새 배경이면 `src/art/scenes.json`에서 장면이나 일정 종류(`defaults`)에 `"bg": "<이름>"`을 적는다.

## 화풍 (모든 그림 공통)

새 그림을 만들 때 기준 그림을 같이 첨부한다.

- 배경 기준: `art-src/backgrounds/courtyard.png`
- 인물 기준: `art-src/concept/<단계>.png`

규칙:

- 16비트 SNES 시대 도트, 평면 색, 어두운 1칸 윤곽선, 그림자는 한 단계, 빛은 왼쪽 위
- 인물은 3~4등신, 검은 점 눈, 볼 터치
- 그라데이션·글로우·광택 금지
- **그림 안에 글자 금지** (간판, 현판, 화면 속 글씨 모두)

## 1. 배경

### 규칙

- **3:2 가로** (1536×1024)
- **사람·동물은 그리지 않는다.** 인물은 스프라이트로 올린다.
- **아래쪽 1/3은 평평한 바닥**(마당, 길, 마루)으로 비워 둔다. 인물이 여기 선다.

### 공통 프롬프트

```
[첨부: 1) 참고 사진(있으면)  2) courtyard.png]

Draw a background in the exact pixel art style of image 2:
16-bit SNES-era pixel art, crisp visible pixels, flat colors, no gradients, no glow,
1-pixel dark outlines, one-step shading, light from top-left. 3:2 landscape, 1536x1024.
IMPORTANT: no people, no animals, no text, no signs, no writing.
Keep the bottom third as flat open floor or ground where characters can stand.
Scene: [아래 목록의 Scene 한 줄]
```

### 있는 배경

| 파일 | 장소 | 쓰는 곳 |
|---|---|---|
| `home` | 아침 집 현관 | 일요일 아침 (갈까 말까) |
| `kids-room` | 어린이회 법회실 | 어린이회 실내 프로그램, 투표, 졸업식 |
| `students-room` | 학생회·대학생회 법회실 | 학생회부터 실내 프로그램 |
| `courtyard` | 대웅전 앞마당 | 피구, 바자회, 악기 고르기, 간사 제의 |
| `bell-yard` | 범종각 쪽 마당 | 방학, 범종각, 고양이 |
| `seonwon` | 국제선원 | 선원 수행자 만나기 |
| `outdoor-buddha` | 야외 불상 | 산책, 등산 |
| `lantern-street` | 연등 거리 (밤) | 연등회 |
| `lantern-temple` | 연등 단 절 마당 | 부처님오신날, 제야 타종(밤) |
| `water-camp` | 물놀이 기구가 들어온 절 마당 | 물놀이캠프 |

### 만들면 좋은 배경 (많이 나오는 순서)

지금은 없어서 다른 배경으로 대신 나오는 곳들이다. 위에서부터 만들면 체감이 크다.

| 우선 | 파일 이름 | 글에 나오는 횟수 | 지금 대신 나오는 배경 | Scene (프롬프트에 붙일 한 줄) |
|---|---|---|---|---|
| 1 | `dharma-hall` | 법당 48 · 대웅전 4 | 법회실 | Inside a Korean Buddhist main dharma hall: golden Buddha statues on a raised altar at the back, red and green dancheong beams, hanging lotus lanterns, rows of square floor cushions on a polished wooden floor, a moktak and a small bell on a low table. |
| 2 | `kitchen` | 공양간 27 | 법회실 | A temple kitchen and dining hall (gongyangan): big steel rice pots and kettles, long low wooden tables with cushions, stacked steel bowls, a serving counter, a back door left ajar to the yard. |
| 3 | `cafe` | 카페 17 | 법회실 | A cozy small café near a temple in Seoul: wooden tables, big window with green hill and temple roofs outside, pendant lights, a long bench by the window. University students hang out here after Sunday meetings. |
| 4 | `pub` | 뒤풀이 5 · 노래방 6 | 법회실 | A casual Korean pub and restaurant for after-meeting dinners: long table with a portable grill, side dishes, small stools, warm evening light, a coat rack. Keep it friendly, no bottles with labels. |
| 5 | `templestay` | 템플스테이 9 · 외부 절 2 | 법회실 | A mountain temple in another region at dawn: small guest rooms with paper sliding doors, stone steps, mist over pine forests, a stone lantern. Different from Hwagyesa: higher in the mountains, quieter. |
| 6 | `ski` | 스키 8 | 범종각 마당 | A ski resort slope on a bright winter day: snowy beginner slope, a lift in the distance, snow fences, a flat snowy area at the bottom. |
| 7 | `union-hall` | 연합법회 3 | 학생회 법회실 | A large Buddhist auditorium for a joint gathering of university Buddhist clubs: stage with a small Buddha statue and flower offerings, rows of folding chairs, banners with no writing. |
| 8 | `bus` | 버스 7 | 학생회 법회실 | Inside a chartered bus on a field trip: two rows of seats, curtains, snacks on laps, mountain highway through the windows. Floor aisle left open. |

만들면 `scenes.json`에서 해당 장면(예: 공양간 장면 id)이나 `defaults`의 배경 이름만 바꾸면 된다.

## 2. 인물 스프라이트

### 규칙

- **한 사람 = 한 장.** 동작 6개를 한 줄로, 칸 사이를 띄워서.
- **투명 배경** PNG, 모든 동작의 키·크기·발끝 높이가 같다.
- 몸은 **오른쪽을 향해 비스듬히**(3/4 시점). 다른 사람은 게임에서 좌우를 뒤집어 주인공을 보게 한다.

동작 순서 (고정): ① 서 있기 A ② 서 있기 B(1px 낮게, 둠칫둠칫) ③ 걷기·뛰기 ④ 합장 ⑤ 기뻐하기 ⑥ 놀라기

```
[첨부: concept/<단계>.png]

Create a pixel art sprite sheet of ONE character from the attached image: [인물 설명].
Same style: 16-bit SNES-era, crisp visible pixels, flat colors, 1-pixel dark outlines,
one-step shading, chibi 3-4 heads tall.
Draw the same character 6 times in one horizontal row, evenly spaced with clear gaps,
all the SAME size, feet on the same baseline, body turned three-quarter to the right:
1) standing idle  2) idle with knees slightly bent (1px lower)  3) walking/running
4) palms pressed together at the chest (hapjang)  5) happy, both arms up  6) surprised
Transparent background. No shadows, no ground, no text. 1536x1024.
```

### 있는 인물

| 파일 | 인물 | kid | student | university |
|---|---|---|---|---|
| `hero-f` / `hero-m` | 주인공 | ✓ | ✓ | ✓ |
| `friend-a` | 장난꾸러기 친구 | ✓ | ✓ | ✓ |
| `friend-b` | 모범생 친구 | ✓ | ✓ | ✓ |
| `friend-c` | 조용한 친구 (안경) | ✓ | ✓ | ✓ |
| `gansa` | 간사 쌤 (어린이회 지솔 / 학생회 영민) | ✓ | ✓ | (대학생회에선 선배로 그대로 씀) |
| `teacher` | 지도 선생님 | ✓ | ✓ | |
| `monk` | 스님 | ✓ | ✓ | (학생회 그림 씀) |

### 감정 그림 (울기·화내기)

1. 원본을 `art-src/emote-raw/`에 넣는다 (한 장에 여러 사람 가능).
2. `scripts/build-art.ts`의 `EMOTES` 표에 파일 이름과 왼쪽부터 누구의 무슨 감정인지 적는다.
3. `npm run art` → 각자 서 있기 그림과 키·발끝을 맞춰 잘라 준다.

지금은 어린이회만 있다: 주인공·친구 셋 울기, 지솔 쌤 울기·화내기, 정 선생님 화내기.
없는 감정은 울기 → 놀라기, 화내기 → 서 있기(부르르)로 대신 나온다.

## 3. 소품

`props/props.png` 한 장에서 잘라 쓴다: 연등, 피구공, 목탁, 오카리나, 단주, 빗자루, 물총, 고양이 세 마리(`cats.webp`).

## 4. 엔딩 카드

30장 모두 있다 (`art-src/endings/<엔딩 id>.png`). 엔딩 id는 `src/data/endings.json`에 있다.

- 3:2, 주인공은 **뒷모습이나 어깨 너머로만** (판마다 성별이 달라서)
- 화계사 흔적 하나(연등, 공양간 고양이, 피구공, 오카리나, 목탁 …), 글자 없음
- 지솔은 포니테일 여자, 영민은 둥근 안경 남자

한 장만 바꾸려면 같은 이름으로 덮어쓰고 `npm run art`.

## 고증 메모

- 물놀이캠프는 계곡이 아니라 **절 마당에 큰 물놀이 기구**가 들어온다. 학생회가 놀아 주고, 절에서 자고 등산한다.
- 부처님오신날 오카리나와 율동은 **모두가 둘 다** 한다.
- 6학년 회장이 예불 때 **목탁**을 친다.
- 대학생회에는 부서가 없다. 명상, 밥·술·카페, 외부 절 탐방, 연합법회가 많다.
