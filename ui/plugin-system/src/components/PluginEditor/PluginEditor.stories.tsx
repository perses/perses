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

import type { Meta, StoryObj } from '@storybook/react';
import {
  PluginEditor,
  PluginRegistry,
  PluginLoader,
  PluginModuleResource,
  dynamicImportPluginLoader,
} from '@perses-dev/plugin-system';
import { DatasourceStoreProvider } from '@perses-dev/dashboards';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// NOTE: the aliases we use for components break these top level imports, so we
// import relatively.
// TODO: we should make these easier to import as code in a more standard way.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const prometheusResource = require('../../../../prometheus-plugin/plugin.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const panelsResource = require('../../../../panels-plugin/plugin.json');

const bundledPluginLoader: PluginLoader = dynamicImportPluginLoader([
  {
    resource: prometheusResource as PluginModuleResource,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    importPlugin: () => import('@perses-dev/prometheus-plugin'),
  },
  {
    resource: panelsResource as PluginModuleResource,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    importPlugin: () => import('@perses-dev/panels-plugin'),
  },
]);

const meta: Meta<typeof PluginEditor> = {
  component: PluginEditor,
  render: (args) => {
    const queryClient = new QueryClient({});

    return (
      <QueryClientProvider client={queryClient}>
        <PluginRegistry pluginLoader={bundledPluginLoader}>
          <DatasourceStoreProvider
            dashboardResource={{
              kind: 'Dashboard',
              metadata: {
                name: 'AddGroupButton',
                project: 'storybook',
                created_at: '2021-11-09T00:00:00Z',
                updated_at: '2021-11-09T00:00:00Z',
                version: 0,
              },
              spec: {
                duration: '6h',
                variables: [],
                layouts: [],
                panels: {},
              },
            }}
            datasourceApi={{
              getDatasource: () => Promise.resolve(undefined),
              getGlobalDatasource: () => Promise.resolve(undefined),
              listDatasources: () => Promise.resolve([]),
              listGlobalDatasources: () => Promise.resolve([]),
            }}
          >
            <PluginEditor {...args} />
          </DatasourceStoreProvider>
        </PluginRegistry>
      </QueryClientProvider>
    );
  },
};

export default meta;

type Story = StoryObj<typeof PluginEditor>;

export const Primary: Story = {
  args: {
    pluginType: 'TimeSeriesQuery',
    pluginKindLabel: 'Query Type',
    value: { kind: 'PrometheusTimeSeriesQuery', spec: { query: '' } },
  },
};
