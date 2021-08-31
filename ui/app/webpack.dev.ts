// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv-defaults').config();
import fs from 'fs';
import { Configuration } from 'webpack';
import { Configuration as DevServerConfig } from 'webpack-dev-server';
import { merge } from 'webpack-merge';
import { commonConfig } from './webpack.common';

declare module 'webpack' {
  interface Configuration {
    devServer?: DevServerConfig | undefined;
  }
}

// Get dev server HTTPS options
function getHttpsConfig() {
  // If key/cert not specified, just use the default self-signed cert
  if (
    process.env.SSL_KEY_FILE === undefined ||
    process.env.SSL_CRT_FILE === undefined
  ) {
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
    port: parseInt(process.env.PORT ?? '3001'),
    open: true,
    https: getHttpsConfig(),
    historyApiFallback: true,
  },
};

let localConfig = {};
try {
  localConfig = require('./webpack.local.js');
  console.log('Using local config from webpack.local.js');
} catch {}

const merged = merge(commonConfig, devConfig, localConfig);
export default merged;
