import { useContext } from 'react';
import { EditorContext } from './editorContextStore';

export const useEditorContext = () => {
  const context = useContext(EditorContext);
  if (!context) throw new Error('useEditorContext は EditorProvider の内側で使ってください。');
  return context;
};
