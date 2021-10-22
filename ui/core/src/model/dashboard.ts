// Copyright 2021 The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { LayoutRef, PanelRef } from './json-references';
import { AnyPanelDefinition } from './panels';
import { ProjectMetadata, ResourceSelector } from './resource';
import { AnyVariableDefinition } from './variables';
import { DurationString } from './time';
import { Definition, JsonObject } from './definitions';

export interface DashboardResource {
  kind: 'Dashboard';
  metadata: ProjectMetadata;
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
