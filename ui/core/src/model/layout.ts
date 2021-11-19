import { PanelRef } from './json-references';

export type LayoutDefinition = GridDefinition;

export interface GridDefinition {
  kind: 'Grid';
  display?: {
    title: string;
    collapse?: {
      open: boolean;
    };
  };
  items: GridItemDefinition[];
}

export interface GridItemDefinition {
  x: number;
  y: number;
  width: number;
  height: number;
  content: PanelRef;
}
