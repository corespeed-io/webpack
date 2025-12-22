import { loadConfig } from 'browserslist';

export function getSupportedBrowsers(dir: string, isDevelopment: boolean) {
  try {
    return loadConfig({
      path: dir,
      env: isDevelopment ? 'development' : 'production'
    });
  } catch {}
}
