import React from 'react';
import { TILE_TYPES } from '../logic/constants';

const Cell = React.memo(({ x, y, playerPos, type, isVisible, isPlayer, enemy, playerClass, hitEffect }) => {
  // Вычисляем точную дистанцию для эффекта освещения
  const dist = Math.hypot(x - playerPos.x, y - playerPos.y);
  
  // Клетки, которые маг уже "прошел", будут чуть видны (Fog of War)
  const opacity = isVisible ? Math.max(0.1, 1 - dist / 6) : 0;

  const classes = [
    'tile',
    type === TILE_TYPES.WALL ? 'tile-wall' : 'tile-floor',
    type === TILE_TYPES.EXIT ? 'tile-exit' : '',
    isPlayer ? 'player-tile' : '',
    playerClass
  ].join(' ');

  return (
    <div 
      className={classes} 
      style={{ 
        opacity: isPlayer ? 1 : opacity,
        filter: isVisible ? `brightness(${Math.max(0.2, 1.2 - dist/5)})` : 'none'
      }}
    >
      {isVisible && (
        <>
          {isPlayer && <span className="entity player-icon">🧙‍♂️</span>}
          {!isPlayer && enemy && (
            <span className="entity enemy-icon">
              👹
              <div className="enemy-hp-bar">
                <div className="enemy-hp-fill" style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}></div>
              </div>
            </span>
          )}
          {!isPlayer && !enemy && type === TILE_TYPES.EXIT && <span className="entity exit-icon">🚪</span>}
          {hitEffect && <span className="hit-effect animate-hit">-{hitEffect.damage}</span>}
        </>
      )}
    </div>
  );
});

export default Cell;