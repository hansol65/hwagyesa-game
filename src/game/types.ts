// 게임 전체에서 쓰는 타입. 스토리 데이터(JSON)도 이 모양을 따른다.

export type StatKey = 'health' | 'intellect' | 'charm' | 'mental' | 'leadership' | 'faith';

export const STAT_KEYS: StatKey[] = ['health', 'intellect', 'charm', 'mental', 'leadership', 'faith'];

export const STAT_LABEL: Record<StatKey, string> = {
  health: '건강',
  intellect: '지능',
  charm: '매력',
  mental: '멘탈',
  leadership: '리더십',
  faith: '신앙',
};

/** 관계를 맺는 인물. 이름과 성격은 characters.json에서 온다. */
export type RelKey = 'jiho' | 'seoyun' | 'haram' | 'gansa' | 'teacher' | 'monk';

export type FriendKey = 'jiho' | 'seoyun' | 'haram';
export const FRIEND_KEYS: FriendKey[] = ['jiho', 'seoyun', 'haram'];

export const REL_KEYS: RelKey[] = ['jiho', 'seoyun', 'haram', 'gansa', 'teacher', 'monk'];

export type Temper = 'active' | 'calm';
export type Talent = 'music' | 'sports' | 'craft';

export interface Traits {
  temper: Temper;
  talent: Talent;
  /** 어릴 땐 신앙이 덜 오르고, 나중에 깊어지는 아이 */
  lateFaith: boolean;
}

export interface Effects {
  stats?: Partial<Record<StatKey, number>>;
  rel?: Partial<Record<RelKey, number>>;
}

export interface Outcome {
  text: string;
  effects?: Effects;
  /** 기록에 1을 더할 키 (칭호·후일담 조건에 쓰임) */
  record?: string;
  /** 기억 표시: 나중 장면이 이 표시를 보고 달라진다 */
  flag?: string;
  /** 한 해 요약에 남길 문장 */
  highlight?: string;
}

/** 확률로 갈리는 결과. 성향·재능·스탯이 확률을 올린다. */
export interface Roll {
  chance: number;
  talent?: Talent;
  temper?: Temper;
  stat?: StatKey;
  /** 스탯 1점당 확률 (기본 1/200). 선거처럼 스탯이 크게 가르는 일은 크게 둔다 */
  statWeight?: number;
  /** 두 번째 스탯 (같은 무게로 더한다). 예: 학생회장 선거는 리더십 + 매력 */
  stat2?: StatKey;
  /** 투표: 세 친구와의 정이 확률을 올린다 */
  friends?: boolean;
  /** 친구 정이 얼마나 반영되는지 (기본 1) */
  friendsWeight?: number;
  /** 기록 하나당 확률 가산 (예: 학년 대표 해 본 횟수) */
  recordBonus?: { key: string; per: number };
  success: Outcome;
  fail: Outcome;
}

export interface Choice {
  label: string;
  /** 결과 문장 (roll이 있으면 roll 쪽 문장을 쓴다) */
  text?: string;
  effects?: Effects;
  record?: string;
  /** 기억 표시: 나중 장면이 이 표시를 보고 달라진다 */
  flag?: string;
  highlight?: string;
  roll?: Roll;
  /** 'active' | 'calm' 태그가 붙으면 그 기질의 아이는 오르는 폭이 커진다 */
  tag?: Temper;
  /** 일요일 법회에 출석한 것으로 칠지 */
  attend?: boolean;
  /** 'program' 이면 이어서 그날 법회 프로그램이 나온다 */
  next?: 'program';
  /** 고르면 미니게임을 한다. 결과가 roll의 확률 대신 성공·실패를 정한다 ('알아서 하기'면 확률) */
  minigame?: MinigameKind;
}

export type MinigameKind = 'dodgeball' | 'dance' | 'pungmul' | 'moktak';

/** 이벤트가 나오거나 후일담이 열리는 조건 */
export interface Cond {
  /** 세 친구 중 가장 가까운 친구가 이 친구이고, 친밀도가 기준 이상 */
  bestFriend?: { key: RelKey; min: number };
  rel?: Partial<Record<RelKey, number>>;
  relBelow?: Partial<Record<RelKey, number>>;
  stats?: Partial<Record<StatKey, number>>;
  records?: Record<string, number>;
  attendRate?: number;
  attendRateBelow?: number;
  lateFaith?: boolean;
  gender?: Gender;
  /** 이 기억 표시가 모두 있어야 */
  flags?: string[];
  /** 이 기억 표시가 하나도 없어야 */
  notFlags?: string[];
  /** 이 스탯이 이 값보다 낮아야 */
  statsBelow?: Partial<Record<StatKey, number>>;
  /** 재능 */
  talent?: Talent;
  /** 이 중 하나라도 맞으면 (엔딩용) */
  any?: Cond[];
}

