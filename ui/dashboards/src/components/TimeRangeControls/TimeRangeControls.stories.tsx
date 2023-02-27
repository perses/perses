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
import { TimeRangeControls, DashboardProvider } from '@perses-dev/dashboards';
import { PluginRegistry, TimeRangeProvider } from '@perses-dev/plugin-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WindowHistoryAdapter } from 'use-query-params/adapters/window';
import { QueryParamProvider } from 'use-query-params';
import { action } from '@storybook/addon-actions';

const meta: Meta<typeof TimeRangeControls> = {
  component: TimeRangeControls,
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
              timeRange={{
                pastDuration: '6h',
                end: new Date(),
              }}
              onChange={action('onChange TimeRangeProvider')}
            >
              <DashboardProvider
                initialState={{
                  dashboardResource: {
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
                  },
                }}
              >
                <TimeRangeControls {...args} />
              </DashboardProvider>
            </TimeRangeProvider>
          </PluginRegistry>
        </QueryClientProvider>
      </QueryParamProvider>
    );
  },
};

export default meta;

type Story = StoryObj<typeof TimeRangeControls>;

export const Primary: Story = {
  args: {},
};
