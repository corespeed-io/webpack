import type { Options as SwcOptions } from '@swc/types';

export function getSwcOptions(
  isDevelopment: boolean,
  useTypeScript: boolean,
  supportedBrowsers: string[] | undefined | null,
  coreJsVersion: string | undefined
): SwcOptions {
  return {
    jsc: {
      parser: useTypeScript
        ? {
          syntax: 'typescript',
          tsx: true
        }
        : {
          syntax: 'ecmascript',
          jsx: true,
          importAttributes: true
        },
      externalHelpers: true,
      loose: false,
      transform: {
        react: {
          runtime: 'automatic',
          refresh: isDevelopment,
          development: isDevelopment
        },
        optimizer: {
          simplify: true,
          globals: {
            // typeofs: {
            //   window: 'object'
            // },
            envs: {
              NODE_ENV: isDevelopment ? '"development"' : '"production"'
            }
          }
        }
      }
    },
    env: {
      // swc-loader don't read browserslist config file, manually specify targets
      targets:
        supportedBrowsers?.length
          ? supportedBrowsers
          : 'defaults, chrome > 70, edge >= 79, firefox esr, safari >= 11, not dead, not ie > 0, not ie_mob > 0, not OperaMini all',
      mode: 'usage',
      loose: false,
      coreJs: coreJsVersion,
      shippedProposals: false
    }
  };
}
