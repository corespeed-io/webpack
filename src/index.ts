import process from 'node:process';
import { configDotenv } from 'dotenv';
import type { DotenvConfigOptions } from 'dotenv';

import type {
  Module as WebpackModule,
  Configuration as WebpackConfiguration,
  ExternalItemObjectKnown as WebpackExternalItemObjectKnown, ExternalItemObjectUnknown as WebpackExternalItemObjectUnknown
} from 'webpack';

// eslint-disable-next-line import-x/no-empty-named-blocks -- reference `devServer` types, not actually referenced in final dist index.d.ts
import type { } from 'webpack-dev-server';

import { getPort } from 'get-port-please';
import type { GetPortOptions } from 'get-port-please';

import LightningCSS from 'lightningcss';
import { loader as miniCssExtractPluginLoader } from 'mini-css-extract-plugin';

import { createRequire } from 'node:module';
import { getTopLevelFrameworkPaths } from './get-top-level-framework-paths';
import { getSupportedBrowsers } from './get-supported-browsers';
import { getSwcOptions } from './get-swc-loader-options';

import { reactCompilerLoader, defineReactCompilerLoaderOption } from 'react-compiler-webpack';
import type { ReactCompilerLoaderOption } from 'react-compiler-webpack';

import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import { DefinePlugin } from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import WebpackBar from 'webpackbar';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import { LightningCssMinifyPlugin } from 'lightningcss-loader';
import { ensurePackage } from './ensure-package';

const $require = typeof globalThis.require === 'function'
  ? globalThis.require
  : createRequire(import.meta.url);

type WebpackConfigurationOutput = NonNullable<WebpackConfiguration['output']>;

