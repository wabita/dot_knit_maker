import { type ReactNode } from 'react';
import { EditorContext } from './editorContextStore';
import type { EditorProps } from './types';

type EditorProviderProps = {
  value: EditorProps;
  children: ReactNode;
};

export const EditorProvider = ({ value, children }: EditorProviderProps) => (
  <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
);
