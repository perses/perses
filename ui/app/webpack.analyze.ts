import { Configuration } from 'webpack';
import { merge } from 'webpack-merge';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import prodConfig from './webpack.prod';

const analyzeConfig: Configuration = {
  plugins: [new BundleAnalyzerPlugin()],
};

const merged = merge(prodConfig, analyzeConfig);
export default merged;
