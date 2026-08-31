import type { DiffOptions } from '../models/DiffOptions';

export class LineNormalizer {
  constructor(private readonly options: DiffOptions) {}

  toComparisonKey(line: string): string {
    const whitespaceNormalized = this.applyWhitespaceSensitivity(line);
    return this.options.ignoreCase ? whitespaceNormalized.toLowerCase() : whitespaceNormalized;
  }

  isIgnorable(line: string): boolean {
    return this.options.ignoreBlankLines && line.trim().length === 0;
  }

  private applyWhitespaceSensitivity(line: string): string {
    switch (this.options.whitespaceSensitivity) {
      case 'exact':
        return line;
      case 'ignore-trailing':
        return line.replace(/\s+$/u, '');
      case 'ignore-all':
        return line.replace(/\s+/gu, '');
    }
  }
}
