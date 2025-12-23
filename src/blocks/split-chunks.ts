import type { ConfigurationBlock } from '../types';

import type { Module as WebpackModule } from 'webpack';
import { getTopLevelFrameworkPaths } from '../utils/get-top-level-framework-paths';

export const splitChunks: ConfigurationBlock = ({
  cwd,
  topLevelFrameworkPackages
}) => (config) => {
  config.optimization ??= {};
  if (config.optimization.runtimeChunk === 'single') {
    config.optimization.runtimeChunk = { name: 'webpack' };
  } else {
    config.optimization.runtimeChunk ??= { name: 'webpack' };
  }

  config.optimization.splitChunks ||= {};
  config.optimization.splitChunks.maxInitialRequests = 25;
  config.optimization.splitChunks.minSize = 20000;

  config.optimization.splitChunks.cacheGroups ??= {};

  const topLevelFrameworkPaths = getTopLevelFrameworkPaths(topLevelFrameworkPackages, cwd);

  config.optimization.splitChunks.cacheGroups.framework ||= {
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
  };

  return config;
};
