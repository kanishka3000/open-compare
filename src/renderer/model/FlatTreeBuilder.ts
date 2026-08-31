import type { ComparisonNode } from '@core/models/ComparisonNode';

export interface FlatTreeRow {
  readonly node: ComparisonNode;
  readonly depth: number;
  readonly isExpandable: boolean;
  readonly isExpanded: boolean;
}

export class FlatTreeBuilder {
  build(nodes: readonly ComparisonNode[], expandedPaths: ReadonlySet<string>): FlatTreeRow[] {
    const rows: FlatTreeRow[] = [];
    this.appendNodes(rows, nodes, 0, expandedPaths);
    return rows;
  }

  private appendNodes(
    rows: FlatTreeRow[],
    nodes: readonly ComparisonNode[],
    depth: number,
    expandedPaths: ReadonlySet<string>,
  ): void {
    for (const node of nodes) {
      if (node.kind === 'file') {
        rows.push({ node, depth, isExpandable: false, isExpanded: false });
        continue;
      }
      const isExpandable = node.children.length > 0;
      const isExpanded = isExpandable && expandedPaths.has(node.relativePath);
      rows.push({ node, depth, isExpandable, isExpanded });
      if (isExpanded) {
        this.appendNodes(rows, node.children, depth + 1, expandedPaths);
      }
    }
  }
}
