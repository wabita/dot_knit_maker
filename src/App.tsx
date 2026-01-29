import { useEffect, useState } from 'react';
import { get, set } from 'idb-keyval';
import { FolderUI } from './components/FolderUI';
import { Editor } from './components/Editor';

import { Viewer } from './components/Viewer';

type GridSize = {
    row: number;
    col: number;
};
const DEFAULT_SIZE: GridSize = { row: 20, col: 18 };

const makeGrid = ({ row, col }: GridSize) => {
    return new Array(row).fill(null).map(() => new Array(col).fill(0));
  };

function App() {
  const [activeTab, setActiveTab] = useState<'edit' | 'view'> ('edit');
  const [palette,setPalette] = useState(['#FFFFFF', '#000000']);
  const [nowColorID, setNowColorID] = useState(1);
  const [grid, setGrid] = useState(() => makeGrid(DEFAULT_SIZE));

  useEffect(() => {
    async function loadData(){
      const savedGrid = await get("originalGrid");
      const savedPalette = await get("originalPalette");
      if (savedGrid) setGrid(savedGrid);
      if (savedPalette) setPalette(savedPalette);
    }loadData();
  }, []);
  
  useEffect(() => {
    set("originalGrid", grid);
    set("originalPalette", palette);
  }, [grid, palette]);


  const ChangeGrid =(i:number , j:number) => {
    setGrid((originalGrid) => {
      const newGrid = originalGrid.map(row => [...row]);
      newGrid[i][j] = nowColorID;
      return newGrid;
    })
  };

  const UpdataPaletteID = (id:number, newColor:string) => {
    const newPalette = [...palette];
    newPalette[id] = newColor;
    setPalette(newPalette);
  }
  const addColor = () => {
    setPalette([...palette, '#cccccc']);
    setNowColorID(palette.length); // 追加した色をすぐ選択
  };


  return (

    <FolderUI currentTab={activeTab} setCurrentTab={setActiveTab}>
      
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        {activeTab === 'edit' ? (
          <Editor grid={grid} palette={palette} nowColorID={nowColorID} setNowColorID={setNowColorID} ChangeGrid={ChangeGrid} UpdataPaletteID={UpdataPaletteID} addColor={addColor}/>
        ): (
          <Viewer grid={grid} palette={palette} />
        )}
      </div>

    </FolderUI>
  );
}

export default App;