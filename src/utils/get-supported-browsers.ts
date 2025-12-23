import readBrowserslist, { loadConfig } from 'browserslist';

export function getSupportedBrowsers(browserlists: string | string[] | null | undefined, dir: string, isDevelopment: boolean) {
  if (browserlists) {
    return readBrowserslist(browserlists);
  }

  try {
    return loadConfig({
      path: dir,
      env: isDevelopment ? 'development' : 'production'
    });
  } catch {}
}
