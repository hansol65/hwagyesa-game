import { openStats, attendRate } from '../game/engine';
import { REL_KEYS, type GameState } from '../game/types';
import { StatHex } from './StatHex';
import { personName, personRole } from '../game/names';


/** 친밀도 0~100을 정(情) 다섯 칸으로 */
function Jeong({ value }: { value: number }) {
  const on = Math.round(value / 20);
  return (
    <span className="jeong" role="img" aria-label={`정 ${on}칸 (${value})`} title={`${value}`}>
      {Array.from({ length: 5 }, (_, i) => (
        <i key={i} className={i < on ? 'on' : ''} />
      ))}
    </span>
  );
}

export function SidePanel({ game }: { game: GameState }) {
  return (
    <aside className="notebook" aria-label="나의 수첩">
      <section>
        <h3>나</h3>
        <StatHex stats={game.stats} keys={openStats(game.grade)} />
        {game.grade <= 6 && <p className="locked-note">리더십은 학생회에 가면 생겨요.</p>}
      </section>
      <section>
        <h3>사람들</h3>
        <ul className="people">
          {REL_KEYS.map((k) => (
            <li key={k} title={personRole(k, game.grade).desc}>
              <span className="name">
                {personName(k, game)}
                <small>{personRole(k, game.grade).role}</small>
              </span>
              <Jeong value={game.rel[k]} />
            </li>
          ))}
        </ul>
      </section>
      <section className="facts">
        <div>
          <span>법회 출석</span>
          <b className="tabular">
            {game.attendance.went}/{game.attendance.total}
            {game.attendance.total > 0 && ` · ${Math.round(attendRate(game) * 100)}%`}
          </b>
        </div>
        <div>
          <span>숨은 성향</span>
          <b>졸업 때 알게 돼요</b>
        </div>
      </section>
      <details className="help">
        <summary>스탯과 일정 표시가 궁금하면</summary>
        <dl>
          <dt>건강</dt><dd>낮으면 감기로 법회를 빠지거나 캠프에서 다쳐요.</dd>
          <dt>지능</dt><dd>공부와 법문 이해. 나중에 진학에 영향을 줘요.</dd>
          <dt>매력</dt><dd>친구를 사귀고 앞에 나서는 힘.</dd>
          <dt>멘탈</dt><dd>낮으면 지쳐서 아무것도 하기 싫어져요.</dd>
          <dt>리더십</dt><dd>학생회부터. 후배를 챙기고 앞에 서는 힘. 회장 선거를 가릅니다.</dd>
          <dt>신앙</dt><dd>법회와 예불로 자라요. 엔딩을 크게 가릅니다.</dd>
          <dt>정</dt><dd>사람들과 가까운 정도. 다섯 칸이 가득 차면 단짝이에요.</dd>
          <dt>먹점</dt><dd>평범한 일요일. 작은 연등 모양은 큰 행사 날이에요.</dd>
        </dl>
      </details>
    </aside>
  );
}
