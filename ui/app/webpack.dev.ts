// Copyright 2021 The Perses Authors
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

import fs from 'fs';
import { Configuration } from 'webpack';
import { Configuration as DevServerConfig } from 'webpack-dev-server';
import { merge } from 'webpack-merge';
import { commonConfig } from './webpack.common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv-defaults').config();

declare module 'webpack' {
  interface Configuration {
    devServer?: DevServerConfig | undefined;
  }
}

// Get dev server HTTPS options
function getHttpsConfig() {
  // in case you would like to disable explicitly the https config of Perses (dev environment only).
  // It's useful in a gitpod environment since the https config is blocking the preview of the UI.
  if (process.env.PERSES_DISABLE_HTTPS === 'true') {
    return false;
  }
  // If key/cert not specified, just use the default self-signed cert
  if (process.env.SSL_KEY_FILE === undefined || process.env.SSL_CRT_FILE === undefined) {
    return true;
  }

  return {
    key: fs.readFileSync(process.env.SSL_KEY_FILE),
    cert: fs.readFileSync(process.env.SSL_CRT_FILE),
  };
}

// Webpack configuration in dev
const devConfig: Configuration = {
  mode: 'development',
  devtool: 'cheap-module-source-map',

  output: {
    pathinfo: true,
  },

  watchOptions: {
    aggregateTimeout: 300,
  },

  devServer: {
    port: parseInt(process.env.PORT ?? '3000'),
    open: true,
    https: getHttpsConfig(),
    historyApiFallback: true,
    allowedHosts: 'all',
    proxy: {
      '/api': 'http://localhost:8080',
      '/proxy': 'http://localhost:8080',
    },
  },
  cache: true,
};

const merged = merge(commonConfig, devConfig);
export default merged;
