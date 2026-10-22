import type { GridSize } from '../components/library/types';

export const createGrid = ({ row, col }: GridSize) =>
  Array.from({ length: row }, () => Array(col).fill(0));