export interface CreateWebpackOptions {
  /**
   * Current working directory, used to resolve relative paths.
   *
   * There is no default value, you must provide this option.
   *
   * @example
   * ```js
   * // either
   * cwd: __dirname
   * // or
   * cwd: import.meta.dirname
   * ```
   */
  cwd: string,
  /**
   * @default process.env.NODE_ENV === 'development'
   */
  development?: boolean,
  /**
   * Enable Single Page Application (SPA) mode.
   *
   * When enabled, this will enables `devServer.historyApiFallback` option.
   *
   * @default true
   */
  spa?: boolean,
  /**
   * Directory to serve static files from.
   *
   * During development, this will be used as `devServer.static.directory` option.
   * During production build, the CopyWebpackPlugin will be used to copy files from this directory to `output.path`.
   *
   * @default undefined
   */
  publicDir?: string,
  entry?: WebpackConfiguration['entry'],
  /**
   * Path to HTML template file.
   *
   * This will be used by `html-webpack-plugin` to generate the final `index.html`.
   *
   * @default './src/index.html'
   */
  htmlTemplatePath?: string,
  output?: {
    /**
     * `output.path`
     *
     * @default undefined
     */
    path?: WebpackConfigurationOutput['path'],
    /**
     * `output.library`
     *
     * @default undefined
     */
    library?: WebpackConfigurationOutput['library'],
    /**
     * Show chunk name in filename.
     * When enabled, `output` filename format will contain `[name]`, making it easier to identify chunks during debugging.
     * Disable to reduce filename length and hide implementation details.
     *
     * @default false
     */
    filenameContainChunkName?: boolean,
    /**
     * Controls filename prefix for output files, this will append to `output.filename`, `output.chunkFilename`, etc.
     * This allows for easy CDN cache policy management / WAF Rules (via path prefix).
     *
     * @default '/_assets/static/'
     */
    filenamePrefix?: string
  },
  sourcemap?: {
    /**
     * `devtool` configuration used for development mode.
     *
     * @default 'eval-source-map'
     *
     * @example
     * 'eval-cheap-module-source-map' // faster development w/ large scale codebase, with trade-off on source map quality.
     */
    development?: WebpackConfiguration['devtool'],
    /**
     * `devtool` configuration used for development mode.
     *
     * @default 'hidden-source-map' // this works with error reporting services like Sentry.
     *
     * @example
     * false // completely disable source map in production. this will break w/ error reporting services like Sentry.
     */
    production?: WebpackConfiguration['devtool']
  },
  /**
   * Dev Server port. Uses `get-port-please` library under the hood to gracefully find available port.
   */
  devServerPort?: {
    /** `process.env.PORT` will always be preferred over this value.
     *
     * @default 3000
     */
    fallbackPort?: number,
    /** Additional ports to try (in addition to the default port and fallbackPort). */
    ports?: GetPortOptions['ports'],
    /**
     * Port range to try.
     * */
    portRange?: GetPortOptions['portRange']
  },
  /**
   * Webpack externals options, but only accepts object format
   *
   * @example
   *
   * ```js
   * externals: {
   *   // remove polyfills
   *   'text-encoding': 'TextEncoder',
   *   'whatwg-url': 'window',
   *   '@trust/webcrypto': 'crypto',
   *   'isomorphic-fetch': 'fetch',
   *   'node-fetch': 'fetch',
   *   // allow jQuery and Lodash to be loaded from CDN
   *   jquery: 'jQuery',
   *   lodash: '_',
   *   // required to bundle "@undecaf/zbar.wasm"
   *   module: 'module',
   *   // bundle shopify frone-end application
   *   'shopify-buy': 'ShopifyBuy'
   * }
   * ```
   */
  externals?: WebpackExternalItemObjectKnown & WebpackExternalItemObjectUnknown,
  /**
   * This is an array of top-level framework package names, they will be bundled together into a single "framework" chunk.
   * The idea is that these framework packages are less likely to change frequently, so by bundling them together it can
   * maxmize caching efficiency for both CDN and browser.
   *
   * @default ['react', 'react-dom', 'wouter', 'react-router', 'react-router-dom']
   */
  topLevelFrameworkPackages?: string[],
  /**
   * Enable experimental built-in CSS support (will be stablized in Webpack 6).
   * When disabled (default), CSS support will be handled via `mini-css-extract-plugin` and `css-loader`.
   *
   * @default false
   */
  webpackExperimentalBuiltinCssSupport?: boolean,
  /**
   * Enable TailwindCSS support via `postcss-loader` and `@tailwindcss/postcss` plugin.
   *
   * You need to manually install `postcss-loader` and `@tailwindcss/postcss` in your project for this to work.
   *
   * @default false
   */
  tailwind?: boolean,
  /**
   * Enable `@svgr/webpack` loader for SVG files.
   *
   * You need to manually install `@svgr/webpack` in your project for this to work.
   *
   * @default false
   */
  svgr?: boolean,
  /**
   * Enable React Compiler loader via `react-compiler-webpack`.
   *
   * @default false
   */
  reactCompiler?: boolean | ReactCompilerLoaderOption,
  /**
   * Enable bundle analysis using `webpack-bundle-analyzer`.
   *
   * @default process.env.ANALYZE === 'true'
   */
  analyze?: boolean | BundleAnalyzerPlugin.Options,
  /**
   * Other webpack plugins to use.
   */
  plugins: WebpackConfiguration['plugins'],

  dotenv?: boolean | DotenvConfigOptions
}

/**
 * Usage:
 *
 * ```js
 * // webpack.config.js
 * const { createWebpck } = require('@corespeed/webpack');
 * const path = require('node:path');
 *
 * module.exports = createWebpck({
 *   // your options here
 *   outputPath: path.join(__dirname, 'dist')
 * });
 * ```
 */
