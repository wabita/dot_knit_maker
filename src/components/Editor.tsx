import { useState } from 'react';

type EditorProps = {
    grid: number[][];
    palette: string[];
    nowColorID: number;
    setNowColorID: (id: number) => void;
    ChangeGrid: (i: number, j: number) => void;
    UpdataPaletteID: (id: number, newColor: string) => void;
    addColor: () => void;
    handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void; 
    gridSize: { row: number, col: number }; 
    resizeGrid: (newSize: { row: number, col: number }) => void;
    backgroundImage: string | null;
    bgOpacity: number;
    setBgOpacity: (val: number) => void;
};

export const Editor = ({ 
    grid, palette, nowColorID, setNowColorID, 
    ChangeGrid, UpdataPaletteID, addColor, handleImageUpload ,gridSize, resizeGrid,backgroundImage,
    bgOpacity, setBgOpacity
}: EditorProps) => {
    const [inputSize, setInputSize] = useState(gridSize);

    return (
        /* 全体*/
        <div style={{ 
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

                {/*画像変更*/}
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
            {/* 中央：キャンパス (ここが400x400の「額縁」) */}
            <div style={{
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
            }}>
                {/* 実際のキャンバス（グリッドエリア） */}
                <div style={{
                    width: gridSize.col >= gridSize.row ? '100%' : 'auto',
                    height: gridSize.row > gridSize.col ? '100%' : 'auto',
                    aspectRatio: `${gridSize.col} / ${gridSize.row}`,
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative', // ★ここが背景画像の「基準」になります
                    zIndex: 0, 
                }}>
                    {/* ▼▼▼ 下書き画像レイヤー：キャンバスの範囲内だけに表示 ▼▼▼ */}
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
                                    onClick={() => ChangeGrid(i, j)}
                                    style={{
                                        flex: 1,
                                        width: '100%',
                                        height: '100%',
                                        border: '0.5px solid rgba(0, 0, 0, 0.15)',
                                        // 背景が見えるように、白(#FFFFFF)の時は少し透けさせる
                                        backgroundColor: palette[colorID] === '#FFFFFF' && backgroundImage 
                                            ? 'rgba(255, 255, 255, 0.2)' 
                                            : palette[colorID],
                                        cursor: 'pointer',
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
                marginLeft: '7px'
            }}>
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