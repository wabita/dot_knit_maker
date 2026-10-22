import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { useEditorContext } from './useEditorContext';
import { ColorPalette } from './ColorPalette';
import type { EditorMode } from './types';

type EditorControlsProps = {
  mode: EditorMode;
  setMode: Dispatch<SetStateAction<EditorMode>>;
};

const saveBtnStyle = (bg: string, color: string) => ({
  padding: '10px', width: '100%', backgroundColor: bg, color,
  border: '2px solid var(--border-color)', borderRadius: '10px', cursor: 'pointer',
  fontWeight: 'bold' as const, fontSize: '12px', display: 'flex', alignItems: 'center',
  justifyContent: 'center', gap: '6px',
});

export const EditorControls = ({
  mode, setMode,
}: EditorControlsProps) => {
  const {
    grid, palette,
    handleImageUpload, gridSize, resizeGrid, backgroundImage, bgOpacity, setBgOpacity,
    penSize, setPenSize, handleRefreshConversion, clearGrid, setBgOffset,
    saveProject, isProjectLoaded,
  } = useEditorContext();
  const [inputSize, setInputSize] = useState(gridSize);
  const [isSizePopoverOpen, setIsSizePopoverOpen] = useState(false);
  const [sizePopoverPosition, setSizePopoverPosition] = useState({ left: 12, top: 12 });
  const [gauge, setGauge] = useState<{ stitches: number | ''; rows: number | ''; yarnPerStitch: number }>({
    stitches: '', rows: '', yarnPerStitch: 2.5,
  });
  const sizeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setInputSize(gridSize), [gridSize]);

  useEffect(() => {
    if (!isSizePopoverOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsSizePopoverOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isSizePopoverOpen]);

  const openSizePopover = () => {
    const rect = sizeButtonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(360, window.innerWidth - 24);
    const height = Math.min(390, window.innerHeight - 24);
    const rightSide = rect.right + 8;
    const leftSide = rect.left - width - 8;
    const left = rightSide + width <= window.innerWidth - 12
      ? rightSide
      : leftSide >= 12
        ? leftSide
        : Math.max(12, (window.innerWidth - width) / 2);
    const top = Math.max(12, Math.min(rect.top, window.innerHeight - height - 12));
    setSizePopoverPosition({ left, top });
    setIsSizePopoverOpen(true);
  };

  const getColorCounts = () => {
    const counts: Record<number, number> = {};
    grid.forEach(row => row.forEach(colorID => { counts[colorID] = (counts[colorID] || 0) + 1; }));
    return counts;
  };

  return (
    <>
            <aside className="editor-control-panel">
                <div className="editor-panel-heading">
                    <h2>マス数と描画ツール</h2>
                    <button
                        ref={sizeButtonRef}
                        type="button"
                        className="editor-size-trigger"
                        aria-haspopup="dialog"
                        aria-expanded={isSizePopoverOpen}
                        onClick={() => isSizePopoverOpen ? setIsSizePopoverOpen(false) : openSizePopover()}
                    >
                        <i className="bi bi-rulers" /> 仕上がり予想
                    </button>
                </div>

                <div className="editor-size-control">
                    <label>横の目数<input type="number" min="1" max="200" value={inputSize.col} onChange={(e) => setInputSize({ ...inputSize, col: Number(e.target.value) })} /></label>
                    <label>縦の段数<input type="number" min="1" max="200" value={inputSize.row} onChange={(e) => setInputSize({ ...inputSize, row: Number(e.target.value) })} /></label>
                    <button
                        type="button"
                        aria-label="マス数を適用"
                        title="マス数を適用"
                        onClick={() => resizeGrid({
                            col: Math.max(1, Math.min(200, Math.floor(inputSize.col) || 1)),
                            row: Math.max(1, Math.min(200, Math.floor(inputSize.row) || 1)),
                        })}
                    ><i className="bi bi-check-lg" /></button>
                </div>

                <div className="editor-tool-options">
                    <span className="editor-tool-label">太さ</span>
                    {[1, 2, 3].map(size => (
                        <button
                            key={size}
                            type="button"
                            aria-label={`ペンの太さ ${size}`}
                            className={penSize === size ? 'is-selected' : ''}
                            onClick={() => setPenSize(size)}
                        ><span className={`editor-brush-dot editor-brush-dot-${size} ${penSize === size ? 'is-selected' : ''}`} aria-hidden="true" /></button>
                    ))}
                    <button type="button" className="editor-clear-button" onClick={clearGrid}>
                        <i className="bi bi-trash3-fill" /> 図案を全消し
                    </button>
                </div>

                <ColorPalette />

                <section className="editor-draft-section" aria-labelledby="draft-heading">
                    <div className="editor-draft-heading">
                        <h3 id="draft-heading">下書き</h3>
                        <span>{backgroundImage ? '画像を読み込み済み' : '画像未読み込み'}</span>
                    </div>
                    <div className="editor-draft-actions">
                        <label className="editor-upload-button">
                            <i className="bi bi-download" /> import
                            <input type="file" accept="image/*" onChange={handleImageUpload} />
                        </label>
                        <button type="button" className="editor-refresh-button" onClick={handleRefreshConversion} disabled={!backgroundImage} aria-label="画像からドットを再生成">
                            <i className="bi bi-arrow-clockwise" />
                        </button>
                    </div>
                    {backgroundImage && <>
                        <label className="editor-opacity-control">
                            <span>画像の透明度 <output>{Math.round(bgOpacity * 100)}%</output></span>
                            <div className="editor-opacity-slider">
                                <button type="button" onClick={() => setBgOpacity(0)} aria-label="透明度を0%にする">0%</button>
                                <input type="range" min="0" max="1" step="0.05" value={bgOpacity} onChange={(e) => setBgOpacity(Number(e.target.value))} />
                                <button type="button" onClick={() => setBgOpacity(1)} aria-label="透明度を100%にする">100%</button>
                            </div>
                        </label>
                        <div className="editor-draft-tools">
                            <button type="button" onClick={() => setMode(prev => prev === 'draft' ? 'pen' : 'draft')} className={mode === 'draft' ? 'is-active' : ''}>
                                <i className="bi bi-arrows-move" /> {mode === 'draft' ? '移動中' : '下書きを移動'}
                            </button>
                            <button type="button" onClick={() => setBgOffset({x: 0, y: 0})}>位置をリセット</button>
                        </div>
                    </>}
                </section>

                <div className="editor-save-actions">
                    {isProjectLoaded && (
                        <button onClick={() => saveProject(true)} style={saveBtnStyle('white', 'var(--border-color)')}>
                            <i className="bi bi-check-all" /> 上書き
                        </button>
                    )}
                    <button onClick={() => saveProject(false)} style={saveBtnStyle('var(--border-color)', 'white')}>
                        <i className="bi bi-plus-circle" /> {isProjectLoaded ? '別名' : 'ほぞん'}
                    </button>
                </div>
            </aside>

            {isSizePopoverOpen && (
                <div className="size-popover-backdrop" onPointerDown={(event) => { if (event.target === event.currentTarget) setIsSizePopoverOpen(false); }}>
                    <section
                        className="size-popover"
                        role="dialog"
                        aria-modal="false"
                        aria-labelledby="size-popover-title"
                        style={{ left: sizePopoverPosition.left, top: sizePopoverPosition.top }}
                        onPointerDown={(event) => event.stopPropagation()}
                    >
                        <header className="size-popover-header">
                        <h2 id="size-popover-title">ゲージ・仕上がり予想</h2>
                        <button type="button" aria-label="閉じる" onClick={() => setIsSizePopoverOpen(false)}>×</button>
                    </header>
                        <div className="gauge-inputs">
                            <h3>ゲージ（10cmあたり）</h3>
                            <label>横<input type="number" min="1" placeholder="目数" value={gauge.stitches} onChange={(e) => setGauge({ ...gauge, stitches: e.target.value === '' ? '' : Number(e.target.value) })} />目</label>
                            <label>縦<input type="number" min="1" placeholder="段数" value={gauge.rows} onChange={(e) => setGauge({ ...gauge, rows: e.target.value === '' ? '' : Number(e.target.value) })} />段</label>
                            <label>1目あたり<input type="number" min="0" step="0.1" value={gauge.yarnPerStitch} onChange={(e) => setGauge({ ...gauge, yarnPerStitch: Number(e.target.value) })} />cm</label>
                        </div>

                        <div className="size-estimate-panel">
                            <h3>仕上がり予想</h3>
                            <strong>
                                {typeof gauge.stitches === 'number' && gauge.stitches > 0 ? `${(inputSize.col / gauge.stitches * 10).toFixed(1)}cm` : '--'}
                                <span> × </span>
                                {typeof gauge.rows === 'number' && gauge.rows > 0 ? `${(inputSize.row / gauge.rows * 10).toFixed(1)}cm` : '--'}
                            </strong>
                            {(() => {
                                const counts = getColorCounts();
                                const totalLengthM = Object.values(counts).reduce((total, count) => total + count, 0) * gauge.yarnPerStitch / 100;
                                return (
                                    <div className="size-yarn-estimate">
                                        <div className="size-yarn-total">必要毛糸量（予想） <b>{totalLengthM.toFixed(1)}m</b></div>
                                        {Object.entries(counts).map(([id, count]) => {
                                            const colorID = Number(id);
                                            const lengthM = count * gauge.yarnPerStitch / 100;
                                            return <div className="size-yarn-row" key={id}><span><i style={{ backgroundColor: palette[colorID] }} />{palette[colorID]}</span><b>{lengthM.toFixed(1)}m</b></div>;
                                        })}
                                    </div>
                                );
                            })()}
                            {(!gauge.stitches || !gauge.rows) && <p>ゲージを入力すると、仕上がり寸法を計算します。</p>}
                        </div>
                    </section>
                </div>
            )}



    </>
  );
};
