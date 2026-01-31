const Board = ({ map, playerPos }) => {
  const VISIBILITY_RADIUS = 4;

  return (
    <div className="board">
      {map.map((row, y) => row.map((tile, x) => {
        const dist = Math.sqrt((x - playerPos.x)**2 + (y - playerPos.y)**2);
        const isVisible = dist < VISIBILITY_RADIUS;
        const isPlayer = x === playerPos.x && y === playerPos.y;

        return (
          <div 
            key={`${x}-${y}`} 
            className={`tile ${tile === 0 ? 'wall' : 'floor'} ${!isVisible ? 'fog' : ''}`}
          >
            {isPlayer && <div className="player-emoji">🧙‍♂️</div>}
          </div>
        );
      }))}
    </div>
  );
};