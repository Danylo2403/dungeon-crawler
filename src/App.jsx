import React, { useState, useEffect, useCallback } from 'react';
import { generateMap } from './logic/mapGen';
import { TILE_TYPES, MAP_SIZE, VISIBILITY_RADIUS } from './logic/constants';
import Cell from './components/Cell';
import './App.css';

function App() {
  const [map, setMap] = useState([]);
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
  const [enemies, setEnemies] = useState([]);
  const [stats, setStats] = useState({ hp: 10, maxHp: 10, exp: 0, lvl: 1, damage: 1 });
  const [message, setMessage] = useState('Dungeon awaits...');

  const initGame = useCallback((nextLvl = 1) => {
    const { map: newMap, startPos } = generateMap();
    const enemyCount = 5 + nextLvl;
    const newEnemies = [];
    for (let i = 0; i < enemyCount; i++) {
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

  // Функция атаки мечом (бьет всех врагов вокруг)
  const handleAttack = () => {
    const neighbors = [
      { x: playerPos.x, y: playerPos.y - 1 },
      { x: playerPos.x, y: playerPos.y + 1 },
      { x: playerPos.x - 1, y: playerPos.y },
      { x: playerPos.x + 1, y: playerPos.y },
    ];

    setEnemies(prev => {
      let hit = false;
      const nextEnemies = prev.map(enemy => {
        const isNeighbor = neighbors.some(n => n.x === enemy.x && n.y === enemy.y);
        if (isNeighbor) {
          hit = true;
          return { ...enemy, hp: enemy.hp - stats.damage };
        }
        return enemy;
      }).filter(e => e.hp > 0);

      if (hit) {
        setMessage('SWORD SWING! ⚔️');
        if (nextEnemies.length < prev.length) {
          setStats(s => ({ ...s, exp: s.exp + 20 }));
        }
      } else {
        setMessage('You swing at the air...');
      }
      return nextEnemies;
    });
  };

  const handleMove = useCallback((dx, dy) => {
    setPlayerPos(prev => {
      const nx = prev.x + dx;
      const ny = prev.y + dy;
      if (ny < 0 || ny >= MAP_SIZE || nx < 0 || nx >= MAP_SIZE) return prev;
      if (enemies.some(e => e.x === nx && e.y === ny)) {
        setMessage("Monster blocks your path! Use your sword!");
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

  if (stats.hp <= 0) return <div className="death-screen"><h1>DEFEATED</h1><button onClick={() => window.location.reload()}>RETRY</button></div>;

  return (
    <div className="game-container">
      <div className="top-hud">
        <div className="bar-container">
          <div className="bar hp-bar" style={{width: `${(stats.hp/stats.maxHp)*100}%`}}></div>
          <span>HP {stats.hp}</span>
        </div>
        <div className="lvl-badge">LVL {stats.lvl}</div>
      </div>

      <div className="log">{message}</div>

      <div className="board">
        {map.map((row, y) => row.map((tile, x) => {
          const dist = Math.hypot(x - playerPos.x, y - playerPos.y);
          const visible = dist < VISIBILITY_RADIUS;
          return (
            <Cell 
              key={`${x}-${y}`}
              type={tile}
              isVisible={visible}
              isPlayer={x === playerPos.x && y === playerPos.y}
              enemy={enemies.find(e => e.x === x && e.y === y)}
            />
          );
        }))}
      </div>

      <div className="mobile-ui">
        <div className="dpad-container">
          <button className="d-btn up" onClick={() => handleMove(0, -1)}>▲</button>
          <div className="d-row">
            <button className="d-btn left" onClick={() => handleMove(-1, 0)}>◀</button>
            <button className="d-btn right" onClick={() => handleMove(1, 0)}>▶</button>
          </div>
          <button className="d-btn down" onClick={() => handleMove(0, 1)}>▼</button>
        </div>
        
        <button className="action-btn sword" onClick={handleAttack}>
          ⚔️
        </button>
      </div>
    </div>
  );
}

export default App;