import { Editor } from '../editor/Editor';
import { EditorProvider } from '../editor/EditorContext';
import type { EditorProps } from '../editor/types';
import { Viewer } from '../Viewer';
import { NewProjectForm } from '../library/NewProjectForm';
import { ProjectLibrary } from '../library/ProjectLibrary';
import type { GridSize, Project } from '../library/types';

type MainTab = 'library' | 'studio';
type StudioTab = 'design' | 'knit';
type Props = {
  activeTab: MainTab; studioTab: StudioTab; projects: Project[]; onOpenProject: (project: Project) => void;
  onToggleFavorite: (id: string) => void; onDeleteProject: (id: string) => void;
  newProjectName: string; newProjectSize: GridSize; onNameChange: (name: string) => void;
  onSizeChange: (update: (current: GridSize) => GridSize) => void; onCreateNewProject: (event: React.FormEvent<HTMLFormElement>) => void;
  editorContextValue: EditorProps; grid: number[][]; gridSize: GridSize; palette: string[];
};
export const Workspace = ({ activeTab, studioTab, projects, onOpenProject, newProjectName, newProjectSize,
  onToggleFavorite, onDeleteProject, onNameChange, onSizeChange, onCreateNewProject, editorContextValue, grid, gridSize, palette }: Props) => (
  <main className={`workspace-main workspace-${activeTab}`}>
    {activeTab === 'library' ? <div className="project-library">
      <div className="library-heading"><h1>わたしの作品</h1><span>{projects.length}点の作品</span></div>
      <div className="library-content">
        <ProjectLibrary projects={projects} onOpenProject={onOpenProject} onToggleFavorite={onToggleFavorite} onDelete={onDeleteProject} />
        <aside className="new-project-panel"><NewProjectForm name={newProjectName} size={newProjectSize}
          onNameChange={onNameChange} onSizeChange={onSizeChange} onSubmit={onCreateNewProject} /></aside>
      </div>
    </div> : <section className="studio-workspace"><div className="studio-body"><div className="studio-stage">
      <div className="studio-page" hidden={studioTab !== 'design'}><EditorProvider value={editorContextValue}><Editor /></EditorProvider></div>
      <div className="studio-page" hidden={studioTab !== 'knit'}><Viewer key={`${gridSize.row}-${gridSize.col}`} grid={grid} palette={palette} isActive={studioTab === 'knit'} /></div>
    </div></div></section>}
  </main>
);
