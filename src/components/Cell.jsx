import React from 'react';
import { TILE_TYPES } from '../logic/constants';
import './Cell.css'; // Добавим отдельный CSS для Cell

const Cell = React.memo(({ type, isVisible, isPlayer, enemy, playerClass, hitEffect }) => {
  const classes = [
    'tile',
    type === TILE_TYPES.WALL ? 'wall' : 'floor',
    type === TILE_TYPES.EXIT ? 'exit' : '',
    !isVisible ? 'fog' : '',
    playerClass
  ].join(' ');

  return (
    <div className={classes}>
      {isVisible && (
        <>
          {isPlayer && <span className="entity player-icon">🧙‍♂️</span>}
          {!isPlayer && enemy && (
            <span className="entity enemy-icon">
              👹
              {/* HP бар монстра */}
              <div className="enemy-hp-bar">
                <div className="enemy-hp-fill" style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}></div>
              </div>
            </span>
          )}
          {!isPlayer && !enemy && type === TILE_TYPES.EXIT && <span className="entity exit-icon">🚪</span>}
          
          {/* Эффект урона "BAM!" */}
          {hitEffect && <span className="hit-effect animate-hit">-{hitEffect.damage}</span>}
        </>
      )}
    </div>
  );
});

export default Cell;