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

import { createContext, useContext, useCallback, useMemo } from 'react';
import { DataSourceResource, ResourceSelector } from '@perses-ui/core';
import { useSampleData } from '../utils/temp-sample-data';

export interface DataSourceRegistryContextType {
  getDataSources(selector: ResourceSelector): DataSourceResource[];
}

export const DataSourceRegistryContext = createContext<
  DataSourceRegistryContextType | undefined
>(undefined);

export interface DataSourceRegistryProps {
  children: React.ReactNode;
}

/**
 * Makes DataSource resources available to children.
 */
export function DataSourceRegistry(props: DataSourceRegistryProps) {
  const { children } = props;

  // TODO: Load from Perses server?
  const dataSource = useSampleData<DataSourceResource>('datasource');
  const dataSources: DataSourceResource[] = useMemo(() => {
    if (dataSource === undefined) return [];
    return [dataSource];
  }, [dataSource]);

  const getDataSources = useCallback(() => {
    // TODO: Is this how K8s selectors actually work?
    // k8s selector is looking at the metadata.labels, which doesn't exist in the current datamodel
    // TODO @nexucis review the way to fetch the datasources (Global datasource vs Local datasource)
    return dataSources.filter(() => {
      return true;
    });
  }, [dataSources]);

  const context: DataSourceRegistryContextType = useMemo(
    () => ({ getDataSources }),
    [getDataSources]
  );

  return (
    <DataSourceRegistryContext.Provider value={context}>
      {children}
    </DataSourceRegistryContext.Provider>
  );
}

export function useDataSourceRegistry() {
  const context = useContext(DataSourceRegistryContext);
  if (context === undefined) {
    throw new Error(
      'No DataSourceRegistry context found. Did you forget a Provider?'
    );
  }
  return context;
}

export function useDataSources(selector: ResourceSelector) {
  return useDataSourceRegistry().getDataSources(selector);
}
