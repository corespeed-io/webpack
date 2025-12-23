import type { ConfigurationBlock } from '../types';

export const base: ConfigurationBlock = ({
  development: isDevelopment,
  entry,
  externals,
  webpackExperimentalBuiltinCssSupport
}) => (config) => {
  config.mode ??= isDevelopment ? 'development' : 'production';
  config.entry ??= entry;

  config.externals ??= externals;

  config.experiments ??= {};
  config.experiments.css ??= webpackExperimentalBuiltinCssSupport;
  config.experiments.cacheUnaffected ??= true;

  return config;
};
