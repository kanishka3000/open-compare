interface CheckOutcome {
  readonly name: string;
  readonly passed: boolean;
  readonly detail: string;
}

export class ValidationReport {
  private readonly outcomes: CheckOutcome[] = [];
  private currentSection = '';

  section(title: string): void {
    this.currentSection = title;
  }

  expect(name: string, actual: unknown, expected: unknown): void {
    const actualText = this.stringify(actual);
    const expectedText = this.stringify(expected);
    this.outcomes.push({
      name: `${this.currentSection} › ${name}`,
      passed: actualText === expectedText,
      detail: `expected ${expectedText}, got ${actualText}`,
    });
  }

  expectTrue(name: string, condition: boolean, detail = ''): void {
    this.outcomes.push({ name: `${this.currentSection} › ${name}`, passed: condition, detail });
  }

  print(): void {
    for (const outcome of this.outcomes) {
      const marker = outcome.passed ? '✓' : '✗';
      const suffix = outcome.passed || outcome.detail === '' ? '' : ` — ${outcome.detail}`;
      console.log(`  ${marker} ${outcome.name}${suffix}`);
    }
    console.log(`\n${this.passedCount()}/${this.outcomes.length} checks passed`);
  }

  get hasFailures(): boolean {
    return this.outcomes.some((outcome) => !outcome.passed);
  }

  private passedCount(): number {
    return this.outcomes.filter((outcome) => outcome.passed).length;
  }

  private stringify(value: unknown): string {
    return typeof value === 'string' ? value : JSON.stringify(value);
  }
}
