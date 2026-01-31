import React from 'react';
import { TILE_TYPES } from '../logic/constants';

const Cell = React.memo(({ type, isVisible, isPlayer, enemy, onCellClick }) => {
  const classes = [
    'tile',
    type === TILE_TYPES.WALL ? 'wall' : 'floor',
    type === TILE_TYPES.EXIT ? 'exit' : '',
    !isVisible ? 'fog' : ''
  ].join(' ');

  return (
    <div className={classes} onClick={onCellClick}>
      {isVisible && (
        <>
          {isPlayer && <span className="entity">🧙‍♂️</span>}
          {!isPlayer && enemy && <span className="entity enemy-icon">👹</span>}
          {!isPlayer && !enemy && type === TILE_TYPES.EXIT && <span className="entity">🚪</span>}
        </>
      )}
    </div>
  );
});

export default Cell;