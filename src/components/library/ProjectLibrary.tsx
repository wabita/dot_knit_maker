import type { Project } from './types';

type ProjectLibraryProps = {
  projects: Project[];
  onOpenProject: (project: Project) => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
};

export const ProjectLibrary = ({ projects, onOpenProject, onToggleFavorite, onDelete }: ProjectLibraryProps) => (
  <div className="project-grid">
      {projects.map(project => (
        <article key={project.id} className="project-card">
          <div className="project-preview" style={{ aspectRatio: `${project.size.col} / ${project.size.row}` }}>
            {project.grid.map((row, rowIndex) => (
              <div key={rowIndex} className="project-preview-row">
                {row.map((colorID, colIndex) => (
                  <span key={`${rowIndex}-${colIndex}`} style={{ backgroundColor: project.palette[colorID] }} />
                ))}
              </div>
            ))}
          </div>
          <div className="project-card-info">
            <h2>{project.name}</h2>
            <span>{project.size.col}目 × {project.size.row}段</span>
            <small>編みかけ・{new Date(project.updatedAt).toLocaleDateString('ja-JP')}</small>
          </div>
          <div className="project-card-actions">
            <button className="project-open-button" type="button" onClick={() => onOpenProject(project)}>作品を開く</button>
            <button className="project-icon-button project-favorite-button" type="button" onClick={() => onToggleFavorite(project.id)}
              aria-label={project.isFavorite ? 'お気に入りを解除' : 'お気に入りに追加'} title={project.isFavorite ? 'お気に入りを解除' : 'お気に入りに追加'}>
              <i className={`bi bi-star${project.isFavorite ? '-fill' : ''}`} />
            </button>
            <button className="project-icon-button project-delete-button" type="button" onClick={() => onDelete(project.id)} aria-label="作品を削除" title="作品を削除">
              <i className="bi bi-trash3" />
            </button>
          </div>
        </article>
      ))}

      {projects.length === 0 && (
        <div className="empty-projects">最初の作品をつくろう！</div>
      )}
  </div>
);
