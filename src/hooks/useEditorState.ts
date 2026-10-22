import { useCanvasDraw } from './useCanvasDraw';
import { useGridHistory } from './useGridHistory';
import { useImageConverter } from './useImageConverter';
import type { EditorProps } from '../components/editor/types';

export type EditorState = Omit<EditorProps, 'saveProject' | 'isProjectLoaded' | 'isFavorite' | 'onDelete' | 'onToggleFavorite'> & {
  resetDocument: (size: { row: number; col: number }) => void;
  loadDocument: (grid: number[][], size: { row: number; col: number }, palette: string[]) => void;
};

export const useEditorState = (): EditorState => {
  const core = useGridHistory();
  const draw = useCanvasDraw({ gridRef: core.gridRef, gridSize: core.gridSize, nowColorID: core.nowColorID, replaceGrid: core.replaceGrid, saveHistory: core.saveHistory });
  const image = useImageConverter({ gridSize: core.gridSize, palette: core.palette, replaceGrid: core.replaceGrid, saveHistory: core.saveHistory });
  const resetDocument = (size: { row: number; col: number }) => { core.resetDocument(size); image.resetImageState(); };
  return { ...core, ...draw, ...image, resetDocument };
};
