import { useState } from 'react';

type EditorProps = {
    grid: number[][];
    palette: string[];
    nowColorID: number;
    setNowColorID: (id: number) => void;
    UpdataPaletteID: (id: number, newColor: string) => void;
    addColor: () => void;
    handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void; 
    gridSize: { row: number, col: number }; 
    resizeGrid: (newSize: { row: number, col: number }) => void;
    backgroundImage: string | null;
    bgOpacity: number;
    setBgOpacity: (val: number) => void;
    penSize: number;
    setPenSize: (size: number) => void;
    paintCells: (i: number, j: number) => void;
    setLastPos: (pos: { i: number, j: number } | null) => void; 
    zoom: number;
    setZoom: (val: number) => void;
    handleRefreshConversion: () => void;
    clearGrid: () => void;
};

export const Editor = ({ 
    grid, palette, nowColorID, setNowColorID, 
    UpdataPaletteID, addColor, handleImageUpload ,gridSize, resizeGrid,backgroundImage,
    bgOpacity, setBgOpacity, penSize, setPenSize, paintCells, setLastPos, zoom, setZoom,
    handleRefreshConversion, clearGrid
}: EditorProps) => {
    const [inputSize, setInputSize] = useState(gridSize);
    const [isDrawing, setIsDrawing] = useState(false);

    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false); // 手のひらツール中か
    const [mode, setMode] = useState<'pen' | 'hand'>('pen'); // ツールモード

    // 描画終了時の処理
    const stopDrawing = () => {
        setIsDrawing(false);
        setIsPanning(false);
        setLastPos(null);
    };
    // マウス移動時の処理
    const handleMouseMove = (e: React.MouseEvent) => {
        if (mode === 'hand' && isPanning) {
            // 手のひらツールで掴んで移動
            setOffset(prev => ({
                x: prev.x + e.movementX,
                y: prev.y + e.movementY
            }));
        } else if (mode === 'pen' && isDrawing) {
            // ペンで描画（ここは各セル側で処理してもOKですが、イベント委譲の方がスムーズです）
        }
    };
    

    return (
        /* 全体*/
        <div onMouseUp={stopDrawing}
             onMouseLeave={stopDrawing}
             onMouseMove={handleMouseMove}
            style={{ 
                display: 'inline-flex', 
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: '10px',
                margin: '0 auto',
                justifyContent: 'flex-start',
                width: '100%'
        }}>
            
            {/* 左側*/}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center',marginRight: '3px', display: 'flex', gap: '10px' }}>
                    {/* import */}
                    <label style={{
                        cursor: 'pointer',
                        padding: '8px 15px',
                        border: '4px solid var(--border-color)',
                        borderRadius: '100vh',
                        backgroundColor: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        width: '100px',
                        margin: '0 auto'
                    }}>
                        import
                        <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleImageUpload} 
                            style={{ display: 'none' }} 
                        />
                    </label>
                    {/* 更新ボタン*/}
                    <button 
                        onClick={handleRefreshConversion}
                        disabled={!backgroundImage}
                        style={{
                            cursor: backgroundImage ? 'pointer' : 'not-allowed',
                            padding: '8px', border: '4px solid var(--border-color)',
                            borderRadius: '50%', backgroundColor: 'white', fontSize: '14px',
                            opacity: backgroundImage ? 1 : 0.4
                        }}
                        title="現在のパレットで再変換"
                        ><i className="bi bi-arrow-clockwise"></i></button>
                </div>

                {/*画像サイズ変更*/}
                <div style={{ 
                        display: 'flex', flexDirection: 'column', gap: '5px', 
                        padding: '10px', border: '2px solid var(--border-color)', borderRadius: '8px' 
                    }}>
                        <div style={{ fontSize: '11px', fontWeight: 'bold' }}>SIZE</div>
                        <div style={{flexDirection: 'row', display: 'flex', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
                                <input 
                                    type="number" 
                                    value={inputSize.col} 
                                    onChange={(e) => setInputSize({...inputSize, col: Number(e.target.value)})}
                                    style={{ width: '40px', border: '1px solid #ccc' }} 
                                /> 目
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
                                <input 
                                    type="number" 
                                    value={inputSize.row} 
                                    onChange={(e) => setInputSize({...inputSize, row: Number(e.target.value)})}
                                    style={{ width: '40px', border: '1px solid #ccc' }} 
                                /> 段
                            </div>
                            <button 
                                onClick={() => resizeGrid(inputSize)}
                                style={{ 
                                    marginTop: '5px', fontSize: '10px', cursor: 'pointer',
                                    backgroundColor: 'var(--border-color)', color: 'white', border: 'none', borderRadius: '4px' 
                                }}
                            >
                                リサイズ
                            </button>
                        </div>
                </div>  

                {/* ✎ / ✋ モード切り替え */}
                <div style={{ display: 'flex', gap: '5px', padding: '10px', border: '2px solid var(--border-color)', borderRadius: '8px' }}>
                    <button 
                        onClick={() => setMode('pen')}
                        style={{ flex: 1, height: '30px', cursor: 'pointer', backgroundColor: mode === 'pen' ? 'var(--border-color)' : 'white', color: mode === 'pen' ? 'white' : 'black' }}
                    ><i className="bi bi-pencil-fill"></i></button>
                    <button 
                        onClick={() => setMode('hand')}
                        style={{ flex: 1, height: '30px', cursor: 'pointer', backgroundColor: mode === 'hand' ? 'var(--border-color)' : 'white', color: mode === 'hand' ? 'white' : 'black' }}
                    ><i className="bi bi-hand-index-thumb-fill"></i></button>
                </div>

                {/*拡大縮小ボタン */}
                <div style={{ 
                    display: 'flex', flexDirection: 'column', gap: '5px', 
                    padding: '10px', border: '2px solid var(--border-color)', borderRadius: '8px' 
                }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold' }}>ZOOM</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                        <button 
                            onClick={() => setZoom(Math.max(zoom - 0.1, 0.5))}
                            style={{ cursor: 'pointer', borderRadius: '50%', width: '30px', height: '30px', backgroundColor: 'var(--border-color)', color: 'white' }}
                        ><i className="bi bi-zoom-out"></i></button>
                        <button 
                            onClick={() => setZoom(Math.min(zoom + 0.1, 3.0))}
                            style={{ cursor: 'pointer', borderRadius: '50%', width: '30px', height: '30px', backgroundColor: 'var(--border-color)', color: 'white' }}
                        ><i className="bi bi-zoom-in"></i></button>
                        <button 
                            onClick={() => { setOffset({x:0, y:0}); setZoom(1); }}
                            style={{ cursor: 'pointer', borderRadius: '50%', width: '30px', height: '30px', backgroundColor: 'var(--border-color)', color: 'white' }}
                        ><i className="bi bi-arrows-fullscreen"></i></button>
                    </div>
                </div>
                {/* 背景画像の不透明度 */}
                <div style={{ 
                    display: 'flex', flexDirection: 'column', gap: '5px', 
                    padding: '10px', border: 'none', borderRadius: '8px',
                }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold' }}>下書き透明度</div>
                    <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.05" 
                        value={bgOpacity} 
                        onChange={(e) => setBgOpacity(Number(e.target.value))}
                        style={{ width: '100%', cursor: 'pointer',accentColor: 'var(--border-color)' }} 
                    />
                    <div style={{ fontSize: '10px', textAlign: 'right' }}>
                        {Math.round(bgOpacity * 100)}%
                    </div>
                </div>
            </div>
            {/* 中央：キャンパス */}
            <div onMouseDown={() => mode === 'hand' && setIsPanning(true)}
                style={{
                display: 'flex',
                flexDirection: 'column',
                width: '400px',
                height: '400px',
                flexShrink: 0,
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                border: 'none',
                overflow: 'hidden',
                cursor: mode === 'hand' ? (isPanning ? 'grabbing' : 'grab') : 'crosshair'
            }}>
                {/* 実際のキャンバス（グリッドエリア） */}
                <div style={{
                    width: gridSize.col >= gridSize.row ? '100%' : 'auto',
                    height: gridSize.row > gridSize.col ? '100%' : 'auto',
                    aspectRatio: `${gridSize.col} / ${gridSize.row}`,
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative', 
                    zIndex: 0, 
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                    transformOrigin: 'center center',
                    transition: isPanning ? 'none' : 'transform 0.1s ease-out',
                    
                }}>
                    {/*下書き画像レイヤー */}
                    {backgroundImage && (
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            backgroundImage: `url(${backgroundImage})`,
                            // contain は、枠（キャンバス）の短い辺に合わせて比率を保ちます
                            backgroundSize: 'contain', 
                            // ★ 下辺の中央に揃える
                            backgroundPosition: 'bottom center', 
                            backgroundRepeat: 'no-repeat',
                            opacity: bgOpacity,
                            zIndex: 1, 
                            pointerEvents: 'none'
                        }} />
                    )}

                    {/* グリッドの描画 */}
                    {grid.map((row, i) => (
                        <div key={i} style={{ display: 'flex', flex: 1 }}>
                            {row.map((colorID, j) => (
                                <div
                                    key={`${i}-${j}`}
                                    onMouseDown={() => {
                                        if (mode === 'pen') {
                                            setIsDrawing(true);
                                            paintCells(i, j);
                                        }
                                    }}
                                    onMouseEnter={() => {
                                        if (isDrawing && mode === 'pen') {
                                            paintCells(i, j);}
                                    }}

                                    style={{
                                        flex: 1,
                                        width: '100%',
                                        height: '100%',
                                        border: '0.5px solid rgba(0, 0, 0, 0.15)',
                                        // 背景が見えるように、白(#FFFFFF)の時は少し透けさせる
                                        cursor: 'crosshair',
                                        backgroundColor: palette[colorID] === '#FFFFFF' && backgroundImage 
                                            ? 'rgba(255, 255, 255, 0.2)' 
                                            : palette[colorID],
                                    }}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* 右側：パレット */}
            <div style={{ 
                position: 'relative', 
                display: 'flex', 
                flexDirection: 'column',
                alignSelf: 'flex-start',
                marginLeft: '7px',
                gap: '15px'
            }}>
                {/* ペンサイズ選択 */}
                <div style={{ 
                    display: 'flex', gap: '5px', padding: '10px', 
                    border: '4px solid var(--border-color)', borderRadius: '8px', backgroundColor: '#f4f1e8' ,
                    paddingBottom: '10px',
                    justifyContent: 'center', 
                    marginBottom: '10px'
                }}>
                    {[1, 2, 3].map(size => (
                        <button
                            key={size}
                            onClick={() => setPenSize(size)}
                            style={{
                                width: '30px', height: '30px', cursor: 'pointer',
                                backgroundColor: penSize === size ? 'var(--border-color)' : 'white',
                                color: penSize === size ? 'white' : 'black',
                                border: '1px solid #ccc', borderRadius: '4px',
                                fontFamily: 'DotFont',
                                fontSize: `${6 + (size * 4)}px`,

                            }}
                        >
                            ●
                        </button>
                    ))}
                    {/*全消しボタン */}
                    <div style={{ width: '1px', backgroundColor: '#ccc', margin: '0 5px' }} /> {/* 区切り線 */}
                    <button
                        onClick={clearGrid}
                        style={{
                            width: '30px', height: '30px', cursor: 'pointer',
                            backgroundColor: 'white', color: '#d9534f', // 少し赤みを持たせて警告色に
                            border: '1px solid #ccc', borderRadius: '4px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        title="すべてリセット"
                    ><i className="bi bi-trash3-fill"></i>
                    </button>
                </div>
                {/* カラーパレットリスト */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: '130px',
                    border: '4px solid var(--border-color)',
                    borderRadius: '8px',
                    backgroundColor: '#f4f1e8',
                    maxHeight: '300px', 
                    overflowY: 'auto',
                    paddingTop: '20px',
                    paddingBottom: '20px'
                }}>
                    {palette.map((color, id) => (
                        <div key={id} style={{ margin: '8px', display: 'flex' }}>
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => UpdataPaletteID(id, e.target.value)}
                                style={{ width: '30px', height: '30px', cursor: 'pointer', flexShrink: 0 }}
                            />
                            <button
                                onClick={() => setNowColorID(id)}
                                style={{
                                    fontFamily: 'monospace', 
                                    fontSize: '12px', 
                                    marginLeft: '5px', 
                                    border: 'none', 
                                    background: nowColorID === id ? 'var(--dot-color)' : '#fff',
                                    flexGrow: 1,
                                    padding: '5px',
                                    width: '100px',
                                }}
                            >
                                {color.toUpperCase()}
                            </button>
                        </div>
                    ))} 
                </div>
                
                {/* ＋ボタン */}
                <button 
                    onClick={addColor} 
                    style={{ 
                        color: 'var(--border-color)',
                        fontFamily: 'DotFont',
                        position: 'absolute', 
                        right: '-10px', 
                        bottom: '-10px', 
                        width: '50px', 
                        height: '35px', 
                        borderRadius: '20px', 
                        border: '4px solid var(--border-color)', 
                        backgroundColor: 'white',
                        fontSize: '20px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10
                    }}
                >
                    +
                </button>
            </div>
        </div>
    );
};