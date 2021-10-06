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

import { Configuration } from 'webpack';
import { Configuration as DevServerConfig } from 'webpack-dev-server';
import { merge } from 'webpack-merge';
import { commonConfig } from './webpack.common';

declare module 'webpack' {
  interface Configuration {
    devServer?: DevServerConfig | undefined;
  }
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
    historyApiFallback: true,
  },
};

const merged = merge(commonConfig, devConfig);
export default merged;
