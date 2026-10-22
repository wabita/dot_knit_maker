import type { GridSize } from '../components/library/types';
import { createGrid } from './grid';

type GridPoint = { row: number; col: number };
type PreviousPoint = { i: number; j: number } | null;

export const paintGridLine = (
  grid: number[][],
  row: number,
  col: number,
  previousPoint: PreviousPoint,
  brushSize: number,
  colorID: number,
) => {
  const nextGrid = grid.map(line => [...line]);
  const points: GridPoint[] = [];

  if (previousPoint) {
    const distance = Math.max(Math.abs(row - previousPoint.i), Math.abs(col - previousPoint.j));
    for (let step = 0; step <= distance; step++) {
      const ratio = distance === 0 ? 0 : step / distance;
      points.push({
        row: Math.round(previousPoint.i + (row - previousPoint.i) * ratio),
        col: Math.round(previousPoint.j + (col - previousPoint.j) * ratio),
      });
    }
  } else {
    points.push({ row, col });
  }

  points.forEach(point => {
    const offset = Math.floor(brushSize / 2);
    for (let y = point.row - offset; y < point.row - offset + brushSize; y++) {
      for (let x = point.col - offset; x < point.col - offset + brushSize; x++) {
        if (nextGrid[y] && nextGrid[y][x] !== undefined) nextGrid[y][x] = colorID;
      }
    }
  });

  return nextGrid;
};

export const convertImageToGrid = (
  image: HTMLImageElement,
  size: GridSize,
  palette: string[],
  scale: number,
  offset: { x: number; y: number },
): number[][] | null => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = size.col;
  canvas.height = size.row;
  if (!context) return null;

  const imageRatio = image.width / image.height;
  const gridRatio = size.col / size.row;
  const drawWidth = imageRatio > gridRatio ? size.col : size.row * imageRatio;
  const drawHeight = imageRatio > gridRatio ? size.col / imageRatio : size.row;
  const finalWidth = drawWidth * scale;
  const finalHeight = drawHeight * scale;
  const baseOffsetX = (size.col - drawWidth) / 2;
  const baseOffsetY = (size.row - drawHeight) / 2;
  const displayScale = Math.max(size.col, size.row) / 400;
  const x = Math.round(baseOffsetX + offset.x * displayScale - (finalWidth - drawWidth) / 2);
  const y = Math.round(baseOffsetY + offset.y * displayScale - (finalHeight - drawHeight) / 2);

  context.fillStyle = '#FFFFFF';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, x, y, finalWidth, finalHeight);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const rgbPalette = palette.map(color => ({
    r: parseInt(color.slice(1, 3), 16),
    g: parseInt(color.slice(3, 5), 16),
    b: parseInt(color.slice(5, 7), 16),
  }));
  const grid = createGrid(size);

  for (let row = 0; row < size.row; row++) {
    for (let col = 0; col < size.col; col++) {
      const index = (row * size.col + col) * 4;
      const [red, green, blue] = [pixels[index], pixels[index + 1], pixels[index + 2]];
      let nearestColorID = 0;
      let minimumDistance = Infinity;
      rgbPalette.forEach((color, colorID) => {
        const distance = Math.hypot(red - color.r, green - color.g, blue - color.b);
        if (distance < minimumDistance) {
          minimumDistance = distance;
          nearestColorID = colorID;
        }
      });
      grid[row][col] = nearestColorID;
    }
  }

  return grid;
};
