import { useState } from 'react'; 

type ViewerProps = {
    grid: number[][];
    palette: string[];
};

// 2次元配列を右に90度回転させる関数
const rotateGrid90 = (grid: number[][]): number[][] => {
    const rows = grid.length;
    if (rows === 0) return [];
    const cols = grid[0].length;
    const newGrid = Array.from({ length: cols }, () => Array(rows).fill(0));
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            newGrid[c][rows - 1 - r] = grid[r][c];
        }
    }
    return newGrid;
};

export const Viewer = ({ grid, palette }: ViewerProps) => {
    const [displayGrid, setDisplayGrid] = useState(grid);
    const [currentRow, setCurrentRow] = useState(1);
    const [checkedStates, setCheckedStates] = useState<Record<number, boolean[]>>({});
    const [rowDirections, setRowDirections] = useState<Record<number, 'R' | 'L'>>({});

    // 進行方向の判定
    const currentDir = rowDirections[currentRow] || (currentRow % 2 !== 0 ? 'R' : 'L');
    const isRightToLeft = currentDir === 'R';

    const totalRows = displayGrid.length;
    const totalCols = displayGrid[0]?.length || 0;
    const gridRowIdx = totalRows - currentRow;
    const activeRow = displayGrid[gridRowIdx];

    // 指示（目数）の集計
    const getInstructions = () => {
        if (!activeRow) return [];
        const instructions = [];
        let count = 1;
        const rowData = isRightToLeft ? [...activeRow].reverse() : [...activeRow];
        for (let i = 0; i < rowData.length; i++) {
            if (rowData[i] === rowData[i + 1]) {
                count++;
            } else {
                instructions.push({ colorID: rowData[i], count });
                count = 1;
            }
        }
        return instructions;
    };

    const instructions = getInstructions();
    const currentChecks = checkedStates[currentRow] || new Array(instructions.length).fill(false);

    const toggleCheck = (idx: number) => {
        const rowChecks = [...currentChecks];
        rowChecks[idx] = !rowChecks[idx];
        setCheckedStates({ ...checkedStates, [currentRow]: rowChecks });
    };

    // データを物理的に回転させる
    const rotate = () => {
        setDisplayGrid(prev => rotateGrid90(prev));
        setCurrentRow(1); // 回転したら1段目からやり直し
        setCheckedStates({});
    };

    const toggleDirection = () => {
        setRowDirections(prev => ({ ...prev, [currentRow]: currentDir === 'R' ? 'L' : 'R' }));
    };

    const btnStyle = {
        width: '40px', 
        height: '40px', 
        borderRadius: '50%', 
        border: '3px solid var(--border-color)', 
        backgroundColor: 'white',
        cursor: 'pointer', 
        fontSize: '20px', 
        color: 'var(--border-color)', 
        fontWeight: 'bold' as const, // TypeScript用の型指定
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        transition: 'transform 0.1s'
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'row', gap: '30px', alignItems: 'flex-start', justifyContent: 'center', width: '100%' }}>
            
            {/* 左側：プレビュー */}
            <div style={{ display: 'flex', width: '400px', height: '400px', flexShrink: 0, alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{
                    width: totalCols >= totalRows ? '100%' : 'auto',
                    height: totalRows >= totalCols ? '100%' : 'auto',
                    aspectRatio: `${totalCols} / ${totalRows}`,
                    display: 'flex', flexDirection: 'column',
                    backgroundColor: '#1a1a1a', 
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                    transition: 'none'
                }}>
                    {displayGrid.map((row, i) => {
                        const isCurrent = i === gridRowIdx;
                        const isFinished = i > gridRowIdx; // 編み終わった段

                        return (
                            <div key={i} style={{ 
                                display: 'flex', flex: 1, width: '100%', position: 'relative',
                                opacity: isFinished ? 0.15 : 1,
                                outline: isCurrent ? '2px solid #ff0000' : 'none',
                                outlineOffset: '-2px',
                                zIndex: isCurrent ? 10 : 1,
                                transition: 'opacity 0.2s ease, outline 0.1s ease'
                            }}>
                                {row.map((colorID, j) => (
                                    <div key={`${i}-${j}`} style={{ flex: 1, height: '100%', backgroundColor: palette[colorID], boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.05)' }} />
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 右側：操作パネル */}
            <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '15px' }}>

                {/* 回転ボタンを独立した行にして、右寄せにする */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: '5px' }}>
                    <button 
                        onClick={rotate}
                        style={{
                            width: '40px', height: '40px', borderRadius: '50%',
                            border: '3px solid var(--border-color)', backgroundColor: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            transition: 'transform 0.2s'
                        }}
                        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
                        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <i className="bi bi-arrow-clockwise" style={{ fontSize: '20px', color: 'var(--border-color)' }}></i>
                    </button>
                </div>

                {/* 段数カウンターセクション */}
                <div style={{ 
                    display: 'flex', alignItems: 'center', gap: '15px', justifyContent: 'center', 
                    padding: '15px', border: '4px solid var(--border-color)', borderRadius: '12px', backgroundColor: 'white' 
                }}>
                    <button onClick={() => setCurrentRow(prev => Math.max(1, prev - 1))} style={btnStyle}>-</button>
                    <div style={{ textAlign: 'center', minWidth: '60px' }}>
                        <span style={{ fontSize: '32px', fontWeight: 'bold', fontFamily: 'DotFont' }}>{currentRow}</span>
                        <div style={{ fontSize: '10px', fontWeight: 'bold' }}>段目</div>
                    </div>
                    <button onClick={() => setCurrentRow(prev => Math.min(totalRows, prev + 1))} style={btnStyle}>+</button>
                </div>

                <div onClick={toggleDirection} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px', cursor: 'pointer',justifyContent: 'center', }}>
                    <div style={{ border: 'none', padding: '2px 8px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold', backgroundColor: isRightToLeft ? '#ff7675' : '#74b9ff', color: 'white' }}>
                        {isRightToLeft ? '右' : '左'}
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>からみて...</span>
                </div>

                <div style={{ maxHeight: '250px', overflowY: 'auto', padding: '12px', border: '4px solid var(--border-color)', borderRadius: '12px', backgroundColor: 'white' }}>
                    {instructions.map((inst, idx) => (
                        <div key={idx} onClick={() => toggleCheck(idx)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer' }}>
                            <div style={{ 
                                width: '22px', height: '22px', 
                                border: `2px solid ${currentChecks[idx] ? '#ea2f76' : 'var(--border-color)'}`, 
                                borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                backgroundColor: currentChecks[idx] ? '#ea2f76' : 'transparent',
                                transition: 'all 0.2s'
                            }}>
                                {currentChecks[idx] && <i className="bi bi-check-lg" style={{ fontSize: '14px', color: 'white' }}></i>}
                            </div>
                            <div style={{ width: '30px', height: '30px', backgroundColor: palette[inst.colorID], border: '1px solid #ccc', borderRadius: '4px', flexShrink: 0, opacity: currentChecks[idx] ? 0.3 : 1 }} />
                            <span style={{ fontSize: '16px', fontWeight: 'bold', color: currentChecks[idx] ? '#adb5bd' : 'black', textDecoration: currentChecks[idx] ? 'line-through' : 'none' }}>
                                {inst.count}目
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};