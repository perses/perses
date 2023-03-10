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
import { StorybookConfig } from '@storybook/react-webpack5';

// UI project root.
const uiRoot = path.resolve(__dirname, '../../..');

/**
 * Information about packages that is used to configure storybook.
 */
type PkgConfig = {
  /**
   * Name of the package. Used to configure a webpack alias.
   */
  pkg: string;

  /**
   * Absolute path to the source directory for the package. Used to look for
   * stories and to configure a webpack alias.
   */
  directory: string;

  /**
   * Title for items from that package. Will be used as the name for the folder
   * containing stories from this package in the storybook UI.
   */
  title: string;
};

const pkgConfig: PkgConfig[] = [
  {
    pkg: '@perses-dev/components',
    directory: path.resolve(uiRoot, 'components/src'),
    title: 'Components',
  },
  {
    pkg: '@perses-dev/core',
    directory: path.resolve(uiRoot, 'core/src'),
    title: 'Core',
  },
  {
    pkg: '@perses-dev/dashboards',
    directory: path.resolve(uiRoot, 'dashboards/src'),
    title: 'Dashboards',
  },
  {
    pkg: '@perses-dev/panels-plugin',
    directory: path.resolve(uiRoot, 'panels-plugin/src'),
    title: 'Panels Plugin',
  },
  {
    pkg: '@perses-dev/plugin-system',
    directory: path.resolve(uiRoot, 'plugin-system/src'),
    title: 'Plugin System',
  },
  {
    pkg: '@perses-dev/prometheus-plugin',
    directory: path.resolve(uiRoot, 'prometheus-plugin/src'),
    title: 'Prometheus Plugin',
  },
];

// File selector for stories.
const BASE_STORY_SELECTOR = '*.stories.@(ts|tsx|mdx)';
const config: StorybookConfig = {
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@storybook/addon-storysource',
    'storybook-dark-mode',
  ],
  stories: [
    // Package-specific stories that live alongside their components or in
    // the `stories` directory.
    ...pkgConfig.map(({ directory, title }) => {
      return {
        directory,
        titlePrefix: title,
        files: `**/${BASE_STORY_SELECTOR}`,
      };
    }),
    // Higher level stories that live alongside the storybook setup.
    '../stories/**/*.@(mdx|stories.@(ts|tsx))',
  ],
  typescript: {
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      compilerOptions: {
        // TODO: play around with these settings
      },
    },
  },
  webpackFinal: async (config) => {
    // Ensure resolve is defined to appease typescript
    config.resolve = config.resolve || {};
    const defaultAlias = config.resolve.alias;
    config.resolve.alias = {
      ...defaultAlias,

      // Needed to support referencing the utils in other packages.
      '@perses-dev/storybook': path.resolve(uiRoot, 'storybook/src'),

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
  docs: {
    autodocs: true,
  },
  babel: async () => {
    // Babel config needed for Storybook 7. Using a babelrc doesn't seem to work
    // right with our monorepo setup. Keep an eye on this as the beta improves.
    return {
      sourceType: 'unambiguous',
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              chrome: 100,
            },
          },
        ],
        '@babel/preset-typescript',
        '@babel/preset-react',
      ],
      plugins: ['react-require'],
    };
  },
};

export default config;
