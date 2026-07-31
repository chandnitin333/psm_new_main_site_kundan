import { describe, it, expect } from 'vitest';
import { fyLabel, fyOfDate } from '../fyConfig';

describe('fyConfig (financial year, default April start)', () => {
  it('fyLabel renders a FY range', () => {
    expect(fyLabel(2026)).toContain('2026');
  });

  it('fyOfDate maps a date to its FY start year', () => {
    expect(fyOfDate(new Date(2026, 6, 15))).toBe(2026); // July -> FY 2026
    expect(fyOfDate(new Date(2026, 1, 10))).toBe(2025); // Feb -> FY 2025
  });
});
