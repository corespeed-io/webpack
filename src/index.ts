import process from 'node:process';
import { configDotenv } from 'dotenv';

import type {
  Configuration as WebpackConfiguration
} from 'webpack';

import { createRequire } from 'node:module';
import { getSupportedBrowsers } from './utils/get-supported-browsers';
import { getSwcOptions } from './utils/get-swc-loader-options';

import type { ConfigurationBlockContext, CreateWebpackContext, CreateWebpackOptions } from './types';
import { output } from './blocks/output';
import { base } from './blocks/base';
import { sourcemap } from './blocks/sourcemap';
import { devserver } from './blocks/devserver';
import { plugins } from './blocks/plugins';
import { resolve } from './blocks/resolve';
import { browserslistToTargets } from 'lightningcss';
import { external } from './blocks/external';
import { loaders } from './blocks/loaders';
import { optimization } from './blocks/optimizatoin';
import { splitChunks } from './blocks/split-chunks';

const $require = typeof globalThis.require === 'function'
  ? globalThis.require
  : createRequire(import.meta.url);

/**
 * Usage:
 *
 * ```js
 * // webpack.config.js
 * const { createWebpck } = require('@corespeed/webpack');
 * const path = require('node:path');
 *
 * module.exports = createWebpack({
 *   // your options here
 * }, {
 *  // your custom webpack config here
 * });
 * ```
 */
export async function createWebpack(
  options: CreateWebpackOptions,
  customWebpackOptions: WebpackConfiguration = {}
): Promise<WebpackConfiguration> {
  const ctx: CreateWebpackContext = {
    output: {},
    spa: true,
    publicDir: './public',
    development: process.env.NODE_ENV === 'development',
    // entry,
    htmlTemplatePath: './src/index.html',
    sourcemap: {},
    devServerPort: {},
    externals: {},
    webpackExperimentalBuiltinCssSupport: false,
    tailwind: false,
    svgr: false,
    topLevelFrameworkPackages: ['react', 'react-dom', 'wouter', 'react-router', 'react-router-dom'],
    reactCompiler: false,
    analyze: process.env.ANALYZE === 'true',
    plugins: [],
    dotenv: {},
    ...options
  };

  // dotenv
  if (ctx.dotenv) {
    if (typeof ctx.dotenv === 'boolean') {
      configDotenv();
    } else {
      configDotenv(ctx.dotenv);
    }
  }

  // Output
  const {
    filenameContainChunkName: outputChunkFileFormatContainChunkName = false,
    filenamePrefix: _outputFilenamePrefix = '/_assets/static/'
  } = ctx.output;

  const prodOnlyChunkName = outputChunkFileFormatContainChunkName ? '[name].' : '';
  const outputFilenamePrefix = ensureFilenamePrefix(_outputFilenamePrefix);

  // MiniCssExtractPlugin do not read output.cssFilename
  // https://github.com/webpack/mini-css-extract-plugin/issues/1041
  // So we need to pass cssFilename to both output.cssFilename and new MiniCssExtractPlugin({ filename: ... })
  // So we calculate them ahead here and pass via block context
  const jsFilename = outputFilenamePrefix + 'js/' + (
    ctx.development
      ? '[name].js'
      : prodOnlyChunkName + '[contenthash].js'
  );
  const cssFilename = outputFilenamePrefix + 'css/' + (
    ctx.development
      ? '[name].css'
      : prodOnlyChunkName + '[contenthash].css'
  );
  const assetFilename = outputFilenamePrefix + 'assets/' + (
    ctx.development
      ? '[name].[hash][ext][query]'
      : prodOnlyChunkName + '[hash][ext][query]'
  );

  // Misc
  const supportedBrowsers = getSupportedBrowsers(ctx.browserlists, ctx.cwd, ctx.development);
  const lightningcssTargets = supportedBrowsers ? browserslistToTargets(supportedBrowsers) : undefined;

  const coreJsVersion = $require('core-js/package.json').version;

  const blockCtx: ConfigurationBlockContext = {
    swcJavaScriptOptions: getSwcOptions(ctx.development, false, supportedBrowsers, coreJsVersion),
    swcTypeScriptOptions: getSwcOptions(ctx.development, true, supportedBrowsers, coreJsVersion),
    supportedBrowsers,
    lightningcssTargets,

    jsFilename,
    cssFilename,
    assetFilename
  };

  return [
    base(ctx, blockCtx),
    external(ctx, blockCtx),
    output(ctx, blockCtx),
    sourcemap(ctx, blockCtx),
    devserver(ctx, blockCtx),
    loaders(ctx, blockCtx),
    plugins(ctx, blockCtx),
    optimization(ctx, blockCtx),
    splitChunks(ctx, blockCtx),
    resolve(ctx, blockCtx)
  ].reduce<WebpackConfiguration | Promise<WebpackConfiguration>>(
    async (config, next) => next(await config),
    customWebpackOptions
  );
}

function ensureFilenamePrefix(path: string): string {
  if (path.startsWith('/')) {
    path = path.slice(1);
  }
  if (!path.endsWith('/')) {
    path = path + '/';
  }
  return path;
}

export type { CreateWebpackOptions } from './types';
