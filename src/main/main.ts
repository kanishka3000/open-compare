import { app, BrowserWindow } from 'electron';
import { DirectoryComparer } from '../core/DirectoryComparer';
import { FileDiffBuilder } from '../core/FileDiffBuilder';
import { ApplicationMenu } from './ApplicationMenu';
import { ApplicationWindow } from './ApplicationWindow';
import { ComparisonService } from './ComparisonService';
import { DockIcon } from './DockIcon';
import { FailureTranslator } from './FailureTranslator';
import { FileDiffService } from './FileDiffService';
import { FolderSelectionDialog } from './FolderSelectionDialog';
import { IpcRouter } from './IpcRouter';
import { NodeFileSystemReader } from './NodeFileSystemReader';

function buildApplication(): { window: ApplicationWindow; menu: ApplicationMenu; router: IpcRouter } {
  const fileSystem = new NodeFileSystemReader();
  const failureTranslator = new FailureTranslator();
  const window = new ApplicationWindow();

  return {
    window,
    menu: new ApplicationMenu(() => window.current),
    router: new IpcRouter(
      new ComparisonService(new DirectoryComparer(fileSystem), failureTranslator),
      new FileDiffService(new FileDiffBuilder(fileSystem), failureTranslator),
      new FolderSelectionDialog(),
    ),
  };
}

const application = buildApplication();

app.whenReady().then(() => {
  application.router.register();
  application.menu.install();
  new DockIcon().apply();
  application.window.create();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      application.window.focusOrCreate();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
