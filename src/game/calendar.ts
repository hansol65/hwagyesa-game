import type { Slot, Stage } from './types';

/**
 * 한 판은 다섯 장, 5분 안팎. 해마다 도는 일정 대신 시기마다 큰 장면만 남겼다.
 * 장면마다 학년(grade)이 붙어 있어서, 그 학년에 맞는 이야기가 나온다.
 * 'sunday'는 고른 프로그램이 바로 나오고, 'morning'은 "법회 갈까 말까" 갈림길이다.
 * event가 있으면 그 장면이 꼭 나온다.
 */
export interface Chapter {
  title: string;
  stage: Stage;
  /** 마지막 장면 뒤: 졸업 화면(다음 회로) 또는 장 마무리 */
  end: 'graduated' | 'chapterEnd';
  slots: Slot[];
}

const S = (grade: number, month: number, label: string, event?: string): Slot => ({ kind: 'sunday', grade, month, label, ...(event ? { event } : {}) });

export const CHAPTERS: Chapter[] = [
  {
    title: '초등 저학년',
    stage: 'kid',
    end: 'chapterEnd',
    slots: [
      S(1, 3, '처음 간 어린이법회'),
      { kind: 'lantern', grade: 1, month: 5, label: '5월 연등회' },
      S(2, 6, '2학년 일요일', 'dodgeball'),
      { kind: 'camp', grade: 2, month: 8, label: '8월 물놀이캠프' },
      S(3, 10, '3학년 일요일', 'story-cat'),
    ],
  },
  {
    title: '초등 고학년',
    stage: 'kid',
    end: 'graduated',
    slots: [
      S(4, 4, '4학년 일요일'),
      { kind: 'may', grade: 4, month: 5, label: '부처님오신날 주간' },
      S(5, 9, '5학년 일요일'),
      { kind: 'newyear', grade: 5, month: 12, label: '12월 31일' },
      { kind: 'president', grade: 6, month: 3, label: '6학년 회장 선거' },
      { kind: 'graduation', grade: 6, month: 2, label: '어린이회 졸업식' },
    ],
  },
  {
    title: '중학생',
    stage: 'student',
    end: 'chapterEnd',
    slots: [
      { kind: 'instrument', grade: 7, month: 3, label: '학생회 첫 일요일' },
      S(7, 4, '중1 일요일'),
      { kind: 'lantern', grade: 8, month: 5, label: '연등회 풍물' },
      { kind: 'vacation', grade: 8, month: 8, label: '방학 행사' },
      { kind: 'morning', grade: 9, month: 10, label: '중3 일요일 아침' },
    ],
  },
  {
    title: '고등학생',
    stage: 'student',
    end: 'graduated',
    slots: [
      S(10, 4, '고1 일요일'),
      { kind: 'buddha', grade: 10, month: 5, label: '부처님오신날' },
      { kind: 'president', grade: 11, month: 3, label: '학생회장 선거' },
      S(11, 9, '고2 일요일'),
      { kind: 'morning', grade: 12, month: 6, label: '고3 일요일 아침' },
      { kind: 'graduation', grade: 12, month: 2, label: '학생회 졸업식' },
    ],
  },
  {
    title: '대학생',
    stage: 'university',
    end: 'graduated',
    slots: [
      { kind: 'welcome', grade: 13, month: 3, label: '대학생회 첫 일요일' },
      S(13, 4, '대1 일요일'),
      { kind: 'offer', grade: 14, month: 3, label: '대2, 선배의 부탁' },
      S(14, 9, '대2 일요일'),
      { kind: 'lantern', grade: 15, month: 5, label: '연등회' },
      S(15, 10, '대3 일요일'),
      { kind: 'graduation', grade: 16, month: 2, label: '대학교 졸업' },
    ],
  },
];

/** 회별 첫 장 번호: 어린이회 0, 학생회 2, 대학생회 4 */
export const STAGE_FIRST_CHAPTER: Record<Stage, number> = { kid: 0, student: 2, university: 4 };
export const LAST_CHAPTER = CHAPTERS.length - 1;

/** 연등을 거는 큰 행사 날 */
export const FESTIVE_KINDS = ['may', 'lantern', 'buddha', 'camp', 'vacation', 'newyear', 'graduation'];

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
  if (grade <= 6) return `초등학교 ${grade}학년`;
  if (grade <= 9) return `중학교 ${grade - 6}학년`;
  if (grade <= 12) return `고등학교 ${grade - 9}학년`;
  return `대학교 ${grade - 12}학년`;
}

/** 짧은 학년: 초1, 중2, 고3, 대1 */
export function shortGrade(grade: number): string {
  if (grade <= 6) return `초${grade}`;
  if (grade <= 9) return `중${grade - 6}`;
  if (grade <= 12) return `고${grade - 9}`;
  return `대${grade - 12}`;
}
