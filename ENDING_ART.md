# 엔딩 카드 그림 30장 — GPT에 넘기는 법

엔딩은 지금 **30개**예요. 조건과 글은 `src/data/endings.json`에 있어요.

## 정한 것

- **3:2 가로** (1536×1024). 배경 그림과 같은 비율이에요. 엔딩 카드 위쪽에 크게 들어가요.
- **주인공 얼굴은 안 그려요.** 주인공은 판마다 여자·남자가 바뀌어서, 한 장으로 둘 다 쓰려면 이렇게 해요.
  - 주인공이 꼭 있어야 하면 **뒷모습이나 어깨 너머**로만 그려요.
  - 머리가 짧고 성별이 드러나지 않는 어른으로 그려요.
- **화계사 흔적을 하나씩** 넣어요. 연등, 공양간 고양이, 목탁, 피구공, 오카리나, 단주, 범종 같은 것들이에요. 글을 안 읽어도 "어릴 때 절에 다니던 사람"인 게 보이게요.
- **그림 안에 글자 금지.** 간판, 현판, 화면 속 글씨도 안 돼요. 게임에서 글을 따로 얹어요.

## 넘기는 순서

1. GPT 새 대화를 열고 **그림 두 장을 먼저 첨부**해요.
   - `art-src/backgrounds/courtyard.png` (화풍 기준)
   - `art-src/concept/university.png` (어른이 된 모습의 기준)
2. 아래 **공통 프롬프트**를 한 번 붙여 넣어요.
3. 그다음부터는 **한 장씩** 보내요. `01 monk: ...`처럼 아래 목록의 한 줄을 그대로 붙이면 돼요.
   - 한 번에 여러 장을 시키면 화풍이 흔들려요.
   - 열 장쯤마다 "아까 그 화풍 그대로"를 덧붙이면 안정적이에요.
4. 받은 그림은 `art-src/endings/<id>.png`로 저장해요. 예: `art-src/endings/monk.png`
   - 다 넣으면 알려 주세요. `npm run art`로 줄이고 엔딩 카드에 붙일게요.

## 공통 프롬프트 (처음에 한 번)

```
[첨부: 1) courtyard.png  2) university.png]

From now on I'll ask for ending illustrations for a small life-sim game about growing up
going to Hwagyesa temple in Seoul every Sunday (kids club → teen club → university club).
Each ending shows "who I became 10 years later".

Style for EVERY image: the exact pixel art style of image 1 — 16-bit SNES-era pixel art,
crisp visible pixels, flat colors, no gradients, no glow, 1-pixel dark outlines,
one-step shading, light from top-left. Characters like image 2: chibi 3-4 heads tall,
black dot eyes, blush.
3:2 landscape, 1536x1024. Warm, gentle, a little funny.

Rules for EVERY image:
- The main character (me, an adult now) is shown ONLY from behind or over the shoulder,
  short hair, gender-neutral. Never show their face. If the scene works without them, leave them out.
- Include one small memory of the temple: a lotus lantern, the orange temple cat,
  a moktak, a dodgeball, an ocarina, prayer beads, or the temple bell.
- IMPORTANT: no text, no letters, no signs, no writing on screens or paper.

Reply "ready" and wait for the first one.
```

## 한 장씩 보내는 목록

