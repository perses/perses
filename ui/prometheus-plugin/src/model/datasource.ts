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

import {
  DataSourceDefinition,
  AnyDataSourceDefinition,
  JsonObject,
  ResourceSelector,
  useDataSourceConfig,
} from '@perses-ui/core';

export const PrometheusDataSourceKind = 'PrometheusDataSource' as const;

type PrometheusDataSource = DataSourceDefinition<PrometheusDataSourceOptions>;

export interface PrometheusDataSourceOptions extends JsonObject {
  base_url: string;
}

export function usePrometheusConfig(selector: ResourceSelector) {
  return useDataSourceConfig(selector, isPromDataSource).options;
}

function isPromDataSource(def: AnyDataSourceDefinition): def is PrometheusDataSource {
  return typeof def.options['base_url'] === 'string';
}
