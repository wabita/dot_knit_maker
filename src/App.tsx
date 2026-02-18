import { useState, useCallback,useEffect } from 'react';
import { get, set } from 'idb-keyval';
import { FolderUI } from './components/FolderUI';
import { Editor } from './components/Editor';

import { Viewer } from './components/Viewer';

type MainTab = 'edit' | 'view' |'select';

// タブのリストを定義
const MAIN_TABS: { label: string; value: MainTab }[] = [
  { label: 'さくひん', value: 'select' }, 
  { label: 'へんしゅう', value: 'edit' },
  { label: 'さくせい', value: 'view' },
];

type GridSize = {
    row: number;
    col: number;
};

const makeGrid = ({ row, col }: GridSize) => {
    return new Array(row).fill(null).map(() => new Array(col).fill(0));
};

type Project = {
    id: string;
    name: string;
    grid: number[][];
    size: GridSize;
    palette: string[];
    updatedAt: number;
    thumbnail?: string;
    isFavorite: boolean;
};

function App() {
  const [gridSize, setGridSize] = useState<GridSize>({ row: 70, col: 50 });
  const [activeTab, setActiveTab] = useState<MainTab>('select');
  const [projects, setProjects] = useState<Project[]>([]);
  const [palette,setPalette] = useState(['#FFFFFF', '#000000']);
  const [nowColorID, setNowColorID] = useState(1);
  const [history, setHistory] = useState<{grid: number[][], size: GridSize}[]>(() => [
    { grid: makeGrid({ row: 70, col: 50 }), size: { row: 70, col: 50 } }
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [grid, setGrid] = useState(() => history[0].grid);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [bgOpacity, setBgOpacity] = useState(0.4);
  const [penSize, setPenSize] = useState(1);
  const [lastPos, setLastPos] = useState<{ i: number, j: number } | null>(null);
  const [zoom, setZoom] = useState(1.0);
  const [bgOffset, setBgOffset] = useState({ x: 0, y: 0 });

  const [hasLoaded, setHasLoaded] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  // 新規作成の関数
  const createNewProject = () => {
    const newSize = { row: 70, col: 50 };
    const newGrid = makeGrid(newSize);
    setGrid(newGrid);
    setGridSize(newSize);
    setPalette(['#FFFFFF', '#000000']);
    setBackgroundImage(null);
    setHistory([{ grid: newGrid, size: newSize }]);
    setHistoryIndex(0);
    setActiveTab('edit'); // そのまま編集画面へ
    setCurrentProjectId(null);
  };

  // 作品読み込み関数
  const loadProject = (p: Project) => {
    setGrid(p.grid);
    setGridSize(p.size);
    setPalette(p.palette);
    setHistory([{ grid: p.grid, size: p.size }]);
    setHistoryIndex(0);
    setCurrentProjectId(p.id);
    setActiveTab('edit'); // 編集画面へ切り替え
  };

  useEffect(() => {
    async function loadSavedData() {
      try {
        // 作品一覧をIndexedDBから取得
        const savedProjects = await get('dot-knit-projects');
        if (savedProjects) setProjects(savedProjects);

        const savedGrid = await get('dot-knit-grid');
        const savedPalette = await get('dot-knit-palette');
        const savedSize = await get('dot-knit-size');

        if (savedGrid) setGrid(savedGrid);
        if (savedPalette) setPalette(savedPalette);
        if (savedSize) setGridSize(savedSize);
        
        if (savedGrid && savedSize) {
          setHistory([{ grid: savedGrid, size: savedSize }]);
        }
      } catch (e) {
        console.error("Load failed", e);
      } finally {
        setHasLoaded(true);
      }
    }
    loadSavedData();
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;

    set('dot-knit-grid', grid);
    set('dot-knit-palette', palette);
    set('dot-knit-size', gridSize);
  }, [grid, palette, gridSize, hasLoaded]);



  const saveHistory = useCallback((currentGrid: number[][], currentSize: GridSize) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ 
        grid: JSON.parse(JSON.stringify(currentGrid)), 
        size: { ...currentSize } 
      });
      if (newHistory.length > 50) newHistory.shift(); 
      return newHistory;
    });
    setHistoryIndex(prev => {
      const next = prev + 1;
      return next >= 50 ? 49 : next;
    });
  }, [historyIndex]);

  //グリッドサイズ変更
  const resizeGrid = (newSize: GridSize) => {
    setGridSize(newSize);
    const newGrid = makeGrid(newSize);
    setGrid(newGrid);
    saveHistory(newGrid, newSize);
  };
  //グリッドをパレット0番の色でリセットする関数
  const clearGrid = () => {
    if (window.confirm("ドット絵をすべてリセットしますか？")) {
      const newGrid = makeGrid(gridSize);
      setGrid(newGrid);
      saveHistory(newGrid, gridSize);
    }
  };
  const [bgScale, setBgScale] = useState(1.0);
    // 画像からグリッドを生成する核心部分を関数として抽出
  // 画像からグリッドを生成する核心部分
  const runImageConversion = (imageSrc: string) => {
      const img = new Image();
      img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = gridSize.col;
          canvas.height = gridSize.row;

          if (ctx) {
              // 1. まずベースとなる比率を計算
              const imgRatio = img.width / img.height;
              const gridRatio = gridSize.col / gridSize.row;
              
              // ★ 修正点1: 宣言と計算を先に済ませる
              let drawWidth, drawHeight;
              if (imgRatio > gridRatio) {
                  drawWidth = gridSize.col;
                  drawHeight = gridSize.col / imgRatio;
              } else {
                  drawHeight = gridSize.row;
                  drawWidth = gridSize.row * imgRatio;
              }

              // 2. 次に拡大率（bgScale）を適用したサイズを出す
              const finalWidth = drawWidth * bgScale;
              const finalHeight = drawHeight * bgScale;

              // 3. ベース位置を「中央」にする（UIと一致させる）
              const baseOffsetX = (gridSize.col - drawWidth) / 2;
              const baseOffsetY = (gridSize.row - drawHeight) / 2;

              // 4. スケーリング係数（UIの400pxエリアに対する変換率）
              const displaySize = 400;
              const scaleK = Math.max(gridSize.col, gridSize.row) / displaySize; 

              // 5. 最終座標の計算（Math.round でピクセル単位のズレを排除）
              const finalX = Math.round(
                  baseOffsetX + (bgOffset.x * scaleK) - (finalWidth - drawWidth) / 2
              );
              const finalY = Math.round(
                  baseOffsetY + (bgOffset.y * scaleK) - (finalHeight - drawHeight) / 2
              );

              ctx.fillStyle = "#FFFFFF"; 
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              
              // 描画実行
              ctx.drawImage(img, finalX, finalY, finalWidth, finalHeight);
              
              // ★ 修正点2: imageData の宣言は1回だけ！
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

              const hexToRgb = (hex: string) => ({
                  r: parseInt(hex.slice(1, 3), 16),
                  g: parseInt(hex.slice(3, 5), 16),
                  b: parseInt(hex.slice(5, 7), 16),
              });

              const paletteRgb = palette.map(hexToRgb);
              const newGrid = makeGrid(gridSize);

              // 最小二乗法によるパレット照合
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
              saveHistory(newGrid, gridSize);
          }
      };
      img.src = imageSrc;
  };
  //描画終了時に保存
  const endAction = () => {
    saveHistory(grid, gridSize);
  };

    // 戻る・進むの関数
  const undo = () => {
      if (historyIndex > 0) {
          const prev = history[historyIndex - 1];
          setGrid(prev.grid);
          setGridSize(prev.size);
          setHistoryIndex(historyIndex - 1);
      }
  };

  const redo = () => {
      if (historyIndex < history.length - 1) {
          const next = history[historyIndex + 1];
          setGrid(next.grid);
          setGridSize(next.size);
          setHistoryIndex(historyIndex + 1);
      }
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

  const saveCurrentProject = async (isOverwrite: boolean = false) => {
    const name = window.prompt("作品のなまえを入力してください", "あたらしい作品");
    if (!name) return;

    const thumbCanvas = document.createElement('canvas');
    const cellSize = 1; // プレビュー用の1マスのサイズ
    thumbCanvas.width = gridSize.col * cellSize;
    thumbCanvas.height = gridSize.row * cellSize;
    const tCtx = thumbCanvas.getContext('2d');
    if (tCtx) {
        grid.forEach((row, i) => {
            row.forEach((colorID, j) => {
                tCtx.fillStyle = palette[colorID];
                tCtx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
            });
        });
    }
    const thumbnailData = thumbCanvas.toDataURL('image/webp', 0.5);
    // 2. 分岐処理
    if (isOverwrite && currentProjectId) {
      // --- 上書き保存 ---
      const updatedProjects = projects.map(p => 
        p.id === currentProjectId 
          ? { ...p, grid, size: gridSize, palette, thumbnail: thumbnailData, updatedAt: Date.now() } 
          : p
      );
      setProjects(updatedProjects);
      await set('dot-knit-projects', updatedProjects);
      alert("上書き保存しました！");
    } else {
      // --- 新規保存（または別名保存） ---
      const name = window.prompt("作品のなまえを入力してください", isOverwrite ? "コピー" : "あたらしい作品");
      if (!name) return;

      const newId = Date.now().toString();
      const newProject: Project = {
        id: newId,
        name: name,
        grid: grid,
        size: gridSize,
        palette: palette,
        updatedAt: Date.now(),
        thumbnail: thumbnailData,
        isFavorite: false
      };

      const updatedProjects = [...projects, newProject];
      setProjects(updatedProjects);
      setCurrentProjectId(newId); // 保存後はこの作品の編集モードにする
      await set('dot-knit-projects', updatedProjects);
      alert("新しく保存しました！");
    }
  };

  // 作品削除の関数
  const deleteProject = async (id: string) => {
      if (!window.confirm("この作品を完全に削除してもよろしいですか？")) return;
      
      const updated = projects.filter(p => p.id !== id);
      setProjects(updated);
      await set('dot-knit-projects', updated);
      setActiveTab('select'); // 削除したら一覧に戻る
      alert("削除しました");
  };

  // お気に入り切り替えの関数
  const toggleFavorite = async (id: string) => {
      const updated = projects.map(p => 
          p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
      );
      setProjects(updated);
      await set('dot-knit-projects', updated);
  };



  return (
    <FolderUI currentTab={activeTab} setCurrentTab={setActiveTab} tabs={MAIN_TABS}>
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        {activeTab === 'select' ? (
          /* --- 作品選択画面 --- */
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '30px', 
            padding: '20px' 
          }}>
            {/* ★ ここを復活：新規作成ボタン */}
            <button 
                onClick={createNewProject}
                style={{ 
                  padding: '20px 40px', 
                  fontSize: '20px', 
                  borderRadius: '15px', 
                  border: '4px solid var(--border-color)', 
                  backgroundColor: 'white', 
                  cursor: 'pointer', 
                  fontWeight: 'bold',
                  boxShadow: '0 6px 0 var(--border-color)',
                  transition: 'all 0.1s'
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(4px)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              ＋ あたらしくつくる
            </button>

            {/* 作品リスト */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: '20px', 
              width: '100%', 
              maxWidth: '900px' 
            }}>
              {projects.map((p) => (
                <div 
                  key={p.id} 
                  onClick={() => loadProject(p)}
                  style={{ 
                    padding: '15px 10px',
                    border: '3px solid var(--border-color)', 
                    borderRadius: '15px', 
                    backgroundColor: 'white', 
                    cursor: 'pointer',
                    overflow: 'hidden',
                    transition: 'transform 0.2s',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  
                  {/* プレビュー画像 */}
                  {/* <div style={{ 
                      width: '100%', 
                      aspectRatio: `${p.size.col} / ${p.size.row}`,
                      backgroundColor: '#f9f9f9',
                      borderRadius: '8px',
                      marginBottom: '10px',
                      backgroundImage: p.thumbnail ? `url(${p.thumbnail})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      border: '1px solid #eee'
                  }} /> */}
                  
                  <div style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '4px' }}>{p.name}</div>
                  <div style={{ fontSize: '11px', color: '#888' }}>{p.size.col}目 × {p.size.row}段</div>
                </div>
              ))}

              {/* 作品がない時のメッセージ */}
              {projects.length === 0 && (
                <div style={{ gridColumn: '1/-1', padding: '40px', color: '#999' }}>
                  最初の作品をつくろう！
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'edit' ? ( 
          /* --- 編集画面 --- */
          <Editor 
            grid={grid} palette={palette} nowColorID={nowColorID} setNowColorID={setNowColorID} 
            UpdataPaletteID={UpdataPaletteID} addColor={addColor} handleImageUpload={handleImageUpload} 
            gridSize={gridSize} resizeGrid={resizeGrid} backgroundImage={backgroundImage}
            bgOpacity={bgOpacity} setBgOpacity={setBgOpacity} penSize={penSize} setPenSize={setPenSize} 
            paintCells={paintCells} setLastPos={setLastPos} zoom={zoom} setZoom={setZoom} 
            handleRefreshConversion={handleRefreshConversion} clearGrid={clearGrid} 
            bgOffset={bgOffset} setBgOffset={setBgOffset} undo={undo} redo={redo} 
            canUndo={historyIndex > 0} canRedo={historyIndex < history.length - 1} 
            endAction={endAction} bgScale={bgScale} setBgScale={setBgScale}
            saveProject={saveCurrentProject} isProjectLoaded={currentProjectId !== null}
            isFavorite={projects.find(p => p.id === currentProjectId)?.isFavorite || false}
            onDelete={() => currentProjectId && deleteProject(currentProjectId)}
            onToggleFavorite={() => currentProjectId && toggleFavorite(currentProjectId)}
          />
        ) : (
          /* --- 作成（ビューワー）画面 --- */
          <Viewer key={`${gridSize.row}-${gridSize.col}`} grid={grid} palette={palette}/>
        )}
      </div>
    </FolderUI>
  );
}

export default App;

