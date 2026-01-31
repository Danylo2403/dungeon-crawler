import React, { useState, useEffect, useCallback } from 'react';
import { generateMap } from './logic/mapGen';
import { TILE_TYPES, MAP_SIZE, VISIBILITY_RADIUS } from './logic/constants';
import Cell from './components/Cell';
import './App.css';

function App() {
  const [map, setMap] = useState([]);
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
  const [enemies, setEnemies] = useState([]);
  const [hp, setHp] = useState(10);
  const [exp, setExp] = useState(0);
  const [level, setLevel] = useState(1);
  const [message, setMessage] = useState('Welcome, Hero!');

  const initGame = useCallback((nextLevel = 1) => {
    const { map: newMap, startPos } = generateMap();
    const count = 5 + nextLevel; // Больше врагов с каждым уровнем
    const newEnemies = [];
    
    for (let i = 0; i < count; i++) {
      let ex, ey;
      do {
        ex = Math.floor(Math.random() * MAP_SIZE);
        ey = Math.floor(Math.random() * MAP_SIZE);
      } while (newMap[ey][ex] !== TILE_TYPES.FLOOR || (ex === startPos.x && ey === startPos.y));
      newEnemies.push({ id: Date.now() + i, x: ex, y: ey, hp: 1 + nextLevel });
    }

    setMap(newMap);
    setPlayerPos(startPos);
    setEnemies(newEnemies);
    setLevel(nextLevel);
    if (nextLevel === 1) setHp(10);
    setMessage(`Level ${nextLevel} started!`);
  }, []);

  useEffect(() => { initGame(); }, [initGame]);

  const attackEnemy = (enemyId) => {
    setEnemies(prev => {
      const newEnemies = prev.map(e => e.id === enemyId ? { ...e, hp: e.hp - 1 } : e)
                            .filter(e => e.hp > 0);
      if (newEnemies.length < prev.length) {
        setExp(curr => curr + 20);
        setMessage('Monster defeated! +20 EXP');
      } else {
        setMessage('You struck the monster!');
      }
      return newEnemies;
    });
  };

  const moveEnemies = useCallback((currentMap, pPos) => {
    setEnemies(prev => prev.map(enemy => {
      // Простой ИИ: движение в сторону игрока
      const dx = pPos.x > enemy.x ? 1 : pPos.x < enemy.x ? -1 : 0;
      const dy = pPos.y > enemy.y ? 1 : pPos.y < enemy.y ? -1 : 0;
      
      const nx = enemy.x + dx;
      const ny = enemy.y + dy;

      if (nx === pPos.x && ny === pPos.y) {
        setHp(h => Math.max(0, h - 1));
        return enemy;
      }

      if (currentMap[ny]?.[nx] === TILE_TYPES.FLOOR && !prev.some(e => e.x === nx && e.y === ny)) {
        return { ...enemy, x: nx, y: ny };
      }
      return enemy;
    }));
  }, []);

  const handleMove = useCallback((dx, dy) => {
    setPlayerPos(prev => {
      const nx = prev.x + dx;
      const ny = prev.y + dy;
      if (ny < 0 || ny >= MAP_SIZE || nx < 0 || nx >= MAP_SIZE) return prev;

      const targetEnemy = enemies.find(e => e.x === nx && e.y === ny);
      if (targetEnemy) {
        attackEnemy(targetEnemy.id);
        return prev;
      }

      if (map[ny][nx] === TILE_TYPES.WALL) return prev;
      
      if (map[ny][nx] === TILE_TYPES.EXIT) {
        initGame(level + 1);
        return prev;
      }

      setTimeout(() => moveEnemies(map, {x: nx, y: ny}), 100);
      return { x: nx, y: ny };
    });
  }, [map, enemies, level, moveEnemies, initGame]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowUp') handleMove(0, -1);
      if (e.key === 'ArrowDown') handleMove(0, 1);
      if (e.key === 'ArrowLeft') handleMove(-1, 0);
      if (e.key === 'ArrowRight') handleMove(1, 0);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove]);

  if (hp <= 0) return <div className="game-over"><h1>GAME OVER</h1><button onClick={() => initGame(1)}>Try Again</button></div>;

  return (
    <div className="game-container">
      <div className="top-ui">
        <div className="stat-card">❤️ {hp}</div>
        <div className="stat-card">⭐ {exp}</div>
        <div className="stat-card">Lvl: {level}</div>
      </div>
      <div className="msg-log">{message}</div>

      <div className="board">
        {map.map((row, y) => row.map((tile, x) => {
          const dist = Math.hypot(x - playerPos.x, y - playerPos.y);
          const visible = dist < VISIBILITY_RADIUS;
          const enemy = enemies.find(e => e.x === x && e.y === y);
          return (
            <Cell 
              key={`${x}-${y}`}
              type={tile}
              isVisible={visible}
              isPlayer={x === playerPos.x && y === playerPos.y}
              enemy={enemy}
              onCellClick={() => visible && enemy && attackEnemy(enemy.id)}
            />
          );
        }))}
      </div>

      <div className="dpad">
        <button className="dbtn up" onClick={() => handleMove(0, -1)}>▲</button>
        <div className="drow">
          <button className="dbtn" onClick={() => handleMove(-1, 0)}>◀</button>
          <button className="dbtn" onClick={() => handleMove(1, 0)}>▶</button>
        </div>
        <button className="dbtn down" onClick={() => handleMove(0, 1)}>▼</button>
      </div>
    </div>
  );
}

export default App;