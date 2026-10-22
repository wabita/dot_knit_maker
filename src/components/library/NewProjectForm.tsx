import { useEffect, useState, type FormEvent } from 'react';
import type { GridSize } from './types';

type NewProjectFormProps = {
  name: string;
  size: GridSize;
  onNameChange: (name: string) => void;
  onSizeChange: (update: (current: GridSize) => GridSize) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export const NewProjectForm = ({ name, size, onNameChange, onSizeChange, onSubmit }: NewProjectFormProps) => {
  const [colDraft, setColDraft] = useState(String(size.col));
  const [rowDraft, setRowDraft] = useState(String(size.row));

  useEffect(() => {
    setColDraft(String(size.col));
    setRowDraft(String(size.row));
  }, [size.col, size.row]);

  const updateDimension = (key: 'col' | 'row', value: string) => {
    const digits = value.replace(/[^0-9]/g, '');
    if (key === 'col') setColDraft(digits);
    else setRowDraft(digits);
    if (digits) onSizeChange(current => ({ ...current, [key]: Math.min(200, Number(digits)) }));
  };

  const commitDimension = (key: 'col' | 'row') => {
    const draft = key === 'col' ? colDraft : rowDraft;
    const value = Math.min(200, Math.max(1, Number(draft) || 1));
    if (key === 'col') setColDraft(String(value));
    else setRowDraft(String(value));
    onSizeChange(current => ({ ...current, [key]: value }));
  };

  return (
  <form className="new-project-form" onSubmit={onSubmit}>
    <h2><span>＋</span> 新しい作品</h2>
    <label className="new-project-name">
      <span>作品名</span>
      <input
        value={name}
        onChange={event => onNameChange(event.target.value)}
        placeholder="作品名を入力"
        maxLength={40}
      />
    </label>
    <div className="new-project-dimensions">
      <label>
        <span>横の目数</span>
        <span className="dimension-input">
          <input type="text" inputMode="numeric" pattern="[0-9]*" aria-label="横の目数" value={colDraft} onChange={event => updateDimension('col', event.target.value)} onBlur={() => commitDimension('col')} />
          <small>目</small>
        </span>
      </label>
      <label>
        <span>縦の段数</span>
        <span className="dimension-input">
          <input type="text" inputMode="numeric" pattern="[0-9]*" aria-label="縦の段数" value={rowDraft} onChange={event => updateDimension('row', event.target.value)} onBlur={() => commitDimension('row')} />
          <small>段</small>
        </span>
      </label>
    </div>
    <button type="submit"><span aria-hidden="true">＋</span> 編み図を作る</button>
  </form>
  );
};
