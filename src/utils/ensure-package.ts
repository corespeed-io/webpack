import { createRequire } from 'node:module';
import isCI from 'is-ci';
import { confirm } from '@clack/prompts';
import { installPackage } from '@antfu/install-pkg';
import { castArray } from 'foxts/cast-array';

export async function ensurePackage(
  packages: string | string[],
  cwd: string,
  dev: boolean
) {
  const globalRequire = createRequire(cwd);

  const missingPackages = new Set<string>();

  for (const packageName of castArray(packages)) {
    try {
      globalRequire.resolve(packageName, { paths: [cwd] });
    } catch (e) {
      if (typeof e === 'object' && e && 'code' in e && e.code === 'MODULE_NOT_FOUND') {
        missingPackages.add(packageName);
      }
    }
  }

  if (missingPackages.size === 0) {
    return;
  }

  if (isCI) {
    throw new Error(
      `Missing required packages: ${[...missingPackages].join(
        ', '
      )}. Please ensure all required packages are installed.`
    );
  }

  const result = await confirm({
    message: ` The following packages are required but not installed: ${[...missingPackages].join(
      ', '
    )}. Do you want to install them now?`,
    initialValue: true
  });
  if (result) {
    await installPackage([...missingPackages], { dev });
  }
}
