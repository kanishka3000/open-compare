import type { ComparisonStatus } from './models/ComparisonStatus';
import type { ComparisonSummary } from './models/ComparisonNode';

export class ComparisonSummaryAccumulator {
  private identical = 0;
  private different = 0;
  private leftOnly = 0;
  private rightOnly = 0;
  private directories = 0;

  countFile(status: ComparisonStatus): void {
    switch (status) {
      case 'identical':
        this.identical += 1;
        break;
      case 'different':
        this.different += 1;
        break;
      case 'left-only':
        this.leftOnly += 1;
        break;
      case 'right-only':
        this.rightOnly += 1;
        break;
    }
  }

  countDirectory(): void {
    this.directories += 1;
  }

  toSummary(): ComparisonSummary {
    return {
      identical: this.identical,
      different: this.different,
      leftOnly: this.leftOnly,
      rightOnly: this.rightOnly,
      directories: this.directories,
    };
  }
}
