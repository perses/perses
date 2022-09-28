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

import { useMemo } from 'react';
import {
  DashboardSpec,
  Datasource,
  DatasourceSelector,
  DatasourceSpec,
  GlobalDatasource,
  useEvent,
} from '@perses-dev/core';
import { DatasourcesContext, DatasourcesContextType } from '@perses-dev/plugin-system';

export interface DatasourcesProviderProps {
  dashboardDatasources: DashboardSpec['datasources'];
  datasourcesApi: DatasourcesApi;
  children?: React.ReactNode;
}

// The external API for fetching datasource resources
export interface DatasourcesApi {
  getDatasource: (selector: DatasourceSelector) => Promise<Datasource | undefined>;
  getGlobalDatasource: (selector: DatasourceSelector) => Promise<GlobalDatasource | undefined>;
}

/**
 * A `DatasourcesContext` provider that uses an external API to resolve datasource selectors.
 */
export function DatasourcesProvider(props: DatasourcesProviderProps) {
  const { dashboardDatasources, datasourcesApi, children } = props;

  const getDatasource = useEvent(async (selector: DatasourceSelector): Promise<DatasourceSpec> => {
    // Try to find it in dashboard spec
    const dashboardDatasource = findDashboardDatasource(dashboardDatasources, selector);
    if (dashboardDatasource !== undefined) {
      return dashboardDatasource;
    }

    // Try to find it at the project level as a Datasource resource
    const datasource = await datasourcesApi.getDatasource(selector);
    if (datasource !== undefined) {
      return datasource.spec;
    }

    // Try to find it at the global level as a GlobalDatasource resource
    const globalDatasource = await datasourcesApi.getGlobalDatasource(selector);
    if (globalDatasource !== undefined) {
      return globalDatasource.spec;
    }

    throw new Error(`No datasource found for kind '${selector.kind}' and name '${selector.name}'`);
  });

  const ctxValue: DatasourcesContextType = useMemo(
    () => ({
      getDatasource,
    }),
    [getDatasource]
  );

  return <DatasourcesContext.Provider value={ctxValue}>{children}</DatasourcesContext.Provider>;
}

// Helper to find a datasource in the list embedded in a dashboard spec
function findDashboardDatasource(dashboardDatasources: DashboardSpec['datasources'], selector: DatasourceSelector) {
  if (dashboardDatasources === undefined) return undefined;

  // If using a name in the selector...
  if (selector.name !== undefined) {
    const named = dashboardDatasources[selector.name];
    if (named === undefined) return undefined;
    return named.plugin.kind === selector.kind ? named : undefined;
  }

  // If only using a kind, try to find one with that kind that is the default
  return Object.values(dashboardDatasources).find((ds) => ds.plugin.kind === selector.kind && ds.default === true);
}
