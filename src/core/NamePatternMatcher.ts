const REGEX_METACHARACTERS = /[.+^${}()|[\]\\]/gu;

/**
 * Matches entry names against simple shell-style patterns (`*` and `?`), the syntax WinMerge users
 * expect in filter fields. Full glob path semantics are deliberately out of scope.
 */
export class NamePatternMatcher {
  private readonly expressions: readonly RegExp[];

  constructor(patterns: readonly string[]) {
    this.expressions = patterns
      .map((pattern) => pattern.trim())
      .filter((pattern) => pattern.length > 0)
      .map((pattern) => this.toRegExp(pattern));
  }

  get isEmpty(): boolean {
    return this.expressions.length === 0;
  }

  matches(name: string): boolean {
    return this.expressions.some((expression) => expression.test(name));
  }

  private toRegExp(pattern: string): RegExp {
    const escaped = pattern.replace(REGEX_METACHARACTERS, '\\$&').replace(/\*/gu, '.*').replace(/\?/gu, '.');
    return new RegExp(`^${escaped}$`, 'iu');
  }
}
