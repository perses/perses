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
import { DatasourceStoreProvider, TemplateVariableList, TemplateVariableProvider } from '@perses-dev/dashboards';
import { WindowHistoryAdapter } from 'use-query-params/adapters/window';
import { QueryParamProvider } from 'use-query-params';
import { PluginRegistry, TimeRangeProvider } from '@perses-dev/plugin-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const meta: Meta<typeof TemplateVariableList> = {
  component: TemplateVariableList,
  render: (args) => {
    const queryClient = new QueryClient({});

    return (
      <QueryParamProvider adapter={WindowHistoryAdapter}>
        <QueryClientProvider client={queryClient}>
          <PluginRegistry
            pluginLoader={{
              getInstalledPlugins: () => Promise.resolve([]),
              importPluginModule: () => Promise.resolve(),
            }}
          >
            <TimeRangeProvider
              initialTimeRange={{
                pastDuration: '6h',
                end: new Date(),
              }}
              enabledURLParams={false}
            >
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
                <TemplateVariableProvider
                  initialVariableDefinitions={[
                    {
                      kind: 'TextVariable',
                      spec: { name: 'NewVariable', display: { name: 'MyVariable' }, value: 'one' },
                    },
                    {
                      kind: 'ListVariable',
                      spec: {
                        name: 'MyList',
                        display: { name: 'MyList' },
                        allow_multiple: false,
                        allow_all_value: false,
                        plugin: {
                          kind: 'StaticListVariable',
                          spec: {
                            values: [
                              { value: 'one', label: 'one' },
                              { value: 'two', label: 'two' },
                              { value: 'three', label: 'three' },
                            ],
                          },
                        },
                      },
                    },
                  ]}
                >
                  <TemplateVariableList {...args} />
                </TemplateVariableProvider>
              </DatasourceStoreProvider>
            </TimeRangeProvider>
          </PluginRegistry>
        </QueryClientProvider>
      </QueryParamProvider>
    );
  },
};

export default meta;

type Story = StoryObj<typeof TemplateVariableList>;

export const Primary: Story = {
  args: {},
};
