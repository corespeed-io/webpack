import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import type { ConfigurationBlock } from '../types';
import ReactRefreshPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import { DefinePlugin } from 'webpack';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import WebpackBarProgressPlugin from 'webpackbar';
import { appendArrayInPlace } from 'foxts/append-array-in-place';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

export const plugins: ConfigurationBlock = ({
  development: isDevelopment,
  htmlTemplatePath,
  analyze,
  webpackExperimentalBuiltinCssSupport,
  plugins: customPlugins
}, { cssFilename }) => (config) => {
  config.plugins ??= [];

  if (!isDevelopment) {
    config.plugins.push(
      new CleanWebpackPlugin(),
      new WebpackBarProgressPlugin()
    );
  }

  if (isDevelopment) {
    config.plugins.push(new ReactRefreshPlugin());
  }

  if (!webpackExperimentalBuiltinCssSupport) {
    config.plugins.push(
      new MiniCssExtractPlugin({
        filename: cssFilename
      })
    );
  }

  // env inline
  const publicEnv = Object.entries(process.env).reduce<Record<string, string>>(
    (acc, [key, value]) => {
      if (key.startsWith('PUBLIC_') || key.startsWith('NEXT_PUBLIC_')) {
        acc[`process.env.${key}`] = JSON.stringify(value);
      }
      return acc;
    },
    {}
  );
  config.plugins.push(
    new DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || (isDevelopment ? 'development' : 'production')),
      'import.meta.env.DEV': isDevelopment.toString(),
      'import.meta.env.PROD': (!isDevelopment).toString(),
      'typeof window': JSON.stringify('object'),
      'process.env': JSON.stringify(publicEnv),
      ...publicEnv
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'public',
          to: '.', // relative to output.path
          // globOptions: {
          //   ignore: ['**/index.html']
          // },
          noErrorOnMissing: true
        }
      ]
    })
  );
  if (htmlTemplatePath) {
    config.plugins.push(
      new HtmlWebpackPlugin({
        template: htmlTemplatePath
      })
    );
  }
  if (analyze) {
    config.plugins.push(
      new BundleAnalyzerPlugin(
        typeof analyze === 'object'
          ? analyze
          : {
            analyzerMode: 'static'
          }
      )
    );
  }

  appendArrayInPlace(config.plugins, customPlugins);

  return config;
};
