
type ViewerProps = {
    grid: number[][];
    palette: string[];
};

export const Viewer = ( {grid, palette} : ViewerProps ) => {
    return(
        <div style={{ display: 'flex', flexDirection: 'column',border: '1px solid #ccc',width: 'fit-content', margin: '0 auto'}}>
            {grid.map((row, i) => (
                <div key={i} style={{ display: 'flex' }}>
                    {row.map((colorID, j) => (
                        <div
                            key={`${i}-${j}`}
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
    )
}