import { useState } from 'react';
import { Scene } from './components/Scene';
import { Graduated, StartScreen, YearEnd } from './components/Screens';
import { SidePanel } from './components/SidePanel';
import { useGame } from './store';

export default function App() {
  const { game, reset } = useGame();
  const [confirmReset, setConfirmReset] = useState(false);

  if (!game) return <StartScreen />;
  if (game.phase === 'graduated') return <Graduated game={game} />;

  return (
    <main className="desk">
      <div className="sheet">
        <header className="masthead">
          <span className="title">화계사 이야기</span>
          <span className="who">{game.name}</span>
          {confirmReset ? (
            <span className="confirm">
              지금까지 한 것이 지워져요. 처음부터 할까요?
              <button className="textlink" onClick={() => { reset(); setConfirmReset(false); }}>
                처음부터
              </button>
              <button className="textlink" onClick={() => setConfirmReset(false)}>
                계속하기
              </button>
            </span>
          ) : (
            <button className="textlink" onClick={() => setConfirmReset(true)}>
              처음부터
            </button>
          )}
        </header>
        <div className="spread">
          {game.phase === 'yearEnd' ? <YearEnd game={game} /> : <Scene game={game} />}
          <SidePanel game={game} />
        </div>
      </div>
    </main>
  );
}
