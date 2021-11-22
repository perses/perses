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

import { createContext, useCallback, useContext, useMemo } from 'react';
import { DatasourceSelector, GlobalDatasourceModel } from '@perses-ui/core';
import { useGlobalDatasourceQuery } from '../model/datasource-client';
import { useSnackbar } from './SnackbarProvider';

export interface DataSourceRegistryContextType {
  getDataSources(selector: DatasourceSelector): GlobalDatasourceModel[];
}

export const DataSourceRegistryContext = createContext<DataSourceRegistryContextType | undefined>(undefined);

export interface DataSourceRegistryProps {
  children: React.ReactNode;
}

/**
 * Makes DataSource resources available to children.
 */
export function DataSourceRegistry(props: DataSourceRegistryProps) {
  const { children } = props;
  const { exceptionSnackbar } = useSnackbar();
  const { data, isLoading } = useGlobalDatasourceQuery({
    onError: exceptionSnackbar,
  });
  const datasourceList: GlobalDatasourceModel[] = useMemo(() => {
    if (isLoading || data === undefined) {
      return [];
    }
    return data;
  }, [isLoading, data]);

  const getDataSources = useCallback(
    (selector: DatasourceSelector) => {
      return datasourceList.filter((ds: GlobalDatasourceModel) => {
        return (
          selector.global &&
          selector.kind === ds.spec.kind &&
          selector.name === ds.metadata.name
        );
      });
    },
    [datasourceList]
  );

  const context: DataSourceRegistryContextType = useMemo(() => ({ getDataSources }), [getDataSources]);

  return <DataSourceRegistryContext.Provider value={context}>{children}</DataSourceRegistryContext.Provider>;
}

export function useDataSourceRegistry() {
  const context = useContext(DataSourceRegistryContext);
  if (context === undefined) {
    throw new Error('No DataSourceRegistry context found. Did you forget a Provider?');
  }
  return context;
}

export function useDataSources(selector: DatasourceSelector) {
  return useDataSourceRegistry().getDataSources(selector);
}
