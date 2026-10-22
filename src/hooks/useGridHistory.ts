import { useCallback, useEffect, useRef, useState } from 'react';
import { get, set } from 'idb-keyval';
import type { GridSize } from '../components/library/types';
import { createGrid } from '../utils/grid';

const DEFAULT_PALETTE = ['#FFFFFF', '#000000'];
type HistoryEntry = { grid: number[][]; size: GridSize; palette: string[] };

export const useGridHistory = () => {
  const [grid, setGrid] = useState(() => createGrid({ row: 70, col: 50 }));
  const initialGrid = useRef(grid).current;
  const [gridSize, setGridSize] = useState<GridSize>({ row: 70, col: 50 });
  const [palette, setPalette] = useState(DEFAULT_PALETTE);
  const [nowColorID, setNowColorID] = useState(1);
  const [history, setHistory] = useState<HistoryEntry[]>([{ grid: initialGrid, size: { row: 70, col: 50 }, palette: DEFAULT_PALETTE }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);
  const gridRef = useRef(grid);

  useEffect(() => { gridRef.current = grid; }, [grid]);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [savedGrid, savedPalette, savedSize] = await Promise.all([
          get<number[][]>('dot-knit-grid'), get<string[]>('dot-knit-palette'), get<GridSize>('dot-knit-size'),
        ]);
        if (!active) return;
        if (savedGrid) { setGrid(savedGrid); gridRef.current = savedGrid; }
        if (savedPalette) setPalette(savedPalette);
        if (savedSize) setGridSize(savedSize);
        if (savedGrid && savedSize) setHistory([{ grid: savedGrid, size: savedSize, palette: savedPalette || DEFAULT_PALETTE }]);
      } catch (error) { console.error('編集中データの読み込みに失敗しました', error); }
      finally { if (active) setHasLoadedDraft(true); }
    };
    void load();
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!hasLoadedDraft) return;
    void set('dot-knit-grid', grid);
    void set('dot-knit-palette', palette);
    void set('dot-knit-size', gridSize);
  }, [grid, palette, gridSize, hasLoadedDraft]);

  const replaceGrid = useCallback((next: number[][]) => { gridRef.current = next; setGrid(next); }, []);
  const saveHistory = useCallback((nextGrid: number[][], nextSize: GridSize, nextPalette = palette) => {
    setHistory(previous => {
      const next = previous.slice(0, historyIndex + 1);
      next.push({ grid: JSON.parse(JSON.stringify(nextGrid)), size: { ...nextSize }, palette: [...nextPalette] });
      if (next.length > 50) next.shift();
      return next;
    });
    setHistoryIndex(previous => Math.min(previous + 1, 49));
  }, [historyIndex, palette]);
  const resizeGrid = (size: GridSize) => {
    const next = createGrid(size); setGridSize(size); replaceGrid(next); saveHistory(next, size);
  };
  const resetDocument = (size: GridSize) => {
    const next = createGrid(size); setGridSize(size); replaceGrid(next); setPalette(DEFAULT_PALETTE); setNowColorID(1);
    setHistory([{ grid: next, size, palette: DEFAULT_PALETTE }]); setHistoryIndex(0);
  };
  const loadDocument = (next: number[][], size: GridSize, nextPalette: string[]) => {
    replaceGrid(next); setGridSize(size); setPalette(nextPalette); setNowColorID(1);
    setHistory([{ grid: next, size, palette: nextPalette }]); setHistoryIndex(0);
  };
  const clearGrid = () => {
    if (!window.confirm('ドット絵をすべてリセットしますか？')) return;
    const next = createGrid(gridSize); replaceGrid(next); saveHistory(next, gridSize);
  };
  const undo = () => {
    if (historyIndex <= 0) return;
    const previous = history[historyIndex - 1]; replaceGrid(previous.grid); setGridSize(previous.size); setPalette(previous.palette);
    setNowColorID(id => Math.min(id, previous.palette.length - 1)); setHistoryIndex(historyIndex - 1);
  };
  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const next = history[historyIndex + 1]; replaceGrid(next.grid); setGridSize(next.size); setPalette(next.palette);
    setNowColorID(id => Math.min(id, next.palette.length - 1)); setHistoryIndex(historyIndex + 1);
  };
  const UpdataPaletteID = (id: number, color: string) => setPalette(p => p.map((value, i) => i === id ? color : value));
  const addColor = () => { setPalette(p => [...p, '#cccccc']); setNowColorID(palette.length); };
  const deleteColor = (id: number) => {
    if (palette.length <= 2) return;
    const nextPalette = palette.filter((_, i) => i !== id);
    const nextGrid = gridRef.current.map(row => row.map(color => color === id ? 0 : color > id ? color - 1 : color));
    setPalette(nextPalette); replaceGrid(nextGrid);
    setNowColorID(current => current === id ? Math.min(id, nextPalette.length - 1) : current > id ? current - 1 : current);
    saveHistory(nextGrid, gridSize, nextPalette);
  };
  return {
    grid, gridRef, replaceGrid, gridSize, setGridSize, history, historyIndex, palette, setPalette,
    nowColorID, setNowColorID, resizeGrid, clearGrid, undo, redo, saveHistory, UpdataPaletteID,
    addColor, deleteColor, resetDocument, loadDocument,
    canUndo: historyIndex > 0, canRedo: historyIndex < history.length - 1,
  };
};
