# 화계사 이야기

화계사 어린이회에 처음 온 초등학교 1학년이 대학을 졸업할 때까지, 일요일마다 무엇을 고르는지에 따라 다른 어른이 되는 웹 게임입니다. 한 판은 5분쯤이고, 엔딩은 30개입니다.

개인이 만드는 비공식 팬 프로젝트입니다. 등장인물은 모두 가상입니다.

## 실행

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/
```

## 구조

```
src/
  game/          게임 규칙 (화면과 상관없는 순수 함수)
    engine.ts      한 판 진행, 선택 결과, 엔딩 고르기
    calendar.ts    다섯 장과 장마다 일정
    types.ts       상태와 데이터 타입
    names.ts       이름·호칭, 조사(은/는, 와/과)
    unlock.ts      엔딩 해금 조건을 글로
  data/          장면 글과 엔딩 (JSON)
    *.json         어린이회
    student/       학생회
    university/    대학생회
    endings.json   엔딩 30개와 조건
    epilogue.json  엔딩 아래 '그리고' 카드
  art/           장면마다 배경·인물 배치 (scenes.json)
  components/    화면 (React)
art-src/         그림 원본 → npm run art 로 public/art 에 게임용 파일
scripts/         개발용 도구
```

## 개발용 도구

| 명령 | 하는 일 |
|---|---|
| `npm run art` | `art-src/`의 원본 그림을 줄이고 잘라 `public/art/`에 넣는다 |
| `npm run sim` | 여러 방식으로 수천 판을 돌려 엔딩·스탯이 어떻게 나오는지 본다 |
| `npx tsx scripts/tune-endings.ts 5000 --write` | 엔딩이 고르게 나오도록 조건 숫자를 맞춰 `endings.json`에 쓴다 (회사원 약 25%, 출가 0.5%) |
| `node scripts/university-data.cjs` | 대학생회 장면 JSON을 다시 만든다 |
| `node scripts/side-choices.cjs` | 장면마다 덧붙는 '한 스탯 몰아주기 / 모 아니면 도' 선택지를 다시 만든다 |

그림 만드는 법은 [ART_GUIDE.md](ART_GUIDE.md)에 있습니다.

## 진행

- 다섯 장: 초등 저학년 → 초등 고학년 → 중학생 → 고등학생 → 대학생
- 대학생회 졸업 → "10년 뒤" → 지나온 장면 주마등 → 엔딩
- 엔딩 도감은 브라우저에 저장되고, 같은 엔딩에 도착한 이름이 쌓입니다
