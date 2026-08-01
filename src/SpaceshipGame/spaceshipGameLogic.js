// Minimal game logic helpers for SpaceshipGame

export function spawnAsteroid(id, GRID) {
  // spawn at a random edge cell with a direction into the board
  const side = Math.floor(Math.random() * 4); // 0 top,1 right,2 bottom,3 left
  let r, c, dr, dc;
  if (side === 0) { r = 0; c = Math.floor(Math.random() * GRID); dr = 1; dc = 0; }
  else if (side === 1) { r = Math.floor(Math.random() * GRID); c = GRID - 1; dr = 0; dc = -1; }
  else if (side === 2) { r = GRID - 1; c = Math.floor(Math.random() * GRID); dr = -1; dc = 0; }
  else { r = Math.floor(Math.random() * GRID); c = 0; dr = 0; dc = 1; }
  return { id, r, c, dr, dc };
}

export function stepEntities(list) {
  // each step, move by dr/dc if present
  return list.map(e => {
    if (typeof e.dr === 'number') {
      const nr = e.r + e.dr;
      const nc = e.c + e.dc;
      // stay within bounds
      return { ...e, r: Math.max(0, Math.min(4, nr)), c: Math.max(0, Math.min(4, nc)) };
    }
    return e;
  });
}

export function checkCollisions(asteroids) {
  // detect asteroid-asteroid collisions in same cell
  const map = {};
  const toRemove = new Set();
  const clouds = [];
  const hearts = [];
  asteroids.forEach(a => {
    const key = `${a.r},${a.c}`;
    if (!map[key]) map[key] = [];
    map[key].push(a);
  });
  Object.values(map).forEach(group => {
    if (group.length >= 2) {
      // collision: remove asteroids, create cloud, and create two hearts
      const idBase = group[0].id;
      clouds.push({ id: `cloud-${idBase}`, r: group[0].r, c: group[0].c });
      // hearts appear where collision happened; no movement for simplicity
      hearts.push({ id: `h-${idBase}-1`, r: group[0].r, c: group[0].c });
      hearts.push({ id: `h-${idBase}-2`, r: group[0].r, c: group[0].c });
      group.forEach(a => toRemove.add(a.id));
    }
  });

  const remaining = asteroids.filter(a => !toRemove.has(a.id));
  return { asteroids: remaining, clouds, hearts };
}
