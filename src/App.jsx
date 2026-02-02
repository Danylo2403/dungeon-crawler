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
  const [messages, setMessages] = useState(['Dungeon awaits...']);
  const [isShaking, setIsShaking] = useState(false);
  const [attackAnimation, setAttackAnimation] = useState(false);
  const [hitEffects, setHitEffects] = useState([]);

  const addLog = (msg) => {
    setMessages(prev => [msg, ...prev].slice(0, 3));
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 300);
  };

  // --- СЛЕДОВАНИЕ КАМЕРЫ ---
  useEffect(() => {
    const playerElem = document.querySelector('.player-tile');
    if (playerElem) {
      playerElem.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      });
    }
  }, [playerPos]);

  const moveEnemies = useCallback((currentMap, currentPlayerPos) => {
    setEnemies(prevEnemies => {
      return prevEnemies.map(enemy => {
        const dist = Math.hypot(enemy.x - currentPlayerPos.x, enemy.y - currentPlayerPos.y);
        
        if (dist < 6 && dist > 1) {
          let dx = 0, dy = 0;
          if (enemy.x < currentPlayerPos.x) dx = 1;
          else if (enemy.x > currentPlayerPos.x) dx = -1;
          else if (enemy.y < currentPlayerPos.y) dy = 1;
          else if (enemy.y > currentPlayerPos.y) dy = -1;

          const nx = enemy.x + dx;
          const ny = enemy.y + dy;
          const isWall = currentMap[ny][nx] === TILE_TYPES.WALL;
          const isOccupied = prevEnemies.some(e => e.x === nx && e.y === ny);
          const isPlayer = nx === currentPlayerPos.x && ny === currentPlayerPos.y;

          if (!isWall && !isOccupied && !isPlayer) return { ...enemy, x: nx, y: ny };
        } 
        
        if (dist <= 1.2) {
          setStats(s => ({ ...s, hp: Math.max(0, s.hp - 1) }));
          addLog("Monster bites you! 🩸");
          triggerShake();
        }
        return enemy;
      });
    });
  }, []);

  const initGame = useCallback((nextLvl = 1) => {
    const { map: newMap, startPos } = generateMap();
    const newEnemies = [];
    for (let i = 0; i < 5 + nextLvl; i++) {
      let ex, ey;
      do {
        ex = Math.floor(Math.random() * MAP_SIZE);
        ey = Math.floor(Math.random() * MAP_SIZE);
      } while (newMap[ey][ex] !== TILE_TYPES.FLOOR || (ex === startPos.x && ey === startPos.y));
      newEnemies.push({ id: Date.now() + i, x: ex, y: ey, hp: 2, maxHp: 2 });
    }
    setMap(newMap);
    setPlayerPos(startPos);
    setEnemies(newEnemies);
    setStats(s => ({ ...s, lvl: nextLvl, hp: s.maxHp }));
    addLog(`Floor ${nextLvl}. Stay alert.`);
  }, []);

  useEffect(() => { initGame(); }, [initGame]);

  const handleAttack = () => {
    setAttackAnimation(true);
    setTimeout(() => setAttackAnimation(false), 200);

    setEnemies(prev => {
      let hit = false;
      const next = prev.map(e => {
        // Урон всем врагам в радиусе 1 клетки
        const isAdjacent = Math.abs(e.x - playerPos.x) <= 1 && Math.abs(e.y - playerPos.y) <= 1;
        if (isAdjacent) {
          hit = true;
          setHitEffects(old => [...old, { id: Date.now(), x: e.x, y: e.y, damage: stats.damage }]);
          return { ...e, hp: e.hp - stats.damage };
        }
        return e;
      }).filter(e => e.hp > 0);

      if (hit) {
        addLog('SWORD HIT! ⚔️');
        triggerShake();
      } else {
        addLog('Whiff... 💨');
      }
      return next;
    });

    moveEnemies(map, playerPos);
  };

  const handleMove = useCallback((dx, dy) => {
    setPlayerPos(prev => {
      const nx = prev.x + dx, ny = prev.y + dy;
      if (ny < 0 || ny >= MAP_SIZE || nx < 0 || nx >= MAP_SIZE) return prev;
      if (enemies.some(e => e.x === nx && e.y === ny)) {
        addLog("Enemy blocks you!");
        return prev;
      }
      if (map[ny][nx] === TILE_TYPES.WALL) return prev;
      if (map[ny][nx] === TILE_TYPES.EXIT) {
        initGame(stats.lvl + 1);
        return prev;
      }
      const nextPos = { x: nx, y: ny };
      moveEnemies(map, nextPos);
      return nextPos;
    });
  }, [map, enemies, stats.lvl, initGame, moveEnemies]);

  useEffect(() => {
    if (hitEffects.length > 0) {
      const timer = setTimeout(() => setHitEffects(old => old.slice(1)), 500);
      return () => clearTimeout(timer);
    }
  }, [hitEffects]);

  if (stats.hp <= 0) return (
    <div className="death">
      <h1>YOU PERISHED</h1>
      <button onClick={() => window.location.reload()}>REBORN</button>
    </div>
  );

  return (
    <div className={`game-container ${isShaking ? 'shake' : ''}`}>
      <div className="top-ui">
        <div className="stats-bar">
          <div className="hp-wrap">
            <div className="hp-bar" style={{width: `${(stats.hp/stats.maxHp)*100}%`}}></div>
            <span>HP {stats.hp}</span>
          </div>
          <div className="floor-badge">LVL {stats.lvl}</div>
        </div>
        <div className="messages">
          {messages.map((m, i) => (
            <div key={i} className="msg" style={{opacity: 1 - i*0.4}}>{m}</div>
          ))}
        </div>
      </div>

      <div className="viewport">
        <div className="board">
          {map.map((row, y) => row.map((tile, x) => (
            // В App.jsx найди map.map(...)
<Cell 
  key={`${x}-${y}`}
  x={x}
  y={y}
  playerPos={playerPos} // Добавили это
  type={tile}
  isVisible={Math.hypot(x - playerPos.x, y - playerPos.y) < 6} 
  isPlayer={x === playerPos.x && y === playerPos.y}
  enemy={enemies.find(e => e.x === x && e.y === y)}
  playerClass={x === playerPos.x && y === playerPos.y ? 'player-tile' : ''}
  hitEffect={hitEffects.find(eff => eff.x === x && eff.y === y)}
/>
          )))}
        </div>
      </div>

      <div className="controls">
        <div className="dpad">
          <button className="btn up" onClick={() => handleMove(0, -1)}>▲</button>
          <div className="dpad-mid">
            <button className="btn left" onClick={() => handleMove(-1, 0)}>◀</button>
            <button className="btn right" onClick={() => handleMove(1, 0)}>▶</button>
          </div>
          <button className="btn down" onClick={() => handleMove(0, 1)}>▼</button>
        </div>
        <button className={`atk-btn ${attackAnimation ? 'swing' : ''}`} onClick={handleAttack}>⚔️</button>
      </div>
    </div>
  );
}

export default App;