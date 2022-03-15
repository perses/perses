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

import { useCallback, useMemo } from 'react';
import { DatasourceSelector, GlobalDatasourceModel } from '@perses-dev/core';
import { DatasourcesContext, Datasources } from '@perses-dev/plugin-system';
import { useGlobalDatasourceQuery } from '../model/datasource-client';
import { useSnackbar } from './SnackbarProvider';

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

  const getDatasources: Datasources['getDatasources'] = useCallback(
    (selector: DatasourceSelector) => {
      return datasourceList.filter((ds: GlobalDatasourceModel) => {
        return selector.global && selector.kind === ds.spec.kind && selector.name === ds.metadata.name;
      });
    },
    [datasourceList]
  );

  const context = useMemo(() => {
    const defaultDatasource = datasourceList.find((ds) => ds.spec.default);
    if (defaultDatasource === undefined) return undefined;
    return { defaultDatasource, getDatasources };
  }, [getDatasources, datasourceList]);

  // TODO: Show a loading indicator? Change up the API to be async?
  if (context === undefined) return null;
  return <DatasourcesContext.Provider value={context}>{children}</DatasourcesContext.Provider>;
}
