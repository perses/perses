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
  DatasourceSelector,
  DatasourceSpec,
  useEvent,
  DatasourceDefinition,
  GenericDatasourceResource,
} from '@perses-dev/core';
import {
  DatasourceStoreContext,
  DatasourceStore,
  DatasourceSelectItemGroup,
  usePluginRegistry,
  DatasourceClient,
  DatasourceSelectItem,
} from '@perses-dev/plugin-system';
import { isEqual } from 'lodash';

export interface DatasourceStoreProviderProps {
  projectName?: string;
  datasources: GenericDatasourceResource[];
  children?: ReactNode;
  savedDatasources?: Record<string, DatasourceSpec>;
  onCreate?: (client: DatasourceClient) => DatasourceClient;
}

/**
 * A `DatasourceContext` provider that uses an external API to resolve datasource selectors.
 */
export function DatasourceStoreProvider(props: DatasourceStoreProviderProps): ReactElement {
  const { projectName: project, datasources, onCreate, children } = props;
  /* IMPORTANT: Here local means in-memory datasources which are not persisted yet but can be injected to the provider by the consumer at run time  */
  const [localDatasourcesState, setLocalDatasourcesState] = useState<GenericDatasourceResource[]>([]);
  const [savedDatasources, setSavedDatasources] = useState<Record<string, DatasourceSpec>>(
    props.savedDatasources ?? {}
  );
  const { getPlugin, listPluginMetadata } = usePluginRegistry();

  const findDatasource = useEvent(async (selector: DatasourceSelector) => {
    const searchDataset = [...datasources, ...localDatasourcesState];
    // First try to find it in dashboard spec
    if (searchDataset.some((ds) => ds.kind === 'Dashboard')) {
      const foundDashboardDatasource = findDashboardDatasource(
        datasources.filter((ds) => ds.kind === 'Dashboard'),
        selector
      );
      if (foundDashboardDatasource) {
        return {
          spec: foundDashboardDatasource.spec,
          proxyUrl: foundDashboardDatasource.spec.proxyUrl,
        };
      }
    }

    // Then, try to find it in dashboard spec
    if (project) {
      const datasource = searchDataset.find(
        (ds) => ds.spec.plugin.kind === selector.kind && ds.metadata['project'] === project
      );

      if (datasource) {
        return {
          spec: datasource.spec,
          proxyUrl: datasource.spec.proxyUrl,
        };
      }
    }

    // Finally, look for a global datasource
    const globalDatasource = searchDataset
      .filter((ds) => ds.kind === 'GlobalDatasource')
      .find((ds) => {
        if (selector.kind !== ds.spec.plugin.kind) {
          return false;
        }
        if (!selector.name) {
          return ds.spec.default;
        }
        return ds.metadata.name.toLowerCase() === selector.name.toLowerCase();
      });

    if (globalDatasource) {
      return {
        spec: globalDatasource.spec,
        proxyUrl: globalDatasource.spec.proxyUrl,
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
      const searchDataset = [...datasources, ...localDatasourcesState];
      const projectDatasources = project
        ? searchDataset.filter(
            (ds) => ds.metadata['project'] === project && ds.spec.plugin.kind === datasourcePluginName
          )
        : [];
      const globalDatasources = searchDataset.filter(
        (ds) => ds.kind === 'GlobalDatasource' && ds.spec.plugin.kind === datasourcePluginName
      );
      const pluginMetadata = await listPluginMetadata(['Datasource']);

      // Find the metadata for the plugin type they asked for, so we can use it for the name of the default datasource
      const datasourcePluginMetadata = pluginMetadata.find((metadata) => metadata.spec.name === datasourcePluginName);
      if (datasourcePluginMetadata === undefined) {
        throw new Error(`Could not find a Datasource plugin with kind '${datasourcePluginName}'`);
      }

      // Get helper for computing results properly
      const { results, addItem } = buildDatasourceSelectItemGroups(datasourcePluginMetadata.spec.display.name);

      // Start with dashboard datasources with the highest precedence
      if (searchDataset.some((ds) => ds.kind === 'Dashboard')) {
        searchDataset
          .filter((ds) => ds.kind === 'Dashboard')
          .forEach(({ spec, metadata: { name: selectorName } }) => {
            if (spec.plugin?.kind === datasourcePluginName) {
              const saved = selectorName in savedDatasources;
              addItem({ spec, selectorName, selectorGroup: 'dashboard', saved });
            }
          });
      }

      // Now look at project-level datasources
      for (const pds of projectDatasources) {
        const selectorName = pds.metadata.name;
        addItem({
          spec: pds.spec,
          selectorName,
          selectorGroup: 'project',
          editLink: `/projects/${project}/datasources`,
        });
      }

      // And finally global datasources
      for (const gds of globalDatasources) {
        const selectorName = gds.metadata.name;
        addItem({ spec: gds.spec, selectorName, selectorGroup: 'global', editLink: '/admin/datasources' });
      }

      return results;
    }
  );

  const getSavedDatasources = useCallback((): Record<string, DatasourceSpec> => {
    return savedDatasources;
  }, [savedDatasources]);

  const queryDatasources = useCallback(
    (selector: DatasourceSelector) => {
      const { name, kind } = selector;
      const queryDataSet = [...datasources, ...localDatasourcesState];

      let result: GenericDatasourceResource[] = queryDataSet.filter((ds) => ds.kind === kind);
      if (name) {
        result = result.filter((ds) => ds.metadata.name.toLowerCase() === name.toLowerCase());
      }
      return result;
    },
    [datasources, localDatasourcesState]
  );

  const setLocalDatasources = useCallback(
    (localDatasources: GenericDatasourceResource[]) => {
      const uniqueNewLocalDatasources = localDatasources.filter((localDatasource) => {
        for (let i = 0; i < datasources.length; i += 1) {
          if (isEqual(datasources[i], localDatasource)) {
            return false;
          }
        }
        return true;
      });
      setLocalDatasourcesState([...uniqueNewLocalDatasources]);
    },
    [datasources]
  );

  const getLocalDatasources = useCallback(() => localDatasourcesState, [localDatasourcesState]);

  const ctxValue: DatasourceStore = useMemo(
    () =>
      ({
        getDatasource,
        getDatasourceClient,
        setSavedDatasources,
        getSavedDatasources,
        listDatasourceSelectItems,
        queryDatasources,
        setLocalDatasources,
        getLocalDatasources,
      }) as DatasourceStore,
    [
      getDatasource,
      getDatasourceClient,
      listDatasourceSelectItems,
      setSavedDatasources,
      getSavedDatasources,
      queryDatasources,
      setLocalDatasources,
      getLocalDatasources,
    ]
  );

  return <DatasourceStoreContext.Provider value={ctxValue}>{children}</DatasourceStoreContext.Provider>;
}

// Helper to find a datasource in the list embedded in a dashboard spec
function findDashboardDatasource(
  dashboardDatasources: GenericDatasourceResource[],
  selector: DatasourceSelector
): DatasourceDefinition | undefined {
  if (!dashboardDatasources?.length) return undefined;

  const { name: selectorName, kind: selectorKind } = selector;

  if (selectorName) {
    const namedDatasource = dashboardDatasources.find(
      (ds) => ds.metadata.name === selector.name && ds.spec.plugin.kind === selectorKind
    );
    if (!namedDatasource) return undefined;

    const {
      metadata: { name },
      spec,
    } = namedDatasource;

    return { name, spec };
  }

  // If only kind is specified, try to find the default datasource for that kind
  const defaultDatasource = dashboardDatasources.find((ds) => ds.spec.plugin.kind === selectorKind && ds.spec.default);
  if (!defaultDatasource) return undefined;

  return { name: defaultDatasource.metadata.name, spec: defaultDatasource.spec };
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
