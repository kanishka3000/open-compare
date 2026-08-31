import { join } from 'node:path';
import { app, nativeImage } from 'electron';

// A packaged build takes its dock icon from the bundle. An unpackaged one runs
// under the stock Electron binary, so it needs the icon applied by hand.
export class DockIcon {
  apply(): void {
    if (app.isPackaged || process.platform !== 'darwin' || !app.dock) {
      return;
    }

    const image = nativeImage.createFromPath(join(__dirname, '../../build/icon.png'));
    if (!image.isEmpty()) {
      app.dock.setIcon(image);
    }
  }
}
