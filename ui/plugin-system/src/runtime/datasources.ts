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

import { DatasourceSelector, DatasourceSpec } from '@perses-dev/core';
import { useQuery } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

export interface DatasourceStore {
  // TODO: Do we even need this method?
  getDatasource(selector: DatasourceSelector): Promise<DatasourceSpec>;

  /**
   * Given a DatasourceSelector, gets a `Client` object from the corresponding Datasource plugin.
   */
  getDatasourceClient<Client>(selector: DatasourceSelector): Promise<Client>;

  /**
   * Gets a list of datasource metadata for a plugin kind.
   */
  listDatasourceMetadata(datasourcePluginKind: string): Promise<DatasourceMetadata[]>;
}

export interface DatasourceMetadata {
  name: string;
  selector: DatasourceSelector;
}

export const DatasourceStoreContext = createContext<DatasourceStore | undefined>(undefined);

export function useDatasourceStore() {
  const ctx = useContext(DatasourceStoreContext);
  if (ctx === undefined) {
    throw new Error('No DatasourceStoreContext found. Did you forget a Provider?');
  }
  return ctx;
}

/**
 * Lists all available Datasource instances for a given datasource plugin kind. Returns a list with the name of that
 * instance, as well as its DatasourceSelector for referencing it.
 */
export function useListDatasources(datasourcePluginKind: string) {
  const { listDatasourceMetadata } = useDatasourceStore();
  return useQuery(['listDatasourceMetadata', datasourcePluginKind], () => listDatasourceMetadata(datasourcePluginKind));
}

/**
 * Provides a convenience hook for getting a DatasourceClient for a given DatasourceSelector.
 */
export function useDatasourceClient<Client>(selector: DatasourceSelector) {
  const store = useDatasourceStore();
  return useQuery<Client>(['getDatasourceClient', selector], () => store.getDatasourceClient<Client>(selector));
}
