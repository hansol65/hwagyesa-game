# 화계사 이야기 — 아트 가이드 (배경 + 스프라이트)

장면은 **배경 한 장 + 캐릭터 스프라이트 몇 개**를 게임 안에서 합쳐서 만든다.
그림은 ChatGPT로 만들고, 도트 변환 없이 그대로 쓴다.

- 배경은 사람 없이 장소만. 게임에서는 **어둡게 깔고**, 인물은 **선명하게** 위에 세운다.
- 캐릭터는 한 사람당 동작 6개를 한 장(스프라이트 시트)에 뽑는다.
- 서 있기 A·B 두 칸을 번갈아 보여 줘서 둠칫둠칫 움직인다.

## 파일 위치

```
art-src/                         원본 (여기에 넣는다)
  backgrounds/<이름>.png         배경
  sprites/<단계>/<인물>.png      kid · student · university
  props/props.png                소품 시트
  concept/<단계>.png             단계별 단체 기준 그림 (게임에는 안 씀)
```

`npm run art` 하면 게임용 파일이 만들어진다.

- 배경은 `public/art/bg/*.webp`로 용량만 줄인다.
- 스프라이트는 동작 6칸으로 잘라 `public/art/sprites/`에 띠 한 장으로 만들고, 칸 크기는 `src/art/sprites.json`에 적힌다.
- 소품은 하나씩 잘라 `public/art/props/`에 넣는다.

어느 장면에 어느 배경을 쓸지는 `src/art/scenes.json`에서 정한다.
등장인물은 장면 글에 이름이 나오는 사람을 자동으로 세운다.

## 화풍 기준

새 그림을 만들 때는 기존 그림을 기준으로 첨부한다.

- 배경: `art-src/backgrounds/courtyard.png`
- 인물: `art-src/concept/<단계>.png` (그 단계의 단체 그림)

화풍 규칙:

- 16비트 SNES 시대 도트, 평면 색, 어두운 1칸 윤곽선, 그림자는 한 단계
- 맑은 하늘, 소나무, 삼각산 바위 봉우리, 단청(초록·주황·빨강) 처마
- 인물은 머리가 큰 3~4등신, 검은 점 눈, 볼 터치
- 그라데이션, 글로우, 광택 금지. 그림 안에 글자, 간판, 현판 글씨 금지

## 1. 배경

### 규칙

- **3:2 가로** (1536×1024)
- **사람, 동물은 그리지 않는다.** 인물은 스프라이트로 올린다.
- **화면 아래쪽 1/3은 평평한 바닥**(마당, 길, 마루)으로 비워 둔다. 인물이 여기 선다.

### 배경 프롬프트 (공통)

```
[첨부: 1) 참고 사진  2) courtyard.png (화풍 기준)]

Redraw the place in photo 1 as a background in the exact pixel art style of image 2:
16-bit SNES-era pixel art, crisp visible pixels, flat colors, no gradients, no glow,
1-pixel dark outlines, one-step shading, light from top-left.
3:2 landscape, 1536x1024.
IMPORTANT: no people, no animals, no text or signs.
Keep the bottom third of the image as flat open ground where characters can stand.
Scene: [장소 설명]
```

### 지금 있는 배경

| 파일 | 장소 | 쓰이는 곳 |
|---|---|---|
| `home` | 아침 집 현관 | 일요일 아침 (갈까 말까) |
| `kids-room` | 어린이회 법회실 | 실내 프로그램, 법문, 투표, 졸업식 |
| `students-room` | 학생회 법회실 | 학생회 단계 실내 (아직 안 씀) |
| `courtyard` | 대웅전 앞마당 | 피구, 바자회, 청소, 물놀이캠프 |
| `bell-yard` | 범종각 쪽 마당 | 제야 타종(밤), 범종각, 고양이 |
| `seonwon` | 국제선원 | 국제선원 수행자 만나기 |
| `outdoor-buddha` | 야외 불상 | 산책, 캠프 등산 |
| `lantern-street` | 연등 거리 (밤) | 연등회 |
| `lantern-temple` | 연등 단 절 마당 (밤) | 부처님오신날 |

없어서 다른 배경으로 대신하는 곳: 공양간(→ 법회실), 법당 안(→ 법회실), 산꼭대기(→ 야외 불상), 물놀이 기구가 들어온 마당(→ 앞마당).
새로 만들면 `scenes.json`에서 바꿔 주면 된다.

## 2. 캐릭터 스프라이트

### 규칙

- **한 사람 = 한 장.** 동작 6개를 한 줄로, 간격을 띄워서 그린다. 손끝이 닿아도 자를 때 갈라 주지만, 띄우는 게 안전하다.
- **투명 배경** PNG
- 모든 동작의 **키와 크기가 같고**, 발끝 높이가 같다.
- 몸은 **오른쪽을 향해 비스듬히**(3/4 시점). 게임에서 주인공 말고 다른 사람은 좌우를 뒤집어 주인공을 보게 한다.

### 동작 6개 (순서 고정)

