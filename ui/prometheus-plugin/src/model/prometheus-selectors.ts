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

import { DatasourceSelector } from '@perses-dev/core';

export const PROM_DATASOURCE_KIND = 'PrometheusDatasource' as const;

/**
 * DatasourceSelector for Prom Datasources.
 */
export interface PrometheusDatasourceSelector extends DatasourceSelector {
  kind: typeof PROM_DATASOURCE_KIND;
}

/**
 * A default selector that asks for the default Prom Datasource.
 */
export const DEFAULT_PROM: PrometheusDatasourceSelector = { kind: PROM_DATASOURCE_KIND };

/**
 * Returns true if the provided PrometheusDatasourceSelector is the default one.
 */
export function isDefaultPromSelector(selector: PrometheusDatasourceSelector) {
  return selector.name === undefined;
}

/**
 * Type guard to make sure a DatasourceSelector is a Prometheus one.
 */
export function isPrometheusDatasourceSelector(selector: DatasourceSelector): selector is PrometheusDatasourceSelector {
  return selector.kind === PROM_DATASOURCE_KIND;
}
