import { describe, expect, it } from 'bun:test';
import { formatBytes } from './modelConverter';

describe('formatBytes', () => {
  it('should format 0 bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('should format bytes (B) correctly', () => {
    expect(formatBytes(500)).toBe('500 B');
    expect(formatBytes(1023)).toBe('1023 B');
  });

  it('should format kilobytes (KB) correctly', () => {
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1536)).toBe('1.5 KB'); // 1536 = 1.5 * 1024
    expect(formatBytes(1024 * 1024 - 1)).toBe('1024 KB'); // Should still format correctly
  });

  it('should format megabytes (MB) correctly', () => {
    expect(formatBytes(1048576)).toBe('1 MB'); // 1024 * 1024
    expect(formatBytes(1048576 * 2.5)).toBe('2.5 MB');
  });

  it('should format gigabytes (GB) correctly', () => {
    expect(formatBytes(1073741824)).toBe('1 GB'); // 1024 * 1024 * 1024
    expect(formatBytes(1073741824 * 3.14)).toBe('3.1 GB'); // Default is 1 decimal
  });

  it('should respect custom decimals', () => {
    // 1024 * 1024 * 1024 * 3.1425 = 3374246944.768
    expect(formatBytes(3374246944.768, 3)).toBe('3.143 GB'); // Rounds to 3 decimals
    expect(formatBytes(1536, 0)).toBe('2 KB'); // Rounds to 0 decimals (1.5 -> 2)
    expect(formatBytes(1500, 2)).toBe('1.46 KB'); // 1500 / 1024 = 1.46484375 -> 1.46
  });

  it('should handle negative decimals as 0 decimals', () => {
    expect(formatBytes(1536, -1)).toBe('2 KB'); // Same as 0 decimals
    expect(formatBytes(1048576 * 2.7, -5)).toBe('3 MB'); // 2.7 -> 3
  });

  it('should format terabytes correctly (if supported, else undefined behavior)', () => {
    // Current implementation only has ['B', 'KB', 'MB', 'GB']
    // 1 TB = 1099511627776 bytes
    expect(formatBytes(1099511627776)).toBe('1 undefined');
  });
});
