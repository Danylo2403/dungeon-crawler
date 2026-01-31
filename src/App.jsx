import React, { useState, useEffect, useCallback } from 'react';
import { generateMap } from './logic/mapGen';
import { TILE_TYPES, MAP_SIZE, VISIBILITY_RADIUS } from './logic/constants';
import Cell from './components/Cell';
import './App.css';

function App() {
  const [map, setMap] = useState([]);
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
  const [enemies, setEnemies] = useState([]);
  const [stats, setStats] = useState({ hp: 10, maxHp: 10, lvl: 1, damage: 1 });
  const [message, setMessage] = useState('Dungeon awaits...');

  const initGame = useCallback((nextLvl = 1) => {
    const { map: newMap, startPos } = generateMap();
    const newEnemies = [];
    for (let i = 0; i < 5 + nextLvl; i++) {
      let ex, ey;
      do {
        ex = Math.floor(Math.random() * MAP_SIZE);
        ey = Math.floor(Math.random() * MAP_SIZE);
      } while (newMap[ey][ex] !== TILE_TYPES.FLOOR || (ex === startPos.x && ey === startPos.y));
      newEnemies.push({ id: Date.now() + i, x: ex, y: ey, hp: Math.ceil(nextLvl / 1.5) + 1 });
    }
    setMap(newMap);
    setPlayerPos(startPos);
    setEnemies(newEnemies);
    setStats(s => ({ ...s, lvl: nextLvl, hp: s.maxHp }));
  }, []);

  useEffect(() => { initGame(); }, [initGame]);

  const handleAttack = () => {
    const adj = [
      {x: playerPos.x, y: playerPos.y-1}, {x: playerPos.x, y: playerPos.y+1},
      {x: playerPos.x-1, y: playerPos.y}, {x: playerPos.x+1, y: playerPos.y}
    ];
    setEnemies(prev => {
      let hit = false;
      const next = prev.map(e => {
        if (adj.some(a => a.x === e.x && a.y === e.y)) {
          hit = true;
          return { ...e, hp: e.hp - stats.damage };
        }
        return e;
      }).filter(e => e.hp > 0);
      setMessage(hit ? 'SWORD HIT! ⚔️' : 'Swing and a miss...');
      return next;
    });
  };

  const handleMove = useCallback((dx, dy) => {
    setPlayerPos(prev => {
      const nx = prev.x + dx, ny = prev.y + dy;
      if (ny < 0 || ny >= MAP_SIZE || nx < 0 || nx >= MAP_SIZE) return prev;
      if (enemies.some(e => e.x === nx && e.y === ny)) {
        setMessage("Monster! Use your sword!");
        return prev;
      }
      if (map[ny][nx] === TILE_TYPES.WALL) return prev;
      if (map[ny][nx] === TILE_TYPES.EXIT) {
        initGame(stats.lvl + 1);
        return prev;
      }
      return { x: nx, y: ny };
    });
  }, [map, enemies, stats.lvl, initGame]);

  if (stats.hp <= 0) return <div className="death"><h1>DEFEATED</h1><button onClick={() => window.location.reload()}>RETRY</button></div>;

  return (
    <div className="game-container">
      <div className="hud">
        <div className="hp-container">
          <div className="hp-fill" style={{width: `${(stats.hp/stats.maxHp)*100}%`}}></div>
          <span className="hp-text">HP {stats.hp}</span>
        </div>
        <div className="lvl-text">FLOOR {stats.lvl}</div>
      </div>

      <div className="log">{message}</div>

      <div className="board-wrapper">
        <div className="board">
          {map.map((row, y) => row.map((tile, x) => (
            <Cell 
              key={`${x}-${y}`}
              type={tile}
              isVisible={Math.hypot(x - playerPos.x, y - playerPos.y) < VISIBILITY_RADIUS}
              isPlayer={x === playerPos.x && y === playerPos.y}
              enemy={enemies.find(e => e.x === x && e.y === y)}
            />
          )))}
        </div>
      </div>

      <div className="controls">
        <div className="dpad">
          <button className="c-btn u" onClick={() => handleMove(0, -1)}>▲</button>
          <button className="c-btn l" onClick={() => handleMove(-1, 0)}>◀</button>
          <button className="c-btn r" onClick={() => handleMove(1, 0)}>▶</button>
          <button className="c-btn d" onClick={() => handleMove(0, 1)}>▼</button>
        </div>
        <button className="attack-btn" onClick={handleAttack}>⚔️</button>
      </div>
    </div>
  );
}

export default App;