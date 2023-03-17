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

import { StoryFn } from '@storybook/react';
import {
  PluginRegistry,
  PluginLoader,
  PluginModuleResource,
  dynamicImportPluginLoader,
} from '@perses-dev/plugin-system';

// NOTE: the aliases we use for components break these top level imports, so we
// import relatively.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const prometheusResource = require('../../../prometheus-plugin/plugin.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const panelsResource = require('../../../panels-plugin/plugin.json');

const bundledPluginLoader: PluginLoader = dynamicImportPluginLoader([
  {
    resource: prometheusResource as PluginModuleResource,
    // This throws an error in CI (but not locally for some reason), likely because
    // this package isn't a dependency for dashboards. We probably do not want to
    // make it one solely for type-checking in storybook.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    importPlugin: () => import('@perses-dev/prometheus-plugin'),
  },
  {
    resource: panelsResource as PluginModuleResource,
    // Same comment as above.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    importPlugin: () => import('@perses-dev/panels-plugin'),
  },
]);

/**
 * Wraps the story in a `PluginRegistry` that includes all of the plugins
 * bundled with Perses.
 */
export const WithPluginRegistry = (Story: StoryFn) => {
  return (
    <PluginRegistry pluginLoader={bundledPluginLoader}>
      <Story />
    </PluginRegistry>
  );
};
