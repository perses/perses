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
import { Panel } from '@perses-dev/dashboards';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import {
  PluginRegistry,
  PluginLoader,
  PluginModuleResource,
  dynamicImportPluginLoader,
} from '@perses-dev/plugin-system';

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
    importPlugin: () => import('@perses-dev/prometheus-plugin'),
  },
  {
    resource: panelsResource as PluginModuleResource,
    importPlugin: () => import('@perses-dev/panels-plugin'),
  },
]);

const meta: Meta<typeof Panel> = {
  component: Panel,
  render: (args) => {
    const queryClient = new QueryClient({});
    return (
      <QueryClientProvider client={queryClient}>
        <PluginRegistry pluginLoader={bundledPluginLoader}>
          <Panel {...args} />
        </PluginRegistry>
      </QueryClientProvider>
    );
  },
};

export default meta;

type Story = StoryObj<typeof Panel>;

export const Primary: Story = {
  args: {
    definition: {
      kind: 'Panel',
      spec: {
        display: {
          name: 'Dashboard Team Overview',
          description: 'This is a markdown panel',
        },
        plugin: {
          kind: 'Markdown',
          spec: {
            text: "## Dashboard Team!\nOn this page, you'll find charts used by the dashboard team.\n\nHere is `some inline code`.\n\n```\n{ look: 'at this code' }\n```\n\n1. One\n2. Two\n3. Three\n\n* two bullet\n* points\n\nDo you want to [visit the google](https://www.google.com)?\n| Dashboard | Link |\n| :----------- | :----------- |\n| Dashboard 1 | [link](www.google.com) |\n| Dashboard 2 | [link](www.google.com) | \n\n<script>alert('xss');</script>\n> Will this <a \n> href='javascript:alert()'>block-quote attack work?</a>\n\n<h1>When inlining HTML, will this header be here?</h1><a href='www.google.com'>Will this regular link be here?</a> <a href='javascript:alert('xss')>Will this javascript link be here?</a>\n\n",
          },
        },
      },
    },
  },
};
