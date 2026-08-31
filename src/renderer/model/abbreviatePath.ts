const MAX_DISPLAYED_CHARACTERS = 46;
const ELLIPSIS = '…';

export function abbreviatePath(path: string): string {
  if (path.length <= MAX_DISPLAYED_CHARACTERS) {
    return path;
  }
  return ELLIPSIS + path.slice(path.length - (MAX_DISPLAYED_CHARACTERS - ELLIPSIS.length));
}
