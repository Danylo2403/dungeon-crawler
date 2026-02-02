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

  // --- ЛОГИКА ХОДА МОНСТРОВ ---
  const moveEnemies = useCallback((currentMap, currentPlayerPos) => {
    setEnemies(prevEnemies => {
      return prevEnemies.map(enemy => {
        const dist = Math.hypot(enemy.x - currentPlayerPos.x, enemy.y - currentPlayerPos.y);
        
        // Если игрок рядом (ближе 5 клеток), монстр идет к нему
        if (dist < 5 && dist > 1) {
          let dx = 0, dy = 0;
          if (enemy.x < currentPlayerPos.x) dx = 1;
          else if (enemy.x > currentPlayerPos.x) dx = -1;
          else if (enemy.y < currentPlayerPos.y) dy = 1;
          else if (enemy.y > currentPlayerPos.y) dy = -1;

          const nx = enemy.x + dx;
          const ny = enemy.y + dy;

          // Проверка на стены и других монстров
          const isWall = currentMap[ny][nx] === TILE_TYPES.WALL;
          const isOccupied = prevEnemies.some(e => e.x === nx && e.y === ny);
          const isPlayer = nx === currentPlayerPos.x && ny === currentPlayerPos.y;

          if (!isWall && !isOccupied && !isPlayer) {
            return { ...enemy, x: nx, y: ny };
          }
        } 
        
        // Если монстр стоит вплотную к игроку, он атакует!
        if (dist <= 1.1) {
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
    addLog(`Floor ${nextLvl}. Monsters are awake.`);
  }, []);

  useEffect(() => { initGame(); }, [initGame]);

  const handleAttack = () => {
    setAttackAnimation(true);
    setTimeout(() => setAttackAnimation(false), 200);

    const adj = [
      {x: playerPos.x, y: playerPos.y-1}, {x: playerPos.x, y: playerPos.y+1},
      {x: playerPos.x-1, y: playerPos.y}, {x: playerPos.x+1, y: playerPos.y}
    ];
    
    setEnemies(prev => {
      let hit = false;
      const next = prev.map(e => {
        if (adj.some(a => a.x === e.x && a.y === e.y)) {
          hit = true;
          setHitEffects(old => [...old, { id: Date.now(), x: e.x, y: e.y, damage: stats.damage }]);
          return { ...e, hp: e.hp - stats.damage };
        }
        return e;
      }).filter(e => e.hp > 0);

      if (hit) {
        addLog('SWORD HIT! ⚔️');
        triggerShake();
      }
      return next;
    });

    // После атаки монстры тоже ходят
    moveEnemies(map, playerPos);
  };

  const handleMove = useCallback((dx, dy) => {
    setPlayerPos(prev => {
      const nx = prev.x + dx, ny = prev.y + dy;
      if (ny < 0 || ny >= MAP_SIZE || nx < 0 || nx >= MAP_SIZE) return prev;
      
      if (enemies.some(e => e.x === nx && e.y === ny)) {
        addLog("Enemy ahead!");
        return prev;
      }
      
      if (map[ny][nx] === TILE_TYPES.WALL) return prev;
      
      if (map[ny][nx] === TILE_TYPES.EXIT) {
        initGame(stats.lvl + 1);
        return prev;
      }

      const nextPos = { x: nx, y: ny };
      // ПОСЛЕ ХОДА ИГРОКА МОНСТРЫ ДЕЛАЮТ СВОЙ ХОД
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
      <h1>YOU DIED</h1>
      <button onClick={() => window.location.reload()}>REBORN</button>
    </div>
  );

  return (
    <div className={`game-container ${isShaking ? 'shake' : ''}`}>
      <div className="hud">
        <div className="hp-container">
          <div className="hp-fill" style={{width: `${(stats.hp/stats.maxHp)*100}%`}}></div>
          <span className="hp-text">HP {stats.hp}</span>
        </div>
        <div className="lvl-text">FLOOR {stats.lvl}</div>
      </div>

      <div className="log-container">
        {messages.map((m, i) => (
          <div key={i} className="log-entry" style={{opacity: 1 - i*0.3}}>{m}</div>
        ))}
      </div>

      <div className="board-wrapper">
        <div className="board">
          {map.map((row, y) => row.map((tile, x) => (
            <Cell 
              key={`${x}-${y}`}
              type={tile}
              isVisible={Math.hypot(x - playerPos.x, y - playerPos.y) < VISIBILITY_RADIUS}
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
          <button className="c-btn u" onClick={() => handleMove(0, -1)}>▲</button>
          <div className="d-row">
            <button className="c-btn l" onClick={() => handleMove(-1, 0)}>◀</button>
            <button className="c-btn r" onClick={() => handleMove(1, 0)}>▶</button>
          </div>
          <button className="c-btn d" onClick={() => handleMove(0, 1)}>▼</button>
        </div>
        <button className={`attack-btn ${attackAnimation ? 'swing' : ''}`} onClick={handleAttack}>⚔️</button>
      </div>
    </div>
  );
}

export default App;