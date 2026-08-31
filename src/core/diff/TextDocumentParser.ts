import type { LineEndingStyle } from '../models/FileDiffResult';

export interface TextDocument {
  readonly lines: readonly string[];
  readonly lineEnding: LineEndingStyle;
}

export class TextDocumentParser {
  parse(content: string): TextDocument {
    return { lines: this.splitLines(content), lineEnding: this.detectLineEnding(content) };
  }

  private splitLines(content: string): string[] {
    if (content.length === 0) {
      return [];
    }
    const lines = content.split(/\r\n|\n|\r/u);
    const endsWithNewline = lines[lines.length - 1] === '';
    return endsWithNewline ? lines.slice(0, -1) : lines;
  }

  private detectLineEnding(content: string): LineEndingStyle {
    const carriageReturnLineFeeds = this.countMatches(content, /\r\n/gu);
    const lineFeeds = this.countMatches(content, /(?<!\r)\n/gu);
    const carriageReturns = this.countMatches(content, /\r(?!\n)/gu);
    const distinctStyles = [carriageReturnLineFeeds, lineFeeds, carriageReturns].filter(
      (count) => count > 0,
    ).length;

    if (distinctStyles === 0) {
      return 'none';
    }
    if (distinctStyles > 1) {
      return 'mixed';
    }
    if (carriageReturnLineFeeds > 0) {
      return 'crlf';
    }
    return lineFeeds > 0 ? 'lf' : 'cr';
  }

  private countMatches(content: string, pattern: RegExp): number {
    return content.match(pattern)?.length ?? 0;
  }
}
