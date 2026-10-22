type MainTab = 'library' | 'studio';
type StudioTab = 'design' | 'knit';
type Props = {
  activeTab: MainTab; studioTab: StudioTab; workingTitle: string;
  onStudioTabChange: (tab: StudioTab) => void; onBackToLibrary: () => void;
};
export const AppHeader = ({ activeTab, studioTab, workingTitle, onStudioTabChange, onBackToLibrary }: Props) => (
  <header className="app-header">
    <div className="app-brand" aria-label="Dot Knit Maker">
      <span className="app-brand-mark">●</span><span>Dot Knit <strong>Maker</strong></span>
    </div>
    {activeTab === 'library' ? <div className="app-page-title">作品一覧</div> : <>
      <nav className="studio-tabs" aria-label="作品の表示">
        <button type="button" className={studioTab === 'design' ? 'studio-tab is-active' : 'studio-tab'} onClick={() => onStudioTabChange('design')}>編集</button>
        <button type="button" className={studioTab === 'knit' ? 'studio-tab is-active' : 'studio-tab'} onClick={() => onStudioTabChange('knit')}>編み図</button>
      </nav>
      <div className="app-header-actions">
        <div className="app-project-name">{workingTitle}</div>
        <button type="button" className="back-to-library" onClick={onBackToLibrary}><span aria-hidden="true">←</span> 作品一覧</button>
      </div>
    </>}
  </header>
);
