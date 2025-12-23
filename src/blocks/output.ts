import type { Configuration as WebpackConfiguration } from 'webpack';
import type { ConfigurationBlock } from '../types';

export const output: ConfigurationBlock = (
  {
    output
  },
  {
    jsFilename,
    cssFilename,
    assetFilename
  }
) => (config: WebpackConfiguration) => {
  const {
    path: outputPath,
    library
  } = output;

  config.output ??= {};
  config.output.asyncChunks = true;
  config.output.crossOriginLoading = 'anonymous';
  config.output.hashFunction = 'xxhash64';
  config.output.hashDigestLength = 16;

  config.output.path ??= outputPath;
  config.output.library ??= library;
  config.output.filename ??= jsFilename;
  config.output.chunkFilename ??= jsFilename;
  config.output.cssFilename ??= cssFilename;
  config.output.cssChunkFilename ??= cssFilename;
  config.output.assetModuleFilename ??= assetFilename;

  config.output.hotUpdateChunkFilename = '[id].[fullhash].hot-update.js';
  config.output.hotUpdateMainFilename = '[fullhash].[runtime].hot-update.json';

  return config;
};
