import { NamePatternMatcher } from './NamePatternMatcher';
import type { ComparisonOptions } from './models/ComparisonOptions';

export class PathFilter {
  private readonly excluded: NamePatternMatcher;
  private readonly included: NamePatternMatcher;

  constructor(private readonly options: ComparisonOptions) {
    this.excluded = new NamePatternMatcher(options.excludedNamePatterns);
    this.included = new NamePatternMatcher(options.includedNamePatterns);
  }

  allowsDirectory(name: string): boolean {
    return this.passesHiddenRule(name) && !this.excluded.matches(name);
  }

  allowsFile(name: string): boolean {
    if (!this.passesHiddenRule(name) || this.excluded.matches(name)) {
      return false;
    }
    return this.included.isEmpty || this.included.matches(name);
  }

  private passesHiddenRule(name: string): boolean {
    return this.options.includeHiddenEntries || !name.startsWith('.');
  }
}
