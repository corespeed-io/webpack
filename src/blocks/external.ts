import { appendArrayInPlace } from 'foxts/append-array-in-place';
import type { ConfigurationBlock } from '../types';
import type { ExternalItem as WebpackExternalItem } from 'webpack';

export const external: ConfigurationBlock = ({
  externals
}) => (config) => {
  const finalExternals: WebpackExternalItem[] = [];

  if (config.externals) {
    if (Array.isArray(config.externals)) {
      appendArrayInPlace(finalExternals, config.externals);
    } else {
      finalExternals.push(config.externals);
    }
  }

  finalExternals.push(externals);

  config.externals = finalExternals;

  return config;
};