```
01 monk: A young Buddhist monk in gray robes seen from behind, kneeling in the temple hall in front of a row of small kids on cushions, holding a list of their names. One kid is waving. Morning light.
02 professor: A university lecture hall seen from the back of the room. The professor (me, from behind) at the podium, a sutra scroll on the desk, students laughing. A tiny dodgeball keychain hangs on the professor's bag.
03 marry: A traditional Korean wedding in front of the temple's main hall, seen from behind the couple in hanbok. An old monk officiates. In the crowd a young woman with a ponytail and a young man with glasses are both crying. Lotus lanterns overhead.
04 jongrip: A middle school classroom with a small Buddha statue on a shelf. Students meditating with eyes closed; one is dozing. The teacher (me, from behind) pretends not to see.
05 kid-teacher: The kids' dharma room on a Sunday. Kids running around the teacher (me, from behind), one kid hanging on my arm, a whistle around my neck, a thick photo album on the table.
06 st-teacher: The temple courtyard with a teen pungmul band (buk, janggu, kkwaenggwari, jing) practicing. The teacher (me, from behind) raises a fist to cheer them on, holding a phone in the other hand.
07 doctor: A cozy pediatric clinic room. A small lotus lantern hangs on the wall. A crying little kid with a bandaid is starting to smile; the doctor (me, from behind) is crouching to eye level.
08 vet: A small animal hospital waiting room. An orange temple cat with kittens sits on the counter. An old monk in gray robes stands at the door holding a bag of cat treats.
09 politician: A district office podium on election night with confetti and a bouquet. The new mayor (me, from behind) bows. In the front row a young woman with a ponytail is taking photos.
10 gukak: A lantern parade at night on a wide city street. The lead kkwaenggwari player (me, from behind) in a pungmul costume with ribbons, leading a band. Teens follow with drums.
11 athlete: A handball stadium with a cheering crowd. The athlete (me, from behind, in a national team uniform) holds a ball high. A little kid in the front row holds a dodgeball.
12 pianist: A concert hall stage with a grand piano and a single spotlight. The pianist (me, from behind) bows. An ocarina sits on top of the piano. In the dark audience one phone screen glows.
13 lantern-artisan: A workshop full of hanji paper lanterns. A huge cat-shaped lantern glows in the middle. Paper, glue and bamboo frames on the table. The artisan (me, from behind) paints the cat's whiskers.
14 meditation-app: A small startup office at dusk. A big monitor shows a calm bell icon (no text). Floor cushions instead of chairs. A small temple bell model sits on the desk.
15 youtuber: A tidy home studio with a camera, ring light and microphone. Behind the camera, a backdrop of lotus lanterns. On the monitor, a paused video of a monk playing dodgeball (no text).
16 photographer: A gallery wall of framed photos of kids at the temple: dodgeball, lanterns, water play. At the end of the wall, one old photo of a tiny first-grader crying. Two adults argue happily in front of it.
17 temple-chef: A warm temple-food restaurant kitchen. Neat bowls of namul, rice and soup. One pan of very red tteokbokki stands out. A lotus lantern hangs by the window.
18 counselor: A quiet counseling room with soft light. Two meditation cushions on the floor, a cup of tea, a small potted plant. The counselor (me, from behind) sits on one cushion, the other is waiting.
19 chongmuwon: An office in a traditional-style Buddhist administrative building. Desk with stacks of documents (no text) and a laptop. Through the window, temple roofs. An orange cat sits on the window ledge.
20 startup: A tiny café table turned into a startup meeting: three laptops, coffee cups, sticky notes (no text). Outside the window, the temple's one-pillar gate. Three people high-five, seen from behind.
21 firefighter: The temple courtyard full of lotus lanterns on Buddha's Birthday. A red fire truck parked by the gate. Kids crowd around the truck. The firefighter (me, from behind) lifts a kid to look inside.
22 police: A night lantern parade on a city street. A police officer (me, from behind) directs traffic with a glowing baton and a whistle. A row of kids in the parade waves.
23 gambler: The temple's stone steps at sunset. An adult (me, from behind) sits alone with a laptop bag and a crumpled business plan. An old monk walks by smiling. Hopeful, a little funny.
24 developer: A late-night office in a glass building, monitors glowing with code-like blocks (no readable text). A tiny lotus lantern stands next to the keyboard. A Sunday calendar page shows a circled day with a small lantern doodle.
25 convert: A small church on a Sunday morning, seen from the back pews. On the windowsill, someone has secretly placed one small lotus lantern. Gentle, warm, not mocking.
26 eternal-student: A university club room full of freshmen. In the corner, two old-timers: a young woman with a ponytail (from the side) and me (from behind), both clearly the oldest people in the room, laughing.
27 webtoon: An artist's desk with a drawing tablet. On the screen, a comic page of kids playing dodgeball at a temple (no text, no speech bubbles). A stack of sketchbooks and a lotus lantern.
28 cat-cafe: A cozy cat café full of orange, calico and tabby cats. An old monk sits at a table with a cat on his lap; the cat is yawning.
29 returned: The hill road up to Hwagyesa temple on a Sunday morning in autumn. An adult (me, from behind) walks up toward the gate. At the top, an older kitchen volunteer waves with both arms.
30 office: A small apartment bedroom at dawn. A phone alarm on the nightstand glowing (no text). Next to it, a small lotus lantern and a framed photo of kids at the temple. Sunday morning light.
```

## 확인할 것

- **여러 판 공통**: 지솔은 포니테일 여자, 영민은 안경 쓴 남자예요. 03, 09, 26처럼 둘이 나오는 장면은 그 모습이 맞는지 봐 주세요.
- **글자가 생겼으면** "remove all text" 한 줄로 다시 시키면 돼요.
- **얼굴이 보이면** "show the main character only from behind"로 다시요.
