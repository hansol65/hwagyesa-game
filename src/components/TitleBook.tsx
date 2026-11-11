import epilogue from '../data/epilogue.json';

/**
 * 칭호 모음. 판이 끝나도 남는다 (이 브라우저에만). 다 모으려면 여러 번 해야 한다.
 */
const KEY = 'hwagyesa-titles';
export const ALL_TITLES = (epilogue.titles as { id: string; name: string }[]).map((t) => t.name);

export function loadTitles(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** 이번 판 칭호를 모음에 더하고, 처음 얻은 것만 돌려준다 */
export function addTitles(names: string[]): string[] {
  const had = loadTitles();
  const fresh = names.filter((n) => !had.includes(n));
  if (fresh.length) {
    try {
      localStorage.setItem(KEY, JSON.stringify([...had, ...fresh]));
    } catch {
      /* 저장이 안 되는 환경이면 이번 판에서만 보인다 */
    }
  }
  return fresh;
}

export function TitleBook({ owned, fresh = [] }: { owned: string[]; fresh?: string[] }) {
  const n = ALL_TITLES.filter((t) => owned.includes(t)).length;
  return (
    <section className="title-book" aria-label={`칭호 모음 ${n}/${ALL_TITLES.length}`}>
      <h3>
        칭호 모음 <span className="tabular">{n} / {ALL_TITLES.length}</span>
      </h3>
      <ul>
        {ALL_TITLES.map((t) => {
          const has = owned.includes(t);
          return (
            <li key={t} className={has ? (fresh.includes(t) ? 'has fresh' : 'has') : 'locked'} title={has ? t : '아직 잠겨 있어요'}>
              {has ? t : <span aria-label="잠김">🔒 ？？？</span>}
              {fresh.includes(t) && <small>새로!</small>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
