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

import path from 'path';
import { Configuration } from 'webpack';

const uiRoot = path.resolve(__dirname, '../../..');
console.log(uiRoot);

const pkgConfig = [
  {
    pkg: '@perses-dev/components',
    directory: path.resolve(uiRoot, 'components/src'),
    titlePrefix: 'Components',
  },
  {
    pkg: '@perses-dev/core',
    directory: path.resolve(uiRoot, 'core/src'),
    titlePrefix: 'Core',
  },
  {
    pkg: '@perses-dev/dashboards',
    directory: path.resolve(uiRoot, 'dashboards/src'),
    titlePrefix: 'Dashboards',
  },
  {
    pkg: '@perses-dev/panels-plugin',
    directory: path.resolve(uiRoot, 'panels-plugin/src'),
    titlePrefix: 'Panels Plugin',
  },
  {
    pkg: '@perses-dev/plugin-system',
    directory: path.resolve(uiRoot, 'plugin-system/src'),
    titlePrefix: 'Plugin System',
  },
  {
    pkg: '@perses-dev/prometheus-plugin',
    directory: path.resolve(uiRoot, 'prometheus-plugin/src'),
    titlePrefix: 'Prometheus Plugin',
  },
];

const BASE_STORY_SELECTOR = '*.stories.@(js|jsx|ts|tsx|mdx)';

module.exports = {
  core: {
    builder: 'webpack5',
  },
  framework: '@storybook/react',
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    'storybook-dark-mode',
  ],
  stories: [
    // Package-specific stories that live alongside their components or in
    // the `stories` directory.
    ...pkgConfig.map(({ directory, titlePrefix }) => {
      return {
        directory,
        titlePrefix,
        files: `**/${BASE_STORY_SELECTOR}`,
      };
    }),
    // Higher level stories that live alongside the storybook setup.
    `../stories/**/${BASE_STORY_SELECTOR}`,
  ],
  typescript: {
    reactDocgen: 'react-docgen',
    reactDocgenTypescriptOptions: {
      compilerOptions: {
        // TODO: play around with these settings
        allowSyntheticDefaultImports: false,
        esModuleInterop: false,
      },
    },
  },
  webpackFinal: async (config: Configuration) => {
    // Ensure resolve is defined to appease typescript
    config.resolve = config.resolve || {};

    const defaultAlias = config.resolve.alias;

    config.resolve.alias = {
      ...defaultAlias,
      // We alias internal cross-package imports to the src (instead of dist)
      // to ensure we are using the same versions of the code throughout the
      // storybook. Without this, we'd be using a mix and match of src/dist for
      // providers/context, leading to them not working properly.
      // Note that this does not work correctly for top-level items not in `src`
      // (e.g. `plugin.json` files).
      ...pkgConfig.reduce((result, { pkg, directory }) => {
        return {
          ...result,
          [pkg]: directory,
        };
      }, {}),
    };
    return config;
  },
};
