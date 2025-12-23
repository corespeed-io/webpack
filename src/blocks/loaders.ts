import type {
  Configuration as WebpackConfiguration,
  RuleSetRule as WebpackRuleSetRule
} from 'webpack';

import LightningCSS from 'lightningcss';
import { loader as MiniCssExtractPluginLoader } from 'mini-css-extract-plugin';
import { reactCompilerLoader, defineReactCompilerLoaderOption } from 'react-compiler-webpack';

import type { ConfigurationBlock, ConfigurationFn } from '../types';
import { createRequire } from 'node:module';
import { ensurePackage } from '../utils/ensure-package';

const regexLikeCss = /\.(css|scss|sass)$/;

const $require = typeof globalThis.require === 'function'
  ? globalThis.require
  : createRequire(import.meta.url);

export const loaders: ConfigurationBlock = (
  {
    cwd,
    postcss,
    svgr,
    reactCompiler,
    webpackExperimentalBuiltinCssSupport,
    browserlists
  },
  {
    swcTypeScriptOptions,
    swcJavaScriptOptions,
    supportedBrowsers
  }
) => async (config) => {
  await ensurePackage(['core-js', '@swc/helpers'], cwd, false);

  const blocks: ConfigurationFn[] = [];

  config.module ??= {};
  config.module.rules ??= [];

  // Automatically transform references to files (i.e. url()) into URLs
  loader({
    oneOf: [
      {
        // This should only be applied to CSS files
        issuer: regexLikeCss,
        // Exclude extensions that webpack handles by default
        exclude: [
          /\.(js|mjs|jsx|ts|tsx)$/,
          /\.html$/,
          /\.json$/,
          /\.webpack\[[^\]]+]$/
        ],
        // `asset/resource` always emits a URL reference, where `asset`
        // might inline the asset as a data URI
        type: 'asset/resource'
      }
    ]
  });

  // CSS
  if (postcss) {
    await ensurePackage(['postcss', 'postcss-loader'], cwd, true);
  }

  const globalRequire = createRequire(cwd);

  if (!webpackExperimentalBuiltinCssSupport || postcss) {
    loader({
      test: /\.css$/,
      use: [
        !webpackExperimentalBuiltinCssSupport && {
          loader: MiniCssExtractPluginLoader
        },
        !webpackExperimentalBuiltinCssSupport && {
          loader: $require.resolve('css-loader')
        },
        postcss && {
          loader: globalRequire.resolve('postcss-loader')
        },
        {
          loader: $require.resolve('lightningcss-loader'),
          options: {
            implementation: LightningCSS,
            // lightningcss-loader will read targets and parsed via browserlists
            // https://github.com/fz6m/lightningcss-loader/blob/7f3601abea4479deb31db713610c5a09e8a5d576/src/loader.ts#L44
            // https://github.com/fz6m/lightningcss-loader/blob/7f3601abea4479deb31db713610c5a09e8a5d576/src/minify.ts#L111
            // https://github.com/fz6m/lightningcss-loader/blob/7f3601abea4479deb31db713610c5a09e8a5d576/src/utils.ts#L39
            targets: browserlists ?? supportedBrowsers
          }
        }
      ]
    });
  }

  // SVGR
  if (svgr) {
    await ensurePackage('@svgr/webpack', cwd, true);

    loader({
      test: /\.svg$/i,
      type: 'asset', // webpack auto asset/resource or asset/inline
      resourceQuery: /url/ // *.svg?url
    });
    loader({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/, // this way we can ignore css url() imports
      resourceQuery: { not: [/url/] }, // exclude react component if *.svg?url
      use: [
        {
          loader: $require.resolve('swc-loader'),
          options: swcTypeScriptOptions
        },
        {
          loader: globalRequire.resolve('@svgr/webpack'),
          options: {
            babel: false
          }
        }
      ]
    });
  }

  // Assets
  loader({
    oneOf: [
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource'
      },
      {
        test: /assets\//,
        type: 'asset/resource',
        generator: {
          filename: '_assets/[hash][ext][query]'
        }
      }
    ]
  });

  // TypeScript/JavaScript
  if (reactCompiler) {
    await ensurePackage('babel-plugin-react-compiler', cwd, true);
  }
  loader({
    test: /\.[cm]?tsx?$/,
    exclude: [
      /node_modules/
    ],
    use: [
      {
        loader: $require.resolve('swc-loader'),
        options: swcTypeScriptOptions
      },
      reactCompiler && {
        loader: reactCompilerLoader,
        options: defineReactCompilerLoaderOption(
          typeof reactCompiler === 'object' ? reactCompiler : {}
        )
      }
    ]
  });
  loader({
    test: /\.[cm]?jsx?$/,
    exclude: [
      /node_modules/
    ],
    use: [
      {
        loader: $require.resolve('swc-loader'),
        options: swcJavaScriptOptions
      },
      reactCompiler && {
        loader: reactCompilerLoader,
        options: defineReactCompilerLoaderOption(
          typeof reactCompiler === 'object' ? reactCompiler : {}
        )
      }
    ]
  });

  return blocks.reduce<WebpackConfiguration | Promise<WebpackConfiguration>>(
    async (cfg, next) => next(await cfg),
    config
  );

  function loader(rule: WebpackRuleSetRule) {
    blocks.push((config: WebpackConfiguration) => {
      if (rule.oneOf) {
        const existing = config.module!.rules!.find(
          (arrayRule) => arrayRule && typeof arrayRule === 'object' && arrayRule.oneOf
        );
        if (existing && typeof existing === 'object') {
          existing.oneOf!.push(...rule.oneOf);
          return config;
        }
      }

      config.module!.rules!.push(rule);
      return config;
    });
  };

  // function unshiftLoader(
  //   rule: WebpackRuleSetRule
  // ) {
  //   blocks.push((config: WebpackConfiguration) => {
  //     if (rule.oneOf) {
  //       const existing = config.module!.rules!.find(
  //         (arrayRule) => arrayRule && typeof arrayRule === 'object' && arrayRule.oneOf
  //       );
  //       if (existing && typeof existing === 'object') {
  //         existing.oneOf?.unshift(...rule.oneOf);
  //         return config;
  //       }
  //     }

  //     config.module!.rules!.unshift(rule);
  //     return config;
  //   });
  // };
};
