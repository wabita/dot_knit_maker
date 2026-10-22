import { useState } from 'react';
import type { MutableRefObject } from 'react';
import type { GridSize } from '../components/library/types';
import { paintGridLine } from '../utils/pixelArt';

type Options = {
  gridRef: MutableRefObject<number[][]>; gridSize: GridSize; nowColorID: number;
  replaceGrid: (grid: number[][]) => void; saveHistory: (grid: number[][], size: GridSize) => void;
};
export const useCanvasDraw = ({ gridRef, gridSize, nowColorID, replaceGrid, saveHistory }: Options) => {
  const [penSize, setPenSize] = useState(1);
  const [lastPos, setLastPos] = useState<{ i: number; j: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const paintCells = (row: number, col: number) => {
    replaceGrid(paintGridLine(gridRef.current, row, col, lastPos, penSize, nowColorID));
    setLastPos({ i: row, j: col });
  };
  const endAction = () => saveHistory(gridRef.current, gridSize);
  return { penSize, setPenSize, lastPos, setLastPos, zoom, setZoom, paintCells, endAction };
};
