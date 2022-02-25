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
  AnyDatasourceSpecDefinition,
  DatasourceSelector,
  DatasourceSpecDefinition,
  HTTPConfig,
  useDatasources,
} from '@perses-dev/core';

export interface PrometheusSpecDatasource extends DatasourceSpecDefinition {
  kind: 'Prometheus';
  http: HTTPConfig;
}

function isPrometheusDatasource(def: AnyDatasourceSpecDefinition): def is PrometheusSpecDatasource {
  return def.kind === 'Prometheus';
}

export function usePrometheusConfig(selector?: DatasourceSelector) {
  const datasources = useDatasources();

  const models = selector === undefined ? [datasources.defaultDatasource] : datasources.getDatasources(selector);
  if (models.length > 1) {
    throw new Error('More than one Datasource found');
  }

  const model = models[0];
  if (model === undefined) {
    throw new Error('Datasource not found');
  }

  const spec = model.spec;
  if (isPrometheusDatasource(spec)) {
    return { ...model, spec };
  }

  throw new Error('Datasource is not a valid Prometheus Datasource');
}
