import { LayoutRef, PanelRef } from './json-references';
import { AnyPanelDefinition } from './panels';
import { ResourceMetadata, ResourceSelector } from './resource';
import { AnyVariableDefinition } from './variables';
import { DurationString } from './time';
import { Definition, JsonObject } from './definitions';

export interface DashboardResource {
  kind: 'Dashboard';
  metadata: ResourceMetadata;
  spec: DashboardSpec;
}

export interface DashboardSpec {
  datasource: ResourceSelector;
  duration: DurationString;
  variables: Record<string, AnyVariableDefinition>;
  panels: Record<string, AnyPanelDefinition>;
  layouts: Record<string, LayoutDefinition>;
  entrypoint: LayoutRef;
}

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

export type ContentRef = LayoutRef | PanelRef;
