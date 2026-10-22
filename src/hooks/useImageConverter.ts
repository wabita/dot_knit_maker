import { useState } from 'react';
import type { ChangeEvent } from 'react';
import type { GridSize } from '../components/library/types';
import { convertImageToGrid } from '../utils/pixelArt';

type Options = {
  gridSize: GridSize; palette: string[]; replaceGrid: (grid: number[][]) => void;
  saveHistory: (grid: number[][], size: GridSize) => void;
};
export const useImageConverter = ({ gridSize, palette, replaceGrid, saveHistory }: Options) => {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [bgOpacity, setBgOpacity] = useState(0.4);
  const [bgScale, setBgScale] = useState(1);
  const [bgOffset, setBgOffset] = useState({ x: 0, y: 0 });
  const resetImageState = () => {
    setBackgroundImage(null); setBgOpacity(0.4); setBgScale(1); setBgOffset({ x: 0, y: 0 });
  };
  const runImageConversion = (source: string) => {
    const image = new Image();
    image.onload = () => {
      const converted = convertImageToGrid(image, gridSize, palette, bgScale, bgOffset);
      if (converted) { replaceGrid(converted); saveHistory(converted, gridSize); }
    };
    image.src = source;
  };
  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = result => {
      const source = result.target?.result as string;
      setBackgroundImage(source); runImageConversion(source);
    };
    reader.readAsDataURL(file);
  };
  const handleRefreshConversion = () => { if (backgroundImage) runImageConversion(backgroundImage); };
  return {
    backgroundImage, bgOpacity, setBgOpacity, bgScale, setBgScale, bgOffset, setBgOffset,
    runImageConversion, handleImageUpload, handleRefreshConversion, resetImageState,
  };
};
