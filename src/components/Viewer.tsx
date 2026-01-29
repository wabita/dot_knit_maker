
type ViewerProps = {
    grid: boolean[][];
};

export const Viewer = ( {grid} : ViewerProps ) => {
    return(
        <div style={{ display: 'flex', flexDirection: 'column',border: '1px solid #ccc',width: 'fit-content', margin: '0 auto'}}>
            {grid.map((row, i) => (
                <div key={i} style={{ display: 'flex' }}>
                    {row.map((isActive, j) => (
                        <div
                            key={`${i}-${j}`}
                            style={{
                                width: '10px',
                                height: '10px',
                                border: '1px solid black',
                                backgroundColor: isActive ? 'black' : 'white',
                                cursor: 'pointer',
                            }}
                        />
                    ))}
                </div>
            ))}
        </div>
    )
}