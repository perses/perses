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

import { ReactElement, ReactNode, useCallback, useMemo, useState } from 'react';
import {
  DashboardResource,
  DashboardSpec,
  DatasourceResource,
  DatasourceSelector,
  DatasourceSpec,
  GlobalDatasourceResource,
  useEvent,
  EphemeralDashboardResource,
  DatasourceDefinition,
} from '@perses-dev/core';
import {
  DatasourceStoreContext,
  DatasourceStore,
  DatasourceSelectItemGroup,
  usePluginRegistry,
  DatasourceClient,
  DatasourceSelectItem,
} from '@perses-dev/plugin-system';

export interface DatasourceStoreProviderProps {
  dashboardResource?: DashboardResource | EphemeralDashboardResource;
  projectName?: string;
  datasourceApi: DatasourceApi;
  children?: ReactNode;
  savedDatasources?: Record<string, DatasourceSpec>;
  onCreate?: (client: DatasourceClient) => DatasourceClient;
}

/**
 * The external API for fetching datasource resources
 */
export interface DatasourceApi {
  buildProxyUrl?: BuildDatasourceProxyUrlFunc;
  getDatasource: (project: string, selector: DatasourceSelector) => Promise<DatasourceResource | undefined>;
  getGlobalDatasource: (selector: DatasourceSelector) => Promise<GlobalDatasourceResource | undefined>;
  listDatasources: (project: string, pluginKind?: string) => Promise<DatasourceResource[]>;
  listGlobalDatasources: (pluginKind?: string) => Promise<GlobalDatasourceResource[]>;
}

/**
 * A `DatasourceContext` provider that uses an external API to resolve datasource selectors.
 */
