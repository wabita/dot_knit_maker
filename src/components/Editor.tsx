import { useState ,useEffect} from 'react';
import { FolderUI } from './FolderUI';

type SideTab = 'data' | 'size';

const SIDE_TABS: { label: string; value: SideTab }[] = [
  { label: '下書き', value: 'data' },
  { label: 'サイズ', value: 'size' },
];

const numInputStyle = { width: '50px', padding: '4px', border: '2px solid var(--border-color)', borderRadius: '4px', textAlign: 'center' as const, fontWeight: 'bold' as const };
const toolToggleStyle = (active: boolean) => ({ flex: 1, height: '35px', border: '2px solid var(--border-color)', borderRadius: '6px', backgroundColor: active ? 'var(--border-color)' : 'white', color: active ? 'white' : 'black', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '12px', fontWeight: 'bold' as const });
const circleBtnStyle = (enabled: boolean) => ({ cursor: enabled ? 'pointer' : 'not-allowed', width: '35px', height: '35px', border: '3px solid var(--border-color)', borderRadius: '50%', backgroundColor: 'white', opacity: enabled ? 1 : 0.4 });

const saveBtnStyle = (bg: string, color: string) => ({
    padding: '10px',
    width: '100%',
    backgroundColor: bg,
    color: color,
    border: `2px solid var(--border-color)`,
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 'bold' as const,
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px'
});

// ボタンの共通スタイルを生成する関数
const actionBtnStyle = (color: string) => ({
    padding: '8px',
    borderRadius: '8px',
    border: `2px solid ${color}`,
    backgroundColor: 'white',
    color: color,
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold' as const, // TypeScriptで文字列リテラルとして扱うために必要
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    transition: 'all 0.2s'
});

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

    bgScale: number;
    setBgScale: (val: number) => void;
    saveProject: (isOverwrite: boolean) => void;
    isProjectLoaded: boolean;
    isFavorite: boolean;
    onDelete: () => void;
    onToggleFavorite: () => void;
};

