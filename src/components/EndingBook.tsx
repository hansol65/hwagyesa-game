import { ENDINGS, type Ending } from '../game/engine';

/**
 * 엔딩 도감. 판이 끝나도 남는다 (이 브라우저에만). 다 모으려면 여러 번, 다르게 살아 봐야 한다.
 * 못 본 엔딩은 이름 대신 ？？？와 힌트 한 줄.
 */
const KEY = 'hwagyesa-endings';

export function loadEndings(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** 이번 판 엔딩을 도감에 넣는다. 처음 본 엔딩이면 true */
export function addEnding(id: string): boolean {
  const had = loadEndings();
  if (had.includes(id)) return false;
  try {
    localStorage.setItem(KEY, JSON.stringify([...had, id]));
  } catch {
    /* 저장이 안 되는 환경이면 이번 판에서만 보인다 */
  }
  return true;
}

export function EndingBook({ owned, current }: { owned: string[]; current?: string }) {
  const n = ENDINGS.filter((e) => owned.includes(e.id)).length;
  return (
    <section className="ending-book" aria-label={`엔딩 도감 ${n}/${ENDINGS.length}`}>
      <h3>
        엔딩 도감 <span className="tabular">{n} / {ENDINGS.length}</span>
      </h3>
      <ol>
        {ENDINGS.map((e, i) => (
          <EndingTile key={e.id} e={e} no={i + 1} has={owned.includes(e.id)} now={e.id === current} />
        ))}
      </ol>
    </section>
  );
}

function EndingTile({ e, no, has, now }: { e: Ending; no: number; has: boolean; now: boolean }) {
  return (
    <li className={has ? (now ? 'has now' : 'has') : 'locked'}>
      <span className="no tabular">{String(no).padStart(2, '0')}</span>
      {has ? (
        <>
          <b>{e.name}</b>
          <small>{e.title}</small>
        </>
      ) : (
        <>
          <b aria-label="아직 못 본 엔딩">？？？</b>
          <small>{e.hint}</small>
        </>
      )}
    </li>
  );
}
