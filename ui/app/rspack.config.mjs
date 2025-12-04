// Copyright 2025 The Perses Authors
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

import { resolve } from 'node:path';
import rspack from '@rspack/core';
import refreshPlugin from '@rspack/plugin-react-refresh';
import TerserPlugin from 'terser-webpack-plugin';
import { defineConfig } from '@rspack/cli';

const isDev = process.env.NODE_ENV === 'development';
const isSharedDev = isDev && process.env.SHARED_DEV === 'true';

const sharedPackagesPath = process.env.SHARED_PACKAGES_PATH ?? resolve(import.meta.dirname, '../../../shared');
const nodeModulesPath = resolve(import.meta.dirname, '../node_modules');
const sharedNodeModulesPath = resolve(sharedPackagesPath, 'node_modules');

const localAliases = {
  '@perses-dev/core': resolve(nodeModulesPath, '@perses-dev/core/dist'),
  '@perses-dev/internal-utils': resolve(nodeModulesPath, '@perses-dev/internal-utils/dist'),
};

const sharedAliases = {
  '@perses-dev/explore': resolve(sharedPackagesPath, 'explore/src'),
  '@perses-dev/components': resolve(sharedPackagesPath, 'components/src'),
  '@perses-dev/dashboards': resolve(sharedPackagesPath, 'dashboards/src'),
  '@perses-dev/plugin-system': resolve(sharedPackagesPath, 'plugin-system/src'),

  // packages only in shared node_modules
  zustand: resolve(sharedNodeModulesPath, 'zustand'),
  immer: resolve(sharedNodeModulesPath, 'immer'),
  'use-immer': resolve(sharedNodeModulesPath, 'use-immer'),
};

// ensure all packages use the same singleton/context-based library instances
// this prevents "multiple instances" errors when developing with shared packages
const singletonAliases = {
  react: resolve(nodeModulesPath, 'react'),
  'react-dom': resolve(nodeModulesPath, 'react-dom'),
  'react/jsx-runtime': resolve(nodeModulesPath, 'react/jsx-runtime'),
  'react/jsx-dev-runtime': resolve(nodeModulesPath, 'react/jsx-dev-runtime'),
  'react-router-dom': resolve(nodeModulesPath, 'react-router-dom'),
  'react-router': resolve(nodeModulesPath, 'react-router'),
  'use-query-params': resolve(nodeModulesPath, 'use-query-params'),
  '@tanstack/react-query': resolve(nodeModulesPath, '@tanstack/react-query'),
  '@mui/material': resolve(nodeModulesPath, '@mui/material'),
  '@mui/system': resolve(nodeModulesPath, '@mui/system'),
  '@mui/styles': resolve(nodeModulesPath, '@mui/styles'),
  '@emotion/react': resolve(nodeModulesPath, '@emotion/react'),
  '@emotion/styled': resolve(nodeModulesPath, '@emotion/styled'),
  'react-hook-form': resolve(nodeModulesPath, 'react-hook-form'),
};

export default defineConfig({
  output: {
    path: resolve(import.meta.dirname, './dist'),
    publicPath: isDev ? undefined : 'PREFIX_PATH_PLACEHOLDER/',
    filename: isDev ? '[name].js' : '[name].[contenthash].js',
    cssFilename: isDev ? '[name].css' : '[name].[contenthash].css',
    cssChunkFilename: isDev ? '[id].css' : '[id].[contenthash].css',
    clean: true,
  },
  mode: isDev ? 'development' : 'production',
  devtool: isDev ? 'cheap-module-source-map' : false,
  entry: './src/bundle.ts',
  resolve: {
    extensions: ['...', '.ts', '.tsx', '.jsx'],
    alias: isSharedDev ? { ...sharedAliases, ...localAliases, ...singletonAliases } : {},
  },
  experiments: {
    css: true,
  },
  optimization: {
    minimizer: [new TerserPlugin(), new rspack.LightningCssMinimizerRspackPlugin()],
  },
  module: {
    rules: [
      {
        test: /\.(ttf|eot|woff|woff2)$/,
        type: 'asset/resource',
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        type: 'asset',
      },
      {
        test: /\.(jsx?|tsx?)$/,
        type: 'javascript/auto',
        exclude: [/node_modules/],
        use: [
          {
            loader: 'builtin:swc-loader',
            options: {
              jsc: {
                parser: {
                  syntax: 'typescript',
                  tsx: true,
                },
                transform: {
                  react: {
                    runtime: 'automatic',
                    development: isDev,
                    refresh: isDev,
                  },
                },
              },
              env: {
                targets: ['chrome >= 87', 'edge >= 88', 'firefox >= 78', 'safari >= 14'],
              },
            },
          },
        ],
      },
    ],
  },
  devServer: isDev
    ? {
        historyApiFallback: true,
        hot: true,
        liveReload: false,
        port: parseInt(process.env.PORT ?? '3000'),
        allowedHosts: 'all',
        proxy: [
          {
            context: ['/api', '/proxy', '/plugins'],
            target: 'http://localhost:8080',
          },
        ],
        client: {
          // By default, the error overlay is not shown because it can get in the
          // way of e2e tests and can be annoying for some developer workflows.
          // If you like the overlay, you can enable it by setting the specified
          // env var.
          overlay: process.env.ERROR_OVERLAY === 'true',
        },
      }
    : undefined,
  plugins: [
    new rspack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      'process.env.API_PREFIX': JSON.stringify(isDev ? '' : 'PREFIX_PATH_PLACEHOLDER'),
    }),
    new rspack.ProgressPlugin({}),
    new rspack.HtmlRspackPlugin({
      template: './index.html',
      favicon: './favicon.ico',
      publicPath: isDev ? '/' : 'PREFIX_PATH_PLACEHOLDER/',
    }),
    isDev ? new refreshPlugin() : null,
  ].filter(Boolean),
});
