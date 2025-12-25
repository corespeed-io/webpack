import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import type { ConfigurationBlock } from '../types';
import { ensurePackage } from '../utils/ensure-package';
import { createRequire } from 'node:module';

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

  return config;
};
