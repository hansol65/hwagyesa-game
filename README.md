# 화계사 이야기 — 스토리 모드 1단계 (어린이회 편)

초등학교 1~6학년, 일요일마다 법회에 갈지 말지 고르며 자라는 텍스트 시뮬레이션입니다.
3D 화계사와 학생회·대학생회는 다음 단계에서 붙입니다.

## 실행

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # 타입 검사 + 빌드 (dist/)
npm run sim        # 무작위 2,000판 x 3가지 성향으로 밸런스 확인
```

## 구조

```
src/
  data/            스토리 데이터 (코드를 안 건드리고 이야기를 늘리는 곳)
    sunday.json      일요일 아침 장면 11가지 (비 오는 날, 생일파티, 할머니 …) + "오랜만에 왔네?" 복귀
    programs.json    출석했을 때 나오는 법회 프로그램 26가지 (학년·달 제한 가능)
    stories.json     조건이 맞을 때 한 번만 나오는 이야기 (지호와 다툼, 아기 고양이, 하람이 이사 …)
    status.json      스탯이 낮을 때 나오는 상태 이벤트 (건강, 멘탈 …)
    annual.json      큰 행사의 학년별 버전 (1학년 / 2~4학년 2종 / 5~6학년) + 졸업식
    epilogue.json    졸업 때 후일담 카드와 칭호, 그리고 나오는 조건
    characters.json  인물 이름과 성격 (임시)
  game/
    types.ts         데이터와 상태의 모양
    calendar.ts      1년 일정 (평범한 일요일 6번 + 큰 행사)
    engine.ts        규칙: 선택 처리, 확률, 체감 성장, 한 해 넘기기, 엔딩 판정 (순수 함수)
  store.ts         zustand 상태 + localStorage 자동 저장
  components/      화면 (장면 카드, 육각형 스탯, 한 해 요약, 졸업)
scripts/simulate.ts  밸런스 시뮬레이션
```

## 이벤트 하나 추가하기

`programs.json`에 항목을 하나 넣으면 바로 법회 프로그램으로 나옵니다.

```json
{
  "id": "my-event",
  "title": "제목",
  "text": ["본문 하나", "또는 무작위로 고를 본문 둘"],
  "choices": [
    { "label": "선택지", "text": "결과 문장", "effects": { "stats": { "faith": 2 }, "rel": { "jiho": 3 } } },
    {
      "label": "확률로 갈리는 선택지", "tag": "active",
      "roll": {
        "chance": 0.4, "talent": "sports", "stat": "health",
        "success": { "text": "성공!", "effects": { "stats": { "health": 3 } }, "record": "my_record", "highlight": "한 해 요약에 남을 문장" },
        "fail": { "text": "실패…", "effects": { "stats": { "mental": -1 } } }
      }
    }
  ]
}
```

- `tag`: `active`/`calm` 기질과 맞으면 오르는 폭 1.5배
- `roll.talent`, `roll.temper`, `roll.stat`: 맞으면 성공 확률이 오름
- `record`: 칭호·후일담 조건에 쓰는 기록
- `minGrade` / `maxGrade` / `months`: 이 학년·달에만 나옴
- `requires` (stories.json): 관계·스탯·기록 조건. 예: `{ "rel": { "jiho": 40 } }`
- 본문 치환: `{season}` 계절 한 줄, `{senior}` 형·오빠 / 언니·누나, `{name}`, `{nameCall}` (한솔아 / 지호야)
- 스탯은 60 근처로 갈수록 덜 오릅니다 (`engine.ts`의 `SOFT_CAP`)
- 최근 14개 장면은 다시 안 나옵니다 (`RECENT_WINDOW`)
