import type { Slot } from './types';

export const KIDS_LAST_GRADE = 6;

/** 연등을 거는 큰 행사 날 */
export const FESTIVE_KINDS = ['may', 'lantern', 'buddha', 'camp', 'newyear', 'graduation'];

/** 평범한 일요일이 오는 달. 학년마다 번갈아서 첫눈·추석·김장 같은 계절 장면도 돌아온다. */
const SUNDAY_MONTHS: Record<'odd' | 'even', [number, number, number]> = {
  odd: [4, 6, 10],
  even: [3, 9, 11],
};

/**
 * 5월 행사는 어린이회 6년 동안 세 번만: 1학년 첫 연등회, 4학년(연등회나 부처님오신날 중 하나),
 * 6학년 마지막 부처님오신날. 매년 나오면 지루해서 줄였다.
 */
const MAY_EVENTS: Record<number, Slot> = {
  1: { kind: 'lantern', month: 5, label: '5월 연등회' },
  4: { kind: 'may', month: 5, label: '5월 부처님오신날 주간' },
  6: { kind: 'buddha', month: 5, label: '부처님오신날' },
};

/** 1년 = 투표 + 일요일 3번 + (5월 행사) + 여름 캠프 + 제야. 6학년은 졸업식이 붙는다. */
export function slotsForGrade(grade: number): Slot[] {
  const [a, b, c] = SUNDAY_MONTHS[grade % 2 === 1 ? 'odd' : 'even'];
  const sunday = (m: number): Slot => ({ kind: 'sunday', month: m, label: `${m}월 일요일` });
  const slots: Slot[] = [
    grade === KIDS_LAST_GRADE
      ? { kind: 'president', month: 3, label: '3월 회장 선거' }
      : { kind: 'rep', month: 3, label: '3월 학년 대표 투표' },
    sunday(a),
    ...(MAY_EVENTS[grade] ? [MAY_EVENTS[grade]] : []),
    sunday(b),
    { kind: 'camp', month: 8, label: '8월 물놀이캠프' },
    sunday(c),
    { kind: 'newyear', month: 12, label: '12월 31일' },
  ];
  // 3월 일요일은 투표 다음, 9·10·11월 일요일은 캠프 다음으로 달 순서를 맞춘다
  slots.sort((x, y) => x.month - y.month || (x.kind === 'sunday' ? 1 : -1));
  if (grade === KIDS_LAST_GRADE) slots.push({ kind: 'graduation', month: 2, label: '졸업식' });
  return slots;
}

/** {season} 자리에 들어가는 계절 한 줄. 같은 장면도 달마다 다르게 느껴지게 한다. */
export const SEASON_LINES: Record<number, string[]> = {
  2: ['아직 바람이 차가워요.', '마당 구석에 녹다 만 눈이 남아 있어요.'],
  3: ['일주문 옆 개나리가 노랗게 피었어요.', '새 학년이 시작돼서 조금 들떠 있어요.', '삼각산에 아직 찬 바람이 불어요.'],
  4: ['절 마당에 벚꽃잎이 날려요.', '봄비가 그친 뒤라 흙냄새가 나요.', '새로 연등 줄이 걸리기 시작했어요.'],
  5: ['마당 가득 연등이 걸려 있어요.', '햇볕이 제법 따가워졌어요.'],
  6: ['매미가 울기 시작했어요.', '장마가 오려는지 하늘이 흐려요.', '계곡 물소리가 커졌어요.'],
  8: ['한낮 더위에 아스팔트가 이글거려요.', '방학이라 늦잠을 자고 싶어요.'],
  9: ['아침저녁으로 바람이 선선해졌어요.', '추석이 다가와요.', '하늘이 높고 파래요.'],
  10: ['삼각산이 단풍으로 붉게 물들었어요.', '은행잎이 길에 노랗게 깔렸어요.', '도토리를 줍는 다람쥐가 바빠요.'],
  11: ['입김이 하얗게 나와요.', '낙엽이 바스락거려요.', '첫눈이 올 것 같은 하늘이에요.'],
  12: ['대웅전 지붕에 눈이 소복이 쌓였어요.', '한 해가 다 갔어요.'],
};

export function gradeLabel(grade: number): string {
  return `초등학교 ${grade}학년`;
}
