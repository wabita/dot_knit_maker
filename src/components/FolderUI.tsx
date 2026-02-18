import {type  ReactNode } from 'react';


type UIProps<T extends string> = {
    currentTab: T;
    setCurrentTab: (tab: T) => void;
    tabs: { label: string; value: T }[]; 
    children: ReactNode;
    isSmall?: boolean;
};


export const FolderUI = <T extends string>({ 
    currentTab, 
    setCurrentTab, 
    tabs, 
    children ,
    isSmall = false,
}: UIProps<T>) => {
  
  return (
    <div style={{ 
        padding: isSmall ? '0' : '40px', 
        maxWidth: isSmall ? '100%' : '900px', 
        margin: '0 auto' 
    }}>
      {/*タブボタン*/}
      <div style={{ display: 'flex', gap: `7px`, paddingLeft: '10px',  alignItems: 'flex-end' }}>
        {tabs.map((tab) => (
          <TabButton
            key={tab.value}
            label={tab.label}
            isActive={currentTab === tab.value}
            onClick={() => setCurrentTab(tab.value)}
            isSmall={isSmall}
          />
        ))}
      </div>
      {/*タブ内容*/}
      <div
        style={{
          backgroundColor: 'var(--folder-bg)',
          position: 'relative',
          zIndex: 2,
          border: '4px solid var(--border-color)',
          margin: '0 auto',
          padding: isSmall ? '15px 10px' : '20px 40px', // 中の余白も比率で変える
          minHeight: isSmall ? 'auto' : '500px',
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
  isSmall?: boolean;
};

const TabButton = ({ label, isActive, onClick, isSmall}: TabButtonProps & { isSmall?: boolean }) => {
  const borderWidth = '4px';

  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: 'inherit',
        fontSize: isSmall ? '12px' : '18px', 
        padding: isSmall ? '8px 0' : '15px 0',
        width: isSmall ? '75px' : '120px',
        fontWeight: 'bold',
        textAlign: 'center',
        cursor: 'pointer',
        position: 'relative',
        borderRadius: '0',
        transition: 'background-color 0.2s',

        // Z-index で下の箱の枠線より「手前」に来るようにする
        zIndex: isActive ? 3 : 1,
        
        // 色の切り替え
        backgroundColor: isActive ? 'var(--folder-bg)' : '#fbd5d5', 
        color: 'var(--text-color)',

        // 境界線の制御
        borderStyle: 'solid',
        borderColor: 'var(--border-color)',
        // アクティブ時は下だけ 0。非アクティブ時は全辺 borderWidth
        borderWidth: isActive 
          ? `${borderWidth} ${borderWidth} 0 ${borderWidth}` 
          : `${borderWidth}`,
        
        // 下の箱への「めり込み」
        // 下の箱の border-top (4px) を隠すために、境界線の太さ分だけマイナスにする
        marginBottom: `-${borderWidth}`,
        
        // アクティブなタブを少しだけ高く（上に大きく）見せると、より「タブ」らしくなります
        marginTop: isActive ? '0' : '4px',
      }}
    >
      {label}
    </button>
  );
};