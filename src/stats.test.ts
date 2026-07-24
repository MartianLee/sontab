import { describe, expect, it } from 'vitest';
import { estimatedSavedBytes, formatBytes } from './stats';

describe('estimatedSavedBytes', () => {
  it('탭당 50MB로 추정한다', () => {
    expect(estimatedSavedBytes(1)).toBe(50 * 1024 * 1024);
    expect(estimatedSavedBytes(0)).toBe(0);
  });
});

describe('formatBytes', () => {
  it('1GB 미만은 MB, 이상은 GB로 소수 한 자리까지', () => {
    expect(formatBytes(50 * 1024 * 1024)).toBe('50 MB');
    expect(formatBytes(750 * 1024 * 1024)).toBe('750 MB');
    expect(formatBytes(1.5 * 1024 * 1024 * 1024)).toBe('1.5 GB');
    expect(formatBytes(23 * 1024 * 1024 * 1024)).toBe('23 GB');
  });
});
