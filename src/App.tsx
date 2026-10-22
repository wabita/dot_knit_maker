import { useState } from 'react';
import type { FormEvent } from 'react';
import { AppHeader } from './components/layout/AppHeader';
import { Workspace } from './components/layout/Workspace';
import type { GridSize, Project } from './components/library/types';
import { useEditorState } from './hooks/useEditorState';
import { useProjects } from './hooks/useProjects';

type MainTab = 'library' | 'studio';
type StudioTab = 'design' | 'knit';

function App() {
  const editor = useEditorState();
  const { grid, palette, gridSize, resetDocument, loadDocument } = editor;
  const [activeTab, setActiveTab] = useState<MainTab>('library');
  const [studioTab, setStudioTab] = useState<StudioTab>('design');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectSize, setNewProjectSize] = useState<GridSize>({ row: 16, col: 16 });
  const [leaveDialog, setLeaveDialog] = useState<'confirm' | 'save-choice' | null>(null);
  const projectsState = useProjects({
    document: { grid, size: gridSize, palette }, resetDocument, loadDocument,
    onProjectDeleted: () => setActiveTab('library'),
  });
  const { projects, currentProjectId, workingTitle, createNewProject, openProject,
    saveCurrentProject, deleteProject, toggleFavorite, isDirty } = projectsState;

  const handleCreateProject = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const size = createNewProject(newProjectName, newProjectSize);
    setNewProjectSize(size); setNewProjectName(''); setActiveTab('studio'); setStudioTab('design');
  };
  const handleOpenProject = (project: Project) => {
    openProject(project); setActiveTab('studio'); setStudioTab('design');
  };
  const requestLibrary = () => {
    if (isDirty) setLeaveDialog('confirm');
    else setActiveTab('library');
  };
  const saveAndLeave = async (overwrite: boolean) => {
    const saved = await saveCurrentProject(overwrite);
    if (saved) { setLeaveDialog(null); setActiveTab('library'); }
  };
  const editorContextValue = {
    ...editor,
    saveProject: saveCurrentProject,
    isProjectLoaded: currentProjectId !== null,
    isFavorite: projects.find(project => project.id === currentProjectId)?.isFavorite || false,
    onDelete: () => { if (currentProjectId) void deleteProject(currentProjectId); },
    onToggleFavorite: () => { if (currentProjectId) void toggleFavorite(currentProjectId); },
  };

  return <div className="app-shell">
    <AppHeader activeTab={activeTab} studioTab={studioTab} workingTitle={workingTitle}
      onStudioTabChange={setStudioTab} onBackToLibrary={requestLibrary} />
    <Workspace activeTab={activeTab} studioTab={studioTab} projects={projects} onOpenProject={handleOpenProject}
      onToggleFavorite={toggleFavorite} onDeleteProject={deleteProject}
      newProjectName={newProjectName} newProjectSize={newProjectSize} onNameChange={setNewProjectName}
      onSizeChange={setNewProjectSize} onCreateNewProject={handleCreateProject}
      editorContextValue={editorContextValue} grid={grid} gridSize={gridSize} palette={palette} />
    {leaveDialog && <div className="leave-dialog-backdrop">
      <section className="leave-dialog" role="dialog" aria-modal="true" aria-labelledby="leave-dialog-title">
        <h2 id="leave-dialog-title">{leaveDialog === 'confirm' ? '変更を保存しますか？' : '保存方法を選んでください'}</h2>
        {leaveDialog === 'confirm' ? <>
          <p>保存していない変更があります。</p>
          <div className="leave-dialog-actions">
            <button type="button" className="leave-dialog-primary" onClick={() => currentProjectId ? setLeaveDialog('save-choice') : void saveAndLeave(false)}>保存する</button>
            <button type="button" onClick={() => { setLeaveDialog(null); setActiveTab('library'); }}>保存しない</button>
            <button type="button" onClick={() => setLeaveDialog(null)}>キャンセル</button>
          </div>
        </> : <>
          <p>この作品に上書きするか、新しい作品として保存できます。</p>
          <div className="leave-dialog-actions">
            <button type="button" className="leave-dialog-primary" onClick={() => void saveAndLeave(true)}>上書き保存</button>
            <button type="button" onClick={() => void saveAndLeave(false)}>新規保存</button>
            <button type="button" onClick={() => setLeaveDialog('confirm')}>戻る</button>
          </div>
        </>}
      </section>
    </div>}
  </div>;
}

export default App;
