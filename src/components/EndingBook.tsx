import { useEffect, useRef, useState } from 'react';
import { ENDINGS, type Ending } from '../game/engine';
import { unlockParts } from '../game/unlock';

/**
 * 엔딩 도감. 판이 끝나도 남는다 (이 브라우저에만). 다 모으려면 여러 번, 다르게 살아 봐야 한다.
 * 못 본 엔딩은 이름 대신 ？？？와 해금 조건.
 */
const KEY = 'hwagyesa-endings';

/** 엔딩 그림. 도감에는 작은 그림(thumb)을 쓴다 */
export const endingArt = (id: string, thumb = false) => `${import.meta.env.BASE_URL}art/endings/${id}${thumb ? '.thumb' : ''}.webp`;

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
  const [open, setOpen] = useState<string | null>(null);
  return (
    <section className="ending-book" aria-label={`엔딩 도감 ${n}/${ENDINGS.length}`}>
      <h3>
        엔딩 도감 <span className="tabular">{n} / {ENDINGS.length}</span>
      </h3>
      <ol>
        {ENDINGS.map((e, i) => (
          <EndingTile key={e.id} e={e} no={i + 1} has={owned.includes(e.id)} now={e.id === current} onOpen={() => setOpen(e.id)} />
        ))}
      </ol>
      {open && <EndingLightbox id={open} owned={owned} onMove={setOpen} onClose={() => setOpen(null)} />}
    </section>
  );
}

function EndingTile({ e, no, has, now, onOpen }: { e: Ending; no: number; has: boolean; now: boolean; onOpen: () => void }) {
  const head = (
    <>
      {has ? (
        <img className="thumb" src={endingArt(e.id, true)} alt="" width={360} height={240} loading="lazy" />
      ) : (
        <span className="thumb" aria-hidden="true">？</span>
      )}
      <p className="tile-head">
        <span className="no tabular">{String(no).padStart(2, '0')}</span>
        {has ? <b>{e.name}</b> : <b aria-label="아직 못 본 엔딩">？？？</b>}
      </p>
    </>
  );
  return (
    <li className={has ? (now ? 'has now' : 'has') : 'locked'}>
      {has ? (
        <button type="button" className="tile-open" onClick={onOpen} aria-label={`${e.name} 그림 크게 보기`}>
          {head}
          <small>{e.title}</small>
        </button>
      ) : (
        <>
          {head}
          <ul className="conds" aria-label="해금 조건">
            {unlockParts(e.when).map((p) => (
              <li key={p.text} className={p.kind}>{p.text}</li>
            ))}
          </ul>
        </>
      )}
    </li>
  );
}

/** 모은 엔딩 그림 크게 보기. 바깥을 누르거나 Esc로 닫고, ←/→로 모은 엔딩끼리 넘긴다 */
function EndingLightbox({ id, owned, onMove, onClose }: { id: string; owned: string[]; onMove: (id: string) => void; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const list = ENDINGS.filter((e) => owned.includes(e.id));
  const at = list.findIndex((e) => e.id === id);
  const e = list[at];
  const step = (d: number) => onMove(list[(at + d + list.length) % list.length].id);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);
  useEffect(() => {
    const key = (ev: KeyboardEvent) => {
      if (ev.key === 'ArrowRight') step(1);
      if (ev.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });
  if (!e) return null;
  const no = ENDINGS.indexOf(e) + 1;
  return (
    <dialog
      ref={ref}
      className="ending-lightbox"
      aria-label={e.name}
      onClose={onClose}
      onClick={(ev) => ev.target === ev.currentTarget && ref.current?.close()}
    >
      <figure>
        <img src={endingArt(e.id)} alt={e.name} width={960} height={640} />
        <figcaption>
          <span className="no tabular">엔딩 {String(no).padStart(2, '0')}</span>
          <b>{e.name}</b>
          <span>{e.title}</span>
        </figcaption>
      </figure>
      <div className="lb-bar">
        {list.length > 1 && (
          <button type="button" className="textlink" onClick={() => step(-1)}>
            ← 이전
          </button>
        )}
        <button type="button" className="textlink" onClick={() => ref.current?.close()} autoFocus>
          닫기
        </button>
        {list.length > 1 && (
          <button type="button" className="textlink" onClick={() => step(1)}>
            다음 →
          </button>
        )}
      </div>
    </dialog>
  );
}
