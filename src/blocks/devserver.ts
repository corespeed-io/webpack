import type { ConfigurationBlock } from '../types';

import { getPort } from 'get-port-please';

// eslint-disable-next-line import-x/no-empty-named-blocks -- reference `devServer` types, not actually referenced in final dist index.d.ts
import type {} from 'webpack-dev-server';

export const devserver: ConfigurationBlock = ({
  devServerPort,
  spa,
  publicDir
}) => async (config) => {
  const {
    fallbackPort: port = process.env.PORT ? Number(process.env.PORT || 3000) : 3000,
    portRange,
    ports
  } = devServerPort;
  const finalPort = await getPort({
    port,
    ports,
    portRange
  });

  config.devServer ??= {};
  config.devServer.port ??= finalPort;
  config.devServer.hot ??= true;
  config.devServer.historyApiFallback ??= spa;

  config.devServer.static ??= {};
  if (typeof config.devServer.static === 'object' && !Array.isArray(config.devServer.static)) {
    config.devServer.static.directory ??= publicDir;
  }
  // in any case being a string, array, boolean, we do not override it

  config.devServer.client ??= {};
  if (typeof config.devServer.client === 'object') {
    config.devServer.client.overlay ??= {};
    if (typeof config.devServer.client.overlay === 'object') {
      config.devServer.client.overlay.errors ??= true;
      config.devServer.client.overlay.warnings ??= false;
    }
  }

  return config;
};
