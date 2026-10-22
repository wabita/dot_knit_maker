import { createContext, useContext, type ReactNode } from 'react';
import type { EditorProps } from './types';

const EditorContext = createContext<EditorProps | null>(null);

type EditorProviderProps = {
  value: EditorProps;
  children: ReactNode;
};

export const EditorProvider = ({ value, children }: EditorProviderProps) => (
  <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
);

export const useEditorContext = () => {
  const context = useContext(EditorContext);
  if (!context) throw new Error('useEditorContext は EditorProvider の内側で使ってください。');
  return context;
};
