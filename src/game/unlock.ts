// 엔딩 해금 조건을 글로. endings.json의 when을 그대로 읽어서 만드니, 숫자를 다시 맞춰도 글이 따라간다.
import { STAT_LABEL, type Cond, type RelKey, type StatKey, type Talent } from './types';

/** 친구 이름은 판마다 바뀌어서 성격으로 부른다 */
const REL: Record<RelKey, string> = {
  jiho: '장난꾸러기',
  seoyun: '모범생',
  haram: '조용한 아이',
  gansa: '지솔 쌤',
  teacher: '영민 쌤',
  monk: '스님',
};
const TALENT: Record<Talent, string> = { music: '음악', sports: '운동', craft: '손재주' };
const FLAG: Record<string, string> = {
  'uni:kid_gansa': '어린이회 간사',
  'uni:st_gansa': '학생회 간사',
  'uni:declined': '간사 제의 거절',
  kittens: '공양간 고양이 지키기',
  cat_cared: '공양간 고양이 지키기',
  president: '회장 선거 출마', st_president: '회장 선거 출마', vice: '회장 선거 출마', st_vice: '회장 선거 출마',
  president_lost: '회장 선거 출마', st_president_lost: '회장 선거 출마',
  'inst:kkwaenggwari': '풍물', 'inst:janggu': '풍물', 'inst:buk': '풍물', 'inst:jing': '풍물',
  chased_elephant: '코끼리 연등 쫓기',
  listened_seoyun: '친구 얘기 들어주기',
};
const RECORD: Record<string, string> = {
  pungmul_success: '풍물 무대 성공',
  moktak_good: '목탁 잘 치기',
  dodgeball_win: '피구 승리', ski_good: '스키', run: '달리기',
  lantern_events: '연등 만들기', lantern_craft: '연등 만들기', beads_made: '단주 만들기', paper_lotus: '연꽃 접기',
  lantern_dance: '무대 서기', dance_success: '무대 서기', ocarina_success: '오카리나', ocarina_practice: '오카리나', karaoke: '노래방',
  meditation: '명상', templestay: '템플스테이', bows: '절 수행', bows_108: '절 수행', new_year_bell: '제야의 종',
  listened: '법문 듣기', study: '공부 택하기', kg_teach: '아이들 가르치기', sg_teach: '아이들 가르치기',
  kg_play: '아이들 돌보기', kg_comfort: '우는 아이 달래기', sg_care: '후배 챙기기', helped_kid: '처지는 아이 돕기', kg_scold: '아이들 단속',
  reels_hit: '릴스 대박', uni_sns: 'SNS 관리', uni_mc: '사회 보기', water_fight: '물총 싸움',
  uni_drink: '뒤풀이', uni_cafe: '카페 모임', uni_union: '연합법회',
  kg_photo: '아이들 사진 찍기', volunteer: '봉사', temple_tour: '외부 절 탐방',
  booth_sold: '음식 팔기', bazaar_sold: '음식 팔기',
  brave: '무서운 얘기 담당',
  gamble_win: '모 아니면 도 성공',
  gamble_lose: '모 아니면 도 실패',
};

/** 조건 한 조각. stat은 숫자 조건, act는 이 판에서 해야 하는 일(재능·간사·기록 등) */
export type UnlockPart = { text: string; kind: 'stat' | 'act' };

/** 조건을 짧은 조각들로. any는 "A / B"로 한 조각에 묶는다 */
function parts(w: Cond): UnlockPart[] {
  const out: UnlockPart[] = [];
  const act = (text: string) => out.push({ text, kind: 'act' });
  const stat = (text: string) => out.push({ text, kind: 'stat' });
  if (w.gender) act(w.gender === 'female' ? '여' : '남');
  if (w.talent) act(`${TALENT[w.talent]} 재능`);
  for (const f of new Set((w.flags ?? []).map((f) => FLAG[f] ?? f))) act(f);
  for (const [k, v] of Object.entries(w.records ?? {})) act(`${RECORD[k] ?? k}${v > 1 ? ` ${v}번` : ''}`);
  for (const [k, v] of Object.entries(w.stats ?? {})) stat(`${STAT_LABEL[k as StatKey]} ${v}↑`);
  for (const [k, v] of Object.entries(w.statsBelow ?? {})) stat(`${STAT_LABEL[k as StatKey]} ${v}↓`);
  for (const [k, v] of Object.entries(w.rel ?? {})) stat(`${REL[k as RelKey]} 정 ${v}↑`);
  if (w.bestFriend) stat(`단짝 ${REL[w.bestFriend.key]} 정 ${w.bestFriend.min}↑`);
  if (w.attendRate !== undefined) stat(`출석 ${Math.round(w.attendRate * 100)}%↑`);
  if (w.attendRateBelow !== undefined) stat(`출석 ${Math.round(w.attendRateBelow * 100)}%↓`);
  if (w.any) {
    const alts = w.any.map((c) => parts(c).map((x) => x.text).join(' '));
    const allStat = w.any.every((c) => parts(c).every((x) => x.kind === 'stat'));
    out.push({ text: [...new Set(alts)].join(' / '), kind: allStat ? 'stat' : 'act' });
  }
  return out;
}

export function unlockParts(w: Cond): UnlockPart[] {
  const p = parts(w);
  return p.length ? p : [{ text: '다른 엔딩에 하나도 안 맞으면', kind: 'act' }];
}

