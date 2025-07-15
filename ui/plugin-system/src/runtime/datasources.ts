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

import { DatasourceSelector, DatasourceSpec, GenericDatasourceResource } from '@perses-dev/core';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

export interface DatasourceStore {
  // TODO: Do we even need this method?
  getDatasource(selector: DatasourceSelector): Promise<DatasourceSpec>;

  /**
   * Given a DatasourceSelector, gets a `Client` object from the corresponding Datasource plugin.
   */
  getDatasourceClient<Client>(selector: DatasourceSelector): Promise<Client>;

  /**
   * Gets a list of datasource selection items for a plugin kind.
   */
  listDatasourceSelectItems(datasourcePluginName: string): Promise<DatasourceSelectItemGroup[]>;

  /**
   * Gets the list of datasources that are available in the dashboard (i.e. dashboards that have been created on the server side that we can use).
   */
  getSavedDatasources(): Record<string, DatasourceSpec>;

  /**
   * Tries to find and retrieve a cloned array of datasources available in the provider
   */
  queryDatasources(selector: DatasourceSelector): GenericDatasourceResource[];

  /**
   * Sets the list of datasources that are saved in the dashboard
   */
  setSavedDatasources(datasources: Record<string, DatasourceSpec>): void;

  /**
   * Sets a local temporary of datasources that are injected into the store.
   * This is used to have some temporary datasources that are not saved in the dashboard yet.
   */
  setLocalDatasources(newLocalDatasources: GenericDatasourceResource[]): void;

  /**
   * Retrieves the cloned set of local datasources
   */
  getLocalDatasources(): GenericDatasourceResource[];
}

export interface DatasourceSelectItemGroup {
  group?: string;
  editLink?: string;
  items: DatasourceSelectItem[];
}

export interface DatasourceSelectItem {
  name: string;
  overridden?: boolean;
  overriding?: boolean;
  saved?: boolean;
  selector: DatasourceSelectItemSelector;
}

/**
 * Datasource Selector used by the frontend only to differentiate datasources coming from different group.
 */
export interface DatasourceSelectItemSelector extends DatasourceSelector {
  /**
   * Group of the datasource.
   * Omit it if you don't store datasource by group.
   */
  group?: string;
}

export const DatasourceStoreContext = createContext<DatasourceStore | undefined>(undefined);

export function useDatasourceStore(): DatasourceStore {
  const ctx = useContext(DatasourceStoreContext);
  if (ctx === undefined) {
    throw new Error('No DatasourceStoreContext found. Did you forget a Provider?');
  }
  return ctx;
}

/**
 * Lists all available Datasource selection items for a given datasource plugin kind.
 * Returns a list, with all information that can be used in a datasource selection context (group, name, selector, kind, ...)
 */
export function useListDatasourceSelectItems(
  datasourcePluginName: string,
  project?: string
): UseQueryResult<DatasourceSelectItemGroup[]> {
  const { listDatasourceSelectItems } = useDatasourceStore();
  return useQuery<DatasourceSelectItemGroup[]>({
    queryKey: ['listDatasourceSelectItems', datasourcePluginName, project],
    queryFn: () => listDatasourceSelectItems(datasourcePluginName),
  });
}

/**
 * Provides a convenience hook for getting a DatasourceClient for a given DatasourceSelector.
 */
export function useDatasourceClient<Client>(selector: DatasourceSelector): UseQueryResult<Client> {
  const store = useDatasourceStore();
  return useQuery<Client>({
    queryKey: ['getDatasourceClient', selector],
    queryFn: () => store.getDatasourceClient<Client>(selector),
  });
}

export function useDatasource(selector: DatasourceSelector): UseQueryResult<DatasourceSpec> {
  const store = useDatasourceStore();
  return useQuery<DatasourceSpec>({
    queryKey: ['getDatasource', selector],
    queryFn: () => store.getDatasource(selector),
  });
}
