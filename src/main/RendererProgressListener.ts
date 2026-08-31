import type { WebContents } from 'electron';
import type { ComparisonProgressListener } from '../core/ComparisonProgressListener';
import type { ComparisonProgress } from '../core/models/DirectoryComparisonResult';
import { IPC_CHANNEL } from '../shared/ipc';

export class RendererProgressListener implements ComparisonProgressListener {
  constructor(private readonly webContents: WebContents) {}

  onProgress(progress: ComparisonProgress): void {
    if (this.webContents.isDestroyed()) {
      return;
    }
    this.webContents.send(IPC_CHANNEL.comparisonProgress, progress);
  }
}
