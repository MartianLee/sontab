/** 탭 하나가 차지했을 메모리 추정치 (보수적으로 50MB) */
const BYTES_PER_TAB = 50 * 1024 * 1024;

export function estimatedSavedBytes(tabCount: number): number {
  return tabCount * BYTES_PER_TAB;
}

export function formatBytes(bytes: number): string {
  const GB = 1024 * 1024 * 1024;
  if (bytes >= GB) {
    const value = bytes / GB;
    const rounded = Math.round(value * 10) / 10;
    return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded} GB`;
  }
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}
