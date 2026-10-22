import type { Dispatch, RefObject, SetStateAction } from 'react';
import { useEditorContext } from './useEditorContext';
import type { EditorMode } from './types';

type EditorCanvasProps = {
  mode: EditorMode;
  setMode: Dispatch<SetStateAction<EditorMode>>;
  offset: { x: number; y: number };
  setOffset: (offset: { x: number; y: number }) => void;
  isPanning: boolean;
  isResizing: boolean;
  setIsPanning: (value: boolean) => void;
  setIsResizing: (value: boolean) => void;
  setLastPointerPos: (position: { x: number; y: number }) => void;
  containerRef: RefObject<HTMLDivElement | null>;
  handleGridPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  handleWheel: (event: React.WheelEvent<HTMLDivElement>) => void;
};

export const EditorCanvas = (props: EditorCanvasProps) => {
  const {
    grid, palette, gridSize, backgroundImage, bgOpacity, bgOffset, bgScale, zoom, setZoom,
    undo, redo, canUndo, canRedo,
  } = useEditorContext();
  const {
    mode, setMode, offset, setOffset, isPanning,
    setIsPanning, setIsResizing, setLastPointerPos, containerRef, handleGridPointerDown, handleWheel,
  } = props;

  return (
            <div
                className="editor-canvas"
                onWheel={handleWheel}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: 'min(400px, calc(100vw - 32px))',
                    height: 'min(400px, calc(100vw - 32px))',
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
                <div className="editor-canvas-tools editor-canvas-tools-left" style={{
                    position: 'absolute', top: '10px', left: '10px', zIndex: 10,
                    display: 'flex', gap: '10px',flexDirection: 'column',justifyContent: 'center' }}>
                    <button className="editor-canvas-tool-button" aria-label="拡大" title="拡大" onClick={() => setZoom(Math.min(zoom + 0.1, 3.0))}><i className="bi bi-zoom-in"></i></button>
                    <button className="editor-canvas-tool-button" aria-label="縮小" title="縮小" onClick={() => setZoom(Math.max(zoom - 0.1, 0.5))}><i className="bi bi-zoom-out"></i></button>

                    <button onClick={() => setMode(prev => prev === 'hand' ? 'pen' : 'hand')}
                        className={`editor-canvas-tool-button ${mode === 'hand' ? 'is-active' : ''}`}
                        aria-label="手のひらツール"
                        title="手のひらツール"
                        style={{
                            backgroundColor: mode === 'hand' ? 'var(--border-color)' : 'white',
                            color: mode === 'hand' ? 'white' : 'black'
                        }}
                    >
                        <i className="bi bi-hand-index-thumb-fill"></i>
                    </button>
                    <button className="editor-canvas-tool-button" aria-label="表示をリセット" title="表示をリセット" onClick={() => { setOffset({x:0, y:0}); setZoom(1); }}><i className="bi bi-arrows-fullscreen"></i></button>
                </div>
                {/* 実際のキャンバス（グリッドエリア） */}
                <div ref={containerRef}
                    onPointerDown={handleGridPointerDown}
                    style={{
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
                                position: 'relative',
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                            }}>
                                <img
                                    src={backgroundImage}
                                    alt="下書き"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        opacity: bgOpacity,
                                        objectFit: 'contain',
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
                <div className="editor-canvas-tools editor-canvas-tools-right" style={{
                    position: 'absolute', top: '10px',right: '10px', zIndex: 10,
                    display: 'flex', gap: '10px',flexDirection: 'column',justifyContent: 'center' }}>
                    <button
                        onClick={undo}
                        disabled={!canUndo}
                        className="editor-canvas-history-button"
                        style={{ opacity: canUndo ? 1 : 0.4 }}
                    >
                        <i className="bi bi-arrow-90deg-left"></i>
                    </button>
                    <button
                        onClick={redo}
                        disabled={!canRedo}
                        className="editor-canvas-history-button"
                        style={{ opacity: canRedo ? 1 : 0.4 }}
                    >
                        <i className="bi bi-arrow-90deg-right"></i>
                    </button>

                </div>
            </div>


  );
};