export interface GameEvent {
  id: string;
  title: string;
  /**
   * 여러 개면 무작위로 하나. 치환: {month} {grade} {name} {season}(계절 한 줄)
   * {senior}(동생들이 나를 부르는 말: 형·오빠 / 언니·누나)
   */
  text: string | string[];
  choices: Choice[];
  /** 상태 이벤트: 이 스탯이 낮을 때 나온다 */
  lowStat?: StatKey;
  minGrade?: number;
  maxGrade?: number;
  /** 이 달에만 나온다 */
  months?: number[];
  /** 이야기 이벤트: 조건이 맞을 때 한 번만 나온다 */
  requires?: Cond;
  /** 기억 표시가 맞으면 본문 뒤에 붙는 문장들 (몇 년 전 선택을 떠올리게 함) */
  addenda?: { flags: string[]; text: string; group?: string }[];
  /** 어느 회의 장면인지 (없으면 어린이회) */
  stage?: Stage;
}

/** 어린이회(초1~6) → 학생회(중1~고3) → 대학생회 */
export type Stage = 'kid' | 'student' | 'university';
export function stageOf(grade: number): Stage {
  return grade <= 6 ? 'kid' : grade <= 12 ? 'student' : 'university';
}

export type Gender = 'male' | 'female';

export type SlotKind =
  | 'sunday'
  | 'may'
  | 'lantern'
  | 'buddha'
  | 'camp'
  | 'newyear'
  | 'graduation'
  | 'rep'
  | 'president'
  /** 학생회 첫날: 풍물 악기 고르기 */
  | 'instrument'
  /** 학생회 방학 행사: 어린이회 캠프 봉사·템플스테이·스키캠프 중 하나 */
  | 'vacation'
  /** 대학생회 첫날: 새내기 */
  | 'welcome'
  /** 대학생회 2학년: 지솔 쌤·영민 쌤의 간사 제의 */
  | 'offer'
  /** 일요일 아침 갈림길: 법회에 갈까 말까 (가면 그날 프로그램이 이어진다) */
  | 'morning';

export interface Slot {
  kind: SlotKind;
  /** 이 장면의 학년 (1~16) */
  grade: number;
  month: number;
  label: string;
  /** 꼭 나오는 장면 id */
  event?: string;
}

export interface Deltas {
  stats: Partial<Record<StatKey, number>>;
  rel: Partial<Record<RelKey, number>>;
}

export interface LogEntry {
  grade: number;
  /** 장면 id와 일정 종류: 마지막 주마등에서 그때 배경을 다시 그린다 */
  id?: string;
  kind?: string;
  label: string;
  title: string;
  choice: string;
  text: string;
}

export type Phase = 'start' | 'play' | 'result' | 'yearEnd' | 'graduated';

export interface YearReport {
  /** 마친 장 번호 */
  chapter: number;
  grade: number;
  went: number;
  total: number;
  highlights: string[];
  statChange: Partial<Record<StatKey, number>>;
}

export interface GameState {
  phase: Phase;
  name: string;
  gender: Gender;
  /** 이번 판 친구 셋의 이름 (역할은 고정, 이름은 매판 무작위) */
  friends: Record<FriendKey, string>;
  /** 이미 본 이벤트 id (이야기 이벤트는 한 번만, 행사는 안 본 버전 먼저) */
  seen: string[];
  /** 선택이 남긴 기억 표시 */
  flags: string[];
  traits: Traits;
  stats: Record<StatKey, number>;
  rel: Record<RelKey, number>;
  /** 1~6 초등, 7~12 중고등, 13~16 대학교 (지금 장면의 학년) */
  grade: number;
  /** 몇 번째 장인지 (calendar.ts의 CHAPTERS) */
  chapter: number;
  slotIndex: number;
  event: GameEvent | null;
  eventText: string;
  result: { text: string; deltas: Deltas; choice: string } | null;
  /** 간다를 고른 일요일 아침: 같은 화면 위쪽에 남겨 둔다 */
  prelude: { id: string; title: string; text: string; choice: string } | null;
  /** 안 간다를 고르고 바로 넘어왔을 때, 다음 화면 맨 위에 남기는 한 줄 */
  lastNote: { label: string; choice: string; text: string; deltas: Deltas } | null;
  /** "법회에 간다"처럼 다음 장면으로 이어지는 선택의 변화량을 잠시 들고 있는 곳 */
  carry: Deltas | null;
  records: Record<string, number>;
  attendance: { yearWent: number; yearTotal: number; went: number; total: number };
  absentStreak: number;
  recentPrograms: string[];
  yearHighlights: string[];
  yearStartStats: Record<StatKey, number>;
  yearReport: YearReport | null;
  log: LogEntry[];
}
