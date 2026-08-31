import { ipcMain, shell, type IpcMainInvokeEvent } from 'electron';
import { BrowserWindow } from 'electron';
import { IPC_CHANNEL, type CompareDirectoriesRequest, type DiffFileRequest } from '../shared/ipc';
import type { ComparisonService } from './ComparisonService';
import type { FileDiffService } from './FileDiffService';
import type { FolderSelectionDialog } from './FolderSelectionDialog';
import { RendererProgressListener } from './RendererProgressListener';

export class IpcRouter {
  constructor(
    private readonly comparisonService: ComparisonService,
    private readonly fileDiffService: FileDiffService,
    private readonly folderDialog: FolderSelectionDialog,
  ) {}

  register(): void {
    ipcMain.handle(IPC_CHANNEL.selectFolder, (event, dialogTitle: string) =>
      this.folderDialog.prompt(BrowserWindow.fromWebContents(event.sender), dialogTitle),
    );

    ipcMain.handle(
      IPC_CHANNEL.compareDirectories,
      (event: IpcMainInvokeEvent, request: CompareDirectoriesRequest) =>
        this.comparisonService.compare(request, new RendererProgressListener(event.sender)),
    );

    ipcMain.handle(IPC_CHANNEL.cancelComparison, () => {
      this.comparisonService.cancel();
    });

    ipcMain.handle(IPC_CHANNEL.diffFile, (_event, request: DiffFileRequest) =>
      this.fileDiffService.diff(request),
    );

    ipcMain.handle(IPC_CHANNEL.revealInFinder, (_event, absolutePath: string) => {
      shell.showItemInFolder(absolutePath);
    });
  }
}
