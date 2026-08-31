import type { ComparisonNode } from '@core/models/ComparisonNode';

/**
 * Chooses which folders open automatically after a comparison: those that contain something other
 * than identical files, so differences are visible without any clicking.
 */
export class DirectoryExpansion {
  pathsWithDifferences(nodes: readonly ComparisonNode[]): Set<string> {
    const paths = new Set<string>();
    this.collect(nodes, paths);
    return paths;
  }

  private collect(nodes: readonly ComparisonNode[], paths: Set<string>): void {
    for (const node of nodes) {
      if (node.kind !== 'directory') {
        continue;
      }
      if (node.status !== 'identical') {
        paths.add(node.relativePath);
      }
      this.collect(node.children, paths);
    }
  }
}
