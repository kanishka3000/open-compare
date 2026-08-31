import type { ComparisonNode } from './models/ComparisonNode';
import type { ComparisonStatus } from './models/ComparisonStatus';

export interface TreeFilterCriteria {
  readonly visibleStatuses: readonly ComparisonStatus[];
  readonly nameQuery: string;
}

/**
 * Produces the subset of a comparison tree the user asked to see. Folders survive when any
 * descendant survives, so the path to a visible file is never broken.
 */
export class ComparisonTreeFilter {
  apply(nodes: readonly ComparisonNode[], criteria: TreeFilterCriteria): ComparisonNode[] {
    const visibleStatuses = new Set(criteria.visibleStatuses);
    const normalizedQuery = criteria.nameQuery.trim().toLowerCase();
    return this.filterNodes(nodes, visibleStatuses, normalizedQuery);
  }

  private filterNodes(
    nodes: readonly ComparisonNode[],
    visibleStatuses: ReadonlySet<ComparisonStatus>,
    normalizedQuery: string,
  ): ComparisonNode[] {
    const kept: ComparisonNode[] = [];
    for (const node of nodes) {
      const filtered = this.filterNode(node, visibleStatuses, normalizedQuery);
      if (filtered) {
        kept.push(filtered);
      }
    }
    return kept;
  }

  private filterNode(
    node: ComparisonNode,
    visibleStatuses: ReadonlySet<ComparisonStatus>,
    normalizedQuery: string,
  ): ComparisonNode | null {
    if (node.kind === 'file') {
      return this.matchesDirectly(node, visibleStatuses, normalizedQuery) ? node : null;
    }
    const children = this.filterNodes(node.children, visibleStatuses, normalizedQuery);
    if (children.length > 0) {
      return { ...node, children };
    }
    return this.matchesDirectly(node, visibleStatuses, normalizedQuery) ? { ...node, children: [] } : null;
  }

  private matchesDirectly(
    node: ComparisonNode,
    visibleStatuses: ReadonlySet<ComparisonStatus>,
    normalizedQuery: string,
  ): boolean {
    if (!visibleStatuses.has(node.status)) {
      return false;
    }
    return normalizedQuery === '' || node.name.toLowerCase().includes(normalizedQuery);
  }
}
