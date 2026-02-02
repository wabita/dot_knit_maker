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
  const [penSize, setPenSize] = useState(1); // ★追加：ペンサイズ
  const [lastPos, setLastPos] = useState<{ i: number, j: number } | null>(null);
  const [zoom, setZoom] = useState(1.0);
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

  // 画像からグリッドを生成する核心部分を関数として抽出
  const runImageConversion = (imageSrc: string) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = gridSize.col;
      canvas.height = gridSize.row;

      if (ctx) {
        const imgRatio = img.width / img.height;
        const gridRatio = gridSize.col / gridSize.row;
        const drawWidth = imgRatio > gridRatio ? gridSize.col : gridSize.row * imgRatio;
        const drawHeight = imgRatio > gridRatio ? gridSize.col / imgRatio : gridSize.row;
        const offsetX = (gridSize.col - drawWidth) / 2;
        const offsetY = gridSize.row - drawHeight;

        ctx.fillStyle = "#FFFFFF"; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

        const hexToRgb = (hex: string) => ({
          r: parseInt(hex.slice(1, 3), 16),
          g: parseInt(hex.slice(3, 5), 16),
          b: parseInt(hex.slice(5, 7), 16),
        });

        const paletteRgb = palette.map(hexToRgb);
        const newGrid = makeGrid(gridSize);

        for (let y = 0; y < gridSize.row; y++) {
          for (let x = 0; x < gridSize.col; x++) {
            const i = (y * gridSize.col + x) * 4;
            const r = imageData[i], g = imageData[i + 1], b = imageData[i + 2];
            let minDistance = Infinity;
            let closestID = 0;

            paletteRgb.forEach((pColor, id) => {
              const distance = Math.sqrt(
                Math.pow(r - pColor.r, 2) + Math.pow(g - pColor.g, 2) + Math.pow(b - pColor.b, 2)
              );
              if (distance < minDistance) {
                minDistance = distance;
                closestID = id;
              }
            });
            newGrid[y][x] = closestID;
          }
        }
        setGrid(newGrid);
      }
    };
    img.src = imageSrc;
  };

  // 新しくアップロードした時
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setBackgroundImage(result); // 下書きとして保存
      runImageConversion(result); // ドット化実行
    };
    reader.readAsDataURL(file);
  };
  // パレット変更後に再実行する用
  const handleRefreshConversion = () => {
    if (backgroundImage) runImageConversion(backgroundImage);
  };

  //グリッドをパレット0番の色でリセットする関数
  const clearGrid = () => {
    if (window.confirm("ドット絵をすべてリセットしますか？")) {
      setGrid(makeGrid(gridSize)); // makeGridはすべてのセルを0で埋めるので、一番上の色になります
    }
  };

  //グリッドの色を変更
  const paintCells = (i: number, j: number) => {
    setGrid((prev) => {
      const newGrid = prev.map(row => [...row]);
      const points = [];

      // 【補完ロジック】直前の座標(lastPos)があれば、今の座標(i, j)との間を埋める
      if (lastPos) {
        const di = Math.abs(i - lastPos.i);
        const dj = Math.abs(j - lastPos.j);
        const steps = Math.max(di, dj); // 何ステップで埋めるか決定

        for (let s = 0; s <= steps; s++) {
          const t = steps === 0 ? 0 : s / steps;
          points.push({
            ii: Math.round(lastPos.i + (i - lastPos.i) * t),
            jj: Math.round(lastPos.j + (j - lastPos.j) * t)
          });
        }
      } else {
        points.push({ ii: i, jj: j });
      }

      // 【ペンサイズ適用】計算されたすべての点に対して、ペンサイズ分の範囲を塗る
      points.forEach(({ ii, jj }) => {
        const offset = Math.floor(penSize / 2);
        for (let r = ii - offset; r < ii - offset + penSize; r++) {
          for (let c = jj - offset; c < jj - offset + penSize; c++) {
            // グリッドの範囲内かチェックして塗る
            if (newGrid[r] && newGrid[r][c] !== undefined) {
              newGrid[r][c] = nowColorID;
            }
          }
        }
      });

      return newGrid;
    });
    // 今塗った場所を「直前の座標」として保存
    setLastPos({ i, j });
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
          grid={grid} palette={palette} nowColorID={nowColorID} setNowColorID={setNowColorID} UpdataPaletteID={UpdataPaletteID} addColor={addColor}
          handleImageUpload={handleImageUpload} gridSize={gridSize} resizeGrid={resizeGrid} backgroundImage={backgroundImage}
          bgOpacity={bgOpacity} setBgOpacity={setBgOpacity} penSize={penSize} setPenSize={setPenSize} paintCells={paintCells} setLastPos={setLastPos}
          zoom={zoom} setZoom={setZoom} handleRefreshConversion={handleRefreshConversion} clearGrid={clearGrid} />
        ): (
          <Viewer grid={grid} palette={palette} gridSize={gridSize}/>
        )}
      </div>

    </FolderUI>
  );
}

export default App;

