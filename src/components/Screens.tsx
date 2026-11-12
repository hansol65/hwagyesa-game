import { useCallback, useEffect, useState } from "react";
import { computeEnding, openStats, attendRate } from "../game/engine";
import { CHAPTERS } from "../game/calendar";
import {
  STAT_KEYS,
  STAT_LABEL,
  type GameState,
  type Gender,
  type StatKey,
} from "../game/types";
import { useGame } from "../store";
import { StatHex } from "./StatHex";
import { Arrow, AttendStamp, BrushLine } from "./Ink";
import { GradPhoto } from "./GradPhoto";
import { Flashback } from "./Flashback";
import { addEnding, EndingBook, endingArt, loadEndings } from "./EndingBook";
import { ENDINGS } from "../game/engine";
import { withEunNeun } from "../game/names";

export function StartScreen() {
  const { start } = useGame();
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender>("female");
  const [book, setBook] = useState(false);
  return (
    <main className="desk start">
      <div className="sheet">
        <h1>화계사 이야기</h1>
        <p className="lead">
          초등학교 1학년, 처음 어린이법회에 왔어요.
          <br />
          일요일마다 무엇을 고르느냐에 따라 다른 어른이 돼요.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            start(name.trim(), gender);
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
              required
            />
          </div>
          <fieldset className="field">
            <legend>나는</legend>
            <div className="choose-one">
              {(
                [
                  ["male", "남자"],
                  ["female", "여자"],
                ] as [Gender, string][]
              ).map(([g, label]) => (
                <label key={g} htmlFor={`gender-${g}`}>
                  <input
                    type="radio"
                    name="gender"
                    id={`gender-${g}`}
                    value={g}
                    checked={gender === g}
                    onChange={() => setGender(g)}
                  />
                  <span className="mark" aria-hidden="true" />
                  <span className="txt">{label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <button className="seal-btn" type="submit" disabled={!name.trim()}>
            법회에 가기 <Arrow />
          </button>
        </form>
        <p className="save-note">
          진행 상황은 이 브라우저에 자동으로 저장돼요.
        </p>
        <button
          className="textlink title-book-open"
          type="button"
          onClick={() => setBook((v) => !v)}
          aria-expanded={book}
        >
          엔딩 도감{" "}
          {
            loadEndings().filter((id) => ENDINGS.some((e) => e.id === id))
              .length
          }{" "}
          / {ENDINGS.length}
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
            <span key={k} className={v > 0 ? "d up" : "d down"}>
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
      <ol
        className="stamps"
        aria-label={`일요일 법회 ${r.total}번 중 ${r.went}번 출석`}
      >
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

const TEMPER = { active: "활발한 아이", calm: "차분한 아이" };
const TALENT = { music: "음악", sports: "운동", craft: "손재주" };

/**
 * 졸업. 어린이회·학생회 졸업은 사진 한 장과 한 줄로 짧게 넘어가고,
 * 대학교 졸업은 사진 → "10년 뒤" 버튼 → 주마등 → "10년 뒤 나는…" 엔딩.
 */
export function Graduated({ game }: { game: GameState }) {
  const { reset, toStudent, toUniversity } = useGame();
  const stage = CHAPTERS[game.chapter].stage;
  const last = stage === "university";
  // 엔딩을 이미 봤으면(새로고침) 바로 엔딩으로
  const [step, setStep] = useState<"photo" | "flash" | "ending">(() =>
    game.flags.some((f) => f.startsWith("ending:")) ? "ending" : "photo",
  );
  const toEnding = useCallback(() => setStep("ending"), []);
  useEffect(() => {
    if (step === "ending") window.scrollTo({ top: 0 });
  }, [step]);
  if (last && step === "ending") {
    return (
      <main className="desk">
        <article className="sheet">
          <div className="page diploma ending-in">
            <EndingView game={game} onReset={reset} />
          </div>
        </article>
      </main>
    );
  }
  return (
    <main className="desk">
      {step === "flash" && <Flashback game={game} onDone={toEnding} />}
      <article className="sheet">
        <div className="page diploma ink-in">
          <GradPhoto game={game} />
          {last ? (
            <>
              <h1>대학생회 졸업</h1>
              <ul className="diary">
                {(game.yearReport?.highlights ?? []).slice(0, 3).map((h) => (
                  <li key={h}>{h}</li>
                ))}
                <li>
                  {game.flags.includes("skipped")
                    ? "대학생회에서 보낸 일요일이 여기서 끝나요."
                    : "초등학교 1학년 때부터 다닌 일요일이 여기서 한 번 끝나요."}
                </li>
              </ul>
              <div className="coda">
                <button
                  className="seal-btn"
                  onClick={() => setStep("flash")}
                  autoFocus
                >
                  10년 뒤 <span aria-hidden="true">· · ·</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <h1>{stage === "kid" ? "어린이회 졸업" : "학생회 졸업"}</h1>
              <ul className="diary">
                {(game.yearReport?.highlights ?? []).slice(0, 3).map((h) => (
                  <li key={h}>{h}</li>
                ))}
                <li>
                  {stage === "kid"
                    ? "다음 주부터는 학생회예요. 친구들도, 스님도 그대로예요."
                    : "봄부터는 대학생회예요. 간사 쌤도 지도 선생님도 없이, 이제 우리가 직접 꾸려요."}
                </li>
              </ul>
              <div className="coda">
                <button
                  className="seal-btn"
                  onClick={stage === "kid" ? toStudent : toUniversity}
                  autoFocus
                >
                  {stage === "kid" ? "학생회로" : "대학생회로"} <Arrow />
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
function EndingView({
  game,
  onReset,
}: {
  game: GameState;
  onReset: () => void;
}) {
  // 도감에 없는 엔딩부터 나오게, 이 판을 넣기 전의 도감을 한 번만 읽어 둔다 (다시 그려도 엔딩이 안 바뀌게)
  const [result] = useState(() => computeEnding(game, loadEndings()));
  const ending = result.ending;
  // 학생회·대학생회부터 시작한 판(앞을 건너뛴 판)은 도감에 넣지 않는다
  const skipped = game.flags.includes("skipped");
  const [fresh] = useState(() =>
    skipped ? false : addEnding(ending.id, game.name),
  );
  const fixEnding = useGame((s) => s.fixEnding);
  useEffect(() => fixEnding(ending.id), [fixEnding, ending.id]);
  const [book, setBook] = useState(false);
  const owned = loadEndings();
  const no = ENDINGS.findIndex((e) => e.id === ending.id) + 1;
  return (
    <>
      <section className="ending-card" aria-labelledby="ending-title">
        <img
          className="ending-art"
          src={endingArt(ending.id)}
          alt=""
          width={960}
          height={640}
        />
        <p className="kicker">
          10년 뒤 · 엔딩{" "}
          <span className="tabular">{String(no).padStart(2, "0")}</span>
          {fresh && <span className="ending-new">새 엔딩</span>}
        </p>
        <h1 id="ending-title">
          {withEunNeun(game.name)} {ending.title}
        </h1>
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
            <dd>{game.traits.lateFaith ? "있음" : "없음"}</dd>
            <dt>법회 출석</dt>
            <dd className="tabular">{Math.round(attendRate(game) * 100)}%</dd>
          </dl>
        </div>
      </div>

      <div className="coda">
        <button className="seal-btn" onClick={onReset} autoFocus>
          다른 어른으로 살아 보기 <Arrow />
        </button>
        <button
          className="textlink"
          onClick={() => setBook((v) => !v)}
          aria-expanded={book}
        >
          엔딩 도감{" "}
          {owned.filter((id) => ENDINGS.some((e) => e.id === id)).length} /{" "}
          {ENDINGS.length}
        </button>
        {skipped && (
          <p className="from-note">
            앞을 건너뛴 판이라 이 엔딩은 도감에 안 들어가요.
          </p>
        )}
      </div>
      {book && <EndingBook owned={owned} current={ending.id} />}
    </>
  );
}

/** 엔딩 글 속 '지솔 언니(누나)' 같은 말을 이 판에 맞게 */
function fillEnding(text: string, game: GameState) {
  const female = game.gender !== "male";
  return text.replaceAll("언니(누나)", female ? "언니" : "누나");
}
