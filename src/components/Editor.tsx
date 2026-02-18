import { useState } from 'react';
import { FolderUI } from './FolderUI';

type SideTab = 'data' | 'size';

const SIDE_TABS: { label: string; value: SideTab }[] = [
  { label: '下書き', value: 'data' },
  { label: 'サイズ', value: 'size' },
];

const numInputStyle = { width: '50px', padding: '4px', border: '2px solid var(--border-color)', borderRadius: '4px', textAlign: 'center' as const, fontWeight: 'bold' as const };
const toolToggleStyle = (active: boolean) => ({ flex: 1, height: '35px', border: '2px solid var(--border-color)', borderRadius: '6px', backgroundColor: active ? 'var(--border-color)' : 'white', color: active ? 'white' : 'black', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '12px', fontWeight: 'bold' as const });
const circleBtnStyle = (enabled: boolean) => ({ cursor: enabled ? 'pointer' : 'not-allowed', width: '35px', height: '35px', border: '3px solid var(--border-color)', borderRadius: '50%', backgroundColor: 'white', opacity: enabled ? 1 : 0.4 });
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
    bgOffset: { x: number, y: number };
    setBgOffset: (offset: { x: number, y: number }) => void;

    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    endAction: () => void;
};

export const Editor = ({ 
    grid, palette, nowColorID, setNowColorID, 
    UpdataPaletteID, addColor, handleImageUpload ,gridSize, resizeGrid,backgroundImage,
    bgOpacity, setBgOpacity, penSize, setPenSize, paintCells, setLastPos, zoom, setZoom,
    handleRefreshConversion, clearGrid, bgOffset, setBgOffset, undo, redo, canUndo, canRedo, endAction
}: EditorProps) => {
    const [inputSize, setInputSize] = useState(gridSize);
    const [isDrawing, setIsDrawing] = useState(false);

    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false); // 手のひらツール中か
    const [mode, setMode] = useState<'pen' | 'hand' | 'draft'>('pen'); // ツールモード
    const [activeTab, setActiveTab] = useState<'data' | 'size'> ('data');
    // 計算用ステート（ゲージ計算など）
    const [gauge, setGauge] = useState<{
        stitches: number | ''; 
        rows: number | '';
        yarnPerStitch: number;
    }>({
        stitches: '', 
        rows: '',
        yarnPerStitch: 2.5,
    });
    // 各色の使用数を数える
    const getColorCounts = () => {
        const counts: Record<number, number> = {};
        grid.forEach(row => {
            row.forEach(colorID => {
                counts[colorID] = (counts[colorID] || 0) + 1;
            });
        });
        return counts;
    };

    // 描画終了時の処理
    const stopDrawing = () => {
        if (isDrawing && mode === 'pen') {
            endAction();
        }
        setIsDrawing(false);
        setIsPanning(false);
        setLastPos(null);
    };
    // マウス移動時の処理
    const handleMouseMove = (e: React.MouseEvent) => {
        if (isPanning) {
            if (mode === 'hand') {
                setOffset(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
            } else if (mode === 'draft') {
                setBgOffset({ x: bgOffset.x + e.movementX, y: bgOffset.y + e.movementY });
            }
        }
    };

    // ホイール操作で拡大縮小
    const handleWheel = (e: React.WheelEvent) => {
        // e.deltaY がマイナスなら上（奥）へ回転 ＝ 拡大
        // e.deltaY がプラスなら下（手前）へ回転 ＝ 縮小
        if (e.deltaY < 0) {
            setZoom(Math.min(zoom + 0.1, 3.0)); // 最大300%
        } else {
            setZoom(Math.max(zoom - 0.1, 0.5)); // 最小50%
        }
    };
    

    return (
        <div onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onMouseMove={handleMouseMove}
            style={{ display: 'inline-flex', flexDirection: 'row', alignItems: 'flex-start', gap: '10px', width: '100%' }}>
            
            {/* 左側：サイドバー */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '260px' }}>
                <FolderUI 
                currentTab={activeTab} 
                setCurrentTab={setActiveTab} 
                tabs={SIDE_TABS}
                isSmall
                >
                    <div style={{ 
                            padding: '15px 0', 
                            height: '180px', 
                            minHeight: '180px', 
                            boxSizing: 'border-box',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-start'
                    }}>
                        {activeTab === 'data' ? (
                            /*  下書き管理タブ  */
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center' }}>
                                    <label style={{ cursor: 'pointer', padding: '8px 15px', border: '3px solid var(--border-color)', borderRadius: '100vh', backgroundColor: 'white', fontSize: '12px', fontWeight: 'bold' }}>
                                        import<input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                                    </label>
                                    <button onClick={handleRefreshConversion} disabled={!backgroundImage} style={circleBtnStyle(!!backgroundImage)}>
                                        <i className="bi bi-arrow-clockwise"></i>
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 'bold' }}>下書き透明度</div>
                                    <input type="range" min="0" max="1" step="0.05" value={bgOpacity} onChange={(e) => setBgOpacity(Number(e.target.value))} style={{ accentColor: 'var(--border-color)' }} />
                                </div>
                                <button onClick={() => setMode(prev => prev === 'draft' ? 'pen' : 'draft')} style={toolToggleStyle(mode === 'draft')}>
                                    <i className="bi bi-arrows-move"></i> {mode === 'draft' ? '移動中' : '下書きを移動'}
                                </button>
                                <button onClick={() => setBgOffset({x:0, y:0})} style={{ fontSize: '10px', padding: '5px', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>位置リセット</button>
                            </div>
                        ) : (
                            /*  ゲージ設定タブ  */
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div style={{ fontSize: '11px', fontWeight: 'bold', borderBottom: '2px solid #eee', paddingBottom: '5px' }}>
                                    基準ゲージ (10cmあたり)
                                </div>
                                
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexDirection: 'column' }}>
                                    <div style={{ fontSize: '11px' }}>
                                        横: <input 
                                            type="number" 
                                            placeholder="--"
                                            value={gauge.stitches || ''} 
                                            onChange={(e) => setGauge({...gauge, stitches: e.target.value === '' ? '' : Number(e.target.value)})} 
                                            style={numInputStyle} 
                                        /> 目
                                    </div>
                                    <div style={{ fontSize: '11px' }}>
                                        縦: <input 
                                            type="number" 
                                            placeholder="--"
                                            value={gauge.rows || ''} 
                                            onChange={(e) => setGauge({...gauge, rows: e.target.value === '' ? '' : Number(e.target.value)})} 
                                            style={numInputStyle} 
                                        /> 段
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </FolderUI>
                {/* SIZE設定 */}
                <div style={{ padding: '10px', border: 'none', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <input type="number" value={inputSize.col} onChange={(e) => setInputSize({...inputSize, col: Number(e.target.value)})} style={{ width: '40px' }} />
                        <div style={{ fontSize: '10px', fontWeight: 'bold' }}>目</div>
                        <input type="number" value={inputSize.row} onChange={(e) => setInputSize({...inputSize, row: Number(e.target.value)})} style={{ width: '40px' }} />
                        <div style={{ fontSize: '10px', fontWeight: 'bold' }}>段</div>
                        <button onClick={() => resizeGrid(inputSize)} style={{ fontSize: '10px', cursor: 'pointer', borderRadius: '50%', border: '2px solid var(--border-color)', backgroundColor: 'white', width: '30px', height: '30px' }}> ▶︎</button>
                    </div>
                </div>

                {/* 仕上がり予想サイズ & 毛糸量予想表示 */}
                {typeof gauge.stitches === 'number' && gauge.stitches > 0 ? (
                    <div style={{ 
                        marginTop: '10px', padding: '10px 12px',
                        backgroundColor: 'var(--folder-bg)', border: '2px dashed var(--border-color)',
                        borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '10px', color: '#666' }}>仕上がり予想</div>
                            <div style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--border-color)' }}>
                                {((inputSize.col / gauge.stitches) * 10).toFixed(1)}cm × 
                                {typeof gauge.rows === 'number' && gauge.rows > 0 
                                    ? ((inputSize.row / gauge.rows) * 10).toFixed(1) 
                                    : '--'}cm
                            </div>
                        </div>

                        <div style={{ height: '1px', backgroundColor: 'var(--border-color)', opacity: 0.2 }}></div>

                        <div>
                            <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>必要毛糸量（予想）</div>
                            {(() => {
                                const counts = getColorCounts();
                                const totalStitches = Object.values(counts).reduce((a, b) => a + b, 0);
                                const totalLengthM = (totalStitches * (gauge.yarnPerStitch || 0)) / 100;

                                return (
                                    <>
                                        <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', textAlign: 'center' }}>
                                            Total: {totalLengthM.toFixed(1)} m
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '100px', overflowY: 'auto' }}>
                                            {Object.entries(counts).map(([id, count]) => {
                                                const colorID = Number(id);
                                                const lengthM = (count * (gauge.yarnPerStitch || 0)) / 100;
                                                return (
                                                    <div key={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                            <div style={{ width: '10px', height: '10px', backgroundColor: palette[colorID], border: '1px solid #ccc' }}></div>
                                                            <span style={{ fontFamily: 'monospace' }}>{palette[colorID]}</span>
                                                        </div>
                                                        <span style={{ fontWeight: 'bold' }}>{lengthM.toFixed(1)} m</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                        
                        <div style={{ fontSize: '9px', color: '#888', textAlign: 'right', marginTop: '4px' }}>
                            1目 ≈ <input 
                                type="number" 
                                step="0.1"
                                value={gauge.yarnPerStitch} 
                                onChange={(e) => setGauge({...gauge, yarnPerStitch: Number(e.target.value)})}
                                style={{ width: '30px', border: 'none', background: 'none', borderBottom: '1px solid #ccc', fontSize: '10px', textAlign: 'center' }} 
                            /> cmで計算
                        </div>
                    </div>
                ) : (
                    <div style={{ height: '45px', marginTop: '5px' }}></div>
                )}
            </div> {/* 左側サイドバーの閉じタグ */}

            {/* 中央*/}
            <div onMouseDown={() => (mode === 'hand' || mode === 'draft') && setIsPanning(true)}
                 onWheel={handleWheel}
                 style={{
                    display: 'flex', flexDirection: 'column', width: '400px', height: '400px',
                    flexShrink: 0, alignItems: 'center', justifyContent: 'center', position: 'relative',
                    overflow: 'hidden', border: 'none',

                    cursor: mode === 'hand' ? (isPanning ? 'grabbing' : 'grab') : mode === 'draft' ? 'move' : 'crosshair'
                }}>
                {/*拡大縮小・配置リセット */}
                <div style={{ 
                    position: 'absolute', top: '10px', left: '10px', zIndex: 10,
                    display: 'flex', gap: '10px',flexDirection: 'column',justifyContent: 'center' }}>
                    <button onClick={() => setZoom(Math.min(zoom + 0.1, 3.0))} style={{ width: '30px', height: '30px', borderRadius: '50%' }}><i className="bi bi-zoom-in"></i></button>
                    <button onClick={() => setZoom(Math.max(zoom - 0.1, 0.5))} style={{ width: '30px', height: '30px', borderRadius: '50%' }}><i className="bi bi-zoom-out"></i></button>

                    <button onClick={() => setMode(prev => prev === 'hand' ? 'pen' : 'hand')} 
                        style={{ 
                            width: '30px', height: '30px', borderRadius: '50%',
                            backgroundColor: mode === 'hand' ? 'var(--border-color)' : 'white', 
                            color: mode === 'hand' ? 'white' : 'black' 
                        }}
                    >
                        <i className="bi bi-hand-index-thumb-fill"></i>
                    </button>
                    <button onClick={() => { setOffset({x:0, y:0}); setZoom(1); }} style={{ width: '30px', height: '30px', borderRadius: '50%' }}><i className="bi bi-arrows-fullscreen"></i></button>
                </div>
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
                            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                            backgroundImage: `url(${backgroundImage})`, backgroundSize: 'contain',
                            backgroundPosition: 'bottom center', backgroundRepeat: 'no-repeat',
                            opacity: bgOpacity, zIndex: 1, pointerEvents: 'none',
                            transform: `translate(${bgOffset.x}px, ${bgOffset.y}px)`
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
                                            paintCells(i, j);
                                        }
                                    }}
                                    style={{
                                        flex: 1, width: '100%', height: '100%',
                                        border: '0.5px solid rgba(0, 0, 0, 0.15)',
                                        backgroundColor: palette[colorID] === '#FFFFFF' && backgroundImage 
                                            ? 'rgba(255, 255, 255, 0.2)' 
                                            : palette[colorID],
                                    }}
                                />
                            ))}
                        </div>
                    ))}
                </div>
                {/*戻る進むボタン */}
                <div style={{ 
                    position: 'absolute', top: '10px',right: '10px', zIndex: 10,
                    display: 'flex', gap: '10px',flexDirection: 'column',justifyContent: 'center' }}>
                    <button 
                        onClick={undo} 
                        disabled={!canUndo}
                        style={{ ...historyBtnStyle, opacity: canUndo ? 1 : 0.4 }}
                    >
                        <i className="bi bi-arrow-90deg-left"></i>
                    </button>
                    <button 
                        onClick={redo} 
                        disabled={!canRedo}
                        style={{ ...historyBtnStyle, opacity: canRedo ? 1 : 0.4 }}
                    >
                        <i className="bi bi-arrow-90deg-right"></i>
                    </button>

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

// スタイル定数
const historyBtnStyle = {
    width: '40px', height: '35px', cursor: 'pointer',
    backgroundColor: 'white', border: '2px solid var(--border-color)', borderRadius: '4px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px'
};


