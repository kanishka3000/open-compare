import type { InlineSegment } from '../models/FileDiffResult';
import { MyersDiff } from './MyersDiff';

const TOKEN_PATTERN = /[\p{L}\p{N}_]+|\s+|[^\p{L}\p{N}_\s]/gu;
const MAX_TOKENS_PER_LINE = 600;

export interface InlineComparison {
  readonly left: readonly InlineSegment[];
  readonly right: readonly InlineSegment[];
}

/**
 * Word-level highlighting of the parts that actually changed within a pair of lines.
 */
export class InlineDiffer {
  private readonly tokenDiff = new MyersDiff();

  compare(leftText: string, rightText: string): InlineComparison {
    const leftTokens = this.tokenize(leftText);
    const rightTokens = this.tokenize(rightText);

    if (leftTokens.length > MAX_TOKENS_PER_LINE || rightTokens.length > MAX_TOKENS_PER_LINE) {
      return { left: this.wholeLineSegments(leftText), right: this.wholeLineSegments(rightText) };
    }

    const leftBuilder = new SegmentBuilder();
    const rightBuilder = new SegmentBuilder();

    for (const operation of this.tokenDiff.compute(leftTokens, rightTokens).operations) {
      const changed = operation.type !== 'equal';
      this.appendTokens(leftBuilder, leftTokens, operation.leftStart, operation.leftCount, changed);
      this.appendTokens(rightBuilder, rightTokens, operation.rightStart, operation.rightCount, changed);
    }

    return { left: leftBuilder.build(), right: rightBuilder.build() };
  }

  unchangedSegments(text: string): readonly InlineSegment[] {
    return text.length === 0 ? [] : [{ text, changed: false }];
  }

  private wholeLineSegments(text: string): readonly InlineSegment[] {
    return text.length === 0 ? [] : [{ text, changed: true }];
  }

  private appendTokens(
    builder: SegmentBuilder,
    tokens: readonly string[],
    start: number,
    count: number,
    changed: boolean,
  ): void {
    for (let offset = 0; offset < count; offset += 1) {
      builder.append(tokens[start + offset]!, changed);
    }
  }

  private tokenize(text: string): string[] {
    return text.match(TOKEN_PATTERN) ?? [];
  }
}

class SegmentBuilder {
  private readonly segments: InlineSegment[] = [];

  append(text: string, changed: boolean): void {
    const previous = this.segments[this.segments.length - 1];
    if (previous && previous.changed === changed) {
      this.segments[this.segments.length - 1] = { text: previous.text + text, changed };
      return;
    }
    this.segments.push({ text, changed });
  }

  build(): InlineSegment[] {
    return this.segments;
  }
}
