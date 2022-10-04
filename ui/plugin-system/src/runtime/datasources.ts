// Copyright 2022 The Perses Authors
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

import { DatasourceSelector, DatasourceSpec } from '@perses-dev/core';
import { createContext, useContext } from 'react';

export interface DatasourceStore {
  // TODO: Do we even need this method?
  getDatasource(selector: DatasourceSelector): Promise<DatasourceSpec>;

  /**
   * Given a DatasourceSelector, gets a `Client` object from the corresponding Datasource plugin.
   */
  getDatasourceClient<Client>(selector: DatasourceSelector): Promise<Client>;
}

export const DatasourceStoreContext = createContext<DatasourceStore | undefined>(undefined);

export function useDatasourceStore() {
  const ctx = useContext(DatasourceStoreContext);
  if (ctx === undefined) {
    throw new Error('No DatasourceStoreContext found. Did you forget a Provider?');
  }
  return ctx;
}
