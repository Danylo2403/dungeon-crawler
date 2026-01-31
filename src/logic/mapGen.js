import { MAP_SIZE, TILE_TYPES } from './constants';

export const generateMap = () => {
  let map = Array(MAP_SIZE).fill().map(() => Array(MAP_SIZE).fill(TILE_TYPES.WALL));
  let x = Math.floor(MAP_SIZE / 2);
  let y = Math.floor(MAP_SIZE / 2);
  const startPos = { x, y };
  let steps = 450; 
  let floorTiles = [];

  while (steps > 0) {
    if (map[y][x] === TILE_TYPES.WALL) {
      map[y][x] = TILE_TYPES.FLOOR;
      floorTiles.push({ x, y });
      steps--;
    }
    const dir = Math.floor(Math.random() * 4);
    if (dir === 0 && y > 1) y--;
    else if (dir === 1 && y < MAP_SIZE - 2) y++;
    else if (dir === 2 && x > 1) x--;
    else if (dir === 3 && x < MAP_SIZE - 2) x++;
  }

  const lastTile = floorTiles[floorTiles.length - 1];
  map[lastTile.y][lastTile.x] = TILE_TYPES.EXIT;
  return { map, startPos };
};