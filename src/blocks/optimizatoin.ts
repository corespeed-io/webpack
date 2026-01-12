import TerserWebpackPlugin from 'terser-webpack-plugin';

import type { ConfigurationBlock } from '../types';
import { LightningCssMinifyPlugin } from 'lightningcss-loader';

import LightningCSS from 'lightningcss';

export const optimization: ConfigurationBlock = (
  {
    development: isDevelopment,
    browserlists,
    dropConsoleInProduction
  },
  {
    supportedBrowsers
  }
) => (config) => {
  config.optimization ??= {};

  config.optimization.emitOnErrors = !isDevelopment;
  config.optimization.checkWasmTypes = false;
  config.optimization.nodeEnv = false; // we manually bring our own DefinePlugin

  config.optimization.minimizer ??= [];
  config.optimization.minimizer.push(
    new TerserWebpackPlugin({
      minify: TerserWebpackPlugin.swcMinify,
      terserOptions: {
        compress: {
          ecma: 2018,
          comparisons: false,
          inline: 2, // https://github.com/vercel/next.js/issues/7178#issuecomment-493048965
          // inline: 1,
          drop_console: isDevelopment ? false : dropConsoleInProduction
        },
        mangle: { safari10: true },
        format: {
          // use ecma 2015+ to enable minify like shorthand object
          ecma: 2018,
          safari10: true,
          comments: false,
          // Fixes usage of Emoji and certain Regex
          ascii_only: true
        }
      }
    }),
    new LightningCssMinifyPlugin({
      implementation: LightningCSS,
      // lightningcss-loader will read targets and parsed via browserlists
      // https://github.com/fz6m/lightningcss-loader/blob/7f3601abea4479deb31db713610c5a09e8a5d576/src/loader.ts#L44
      // https://github.com/fz6m/lightningcss-loader/blob/7f3601abea4479deb31db713610c5a09e8a5d576/src/minify.ts#L111
      // https://github.com/fz6m/lightningcss-loader/blob/7f3601abea4479deb31db713610c5a09e8a5d576/src/utils.ts#L39
      targets: browserlists ?? supportedBrowsers
    })
  );

  return config;
};
