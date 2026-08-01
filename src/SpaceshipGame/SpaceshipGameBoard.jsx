import React, { useEffect, useRef, useState } from 'react';
import { spawnAsteroid, stepEntities, checkCollisions } from './spaceshipGameLogic.js';
import asteroidImg from '../Prompts/asteroid.png';

const GRID = 5;
const CELL = 90; // px

function posToStyle(r, c) {
  return {
    transform: `translate(${c * CELL}px, ${r * CELL}px)`
  };
}

export default function SpaceshipGameBoard({ running, onLoseLife, onGainLife, addTime }) {
  const [ship, setShip] = useState({ r: 2, c: 2, dir: 'up' });
  const [asteroids, setAsteroids] = useState([]); // {id,r,c,dr,dc}
  const [hearts, setHearts] = useState([]);
  const [clouds, setClouds] = useState([]);
  const nextId = useRef(1);
  const spawnTimer = useRef(null);
  const lastTeleport = useRef(0);

  useEffect(() => {
    function handleKey(e) {
      if (!running) return;
      const moves = { ArrowUp: [-1,0,'up'], ArrowDown: [1,0,'down'], ArrowLeft: [0,-1,'left'], ArrowRight: [0,1,'right'] };
      if (moves[e.key]) {
        e.preventDefault();
        const [dr, dc, dir] = moves[e.key];
        setShip(s => {
          const nr = Math.max(0, Math.min(GRID-1, s.r + dr));
          const nc = Math.max(0, Math.min(GRID-1, s.c + dc));
          return { r: nr, c: nc, dir };
        });
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [running]);

  useEffect(() => {
    if (!running) {
      clearInterval(spawnTimer.current);
      spawnTimer.current = null;
      return;
    }
    // spawn one immediately, then every 4s
    setAsteroids(a => {
      if (a.length >= 6) return a;
      const ent = spawnAsteroid(nextId.current++, GRID);
      return [...a, ent];
    });
    spawnTimer.current = setInterval(() => {
      setAsteroids(a => {
        if (a.length >= 6) return a;
        const ent = spawnAsteroid(nextId.current++, GRID);
        return [...a, ent];
      });
    }, 4000);
    return () => clearInterval(spawnTimer.current);
  }, [running]);

  // game step loop for moving asteroids/hearts and handling collisions
  useEffect(() => {
    let raf = null;
    let last = performance.now();
    function frame(t) {
      const dt = t - last;
      if (dt > 120) {
        // step roughly every 120ms
        setAsteroids(a => stepEntities(a));
        setHearts(h => stepEntities(h));
        // collisions
        setAsteroids(a => {
          const { asteroids: na, clouds: nc, hearts: nh } = checkCollisions(a);
          if (nc.length) setClouds(prev => [...prev, ...nc]);
          if (nh.length) setHearts(prev => [...prev, ...nh]);
          return na;
        });
        last = t;
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  // cloud lifecycle
  useEffect(() => {
    if (!clouds.length) return;
    const ids = clouds.map(c => c.id);
    const t = setTimeout(() => {
      setClouds(prev => prev.filter(c => !ids.includes(c.id)));
    }, 1000);
    return () => clearTimeout(t);
  }, [clouds]);

  // asteroid vs ship collision check
  useEffect(() => {
    asteroids.forEach(a => {
      if (a.r === ship.r && a.c === ship.c) {
        onLoseLife();
        // remove asteroid
        setAsteroids(prev => prev.filter(x => x.id !== a.id));
      }
    });
  }, [asteroids, ship, onLoseLife]);

  // heart vs ship
  useEffect(() => {
    hearts.forEach(h => {
      if (h.r === ship.r && h.c === ship.c) {
        onGainLife();
        setHearts(prev => prev.filter(x => x.id !== h.id));
      }
    });
  }, [hearts, ship, onGainLife]);

  // portal handling: if ship on edge cell that is portal, teleport to opposite corresponding portal and add 120s
  useEffect(() => {
    const { r, c } = ship;
    let teleported = null;
    if (c === 0) teleported = { r, c: GRID - 1 };
    else if (c === GRID - 1) teleported = { r, c: 0 };
    else if (r === 0) teleported = { r: GRID - 1, c };
    else if (r === GRID - 1) teleported = { r: 0, c };
    if (teleported) {
      const now = Date.now();
      // debounce repeated teleports for 700ms
      if (now - lastTeleport.current < 700) return;
      lastTeleport.current = now;
      setTimeout(() => setShip(s => ({ ...s, r: teleported.r, c: teleported.c })), 100);
      addTime(120);
    }
  }, [ship, addTime]);

  return (
    <div className="spaceship-board" style={{ width: GRID*CELL, height: GRID*CELL }}>
      {/* grid background */}
      <div className="grid">
        {Array.from({ length: GRID }).map((_, r) => (
          <div className="grid-row" key={r} style={{ height: CELL }}>
            {Array.from({ length: GRID }).map((__, c) => (
              <div className="grid-cell" key={c} style={{ width: CELL }} />
            ))}
          </div>
        ))}
      </div>

      {/* ship */}
      <div className={`entity ship dir-${ship.dir}`} style={posToStyle(ship.r, ship.c)}>
        <div className="ship-sprite" />
      </div>

      {/* asteroids */}
      {asteroids.map(a => (
        <div key={a.id} className="entity asteroid" style={posToStyle(a.r, a.c)}>
          <img src={asteroidImg} alt="asteroid" style={{width:52,height:52}} />
        </div>
      ))}

      {/* hearts */}
      {hearts.map(h => (
        <div key={h.id} className="entity heart" style={posToStyle(h.r, h.c)}>❤</div>
      ))}

      {/* clouds */}
      {clouds.map(c => (
        <div key={c.id} className="entity cloud" style={posToStyle(c.r, c.c)}>☁</div>
      ))}
    </div>
  );
}
