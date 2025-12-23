import type { ConfigurationBlock } from '../types';

export const sourcemap: ConfigurationBlock = ({
  development: isDevelopment,
  sourcemap
}) => (config) => {
  const {
    development: sourceMapDevelopment = 'eval-source-map',
    production: sourceMapProduction = 'hidden-source-map'
  } = sourcemap;

  config.devtool ??= isDevelopment ? sourceMapDevelopment : sourceMapProduction;

  return config;
};
