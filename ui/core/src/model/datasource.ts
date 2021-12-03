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

import { Metadata, ProjectMetadata } from './resource';

// TODO: Should use Definition<> and JsonObject?
export interface DatasourceSpecDefinition {
  kind: string;
  default: boolean;
}

export type AnyDatasourceSpecDefinition = DatasourceSpecDefinition;

export interface DatasourceModel {
  kind: 'Datasource';
  metadata: ProjectMetadata;
  spec: AnyDatasourceSpecDefinition;
}

export interface GlobalDatasourceModel {
  kind: 'GlobalDatasource';
  metadata: Metadata;
  spec: AnyDatasourceSpecDefinition;
}
