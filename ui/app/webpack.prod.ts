import { Configuration } from 'webpack';
import { merge } from 'webpack-merge';
import { commonConfig } from './webpack.common';

const prodConfig: Configuration = {
  mode: 'production',
  bail: true,
  devtool: 'source-map',
};

const merged = merge(commonConfig, prodConfig);
export default merged;