export async function createWebpck({
  cwd,
  output = {},
  spa = true,
  publicDir,
  development: isDevelopment = process.env.NODE_ENV === 'development',
  entry,
  htmlTemplatePath = './src/index.html',
  sourcemap = {},
  devServerPort = {},
  externals,
  webpackExperimentalBuiltinCssSupport = false,
  tailwind = false,
  svgr = false,
  topLevelFrameworkPackages = ['react', 'react-dom', 'wouter', 'react-router', 'react-router-dom'],
  reactCompiler = false,
  analyze = process.env.ANALYZE === 'true',
  plugins = [],
  dotenv = {}
}: CreateWebpackOptions): Promise<WebpackConfiguration> {
  if (dotenv) {
    if (typeof dotenv === 'boolean') {
      configDotenv();
    } else {
      configDotenv(dotenv);
    }
  }

  const {
    path: outputPath,
    library,
    filenameContainChunkName: outputChunkFileFormatContainChunkName = false,
    filenamePrefix: _outputFilenamePrefix = '/_assets/static/'
  } = output;
  const chunknamePrefix = outputChunkFileFormatContainChunkName ? '[name].' : '';
  const outputFilenamePrefix = ensureLeadingTrailingSlash(_outputFilenamePrefix);

  // devtool / sourcemap
  const {
    development: sourceMapDevelopment = 'eval-source-map',
    production: sourceMapProduction = 'hidden-source-map'
  } = sourcemap;

  // devServer.port
  const {
    fallbackPort: port = process.env.PORT ? Number(process.env.PORT || 3000) : 3000,
    portRange,
    ports
  } = devServerPort;
  const finalPort = await getPort({
    port,
    ports,
    portRange
  });

  const ensureDevPackages = ['webpack-dev-server', 'core-js', '@swc/helpers'];
  if (svgr) {
    ensureDevPackages.push('@svgr/webpack');
  }
  if (tailwind) {
    ensureDevPackages.push('postcss-loader', '@tailwindcss/postcss');
  }
  await ensurePackage(
    ensureDevPackages,
    cwd,
    true
  );

  // Misc
  const supportedBrowsers = getSupportedBrowsers(cwd, isDevelopment);

  const topLevelFrameworkPaths = getTopLevelFrameworkPaths(topLevelFrameworkPackages, cwd);

  const coreJsVersion = $require('core-js/package.json').version;

  const swcOptionsTypeScript = getSwcOptions(isDevelopment, true, supportedBrowsers, coreJsVersion);
  const swcOptionsJavaScript = getSwcOptions(isDevelopment, false, supportedBrowsers, coreJsVersion);

  const publicEnv = Object.entries(process.env).reduce<Record<string, string>>(
    (acc, [key, value]) => {
      if (key.startsWith('PUBLIC_') || key.startsWith('NEXT_PUBLIC_')) {
        acc[`process.env.${key}`] = JSON.stringify(value);
      }
      return acc;
    },
    {}
  );

  return {
    mode: isDevelopment ? 'development' : 'production',
    entry,
    output: {
      path: outputPath,
      library,
      filename: outputFilenamePrefix + 'js/' + (
        isDevelopment
          ? '[name].js'
          : chunknamePrefix + '[contenthash].js'
      ),
      cssFilename: outputFilenamePrefix + 'css/' + (
        isDevelopment
          ? '[name].css'
          : chunknamePrefix + '[contenthash].css'
      ),
      chunkFilename: outputFilenamePrefix + 'chunks/' + (
        isDevelopment
          ? '[name].js'
          : chunknamePrefix + '[contenthash].js'
      ),
      hotUpdateChunkFilename: '[id].[fullhash].hot-update.js',
      hotUpdateMainFilename: '[fullhash].[runtime].hot-update.json',
      asyncChunks: true,
      crossOriginLoading: 'anonymous',
      hashFunction: 'xxhash64',
      hashDigestLength: 16
      // strictModuleExceptionHandling: true
    },
    devtool: isDevelopment ? sourceMapDevelopment : sourceMapProduction,
    devServer: {
      port: finalPort,
      hot: true,
      historyApiFallback: spa,
      static: {
        directory: publicDir
      },
      client: {
        overlay: {
          errors: true,
          warnings: false
        }
      }
    },
    externals,
    module: {
      rules: [
        // CSS
        (!webpackExperimentalBuiltinCssSupport || tailwind) && {
          test: /\.css$/,
          use: [
            !webpackExperimentalBuiltinCssSupport && {
              loader: miniCssExtractPluginLoader
            },
            !webpackExperimentalBuiltinCssSupport && {
              loader: $require.resolve('css-loader')
            },
            {
              loader: $require.resolve('lightningcss-loader'),
              options: {
                implementation: LightningCSS
              }
            },
            tailwind && {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [$require('@tailwindcss/postcss')]
                }
              }
            }
          ]
        },
        // SVG w/ SVGR
        svgr && {
          test: /\.svg$/i,
          type: 'asset',
          resourceQuery: /url/, // *.svg?url
          generator: {
            filename: outputFilenamePrefix + 'svg/' + (
              isDevelopment
                ? '[name][ext][query]'
                : chunknamePrefix + '[contenthash][ext][query]'
            )
          }
        },
        svgr && {
          test: /\.svg$/i,
          issuer: /\.[jt]sx?$/,
          resourceQuery: { not: [/url/] }, // exclude react component if *.svg?url
          use: [
            {
              loader: $require.resolve('swc-loader'),
              options: swcOptionsTypeScript
            },
            $require.resolve('@svgr/webpack')
          ]
        },
        // Normal assets
        {
          oneOf: [
            {
              test: /\.(woff|woff2|eot|ttf|otf)$/i,
              type: 'asset/resource',
              generator: {
                filename: outputFilenamePrefix + 'fonts/' + (
                  isDevelopment
                    ? '[name][ext][query]'
                    : chunknamePrefix + '[contenthash][ext][query]'
                )
              }
            },
            {
              test: /assets\//,
              type: 'asset/resource',
              generator: {
                filename: '_assets/[hash][ext][query]'
              }
            }
          ]
        },
        // TypeScript/JavaScript
        {
          test: /\.[cm]?tsx?$/,
          exclude: [
            /node_modules/
          ],
          use: [
            {
              loader: $require.resolve('swc-loader'),
              options: swcOptionsTypeScript
            },
            reactCompiler && {
              loader: reactCompilerLoader,
              options: defineReactCompilerLoaderOption(
                typeof reactCompiler === 'object' ? reactCompiler : {}
              )
            }
          ]
        },
        {
          test: /\.[cm]?jsx?$/,
          exclude: [
            /node_modules/
          ],
          use: [
            {
              loader: $require.resolve('swc-loader'),
              options: swcOptionsJavaScript
            },
            reactCompiler && {
              loader: reactCompilerLoader,
              options: defineReactCompilerLoaderOption(
                typeof reactCompiler === 'object' ? reactCompiler : {}
              )
            }
          ]
        }
      ]
    },
    plugins: [
      !isDevelopment && new CleanWebpackPlugin(),
      isDevelopment && new ReactRefreshWebpackPlugin(),
      new DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
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
            to: '.',
            globOptions: {
              ignore: ['**/index.html']
            },
            noErrorOnMissing: true
          }
        ]
      }),
      new HtmlWebpackPlugin({
        template: htmlTemplatePath
      }),
      analyze && new BundleAnalyzerPlugin(
        typeof analyze === 'object'
          ? analyze
          : {
            analyzerMode: 'static'
          }
      ),
      !isDevelopment && new WebpackBar(),
      ...plugins
    ],
    resolve: {
      extensions: ['.ts', '.tsx', '.jsx', '.mjs', '.cjs', '.js', '.json'],
      cache: true,
      unsafeCache: false,
      conditionNames: ['import', 'module', 'require', 'default'],
      plugins: [
        new TsconfigPathsPlugin({
          // tsconfig-paths-webpack-plugin can't access `resolve.extensions`
          // have to provide again
          extensions: ['.ts', '.tsx', '.jsx', '.mjs', '.cjs', '.js', '.json']
        })
      ]
    },
    optimization: {
      splitChunks: {
        cacheGroups: {
          framework: {
            chunks: 'all',
            name: 'framework',
            test(module: WebpackModule) {
              const resource = module.nameForCondition();
              return resource
                ? topLevelFrameworkPaths.some((pkgPath) => resource.startsWith(pkgPath))
                : false;
            },
            priority: 40,
            enforce: true
          },
          monaco: {
            test: /[/\\]node_modules[/\\]monaco-editor[/\\]/,
            name: 'monaco',
            chunks: 'async',
            priority: 50,
            enforce: true
          }
        },
        maxInitialRequests: 25,
        minSize: 20000
      },
      runtimeChunk: {
        name: 'webpack'
      },
      minimizer: [
        new TerserPlugin({
          minify: TerserPlugin.swcMinify,
          terserOptions: {
            compress: {
              ecma: 2018,
              comparisons: false,
              inline: 2 // https://github.com/vercel/next.js/issues/7178#issuecomment-493048965
              // inline: 1,
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
          implementation: LightningCSS
        })
      ]
    },
    experiments: {
      css: webpackExperimentalBuiltinCssSupport,
      cacheUnaffected: true
    }
  } satisfies WebpackConfiguration;
}

function ensureLeadingTrailingSlash(path: string): string {
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  if (!path.endsWith('/')) {
    path = path + '/';
  }
  return path;
}
