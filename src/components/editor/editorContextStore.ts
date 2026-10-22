import { createContext } from 'react';
import type { EditorProps } from './types';

export const EditorContext = createContext<EditorProps | null>(null);
