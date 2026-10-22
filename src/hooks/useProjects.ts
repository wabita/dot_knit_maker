import { useEffect, useState } from 'react';
import { get, set } from 'idb-keyval';
import type { GridSize, Project } from '../components/library/types';

type Document = { grid: number[][]; size: GridSize; palette: string[] };
type Options = {
  document: Document;
  resetDocument: (size: GridSize) => void;
  loadDocument: (grid: number[][], size: GridSize, palette: string[]) => void;
  onProjectDeleted: () => void;
};
export const useProjects = ({ document, resetDocument, loadDocument, onProjectDeleted }: Options) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [workingTitle, setWorkingTitle] = useState('あたらしい作品');
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadSavedData = async () => {
    try {
      const saved = await get<Project[]>('dot-knit-projects');
      if (saved) setProjects(saved);
    } catch (error) { console.error('作品一覧の読み込みに失敗しました', error); }
    finally { setHasLoaded(true); }
  };
  useEffect(() => { void loadSavedData(); }, []);
  const updateProjects = async (next: Project[]) => {
    setProjects(next);
    await set('dot-knit-projects', next);
  };
  const saveCurrentProject = async (isOverwrite = false) => {
    if (isOverwrite && currentProjectId) {
      await updateProjects(projects.map(project => project.id === currentProjectId
        ? { ...project, ...document, updatedAt: Date.now() } : project));
      alert('上書き保存しました！'); return true;
    }
    const name = window.prompt('作品のなまえを入力してください', isOverwrite ? 'コピー' : workingTitle);
    if (!name?.trim()) return false;
    const project: Project = { id: Date.now().toString(), name, ...document, updatedAt: Date.now(), isFavorite: false };
    await updateProjects([...projects, project]); setCurrentProjectId(project.id); setWorkingTitle(name);
    alert('新しく保存しました！'); return true;
  };
  const deleteProject = async (id: string) => {
    if (!window.confirm('この作品を完全に削除してもよろしいですか？')) return;
    await updateProjects(projects.filter(project => project.id !== id)); onProjectDeleted(); alert('削除しました');
  };
  const toggleFavorite = async (id: string) => updateProjects(projects.map(project => project.id === id
    ? { ...project, isFavorite: !project.isFavorite } : project));
  const createNewProject = (name: string, size: GridSize) => {
    const validSize = {
      col: Math.max(1, Math.min(200, Math.floor(size.col) || 1)),
      row: Math.max(1, Math.min(200, Math.floor(size.row) || 1)),
    };
    resetDocument(validSize); setCurrentProjectId(null); setWorkingTitle(name.trim() || 'あたらしい作品');
    return validSize;
  };
  const openProject = (project: Project) => {
    loadDocument(project.grid, project.size, project.palette);
    setCurrentProjectId(project.id); setWorkingTitle(project.name);
  };
  const currentProject = projects.find(project => project.id === currentProjectId);
  const isDirty = !currentProject || JSON.stringify([document.grid, document.size, document.palette]) !==
    JSON.stringify([currentProject.grid, currentProject.size, currentProject.palette]);
  return {
    projects, currentProjectId, setCurrentProjectId, hasLoaded, workingTitle, setWorkingTitle, isDirty,
    loadSavedData, updateProjects, saveCurrentProject, deleteProject, toggleFavorite, createNewProject, openProject,
  };
};
