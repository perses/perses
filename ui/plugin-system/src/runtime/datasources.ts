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

import { createContext, useContext } from 'react';
import { DatasourceSelector, GlobalDatasourceResource, DatasourceResource } from '@perses-dev/core';

export type Datasource = GlobalDatasourceResource | DatasourceResource;

export interface Datasources {
  /**
   * Gets the Datasource for the provided selector or if no selector is provided, gets the current default Datasource.
   */
  getDatasource(selector?: DatasourceSelector): Promise<Datasource>;
}

export const DatasourcesContext = createContext<Datasources | undefined>(undefined);

/**
 * Gets the Datasources at runtime.
 */
export function useDatasources(): Datasources {
  const ctx = useContext(DatasourcesContext);
  if (ctx === undefined) {
    throw new Error('No DatasourcesContext found. Did you forget a Provider?');
  }
  return ctx;
}
