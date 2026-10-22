import { useState, useRef } from 'react';
import { EditorCanvas } from './EditorCanvas';
import { EditorControls } from './EditorControls';
import { useEditorContext } from './EditorContext';
import type { EditorMode } from './types';

export const Editor = () => {
    const props = useEditorContext();
    const {
        gridSize, bgOffset, setBgOffset, bgScale, setBgScale, paintCells, setLastPos,
        zoom, setZoom, undo, redo, canUndo, canRedo, endAction,
    } = props;
    const [isDrawing, setIsDrawing] = useState(false);//描画中か
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false); // 手のひらツールか
    const [mode, setMode] = useState<EditorMode>('pen'); // ツールモード
    const [isResizing, setIsResizing] = useState(false);//サイズ変更中かどうか

    const [lastPointerPos, setLastPointerPos] = useState({ x: 0, y: 0 });
    // 画面の要素に直接アクセスしたり、値だけを静かに保持するためのRef
    const containerRef = useRef<HTMLDivElement>(null);
    // 前回の描画位置を記憶しておくためのRef
    const lastDrawPosRef = useRef<{ row: number; col: number } | null>(null);


    // マウス移動時の処理を拡張
    const handleGridPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        if (e.cancelable) e.preventDefault();

        if (mode === 'pen') {
            // iPadOS は Apple Pencil を pointerType="pen" として届ける。
            // 指・マウスも同じ Pointer Events 経路なので、スマホでも描画できる。
            e.currentTarget.setPointerCapture(e.pointerId);
            setIsDrawing(true);

            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const col = Math.floor((x / rect.width) * gridSize.col);
            const row = Math.floor((y / rect.height) * gridSize.row);

            lastDrawPosRef.current = { row, col };

            setLastPos({ i: row, j: col });
            paintCells(row, col);
            setIsDrawing(true);
        }
        else {
            setIsPanning(true);
        }
        setLastPointerPos({ x: e.clientX, y: e.clientY });
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect || (!isPanning && !isDrawing)) return;

        const deltaX = e.clientX - lastPointerPos.x;
        const deltaY = e.clientY - lastPointerPos.y;

        if (mode === 'hand') {
            setOffset(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
        } else if (mode === 'draft' && isPanning && !isResizing) {
            setBgOffset({ x: bgOffset.x + deltaX, y: bgOffset.y + deltaY });
        } else if (mode === 'draft' && isResizing) {
            // ★ ここを追加：下書きの拡大縮小処理
            // マウスの横方向の移動量（deltaX）を使ってサイズを変えます
            // 右に引っ張ると拡大、左に押し込むと縮小するシンプルな仕組みです
            const scaleChange = deltaX * 0.005;

            // サイズが0やマイナスになると見えなくなってしまうので、Math.maxで最低「0.1倍」までに制限します
            setBgScale(Math.max(0.1, bgScale + scaleChange));
        } else if (mode === 'pen' && isDrawing) {
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const col = Math.floor((x / rect.width) * gridSize.col);
            const row = Math.floor((y / rect.height) * gridSize.row);

            if (row >= 0 && row < gridSize.row && col >= 0 && col < gridSize.col) {
                // ★ 修正：Refから前回の座標を取得
                const lastPos = lastDrawPosRef.current;
                const lastRow = lastPos ? lastPos.row : row;
                const lastCol = lastPos ? lastPos.col : col;

                const dist = Math.max(Math.abs(row - lastRow), Math.abs(col - lastCol));

                for (let n = 0; n <= dist; n++) {
                    const t = dist === 0 ? 0 : n / dist;
                    const r = Math.round(lastRow + (row - lastRow) * t);
                    const c = Math.round(lastCol + (col - lastCol) * t);
                    paintCells(r, c);
                }

                // ★ 修正：Refを更新
                lastDrawPosRef.current = { row, col };
            }
        }
        setLastPointerPos({ x: e.clientX, y: e.clientY });
    };
    // 描画終了時の処理
    const stopDrawing = () => {
        if (isDrawing && mode === 'pen') {
            endAction();
        }
        setIsDrawing(false);
        setIsPanning(false);
        setIsResizing(false);
        setLastPos(null);
        lastDrawPosRef.current = null;
    };

    const handlePointerCancel = () => {
        stopDrawing();
    };

    // ホイール操作で拡大縮小
    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
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
            className="editor-layout"
            onPointerUp={stopDrawing}
            onPointerCancel={handlePointerCancel}
            onPointerMove={handlePointerMove}
            style={{
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
            }}
        >

            <EditorCanvas
                mode={mode} setMode={setMode} offset={offset} setOffset={setOffset}
                isPanning={isPanning} isResizing={isResizing}
                setIsPanning={setIsPanning} setIsResizing={setIsResizing} setLastPointerPos={setLastPointerPos}
                containerRef={containerRef} handleGridPointerDown={handleGridPointerDown} handleWheel={handleWheel}
            />

            <EditorControls mode={mode} setMode={setMode} />
        </div>
    );
};
