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
import {
  DatasourceStoreContext,
  DatasourceStore,
  usePluginRegistry,
  DatasourceSelectItemGroup,
} from '@perses-dev/plugin-system';
import { StoryFn, StoryContext } from '@storybook/react';

declare module '@storybook/react' {
  interface Parameters {
    withPluginSystemDatasourceStore?: WithPluginSystemDatasourceStoreParameter;
  }
}

export type WithPluginSystemDatasourceStoreParameter = {
  props: DatasourceStore;
};

const prometheusDemoUrl = 'https://prometheus.demo.do.prometheus.io';

// Type guard because storybook types parameters as `any`
function isWithDatastoreStoreParameter(
  parameter: unknown | WithPluginSystemDatasourceStoreParameter
): parameter is WithPluginSystemDatasourceStoreParameter {
  return !!parameter && typeof parameter === 'object' && 'props' in parameter;
}

// This decorator includes "PluginSystem" in the name to differentiate it from
// the datasource store decorator in the `dashboards` package.
export const WithPluginSystemDatasourceStore = (Story: StoryFn, context: StoryContext<unknown>) => {
  const { getPlugin } = usePluginRegistry();

  const initParameter = context.parameters.withPluginSystemDatasourceStore;

  // This currently provides a very simplified default to enable use in some
  // basic stories. It likely will need expanding in the future.
  // In general, `plugin-system` would probably benefit from a provider wrapper
  // for `DatasourceStoreContext` that is more generic than the one available
  // in the `dashboard` package for non-dashboard use cases.
  const defaultValue: DatasourceStore = {
    getDatasource: (selector) => {
      if (selector.kind === 'PrometheusDatasource') {
        return Promise.resolve({
          default: true,
          plugin: {
            kind: 'PrometheusDatasource',
            spec: {},
          },
        });
      }
      throw new Error(`WithDatasourceStore is not configured to support kind: ${selector.kind}`);
    },
    getDatasourceClient: async <Client,>(selector: DatasourceSelector) => {
      if (selector.kind === 'PrometheusDatasource') {
        const plugin = await getPlugin('Datasource', 'PrometheusDatasource');
        const client = plugin.createClient({ directUrl: prometheusDemoUrl }, { proxyUrl: prometheusDemoUrl }) as Client;
        return client;
      }
      throw new Error(`WithDatasourceStore is not configured to support kind: ${selector.kind}`);
    },
    listDatasourceSelectItems: async (datasourcePluginKind): Promise<DatasourceSelectItemGroup[]> => {
      if (datasourcePluginKind === 'PrometheusDatasource') {
        return Promise.resolve([
          {
            items: [
              {
                name: 'PrometheusDatasource',
                selector: { kind: 'PrometheusDatasource' },
              },
            ],
          },
        ]);
      }
      throw new Error(`WithDatasourceStore is not configured to support kind: ${datasourcePluginKind}`);
    },
    getSavedDatasources: (): Record<string, DatasourceSpec> => {
      return {};
    },
    setSavedDatasources: (datasources: Record<string, DatasourceSpec>) => {
      return datasources;
    },
    getLocalDatasources: (): Record<string, DatasourceSpec> => {
      return {};
    },
    setLocalDatasources: (datasources: Record<string, DatasourceSpec>) => {
      return datasources;
    },
  };

  const parameter = isWithDatastoreStoreParameter(initParameter) ? initParameter : { props: defaultValue };
  const props = parameter?.props;

  return (
    <DatasourceStoreContext.Provider value={props}>
      <Story />
    </DatasourceStoreContext.Provider>
  );
};
