// For development only
// This file guards the file-watcher so missing dev deps won't crash production

import { app, BrowserWindow } from 'electron';
import { createRequire } from 'module';

export function watchRenderer(paths) {
  // Try to load chokidar synchronously. If it's not available (packaged app),
  // silently disable watching and keep the app running.
  let chokidarPkg;
  // Determine if we're in development so we can provide better guidance.
  const isDev =
    process.env.NODE_ENV === 'development' ||
    process.env.ELECTRON_IS_DEV === '1' ||
    (app && !app.isPackaged);

  try {
    // Use createRequire to load CommonJS packages from ESM context.
    const require = createRequire(import.meta.url);
    chokidarPkg = require('chokidar');
  } catch (err) {
    // chokidar not available — decide messaging based on environment
    if (isDev) {
      console.error(
        'watchRenderer: chokidar not found. Install it to enable live reload while developing:\n  npm install --save-dev chokidar\nor\n  npm install --save chokidar\n'
      );
    } else {
      console.warn('watchRenderer: chokidar not available, file watching disabled.');
    }

    return {
      close: () => { },
    };
  }

  try {
    const watcher = chokidarPkg.watch(paths, { ignoreInitial: true });

    watcher.on('change', (changedPath) => {
      try {
        BrowserWindow.getAllWindows().forEach((win) => {
          try {
            win.webContents.reloadIgnoringCache();
          } catch (innerErr) {
            console.error('watchRenderer: failed to reload window', innerErr);
          }
        });
      } catch (err) {
        console.error('watchRenderer change handler error:', err);
      }
    });

    watcher.on('error', (error) => {
      // Log watcher errors but keep running — watcher may recover depending on error
      console.error('watchRenderer watcher error:', error);
    });

    return watcher;
  } catch (err) {
    console.error('watchRenderer failed to start watcher:', err);
    return {
      close: () => { },
    };
  }
}
