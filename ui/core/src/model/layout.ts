import { Definition, JsonObject } from './definitions';
import { ContentRef } from './json-references';

export type LayoutDefinition = ExpandLayoutDefinition | GridLayoutDefinition;

export type ExpandLayoutDefinition = Definition<'expand', ExpandLayoutOptions>;

export interface ExpandLayoutOptions extends JsonObject {
  open: boolean;
  children: ContentRef[];
}

export type GridLayoutDefinition = Definition<'grid', GridLayoutOptions>;

export interface GridLayoutOptions extends JsonObject {
  children: GridRowDefinition[];
}

export type GridRowDefinition = GridCellDefinition[];

export interface GridCellDefinition extends JsonObject {
  width: number;
  content?: ContentRef;
}
