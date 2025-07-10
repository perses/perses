// Copyright 2023 The Perses Authors
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

import { Definition, UnknownSpec } from './definitions';
import { GenericMetadata, Metadata, ProjectMetadata } from './resource';
import { Display } from './display';

export interface DatasourceSpec<PluginSpec = UnknownSpec> {
  display?: Display;
  default: boolean;
  plugin: Definition<PluginSpec>;
}

export interface GenericDatasourceResource {
  kind: string;
  metadata: GenericMetadata;
  spec: DatasourceSpec;
}

/**
 * A Datasource that's available across all projects.
 */
export interface GlobalDatasourceResource {
  kind: 'GlobalDatasource';
  metadata: Metadata;
  spec: DatasourceSpec;
}

/**
 * A Datasource resource, that belongs to a project.
 */
export interface DatasourceResource {
  kind: 'Datasource';
  metadata: ProjectMetadata;
  spec: DatasourceSpec;
}

export type Datasource = DatasourceResource | GlobalDatasourceResource;

/**
 * A selector for pointing at a specific Datasource.
 */
export interface DatasourceSelector {
  /**
   * Kind of the datasource.
   */
  kind: string;

  /**
   * Name of the datasource.
   * If omitted, it's assumed that you target the default datasource for the specified kind (and group, if set)
   */
  name?: string;
}

/**
 * An intermediary type to regroup the name and the spec of a datasource.
 */
export interface DatasourceDefinition {
  name: string;
  spec: DatasourceSpec;
}
