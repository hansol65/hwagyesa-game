import { useState } from 'react';
import { computeEnding, OPEN_STATS, attendRate } from '../game/engine';
import { gradeLabel } from '../game/calendar';
import { STAT_KEYS, STAT_LABEL, type GameState, type Gender, type StatKey } from '../game/types';
import { useGame } from '../store';
import { StatHex } from './StatHex';
import { Arrow, AttendStamp, BrushLine } from './Ink';
import { GradPhoto } from './GradPhoto';

export function StartScreen() {
  const { start } = useGame();
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('female');
  return (
    <main className="desk start">
      <div className="sheet">
        <h1>화계사 이야기</h1>
        <p className="lead">
          초등학교 1학년, 처음 어린이법회에 왔어요.
          <br />
          일요일마다 무엇을 고르느냐에 따라 다른 아이로 자라요.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            start(name, gender);
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
          <button className="seal-btn" type="submit">
            법회에 가기 <Arrow />
          </button>
        </form>
        <p className="save-note">진행 상황은 이 브라우저에 자동으로 저장돼요.</p>
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
      <h2>{gradeLabel(r.grade)}을 마치며</h2>
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
        {r.grade + 1}학년 첫 일요일로 <Arrow />
      </button>
    </section>
  );
}

const TEMPER = { active: '활발한 아이', calm: '차분한 아이' };
const TALENT = { music: '음악', sports: '운동', craft: '손재주' };

/** 어린이회 졸업장 */
export function Graduated({ game }: { game: GameState }) {
  const { reset } = useGame();
  const ending = computeEnding(game);
  const tilts = [-3, 2, -1, 3, -2, 1];
  return (
    <main className="desk">
      <article className="sheet">
        <div className="page diploma ink-in">
          <GradPhoto game={game} />
          <h1>어린이회 졸업</h1>
          <p className="sub tabular">
            {game.name} · 일요일 법회 {game.attendance.total}번 중 {game.attendance.went}번 ({Math.round(attendRate(game) * 100)}%)
          </p>

          {ending.titles.length > 0 && (
            <ul className="seals" aria-label="받은 칭호">
              {ending.titles.map((t, i) => (
                <li key={t} className="seal" style={{ ['--tilt' as string]: `${tilts[i % tilts.length]}deg` }} aria-label={t}>
                  {t.replaceAll(' ', '')}
                </li>
              ))}
            </ul>
          )}

          <div className="diploma-grid">
            <ul className="diary">
              {ending.cards.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <div>
              <StatHex stats={game.stats} keys={OPEN_STATS} size={240} />
              <dl className="traits">
                <dt>기질</dt>
                <dd>{TEMPER[game.traits.temper]}</dd>
                <dt>재능</dt>
                <dd>{TALENT[game.traits.talent]}</dd>
                <dt>늦게 피는 신앙</dt>
                <dd>{game.traits.lateFaith ? '있음' : '없음'}</dd>
              </dl>
            </div>
          </div>

          <div className="coda">
            <button className="seal-btn" onClick={reset}>
              처음부터 다시
            </button>
            <p>학생회 편은 다음 단계에서 이어져요.</p>
          </div>
        </div>
      </article>
    </main>
  );
}
