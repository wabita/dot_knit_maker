
type EditorProps = {
    grid: number[][];
    palette: string[];
    nowColorID: number;
    setNowColorID: (id: number) => void;
    ChangeGrid: (i: number, j: number) => void;
    UpdataPaletteID: (id: number, newColor: string) => void;
    addColor: () => void;

};


export const Editor = ( {grid, palette, nowColorID, setNowColorID, ChangeGrid, UpdataPaletteID, addColor} : EditorProps ) => {
    return(
        <div style={{ 
            display: 'inline-flex', 
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: '20px',
            margin: '0 auto',
            justifyContent: 'center',
             }}>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid #ccc',
                width: 'fit-content',
                margin: '0 auto',
                flexShrink: 0,
                alignItems: 'center',
                }}>
                {grid.map((row, i) => (
                    <div key={i} style={{ display: 'flex' }}>
                        {row.map((colorID, j) => (
                            <div
                                key={`${i}-${j}`}
                                onClick={() => ChangeGrid(i, j)}
                                style={{
                                    width: '10px',
                                    height: '10px',
                                    border: '1px solid black',
                                    backgroundColor: palette[colorID],
                                    cursor: 'pointer',
                                }}
                            />
                        ))}
                    </div>
                ))}
            </div>
            

            <div style={{ position: 'relative' }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    marginLeft: '20px' ,
                    borderLeft: '1px solid #eee',
                    minWidth: '200px',
                    border: '4px solid var(--border-color)',
                    borderRadius: '8px',
                    backgroundColor: '#f4f1e8',
                    maxHeight: '300px', 
                    overflowY: 'auto',}}>
                    {palette.map((color, id) => (
                        <div key={id} style={{  margin: '8px' }}>
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => UpdataPaletteID(id, e.target.value)}
                                style={{ 
                                        width: '30px', height: '30px', cursor: 'pointer'}}
                            />
                            <button
                                onClick={() => setNowColorID(id)}
                                style={{fontFamily: 'monospace', fontSize: '12px', marginTop: '5px', marginLeft: '5px', border: 'none', background: nowColorID === id ? 'var(--dot-color)' : '#fff' }}
                            >
                                {palette[id]}
                            </button>
                        </div>
                    ))} 
                </div>
                <button onClick={addColor} 
                        style={{ 
                            color: 'var(--border-color)',
                            fontFamily: 'DotFont',
                            position: 'absolute', 
                            right: '-10px',  /* 右の縁に被せる */
                            bottom: '-10px', /* 下の縁に被せる */
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
                        }}>
                        +
                </button>
            </div>
        </div>
    )

};
