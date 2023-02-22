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

import {
  PluginLoader,
  PluginModuleResource,
  TimeRangeProvider,
  dynamicImportPluginLoader,
  TemplateVariableContext,
} from '@perses-dev/plugin-system';
import { Meta, Story } from '@storybook/react';
import { QueryParamProvider } from 'use-query-params';
import { WindowHistoryAdapter } from 'use-query-params/adapters/window';
import { PluginRegistry } from '@perses-dev/plugin-system';
import { TimeSeriesChart } from '@perses-dev/panels-plugin';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const panelsResource = require('../../../plugin.json');

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  args: {},
} as Meta;

const bundledPluginLoader: PluginLoader = dynamicImportPluginLoader([
  {
    resource: panelsResource as PluginModuleResource,
    importPlugin: () => import('@perses-dev/panels-plugin'),
  },
]);

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: Story = () => {
  return (
    <PluginRegistry
      pluginLoader={bundledPluginLoader}
      defaultPluginKinds={{
        Panel: 'TimeSeriesChart',
      }}
    >
      <TemplateVariableContext.Provider
        value={{
          state: {
            one: {
              value: '',
              loading: false,
            },
          },
        }}
      >
        <QueryParamProvider adapter={WindowHistoryAdapter}>
          <TimeRangeProvider
            initialTimeRange={{
              end: new Date(),
              pastDuration: '6h',
            }}
            enabledURLParams={false}
          >
            <TimeSeriesChart.PanelComponent
              spec={{
                queries: [],
              }}
            />
          </TimeRangeProvider>
        </QueryParamProvider>
      </TemplateVariableContext.Provider>
    </PluginRegistry>
  );
};

export const Primary = Template.bind({});