export const Editor = ({ 
    grid, palette, nowColorID, setNowColorID, 
    UpdataPaletteID, addColor, handleImageUpload ,gridSize, resizeGrid,backgroundImage,
    bgOpacity, setBgOpacity, penSize, setPenSize, paintCells, setLastPos, zoom, setZoom,
    handleRefreshConversion, clearGrid, bgOffset, setBgOffset, undo, redo, canUndo, canRedo, endAction,
    bgScale, setBgScale, saveProject, isProjectLoaded, isFavorite, onDelete, onToggleFavorite
}: EditorProps) => {
    const [inputSize, setInputSize] = useState(gridSize);
    const [isDrawing, setIsDrawing] = useState(false);

    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false); // 手のひらツール中か
    const [mode, setMode] = useState<'pen' | 'hand' | 'draft'>('pen'); // ツールモード
    const [activeTab, setActiveTab] = useState<'data' | 'size'> ('data');
    const [isResizing, setIsResizing] = useState(false);//サイズ変更中かどうか

    const [lastPointerPos, setLastPointerPos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        setInputSize(gridSize);
    }, [gridSize]);

    const handlePointerDown = (e: React.PointerEvent) => {
        if (e.cancelable) e.preventDefault();
        
        setIsPanning(true);
        setLastPointerPos({ x: e.clientX, y: e.clientY });
    };
    // マウス移動時の処理を拡張
    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isPanning && !isDrawing) return;
        if (e.cancelable) e.preventDefault();

        const deltaX = e.clientX - lastPointerPos.x;
        const deltaY = e.clientY - lastPointerPos.y;

        if (mode === 'hand') {
            setOffset(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
        } else if (mode === 'draft') {
            if (isResizing) {
                const resizeDelta = deltaX * 0.005; 
                setBgScale(Math.max(0.1, bgScale + resizeDelta));
            } else {
                setBgOffset({ x: bgOffset.x + deltaX, y: bgOffset.y + deltaY });
            }
        } else if (mode === 'pen' && isDrawing) {
            // ★ ここが「スイー」の核心：指の座標から何行目の何列目か計算する
            const container = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - container.left;
            const y = e.clientY - container.top;
            
            // コンテナ内での比率から行列を算出
            const col = Math.floor((x / container.width) * gridSize.col);
            const row = Math.floor((y / container.height) * gridSize.row);

            if (row >= 0 && row < gridSize.row && col >= 0 && col < gridSize.col) {
                paintCells(row, col);
            }
        }
        
        setLastPointerPos({ x: e.clientX, y: e.clientY });
    };
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
        setIsResizing(false); // ★ ここを忘れずに！
        setLastPos(null);
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
        <div 
            onPointerUp={stopDrawing} 
            onPointerLeave={stopDrawing} 
            onPointerMove={handlePointerMove}
            style={{ 
                touchAction: 'none', 
                userSelect: 'none',          // テキスト選択を禁止
                WebkitUserSelect: 'none',    // Safari (iPad) 用
                WebkitTouchCallout: 'none',  // 画像長押しのメニューを禁止
                display: 'inline-flex', 
                // ...既存のスタイル
            }}
        >
            
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
                            width: '150px',
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
            <div 
                onPointerDown={handlePointerDown} // ★ Pointerに変更して関数を呼ぶ
                onWheel={handleWheel}
                style={{
                    display: 'flex', 
                    flexDirection: 'column', 
                    width: '400px', 
                    height: '400px',
                    flexShrink: 0, 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    position: 'relative',
                    overflow: 'hidden', 
                    border: 'none',
                    cursor: mode === 'hand' ? (isPanning ? 'grabbing' : 'grab') : mode === 'draft' ? 'move' : 'crosshair',
                    touchAction: 'none' // ★ iPadでのスクロールや「青い選択」を防ぐ
                }}
            >
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
                            position: 'absolute',
                            top: 0, left: 0, width: '100%', height: '100%',
                            zIndex: 1,
                            pointerEvents: mode === 'draft' ? 'auto' : 'none', // モード中だけ触れる
                            transform: `translate(${bgOffset.x}px, ${bgOffset.y}px) scale(${bgScale})`,
                            transformOrigin: 'center center',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}>
                            {/* 実際の画像 */}
                            <div style={{
                                position: 'relative', // ハンドルの基準点になる
                                width: 'auto',
                                height: 'auto',
                                maxWidth: '100%',     // 親枠からはみ出さないように制限
                                maxHeight: '100%',    // 親枠からはみ出さないように制限
                                display: 'flex',      // imgタグの隙間対策
                            }}>
                                <img 
                                    src={backgroundImage}
                                    onPointerDown={(e) => {
                                        if (mode === 'pen') {
                                            e.currentTarget.setPointerCapture(e.pointerId);
                                            setIsDrawing(true);
                                            
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const col = Math.floor(((e.clientX - rect.left) / rect.width) * gridSize.col);
                                            const row = Math.floor(((e.clientY - rect.top) / rect.height) * gridSize.row);
                                            setLastPos({ i: row, j: col });
                                            paintCells(row, col);
                                        }
                                    }}
                                    alt="下書き"
                                    style={{
                                        width: 'auto',
                                        height: 'auto',
                                        maxWidth: '100%',      // コンテナに合わせて縮小
                                        maxHeight: '100%',     // コンテナに合わせて縮小
                                        opacity: bgOpacity,
                                        objectFit: 'contain',  // 念のためアスペクト比を維持
                                        userSelect: 'none',    // 画像自体の選択を防ぐ
                                        pointerEvents: 'none', // 画像自体のドラッグを防ぐ
                                    }}
                                    onContextMenu={(e) => e.preventDefault()}
                                />
                                {mode === 'draft' && (
                                    <>
                                        {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(pos => (
                                            <div
                                                key={pos}
                                                onPointerDown={(e) => {
                                                    e.stopPropagation();
                                                    e.currentTarget.setPointerCapture(e.pointerId); // ★ 指が離れても追跡を継続
                                                    setIsResizing(true);
                                                    setIsPanning(true);
                                                    setLastPointerPos({ x: e.clientX, y: e.clientY });
                                                }}
                                                style={{
                                                    position: 'absolute',
                                                    width: '10px', height: '10px',
                                                    backgroundColor: 'white',
                                                    border: `2px solid var(--border-color)`,
                                                    cursor: 'nwse-resize', 
                                                    transform: `scale(${1 / bgScale})`,
                                                    ...(pos === 'top-left' && { top: -5, left: -5 }),
                                                    ...(pos === 'top-right' && { top: -5, right: -5 }),
                                                    ...(pos === 'bottom-left' && { bottom: -5, left: -5 }),
                                                    ...(pos === 'bottom-right' && { bottom: -5, right: -5 }),
                                                    }}
                                                />
                                            ))}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    


                    {/* グリッドの描画 */}
                    {grid.map((row, i) => (
                        <div key={i} style={{ display: 'flex', flex: 1 }}>
                            {row.map((colorID, j) => (
                                <div
                                    key={`${i}-${j}`}
                                    style={{
                                        flex: 1, width: '100%', height: '100%',
                                        border: '0.5px solid rgba(0, 0, 0, 0.15)',
                                        backgroundColor: palette[colorID] === '#FFFFFF' && backgroundImage 
                                            ? 'rgba(255, 255, 255, 0.2)' 
                                            : palette[colorID],
                                        //タッチ操作で余計な挙動をさせない
                                        touchAction: 'none', 
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

                {/* 作品の保存ボタン */}
                {/* 保存ボタンエリア */}
                <div style={{ display: 'flex', gap: '5px' }}>
                    {isProjectLoaded && (
                        <button onClick={() => saveProject(true)} style={saveBtnStyle('white', 'var(--border-color)')}>
                            <i className="bi bi-check-all"></i> 上書き
                        </button>
                    )}
                    <button onClick={() => saveProject(false)} style={saveBtnStyle('var(--border-color)', 'white')}>
                        <i className="bi bi-plus-circle"></i> {isProjectLoaded ? '別名' : 'ほぞん'}
                    </button>
                </div>

                {/* ★ お気に入り & 削除ボタン（読み込み時のみ表示） */}
                {isProjectLoaded && (
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <button 
                            onClick={onToggleFavorite}
                            style={{ ...actionBtnStyle(isFavorite ? '#ffc107' : '#666'), flex: 2 }}
                        >
                            <i className={`bi bi-star${isFavorite ? '-fill' : ''}`}></i>
                            {isFavorite ? ' お気に入り中' : ' お気に入り'}
                        </button>
                        <button 
                            onClick={onDelete}
                            style={{ ...actionBtnStyle('#ff4d4f'), flex: 1 }}
                        >
                            <i className="bi bi-trash3"></i>
                        </button>
                    </div>
                )}
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
                    maxHeight: '270px', 
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


