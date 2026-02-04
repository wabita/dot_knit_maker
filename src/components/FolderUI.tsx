import {type  ReactNode } from 'react'

type TabType = 'edit' | 'view';

type UIProps = {
    currentTab: TabType;
    setCurrentTab: (tab: TabType) => void;
    children: ReactNode;
};

const pixelSize = 5; 

export const FolderUI = ({ currentTab, setCurrentTab, children }: UIProps) => {
  
  return (
    <div style={{ padding: '100px', maxWidth: '900px', margin: '0 auto' }}>
      {/*タブボタン*/}
      <div style={{ display: 'flex', gap: `25px`, paddingLeft: '30px',  alignItems: 'flex-end' }}>

        <TabButton 
          label="へんしゅう" 
          isActive={currentTab === 'edit'} 
          onClick={() => setCurrentTab('edit')} 
        />
        <TabButton 
          label="さくせい" 
          isActive={currentTab === 'view'} 
          onClick={() => setCurrentTab('view')} 
        />
      </div>
      {/*タブ内容*/}
      <div
        style={{
          backgroundColor: 'var(--folder-bg)',
          position: 'relative',
          padding: '10px 20px',
          minHeight: '500px',
          zIndex: 2,
          
          boxShadow: `
            /* 内側のハイライト*/
            -${pixelSize}px 0 0 0 white,
             ${pixelSize}px 0 0 0 white,
             0 -${pixelSize}px 0 0 white,
             0 ${pixelSize}px 0 0 white,

             /* 枠 */
            -${pixelSize * 2}px 0 0 0 var(--border-color),
             ${pixelSize * 2}px 0 0 0 var(--border-color),
             0 -${pixelSize * 2}px 0 0 var(--border-color),
             0 ${pixelSize * 2}px 0 0 var(--border-color),
             
            /* 3. 四隅の補正 */
            -${pixelSize}px -${pixelSize}px 0 0 var(--border-color),
             ${pixelSize}px -${pixelSize}px 0 0 var(--border-color),
            -${pixelSize}px  ${pixelSize}px 0 0 var(--border-color),
             ${pixelSize}px  ${pixelSize}px 0 0 var(--border-color),
             
             /* 4. 影 */
             ${pixelSize * 3}px ${pixelSize * 3}px 0 0 rgba(0,0,0,0.1)
            `,
          
          margin: `${pixelSize * 2}px`,
        }}
      >
        {children}
      </div>
    </div>
  );
};


type TabButtonProps = {
  label: string;
  isActive: boolean;
  onClick: () => void;
};

const TabButton = ({ label, isActive, onClick }: TabButtonProps) => {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: 'inherit',
        fontSize: '18px',
        fontWeight: 'bold',
        padding: '15px 0',
        width: '120px',
        textAlign: 'center',
        cursor: 'pointer',
        position: 'relative',
        zIndex: isActive ? 3 : 1, 
        
        backgroundColor: isActive ? 'var(--folder-bg)' : '#fbd5d5', 
        color: 'var(--text-color)',

        border: 'none',
        borderRadius: '0',

        boxShadow: `
            /* ハイライト */
            -${pixelSize}px 0 0 0 white,
             ${pixelSize}px 0 0 0 white,
             0 -${pixelSize}px 0 0 white,

            /* 外枠 */
            -${pixelSize * 2}px 0 0 0 var(--border-color),
             ${pixelSize * 2}px 0 0 0 var(--border-color),
             0 -${pixelSize * 2}px 0 0 var(--border-color),
             0 ${isActive ? pixelSize*2 : 0}px 0 0 var(--folder-bg),
             
            /* 3. 四隅の補正 */
            -${pixelSize}px -${pixelSize}px 0 0 var(--border-color),
             ${pixelSize}px -${pixelSize}px 0 0 var(--border-color),
             /* 下の角も、選択中は調整する */
            -${pixelSize}px  ${isActive ? 0 : pixelSize}px 0 0 var(--border-color),
             ${pixelSize}px  ${isActive ? 0 : pixelSize}px 0 0 var(--border-color)
        `,

        marginBottom: `-${pixelSize * 2}px`, 
        
        
      }}
    >
      {label}
    </button>
  );
};