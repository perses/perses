// Copyright The Perses Authors
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

import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack';

export default defineConfig({
    plugins: [pluginReact()],
    source: {
        entry: {
            index: './src/index.ts',
        },
    },
    output: {
        distPath: {
            root: 'dist',
        },
    },
    tools: {
        rspack: {
            output: {
                uniqueName: '@perses-dev/opengemini-plugin',
            },
            plugins: [
                new ModuleFederationPlugin({
                    name: 'opengemini',
                    filename: '__mf/remoteEntry.js',
                    exposes: {
                        './OpenGeminiDatasource': './src/datasources/opengemini-datasource/OpenGeminiDatasource.tsx',
                        './OpenGeminiTimeSeriesQuery': './src/queries/opengemini-time-series-query/OpenGeminiTimeSeriesQuery.tsx',
                    },
                    shared: {
                        react: {
                            singleton: true,
                            requiredVersion: '^18.0.0',
                        },
                        'react-dom': {
                            singleton: true,
                            requiredVersion: '^18.0.0',
                        },
                        '@emotion/react': {
                            singleton: true,
                        },
                        '@emotion/styled': {
                            singleton: true,
                        },
                        '@mui/material': {
                            singleton: true,
                        },
                        '@perses-dev/core': {
                            singleton: true,
                        },
                        '@perses-dev/components': {
                            singleton: true,
                        },
                        '@perses-dev/plugin-system': {
                            singleton: true,
                        },
                    },
                }),
            ],
        },
    },
    server: {
        port: 3100,
    },
});
