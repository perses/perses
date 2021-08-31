import path from 'path';
import { Configuration } from 'webpack';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';

// File paths used by the build
const ROOT = path.resolve(__dirname);
export const FilePaths = {
  ROOT,
  SRC: path.resolve(ROOT, 'src'),
  OUT: path.resolve(ROOT, 'dist'),
};

// Webpack configuration that's common between environments
export const commonConfig: Configuration = {
  context: FilePaths.SRC,
  entry: {
    main: './index.tsx',
  },

  output: {
    path: FilePaths.OUT,
    publicPath: '/',
  },

  resolve: {
    // Add ts/tsx to list of files that can be imported without including the extension
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },

  plugins: [
    new CleanWebpackPlugin(),

    // Generates HTML index page with bundle injected
    new HtmlWebpackPlugin({
      template: path.resolve(FilePaths.SRC, 'index.html'),
      templateParameters: {},
    }),

    // Does TS type-checking in a separate process
    new ForkTsCheckerWebpackPlugin({
      typescript: {
        configFile: path.resolve(FilePaths.ROOT, 'tsconfig.json'),
      },
    }),
  ],

  // How to load and transpile modules
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        include: [FilePaths.SRC],
        enforce: 'pre',
        use: [
          {
            loader: 'eslint-loader',
          },
        ],
      },

      {
        test: /\.tsx?$/,
        //include: [FilePaths.SRC],
        use: [
          {
            loader: 'ts-loader',
            options: {
              // Type-checking happens in separate plugin process
              transpileOnly: true,
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(ttf|eot|woff|woff2)$/,
        type: 'asset/resource',
      },
      {
        test: /\.(png|jpg|gif)$/,
        type: 'asset',
      },
      // SVG as React components
      {
        test: /\.svg$/,
        use: [
          {
            loader: '@svgr/webpack',
            options: {
              // Generated React components will support a 'title' prop to render
              // a <title> inside the <svg>
              titleProp: true,
            },
          },
        ],
      },
    ],
  },
};