| 번호 | 동작 | 쓰임 |
|---|---|---|
| 1 | 서 있기 A | 기본 |
| 2 | 서 있기 B (몸이 아주 조금 낮음) | 1번과 번갈아 둠칫둠칫 |
| 3 | 걷기·뛰기 | 피구, 보물찾기, 산책 |
| 4 | 합장 | 예불, 법문, 명상, 목탁 |
| 5 | 기뻐하기 | 결과가 크게 좋을 때 (콩콩 뛴다) |
| 6 | 놀라기 | 결과가 나쁠 때, 혼남 (아주 크게 잃으면 울기) |

### 스프라이트 프롬프트 (공통)

```
[첨부: concept/<단계>.png (생김새 기준)]

Create a pixel art sprite sheet of ONE character from the attached image: [인물 설명].
Same pixel art style: 16-bit SNES-era, crisp visible pixels, flat colors,
1-pixel dark outlines, one-step shading, chibi 3-4 heads tall.

Draw the same character 6 times in one horizontal row, evenly spaced with clear gaps,
all the SAME size and height, feet aligned on the same baseline, body turned three-quarter to the right:
1) standing idle
2) standing idle with knees very slightly bent (body 1 pixel lower) for a bounce animation
3) walking / running
4) palms pressed together in front of the chest (Buddhist hapjang greeting)
5) happy, both arms raised, big smile
6) surprised, eyes wide, one hand near the mouth

Transparent background. No shadows, no ground, no text. 3:2 landscape, 1536x1024.
```

### 지금 있는 인물

| 파일 | 인물 | kid | student | university |
|---|---|---|---|---|
| `hero-f` | 주인공 여자아이 | ✓ | ✓ | ✓ |
| `hero-m` | 주인공 남자아이 | ✓ | ✓ | ✓ |
| `friend-a` | 장난꾸러기 친구 | ✓ | ✓ | ✓ |
| `friend-b` | 모범생 친구 | ✓ | ✓ | ✓ |
| `friend-c` | 조용한 친구 (안경) | ✓ | ✓ | ✓ |
| `gansa` | 간사 쌤 (어린이회 지솔 쌤 / 학생회 영민 쌤) | ✓ | ✓ | |
| `teacher` | 지도 선생님 (어린이회 정 선생님: 친근한 아저씨, 혼낼 땐 무서움 / 학생회 선생님) | ✓ | ✓ | |
| `monk` | 스님 | ✓ | ✓ | |

대학생회는 학생이 직접 꾸리니 간사·지도 선생님이 없다. 스님은 학생회 그림을 같이 쓴다.

### 감정 그림 (울기·화내기)

기본 시트와 따로 만든다. 한 장에 여러 사람이 있어도 되고, 한 사람이 울기·화내기 둘 다 있어도 된다.

1. 원본을 `art-src/emote-raw/`에 넣는다 (투명 배경).
2. `scripts/build-art.ts`의 `EMOTES` 표에 파일 이름과, 왼쪽부터 누구의 무슨 감정인지 적는다.
   예: `{ file: 'kids-cry.webp', stage: 'kid', out: ['hero-f-cry', 'hero-m-cry', ...] }`
3. `npm run art`. 각 그림을 그 사람의 서 있기와 키·발끝이 같게 맞춰 자른다.

지금 있는 것 (어린이회):

| 인물 | 울기 | 화내기 |
|---|---|---|
| 주인공 여자아이·남자아이 | ✓ | |
| 친구 셋 | ✓ | |
| 지솔 쌤 | ✓ | ✓ |
| 정 선생님 | | ✓ |

없는 그림은 울기 대신 놀라기, 화내기 대신 서 있기(부르르 떨기)로 나온다.
주인공이 울면 지솔 쌤과 정 선생님은 달래지 않고 **화내기**로 선다.
장면마다 특정 사람만 다른 동작을 시키려면 `scenes.json`에 `"castPose": { "haram": "cry" }`처럼 적는다.

```
[첨부: 그 인물의 기존 스프라이트 시트 (생김새와 크기 기준)]

Create pixel art of the SAME character as the attached sprite sheet,
same proportions, same outfit, same pixel art style, body turned three-quarter to the right:
[crying: tears streaming down, rubbing eyes, mouth open wailing]
[angry: eyebrows sharply down, frowning, hands on hips or pointing a finger]
Transparent background. No shadows, no ground, no text.
```

## 3. 소품

`props/props.png`에서 잘라 쓴다. 순서대로 연등, 피구공, 목탁, 오카리나, 단주, 빗자루, 물총.
아직 장면에는 안 올렸다.

## 고증 메모

- 물놀이캠프는 계곡이 아니라 **절 마당에 큰 물놀이 기구**가 들어오고, 학생회 형·누나들이 놀아 주고, 절에서 하룻밤 자고 등산한다.
- 부처님오신날 오카리나와 율동은 **모두가 둘 다** 한다.
- 6학년 회장이 예불 때 **목탁**을 친다.
