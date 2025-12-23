import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import type { ConfigurationBlock } from '../types';

export const resolve: ConfigurationBlock = () => (config) => {
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

  return config;
};
