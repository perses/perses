// Copyright 2024 The Perses Authors
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

import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  server: {
    port: 3005,
  },
  dev: {
    assetPrefix: '/plugins-dev/BarChart/',
  },
  output: {
    assetPrefix: '/plugins/BarChart/',
    copy: [{ from: './package.json' }],
  },
  plugins: [pluginReact()],
  tools: {
    htmlPlugin: false,
    rspack: (config, { appendPlugins }) => {
      config.output!.uniqueName = 'BarChart';
      appendPlugins([
        new ModuleFederationPlugin({
          name: 'BarChart',
          exposes: {
            './BarChart': './src/BarChart.ts',
          },
          shared: {
            react: { requiredVersion: '^18.2.0', singleton: true },
            'react-dom': { requiredVersion: '^18.2.0', singleton: true },
            echarts: { singleton: true },
            'date-fns': { singleton: true },
            'date-fns-tz': { singleton: true },
            lodash: { singleton: true },
            '@perses-dev/components': { singleton: true },
            '@perses-dev/plugin-system': { singleton: true },
            '@emotion/react': { requiredVersion: '^11.11.3', singleton: true },
            '@emotion/styled': { singleton: true },
            '@hookform/resolvers': { singleton: true },
            'use-resize-observer': { requiredVersion: '^9.1.0', singleton: true },
            'mdi-material-ui': { requiredVersion: '^7.4.0', singleton: true },
            immer: { singleton: true },
          },
          dts: false,
          runtime: false,
        }),
      ]);
    },
  },
});
