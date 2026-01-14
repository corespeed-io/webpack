import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import type { ConfigurationBlock } from '../types';
import { ensurePackage } from '../utils/ensure-package';
import { createRequire } from 'node:module';

import path from 'node:path';

export const resolve: ConfigurationBlock = ({ cwd, lodashTreeShaking }) => async (config) => {
  config.resolve ??= {};

  const extensions = ['.ts', '.tsx', '.jsx', '.mjs', '.cjs', '.js', '.json'];

  config.resolve.extensions = extensions;
  config.resolve.cache = true;
  config.resolve.unsafeCache = false;
  config.resolve.conditionNames = ['import', 'module', 'require', 'default'];
  config.resolve.plugins ??= [];
  config.resolve.plugins.push(
    new TsconfigPathsPlugin({
      // tsconfig-paths-webpack-plugin can't access `resolve.extensions`
      // have to provide again
      extensions
    })
  );

  const globalRequire = createRequire(cwd);

  if (lodashTreeShaking) {
    await ensurePackage('lodash-es', cwd, true);

    config.resolve.alias ??= {};
    if (!Array.isArray(config.resolve.alias)) {
      config.resolve.alias.lodash = 'lodash-es';
    }

    config.resolve.fallback ??= {};
    if (!Array.isArray(config.resolve.fallback)) {
      config.resolve.fallback['lodash-es/fp'] = globalRequire.resolve('lodash/fp');
    }
  }

  /**
   * tailwind-merge optimization
   *
   * webpack do not repect the order in the `conditionNames` config
   * instead, it prioritize the order in the `exports` field of package.json
   *
   * since tailwind-merge list its CommonJS export before ESM export, webpack will
   * always piroritize CommonJS version.
   *
   * We can use alias to force webpack to use the ESM version
   */
  try {
    const tailwindMergeDistDir = globalRequire.resolve('tailwind-merge');

    config.resolve.alias ??= {};
    if (!Array.isArray(config.resolve.alias)) {
      config.resolve.alias['tailwind-merge'] = path.join(
        tailwindMergeDistDir,
        '../bundle-mjs.mjs'
      );
    }
  } catch {
    // tailwind-merge does not exist, do nothing
  }

  /**
   * use-sync-external-store/shim optimization
   *
   * React 18 and above has built-in support for useSyncExternalStore,
   * no need to include shim
   */
  try {
    const reactPackageJson = globalRequire('react/package.json');
    const reactVersion = reactPackageJson.version;
    const majorVersion = Number.parseInt(reactVersion.split('.')[0], 10);

    if (
      majorVersion >= 18
      || majorVersion === 0 // experimental versions
    ) {
      config.resolve.alias ??= {};

      if (!Array.isArray(config.resolve.alias)) {
        config.resolve.alias['use-sync-external-store/shim'] = 'react';
      }
    }
  } catch {
    // react does not exist, do nothing
  }

  return config;
};
