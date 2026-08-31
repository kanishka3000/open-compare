export function expandTabs(text: string, tabWidth: number): string {
  if (!text.includes('\t')) {
    return text;
  }
  return text.replace(/\t/gu, ' '.repeat(tabWidth));
}
