import type { ConfigurationBlock } from '../types';

export const base: ConfigurationBlock = ({
  development: isDevelopment,
  entry,
  webpackExperimentalBuiltinCssSupport
}) => (config) => {
  config.mode ??= isDevelopment ? 'development' : 'production';
  config.entry ??= entry;

  config.experiments ??= {};
  config.experiments.css ??= webpackExperimentalBuiltinCssSupport;
  config.experiments.cacheUnaffected ??= true;

  return config;
};
