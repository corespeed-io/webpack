import type { DotenvConfigOptions } from 'dotenv';
import type { GetPortOptions } from 'get-port-please';
import type { ReactCompilerLoaderOption } from 'react-compiler-webpack';
import type {
  Configuration as WebpackConfiguration,
  ExternalItemObjectKnown as WebpackExternalItemObjectKnown, ExternalItemObjectUnknown as WebpackExternalItemObjectUnknown
} from 'webpack';
import type { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import type { Options as SwcOptions } from '@swc/types';
import type { Targets as LightningCssTargets } from 'lightningcss';

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
   * If not specificied, the `html-webpack-plugin` will not be enabled
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
    filenamePrefix?: string,
    /**
     * `output.crossOriginLoading` setting.
     *
     * @default undefined
     */
    crossOriginLoading?: WebpackConfigurationOutput['crossOriginLoading']
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
   * Enable `postcss-loader`. This allows you to run PostCSS plugins like Tailwind CSS.
   *
   * You need to manually install `postcss-loader` in your project for this to work.
   *
   * @default false
   */
  postcss?: boolean,
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
  plugins?: WebpackConfiguration['plugins'],

  dotenv?: boolean | DotenvConfigOptions,

  /**
   * By default we will use "browserlists" package to looking for config, like `.browserslistrc` file or `browserslist` field in `package.json`, etc.
   *
   * But if you wish, you can also directly specify the browserlists here.
   */
  browserlists?: string | string[],

  /**
   * Enable alias lodash to lodash-es for better tree-shaking.
   *
   * @default false
   */
  lodashTreeShaking?: boolean
}

type OptionalOrMustSpecified = 'entry' | 'htmlTemplatePath' | 'browserlists';

export interface ConfigurationBlockContext {
  swcJavaScriptOptions: SwcOptions,
  swcTypeScriptOptions: SwcOptions,
  supportedBrowsers: string[] | undefined,
  lightningcssTargets: LightningCssTargets | undefined,

  jsFilename: string,
  cssFilename: string,
  assetFilename: string
};

export interface CreateWebpackContext extends Required<Omit<CreateWebpackOptions, OptionalOrMustSpecified>>, Pick<CreateWebpackOptions, OptionalOrMustSpecified> {}

export type ConfigurationFn = (config: WebpackConfiguration) => WebpackConfiguration | Promise<WebpackConfiguration>;
export type ConfigurationBlock = (ctx: CreateWebpackContext, blockCtx: ConfigurationBlockContext) => ConfigurationFn;
