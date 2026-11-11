import { useState } from 'react';
import { computeEnding, openStats, attendRate } from '../game/engine';
import { CHAPTERS } from '../game/calendar';
import { STAT_KEYS, STAT_LABEL, type GameState, type Gender, type Stage, type StatKey } from '../game/types';
import { useGame } from '../store';
import { StatHex } from './StatHex';
import { Arrow, AttendStamp, BrushLine } from './Ink';
import { GradPhoto } from './GradPhoto';
import { addEnding, EndingBook, loadEndings } from './EndingBook';
import { ENDINGS } from '../game/engine';

export function StartScreen() {
  const { start } = useGame();
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('female');
  const [book, setBook] = useState(false);
  const [from, setFrom] = useState<Stage>('kid');
  return (
    <main className="desk start">
      <div className="sheet">
        <h1>화계사 이야기</h1>
        <p className="lead">
          초등학교 1학년, 처음 어린이법회에 왔어요.
          <br />
          일요일마다 무엇을 고르느냐에 따라 다른 어른이 돼요. 한 판은 5분쯤.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            start(name, gender, from);
          }}
        >
          <div className="field">
            <label htmlFor="name">이름</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 적어 주세요"
              maxLength={8}
              autoComplete="off"
            />
          </div>
          <fieldset className="field">
            <legend>나는</legend>
            <div className="choose-one">
              {(
                [
                  ['female', '여자아이'],
                  ['male', '남자아이'],
                ] as [Gender, string][]
              ).map(([g, label]) => (
                <label key={g} htmlFor={`gender-${g}`}>
                  <input type="radio" name="gender" id={`gender-${g}`} value={g} checked={gender === g} onChange={() => setGender(g)} />
                  <span className="mark" aria-hidden="true" />
                  <span className="txt">{label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="field">
            <legend>어디서부터</legend>
            <div className="choose-one wrap">
              {(
                [
                  ['kid', '어린이회 (처음부터)'],
                  ['student', '학생회부터'],
                  ['university', '대학생회부터'],
                ] as [Stage, string][]
              ).map(([v, label]) => (
                <label key={v} htmlFor={`from-${v}`}>
                  <input type="radio" name="from" id={`from-${v}`} value={v} checked={from === v} onChange={() => setFrom(v)} />
                  <span className="mark" aria-hidden="true" />
                  <span className="txt">{label}</span>
                </label>
              ))}
            </div>
            {from !== 'kid' && (
              <p className="from-note">앞의 회는 알아서 지나가요. 건너뛴 판이라 엔딩 도감에는 안 들어가요.</p>
            )}
          </fieldset>
          <button className="seal-btn" type="submit">
            법회에 가기 <Arrow />
          </button>
        </form>
        <p className="save-note">진행 상황은 이 브라우저에 자동으로 저장돼요.</p>
        <button className="textlink title-book-open" type="button" onClick={() => setBook((v) => !v)} aria-expanded={book}>
          엔딩 도감 {loadEndings().filter((id) => ENDINGS.some((e) => e.id === id)).length} / {ENDINGS.length}
        </button>
        {book && <EndingBook owned={loadEndings()} />}
      </div>
    </main>
  );
}

function StatLine({ change }: { change: Partial<Record<StatKey, number>> }) {
  const keys = STAT_KEYS.filter((k) => change[k]);
  if (!keys.length) return <p className="statline">스탯은 그대로예요.</p>;
  return (
    <p className="statline">
      <span className="deltas tabular">
        {keys.map((k) => {
          const v = change[k] ?? 0;
          return (
            <span key={k} className={v > 0 ? 'd up' : 'd down'}>
              {STAT_LABEL[k]} {v > 0 ? `+${v}` : `−${Math.abs(v)}`}
            </span>
          );
        })}
      </span>
    </p>
  );
}

/** 한 해를 마치는 장: 출석 도장과 그해의 일기 */
export function YearEnd({ game }: { game: GameState }) {
  const { nextYear } = useGame();
  const r = game.yearReport;
  if (!r) return null;
  const tilts = [-6, 4, -2, 7, -4, 3, -7, 5];
  return (
    <section className="page year ink-in" aria-live="polite">
      <h2>{CHAPTERS[r.chapter].title} 시절을 마치며</h2>
      <BrushLine width={150} />
      <ol className="stamps" aria-label={`일요일 법회 ${r.total}번 중 ${r.went}번 출석`}>
        {Array.from({ length: r.total }, (_, i) => (
          <li key={i}>
            <AttendStamp went={i < r.went} tilt={tilts[i % tilts.length]} />
          </li>
        ))}
      </ol>
      <p className="stamp-caption tabular">
        일요일 법회 {r.total}번 중 {r.went}번 나갔어요.
      </p>
      {r.highlights.length > 0 && (
        <ul className="diary">
          {r.highlights.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      )}
      <StatLine change={r.statChange} />
      <button className="next" onClick={nextYear} autoFocus>
        {CHAPTERS[r.chapter + 1]?.title} 이야기로 <Arrow />
      </button>
    </section>
  );
}

const TEMPER = { active: '활발한 아이', calm: '차분한 아이' };
const TALENT = { music: '음악', sports: '운동', craft: '손재주' };

/**
 * 졸업. 어린이회·학생회 졸업은 사진 한 장과 한 줄로 짧게 넘어가고,
 * 대학교 졸업에서 "10년 뒤 나는…" 엔딩이 나온다.
 */
export function Graduated({ game }: { game: GameState }) {
  const { reset, toStudent, toUniversity } = useGame();
  const stage = CHAPTERS[game.chapter].stage;
  const last = stage === 'university';
  return (
    <main className="desk">
      <article className="sheet">
        <div className="page diploma ink-in">
          <GradPhoto game={game} />
          {last ? (
            <EndingView game={game} onReset={reset} />
          ) : (
            <>
              <h1>{stage === 'kid' ? '어린이회 졸업' : '학생회 졸업'}</h1>
              <ul className="diary">
                {(game.yearReport?.highlights ?? []).slice(0, 3).map((h) => (
                  <li key={h}>{h}</li>
                ))}
                <li>
                  {stage === 'kid'
                    ? '다음 주부터는 학생회예요. 친구들도, 스님도 그대로예요.'
                    : '봄부터는 대학생회예요. 간사 쌤도 지도 선생님도 없이, 이제 우리가 직접 꾸려요.'}
                </li>
              </ul>
              <div className="coda">
                <button className="seal-btn" onClick={stage === 'kid' ? toStudent : toUniversity} autoFocus>
                  {stage === 'kid' ? '학생회로' : '대학생회로'} <Arrow />
                </button>
              </div>
            </>
          )}
        </div>
      </article>
    </main>
  );
}

/** 마지막 엔딩: 10년 뒤 나는 어떤 어른이 되었나 */
function EndingView({ game, onReset }: { game: GameState; onReset: () => void }) {
  const result = computeEnding(game);
  const ending = result.ending;
  // 학생회·대학생회부터 시작한 판(앞을 건너뛴 판)은 도감에 넣지 않는다
  const skipped = game.flags.includes('skipped');
  const [fresh] = useState(() => (skipped ? false : addEnding(ending.id)));
  const [book, setBook] = useState(false);
  const owned = loadEndings();
  const no = ENDINGS.findIndex((e) => e.id === ending.id) + 1;
  return (
    <>
      <section className="ending-card" aria-labelledby="ending-title">
        <p className="kicker">
          10년 뒤 · 엔딩 <span className="tabular">{String(no).padStart(2, '0')}</span>
          {fresh && <span className="ending-new">새 엔딩</span>}
        </p>
        <h1 id="ending-title">{ending.title}</h1>
        <p className="ending-text">{fillEnding(ending.text, game)}</p>
      </section>

      <div className="diploma-grid">
        <div>
          <h3 className="sub-h">그리고</h3>
          <ul className="diary">
            {result.cards.slice(0, 3).map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
        <div>
          <StatHex stats={game.stats} keys={openStats(game.grade)} size={220} />
          <dl className="traits">
            <dt>기질</dt>
            <dd>{TEMPER[game.traits.temper]}</dd>
            <dt>재능</dt>
            <dd>{TALENT[game.traits.talent]}</dd>
            <dt>늦게 피는 신앙</dt>
            <dd>{game.traits.lateFaith ? '있음' : '없음'}</dd>
            <dt>법회 출석</dt>
            <dd className="tabular">{Math.round(attendRate(game) * 100)}%</dd>
          </dl>
        </div>
      </div>

      <div className="coda">
        <button className="seal-btn" onClick={onReset} autoFocus>
          다른 어른으로 살아 보기 <Arrow />
        </button>
        <button className="textlink" onClick={() => setBook((v) => !v)} aria-expanded={book}>
          엔딩 도감 {owned.filter((id) => ENDINGS.some((e) => e.id === id)).length} / {ENDINGS.length}
        </button>
        {skipped && <p className="from-note">앞을 건너뛴 판이라 이 엔딩은 도감에 안 들어가요.</p>}
      </div>
      {book && <EndingBook owned={owned} current={ending.id} />}
    </>
  );
}

/** 엔딩 글 속 '지솔 언니(누나)' 같은 말을 이 판에 맞게 */
function fillEnding(text: string, game: GameState) {
  const female = game.gender !== 'male';
  return text.replaceAll('언니(누나)', female ? '언니' : '누나');
}
