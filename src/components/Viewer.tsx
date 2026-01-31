type ViewerProps = {
    grid: number[][];
    palette: string[];
    gridSize: { row: number, col: number }; // ★これを受け取るように追加
};

export const Viewer = ({ grid, palette, gridSize }: ViewerProps) => {
    return (
        /* 外側の400px固定枠（Editorと共通） */
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            width: '400px',
            height: '400px',
            flexShrink: 0,
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto', // 中央寄せ
        }}>
            {/* アスペクト比計算用のコンテナ（Editorと共通） */}
            <div style={{
                width: gridSize.col >= gridSize.row ? '100%' : 'auto',
                height: gridSize.row > gridSize.col ? '100%' : 'auto',
                aspectRatio: `${gridSize.col} / ${gridSize.row}`,
                display: 'flex',
                flexDirection: 'column',
            }}>
                {grid.map((row, i) => (
                    /* 行：flex: 1 で高さを均等に */
                    <div key={i} style={{ display: 'flex', flex: 1 }}>
                        {row.map((colorID, j) => (
                            /* マス：flex: 1 で幅を均等に */
                            <div
                                key={`${i}-${j}`}
                                style={{
                                    flex: 1, // ★これが必要
                                    width: '100%',
                                    height: '100%',
                                    border: '0.5px solid rgba(0, 0, 0, 0.15)',
                                    backgroundColor: palette[colorID],
                                }}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};