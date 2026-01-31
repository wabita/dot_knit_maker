import { useEffect, useState } from 'react';
import { get, set } from 'idb-keyval';
import { FolderUI } from './components/FolderUI';
import { Editor } from './components/Editor';

import { Viewer } from './components/Viewer';

type GridSize = {
    row: number;
    col: number;
};

const makeGrid = ({ row, col }: GridSize) => {
    return new Array(row).fill(null).map(() => new Array(col).fill(0));
};

function App() {
  const [gridSize, setGridSize] = useState<GridSize>({ row: 90, col: 73 });
  const [activeTab, setActiveTab] = useState<'edit' | 'view'> ('edit');
  const [palette,setPalette] = useState(['#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF']);
  const [nowColorID, setNowColorID] = useState(1);
  const [grid, setGrid] = useState(() => makeGrid(gridSize));
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [bgOpacity, setBgOpacity] = useState(0.4);
  //グリットサイズ変更
  const resizeGrid = (newSize: GridSize) => {
    setGridSize(newSize);
    setGrid(makeGrid(newSize)); // グリッドを新しいサイズで作り直す
  };

  useEffect(() => {
    async function loadData(){
      const savedGrid = await get("originalGrid");
      const savedPalette = await get("originalPalette");
      if (savedGrid) setGrid(savedGrid);
      if (savedPalette) setPalette(savedPalette);
    }loadData();
  }, []);
  
  useEffect(() => {
    set("originalGrid", grid);
    set("originalPalette", palette);
  }, [grid, palette]);

  //アップデートした画像をグリッドに反映
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setBackgroundImage(result);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 現在のグリッドサイズに合わせてリサイズしてCanvasに描画
        canvas.width = gridSize.col;
        canvas.height = gridSize.row;

        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          // ピクセルデータ（RGBAの配列）を取得
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

          // 16進数カラーコードをRGB数値に変換する補助関数
          const hexToRgb = (hex: string) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return { r, g, b };
          };

          const paletteRgb = palette.map(hexToRgb);
          const newGrid = makeGrid(gridSize);

          // 全ピクセルをループして、最も近いパレットの色（ID）を探す
          for (let y = 0; y < gridSize.row; y++) {
            for (let x = 0; x < gridSize.col; x++) {
              const i = (y * gridSize.col + x) * 4;
              const r = imageData[i];     // 画像の赤
              const g = imageData[i + 1]; // 画像の緑
              const b = imageData[i + 2]; // 画像の青

              let minDistance = Infinity;
              let closestID = 0;

              // 現在のパレット全色と比較して、一番「距離」が近い色を選ぶ
              paletteRgb.forEach((pColor, id) => {
                const distance = Math.sqrt(
                  Math.pow(r - pColor.r, 2) +
                  Math.pow(g - pColor.g, 2) +
                  Math.pow(b - pColor.b, 2)
                );
                if (distance < minDistance) {
                  minDistance = distance;
                  closestID = id;
                }
              });
              newGrid[y][x] = closestID;
            }
          }
          // グリッドを更新して反映
          setGrid(newGrid);
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };
  //グリッドの色を変更
  const ChangeGrid =(i:number , j:number) => {
    setGrid((originalGrid) => {
      const newGrid = originalGrid.map(row => [...row]);
      newGrid[i][j] = nowColorID;
      return newGrid;
    })
  };
  //パレット 色更新
  const UpdataPaletteID = (id:number, newColor:string) => {
    const newPalette = [...palette];
    newPalette[id] = newColor;
    setPalette(newPalette);
  }
  //パレット 色追加
  const addColor = () => {
    setPalette([...palette, '#cccccc']);
    setNowColorID(palette.length); // 追加した色をすぐ選択
  };


  return (

    <FolderUI currentTab={activeTab} setCurrentTab={setActiveTab}>
      
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        {activeTab === 'edit' ? (
          <Editor 
          grid={grid} palette={palette} nowColorID={nowColorID} setNowColorID={setNowColorID} ChangeGrid={ChangeGrid} UpdataPaletteID={UpdataPaletteID} addColor={addColor}
          handleImageUpload={handleImageUpload} gridSize={gridSize} resizeGrid={resizeGrid} backgroundImage={backgroundImage}
          bgOpacity={bgOpacity} setBgOpacity={setBgOpacity}/>
        ): (
          <Viewer grid={grid} palette={palette} gridSize={gridSize}/>
        )}
      </div>

    </FolderUI>
  );
}

export default App;

