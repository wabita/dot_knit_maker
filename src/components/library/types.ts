export type GridSize = {
  row: number;
  col: number;
};

export type Project = {
  id: string;
  name: string;
  grid: number[][];
  size: GridSize;
  palette: string[];
  updatedAt: number;
  thumbnail?: string;
  isFavorite: boolean;
};
