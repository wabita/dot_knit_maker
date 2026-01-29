import { useState } from 'react';
import { FolderUI } from './components/FolderUI';
import { Editor } from './components/Editor';
import { Viewer } from './components/Viewer';

type GridSize = {
    row: number;
    col: number;
};
const DEFAULT_SIZE: GridSize = { row: 20, col: 18 };

const makeGrid = ({ row, col }: GridSize) => {
    return new Array(row).fill(null).map(() => new Array(col).fill(false));
  };

function App() {
  const [activeTab, setActiveTab] = useState<'edit' | 'view'> ('edit');
  const [grid, setGrid] = useState(() => makeGrid(DEFAULT_SIZE));
  const ChangeGrid =(i:number , j:number) => {
    setGrid((originalGrid) => {
      const newGrid = originalGrid.map(row => [...row]);
      newGrid[i][j] = !newGrid[i][j];
      return newGrid;
    })
  };

  return (
    
    <FolderUI currentTab={activeTab} setCurrentTab={setActiveTab}>
      
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        {activeTab === 'edit' ? (
          <Editor grid={grid} ChangeGrid={ChangeGrid} />
        ): (
          <Viewer grid={grid} />
        )}
      </div>

    </FolderUI>
  );
}

export default App;