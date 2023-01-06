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

import { useCallback, useMemo, useState } from 'react';
import {
  DashboardResource,
  DashboardSpec,
  Datasource,
  DatasourceSelector,
  DatasourceSpec,
  GlobalDatasource,
  useEvent,
} from '@perses-dev/core';
import {
  DatasourceStoreContext,
  DatasourceStore,
  usePluginRegistry,
  DatasourceMetadata,
  ActiveDatasourceClient,
} from '@perses-dev/plugin-system';

export interface DatasourceStoreProviderProps {
  dashboardResource: DashboardResource;
  datasourceApi: DatasourceApi;
  children?: React.ReactNode;
}

// The external API for fetching datasource resources
export interface DatasourceApi {
  getDatasource: (
    project: string,
    selector: DatasourceSelector
  ) => Promise<{ resource: Datasource; proxyUrl: string } | undefined>;

  getGlobalDatasource: (
    selector: DatasourceSelector
  ) => Promise<{ resource: GlobalDatasource; proxyUrl: string } | undefined>;

  listDatasources: (project: string, pluginKind?: string) => Promise<Datasource[]>;

  listGlobalDatasources: (pluginKind?: string) => Promise<GlobalDatasource[]>;
}

/**
 * A `DatasourceContext` provider that uses an external API to resolve datasource selectors.
 */
export function DatasourceStoreProvider(props: DatasourceStoreProviderProps) {
  const { dashboardResource, datasourceApi, children } = props;
  const { project } = dashboardResource.metadata;

  const [activeDatasourceClient, setActiveDatasourceClient] = useState<ActiveDatasourceClient>();

  const { getPlugin, listPluginMetadata } = usePluginRegistry();

  const findDatasource = useEvent(async (selector: DatasourceSelector) => {
    // Try to find it in dashboard spec
    const { datasources } = dashboardResource.spec;
    const dashboardDatasource = findDashboardDatasource(datasources, selector);
    if (dashboardDatasource !== undefined) {
      return { spec: dashboardDatasource, proxyUrl: undefined };
    }

    // Try to find it at the project level as a Datasource resource
    const datasource = await datasourceApi.getDatasource(project, selector);
    if (datasource !== undefined) {
      return { spec: datasource.resource.spec, proxyUrl: datasource.proxyUrl };
    }

    // Try to find it at the global level as a GlobalDatasource resource
    const globalDatasource = await datasourceApi.getGlobalDatasource(selector);
    if (globalDatasource !== undefined) {
      return { spec: globalDatasource.resource.spec, proxyUrl: globalDatasource.proxyUrl };
    }

    throw new Error(`No datasource found for kind '${selector.kind}' and name '${selector.name}'`);
  });

  // Gets a datasource spec for a given selector
  const getDatasource = useCallback(
    async (selector: DatasourceSelector): Promise<DatasourceSpec> => {
      const { spec } = await findDatasource(selector);
      return spec;
    },
    [findDatasource]
  );

  // Given a Datasource selector, finds the spec for it and then uses its corresponding plugin the create a client
  const getDatasourceClient = useCallback(
    async function getClient<Client>(selector: DatasourceSelector): Promise<Client> {
      if (activeDatasourceClient && activeDatasourceClient.selector) {
        if (selector.name) {
          if (selector.name === activeDatasourceClient.selector.name) {
            return activeDatasourceClient.client as Client;
          }
        } else {
          return activeDatasourceClient.client as Client;
        }
      }
      const { kind } = selector;
      const [{ spec, proxyUrl }, plugin] = await Promise.all([findDatasource(selector), getPlugin('Datasource', kind)]);
      const client = plugin.createClient(spec.plugin.spec, {
        proxyUrl,
      }) as Client;
      setActiveDatasourceClient({ selector, client });
      return client;
    },
    [findDatasource, getPlugin, activeDatasourceClient]
  );

  const listDatasourceMetadata = useEvent(async (datasourcePluginKind: string): Promise<DatasourceMetadata[]> => {
    const [pluginMetadata, datasources, globalDatasources] = await Promise.all([
      listPluginMetadata('Datasource'),
      datasourceApi.listDatasources(project, datasourcePluginKind),
      datasourceApi.listGlobalDatasources(datasourcePluginKind),
    ]);

    // Find the metadata for the plugin type they asked for so we can use it for the name of the default datasource
    const datasourcePluginMetadata = pluginMetadata.find((metadata) => metadata.kind === datasourcePluginKind);
    if (datasourcePluginMetadata === undefined) {
      throw new Error(`Could not find a Datasource plugin with kind '${datasourcePluginKind}'`);
    }

    // Get helper for de-duping results properly
    const { results, addResult } = buildListDatasourceMetadataResults(datasourcePluginMetadata.display.name);

    // Start with dashboard datasources that have highest precedence
    if (dashboardResource.spec.datasources !== undefined) {
      for (const selectorName in dashboardResource.spec.datasources) {
        const spec = dashboardResource.spec.datasources[selectorName];
        if (spec === undefined || spec.plugin.kind !== datasourcePluginKind) continue;
        addResult(spec, selectorName);
      }
    }

    // Now look at project-level datasources
    for (const datasource of datasources) {
      const selectorName = datasource.metadata.name;
      addResult(datasource.spec, selectorName);
    }

    // And finally global datasources
    for (const globalDatasource of globalDatasources) {
      const selectorName = globalDatasource.metadata.name;
      addResult(globalDatasource.spec, selectorName);
    }

    return results;
  });

  const ctxValue: DatasourceStore = useMemo(
    () => ({
      activeDatasourceClient,
      getDatasource,
      getDatasourceClient,
      listDatasourceMetadata,
    }),
    [getDatasource, getDatasourceClient, listDatasourceMetadata, activeDatasourceClient]
  );

  return <DatasourceStoreContext.Provider value={ctxValue}>{children}</DatasourceStoreContext.Provider>;
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

// Helper for building a list of DatasourceMetadata results that will take care of de-duping already used selectors
function buildListDatasourceMetadataResults(pluginDisplayName: string) {
  const results: DatasourceMetadata[] = [];
  const usedNames = new Set<string>();
  let defaultAdded = false;
  const addResult = (spec: DatasourceSpec, selectorName: string) => {
    // If we haven't added a default yet and this is a default, add default option to the beginning of the results
    if (spec.default && defaultAdded === false) {
      results.unshift({
        name: `Default ${pluginDisplayName}`,
        selector: {
          kind: spec.plugin.kind,
        },
      });
      defaultAdded = true;
    }

    // If we already have a datasource with this selector name, ignore it, otherwise add to end of list
    if (usedNames.has(selectorName)) return;

    results.push({
      name: spec.display?.name ?? selectorName,
      selector: {
        kind: spec.plugin.kind,
        name: selectorName,
      },
    });
    usedNames.add(selectorName);
  };

  return { results, addResult };
}
