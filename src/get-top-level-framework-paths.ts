import path from 'node:path';
import { createRequire } from 'node:module';

export function getTopLevelFrameworkPaths(
  frameworkPackages: string[],
  dir: string
) {
  const globalRequire = createRequire(dir);

  // Only top-level packages are included, e.g. nested copies like
  // 'node_modules/meow/node_modules/react' are not included.
  const topLevelFrameworkPaths: string[] = [];
  const visitedFrameworkPackages = new Set();

  // Adds package-paths of dependencies recursively
  const addPackagePath = (packageName: string, relativeToPath: string) => {
    try {
      if (visitedFrameworkPackages.has(packageName)) return;
      visitedFrameworkPackages.add(packageName);

      const packageJsonPath = globalRequire.resolve(`${packageName}/package.json`, {
        paths: [relativeToPath]
      });

      // Include a trailing slash so that a `.startsWith(packagePath)` check avoids false positives
      // when one package name starts with the full name of a different package.
      // For example:
      //   "node_modules/react-slider".startsWith("node_modules/react")  // true
      //   "node_modules/react-slider".startsWith("node_modules/react/") // false
      const directory = path.join(packageJsonPath, '../');

      // Returning from the function in case the directory has already been added and traversed
      if (topLevelFrameworkPaths.includes(directory)) return;
      topLevelFrameworkPaths.push(directory);

      const dependencies = globalRequire(packageJsonPath).dependencies || {};
      for (const name of Object.keys(dependencies)) {
        addPackagePath(name, directory);
      }
    } catch {
      // don't error on failing to resolve framework packages
    }
  };

  for (const packageName of frameworkPackages) {
    addPackagePath(packageName, dir);
  }

  return topLevelFrameworkPaths;
}
