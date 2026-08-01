import React, { useState, useEffect } from 'react';
import SpaceshipGameBoard from './SpaceshipGameBoard.jsx';
import './SpaceshipGame.css';

export default function SpaceshipGame() {
  const [running, setRunning] = useState(false);
  const [lives, setLives] = useState(3);
  const [timer, setTimer] = useState(5 * 60); // seconds

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setTimer(t0 => Math.max(0, t0 - 1)), 1000);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    if (timer <= 0) setRunning(false);
  }, [timer]);

  function toggleRunning() {
    setRunning(r => !r);
  }

  return (
    <div className="spaceship-game-root">
      <div className="topbar">
        <button className="btn" onClick={toggleRunning}>{running ? 'Pause' : 'Play'}</button>
        <div className="timer">{Math.floor(timer/60)}:{String(timer%60).padStart(2,'0')}</div>
        <div className="lives">{'❤'.repeat(lives)}</div>
      </div>
      <div className="game-area">
        <SpaceshipGameBoard
          running={running}
          onLoseLife={() => setLives(l => Math.max(0, l - 1))}
          onGainLife={() => setLives(l => Math.min(4, l + 1))}
          addTime={(s) => setTimer(t => t + s)}
        />
      </div>
    </div>
  );
}
