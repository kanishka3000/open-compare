import type { LineNormalizer } from './LineNormalizer';

/**
 * The subset of a file's lines that participate in the diff, together with the mapping back to
 * their positions in the original file. Lines the diff options mark as ignorable are excluded.
 */
export class LineSequence {
  readonly comparisonKeys: readonly string[];
  readonly sourceLineIndices: readonly number[];

  constructor(
    readonly lines: readonly string[],
    normalizer: LineNormalizer,
  ) {
    const comparisonKeys: string[] = [];
    const sourceLineIndices: number[] = [];
    lines.forEach((line, index) => {
      if (normalizer.isIgnorable(line)) {
        return;
      }
      comparisonKeys.push(normalizer.toComparisonKey(line));
      sourceLineIndices.push(index);
    });
    this.comparisonKeys = comparisonKeys;
    this.sourceLineIndices = sourceLineIndices;
  }

  get length(): number {
    return this.comparisonKeys.length;
  }

  sourceLineIndexAt(sequenceIndex: number): number {
    return this.sourceLineIndices[sequenceIndex]!;
  }

  textAt(sequenceIndex: number): string {
    return this.lines[this.sourceLineIndexAt(sequenceIndex)]!;
  }
}