export function DatasourceStoreProvider(props: DatasourceStoreProviderProps): ReactElement {
  const { projectName, datasourceApi, onCreate, children } = props;
  const [dashboardResource, setDashboardResource] = useState(props.dashboardResource);
  const [savedDatasources, setSavedDatasources] = useState<Record<string, DatasourceSpec>>(
    props.savedDatasources ?? {}
  );
  const project = projectName ?? dashboardResource?.metadata.project;

  const { getPlugin, listPluginMetadata } = usePluginRegistry();

  const findDatasource = useEvent(async (selector: DatasourceSelector) => {
    // Try to find it in dashboard spec
    if (dashboardResource) {
      const { datasources } = dashboardResource.spec;
      const dashboardDatasource = findDashboardDatasource(datasources, selector);
      if (dashboardDatasource) {
        return {
          spec: dashboardDatasource.spec,
          proxyUrl: buildDatasourceProxyUrl(datasourceApi, {
            project: dashboardResource.metadata.project,
            dashboard: dashboardResource.metadata.name,
            name: dashboardDatasource.name,
          }),
        };
      }
    }

    if (project) {
      // Try to find it at the project level as a Datasource resource
      const datasource = await datasourceApi.getDatasource(project, selector);
      if (datasource !== undefined) {
        return {
          spec: datasource.spec,
          proxyUrl: buildDatasourceProxyUrl(datasourceApi, {
            project: datasource.metadata.project,
            name: datasource.metadata.name,
          }),
        };
      }
    }

    // Try to find it at the global level as a GlobalDatasource resource
    const globalDatasource = await datasourceApi.getGlobalDatasource(selector);
    if (globalDatasource !== undefined) {
      return {
        spec: globalDatasource.spec,
        proxyUrl: buildDatasourceProxyUrl(datasourceApi, {
          name: globalDatasource.metadata.name,
        }),
      };
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
    async function getClient<Client extends DatasourceClient>(selector: DatasourceSelector): Promise<Client> {
      const { kind } = selector;
      const [{ spec, proxyUrl }, plugin] = await Promise.all([findDatasource(selector), getPlugin('Datasource', kind)]);

      // allows extending client
      const client = plugin.createClient(spec.plugin.spec, { proxyUrl }) as Client;
      if (onCreate !== undefined) {
        return onCreate(client) as Client;
      }
      return client;
    },
    [findDatasource, getPlugin, onCreate]
  );

  const listDatasourceSelectItems = useEvent(
    async (datasourcePluginName: string): Promise<DatasourceSelectItemGroup[]> => {
      const [pluginMetadata, datasources, globalDatasources] = await Promise.all([
        listPluginMetadata(['Datasource']),
        project ? datasourceApi.listDatasources(project, datasourcePluginName) : [],
        datasourceApi.listGlobalDatasources(datasourcePluginName),
      ]);

      // Find the metadata for the plugin type they asked for, so we can use it for the name of the default datasource
      const datasourcePluginMetadata = pluginMetadata.find((metadata) => metadata.spec.name === datasourcePluginName);
      if (datasourcePluginMetadata === undefined) {
        throw new Error(`Could not find a Datasource plugin with kind '${datasourcePluginName}'`);
      }

      // Get helper for computing results properly
      const { results, addItem } = buildDatasourceSelectItemGroups(datasourcePluginMetadata.spec.display.name);

      // Start with dashboard datasources with the highest precedence
      if (dashboardResource?.spec.datasources) {
        for (const selectorName in dashboardResource.spec.datasources) {
          const spec = dashboardResource.spec.datasources[selectorName];
          if (spec === undefined || spec.plugin.kind !== datasourcePluginName) continue;

          const saved = selectorName in savedDatasources;
          addItem({ spec, selectorName, selectorGroup: 'dashboard', saved });
        }
      }

      // Now look at project-level datasources
      for (const datasource of datasources) {
        const selectorName = datasource.metadata.name;
        addItem({
          spec: datasource.spec,
          selectorName,
          selectorGroup: 'project',
          editLink: `/projects/${project}/datasources`,
        });
      }

      // And finally global datasources
      for (const globalDatasource of globalDatasources) {
        const selectorName = globalDatasource.metadata.name;
        addItem({ spec: globalDatasource.spec, selectorName, selectorGroup: 'global', editLink: '/admin/datasources' });
      }

      return results;
    }
  );

  const getLocalDatasources = useCallback((): Record<string, DatasourceSpec> => {
    return dashboardResource?.spec.datasources ?? {};
  }, [dashboardResource]);

  const getSavedDatasources = useCallback((): Record<string, DatasourceSpec> => {
    return savedDatasources;
  }, [savedDatasources]);

  const setLocalDatasources = useCallback(
    (datasources: Record<string, DatasourceSpec>) => {
      if (dashboardResource) {
        setDashboardResource(
          dashboardResource.kind === 'Dashboard'
            ? ({
                ...dashboardResource,
                spec: {
                  ...dashboardResource.spec,
                  datasources: datasources,
                },
              } as DashboardResource)
            : ({
                ...dashboardResource,
                spec: {
                  ...dashboardResource.spec,
                  datasources: datasources,
                },
              } as EphemeralDashboardResource)
        );
      }
    },
    [dashboardResource]
  );

  const ctxValue: DatasourceStore = useMemo(
    () =>
      ({
        getDatasource,
        getDatasourceClient,
        getLocalDatasources,
        setLocalDatasources,
        setSavedDatasources,
        getSavedDatasources,
        listDatasourceSelectItems,
      }) as DatasourceStore,
    [
      getDatasource,
      getDatasourceClient,
      getLocalDatasources,
      setLocalDatasources,
      listDatasourceSelectItems,
      setSavedDatasources,
      getSavedDatasources,
    ]
  );

  return <DatasourceStoreContext.Provider value={ctxValue}>{children}</DatasourceStoreContext.Provider>;
}

function buildDatasourceProxyUrl(api: DatasourceApi, params: BuildDatasourceProxyUrlParams): string {
  return api.buildProxyUrl ? api.buildProxyUrl(params) : '';
}

// Helper to find a datasource in the list embedded in a dashboard spec
function findDashboardDatasource(
  dashboardDatasources: DashboardSpec['datasources'],
  selector: DatasourceSelector
): DatasourceDefinition | undefined {
  if (dashboardDatasources === undefined) return undefined;

  // If using a name in the selector...
  if (selector.name !== undefined) {
    const named = dashboardDatasources[selector.name];
    if (named === undefined) return undefined;
    return named.plugin.kind === selector.kind ? { name: selector.name, spec: named } : undefined;
  }

  // If only using a kind, try to find one with that kind that is the default
  const result = Object.entries(dashboardDatasources).find(
    (entry) => entry[1].plugin.kind === selector.kind && entry[1].default
  );
  if (!result) {
    return undefined;
  }
  return { name: result[0], spec: result[1] };
}

interface AddDatasouceSelectItemParams {
  spec: DatasourceSpec;
  selectorName: string;
  selectorGroup?: string;
  editLink?: string;
  saved?: boolean;
}

type AddDatasourceSelectItemFunc = (params: AddDatasouceSelectItemParams) => void;

/**
 * Helper for building a list of DatasourceSelectItemGroup results.
 * @param pluginDisplayName
 */
function buildDatasourceSelectItemGroups(pluginDisplayName: string): {
  results: DatasourceSelectItemGroup[];
  addItem: AddDatasourceSelectItemFunc;
} {
  const results: DatasourceSelectItemGroup[] = [];
  const usedNames = new Set<string>();
  let isFirst = true;
  let explicitDefaultAdded = false;
  const groupIndices: Record<string, number> = {};
  let currentGroupIndex = 1; // 0 is the default group, always there as it contains at least the first item.

  const addItem = ({
    spec,
    selectorName,
    selectorGroup: group,
    editLink,
    saved,
  }: AddDatasouceSelectItemParams): void => {
    group = group ?? '';

    // Ensure the default group is always present as soon as an item is added.
    if (isFirst) {
      results.push({
        group: `Default ${pluginDisplayName}`,
        items: [],
      });
    }

    // Create the group if necessary
    let selectItemGroup = results[groupIndices[group] ?? -1];
    if (!selectItemGroup) {
      groupIndices[group] = currentGroupIndex;
      selectItemGroup = { items: [], group, editLink };
      results[currentGroupIndex] = selectItemGroup;
      currentGroupIndex++;
    }

    // Add item to the group
    const isOverridden = usedNames.has(selectorName);
    selectItemGroup.items.push({
      name: spec.display?.name ?? selectorName,
      overridden: isOverridden,
      saved,
      selector: {
        kind: spec.plugin.kind,
        name: selectorName,
        group,
      },
    });
    usedNames.add(selectorName);

    const isExplicitDefault = !isOverridden && spec.default && !explicitDefaultAdded;
    if (results[0] && (isFirst || isExplicitDefault)) {
      // If we haven't added a default yet and this is a default, add default option to the beginning of the results
      results[0].items = [
        {
          name: `Default (${selectorName} from ${group})`,
          selector: {
            kind: spec.plugin.kind,
          },
        },
      ];
      // We consider that we added the default datasource only if it has been explicitly set as default.
      // If we add this datasource as default just because it's the first, it still needs to be overridable by
      // another datasource explicitly set as default.
      explicitDefaultAdded = isExplicitDefault;
    }

    // At the end, we make sure the overriding item(s) is well flagged so
    if (isOverridden) {
      for (let i = explicitDefaultAdded ? 1 : 0; i < currentGroupIndex; i++) {
        (results[i]?.items ?? [])
          .filter((item: DatasourceSelectItem) => item.selector.name === selectorName)
          .forEach((item: DatasourceSelectItem) => {
            item.overriding = true;
          });
      }
    }

    isFirst = false;
  };

  return { results, addItem };
}
