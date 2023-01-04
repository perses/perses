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
import { Metadata, ProjectMetadata } from './resource';
import { Display } from './display';

/**
 * A Datasource that's available across all projects.
 */
export interface GlobalDatasource {
  kind: 'GlobalDatasource';
  metadata: Metadata;
  spec: DatasourceSpec;
}

/**
 * A Datasource that belongs to a project.
 */
export interface Datasource {
  kind: 'Datasource';
  metadata: ProjectMetadata;
  spec: DatasourceSpec;
}

export interface DatasourceSpec<PluginSpec = UnknownSpec> {
  display?: Display;
  default: boolean;
  plugin: Definition<PluginSpec>;
}

/**
 * A selector for pointing at a specific Datasource. If name is omitted, it's assumed that you want the default
 * Datasource for the specified kind.
 */
export interface DatasourceSelector {
  kind: string;
  name?: string;
}
