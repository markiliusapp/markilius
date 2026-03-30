import { describe, it, expect } from 'vitest';
import { computeStreakData, getStreakRowRole, absoluteStreakId } from '../heatmapUtils';

// Helper: build an active-set from an array of active days
function active(days: number[]) {
    const set = new Set(days);
    return (day: number) => set.has(day);
}

describe('computeStreakData', () => {
    it('returns empty map when no days are active', () => {
        const result = computeStreakData(31, active([]), 0);
        expect(result.size).toBe(0);
    });

    it('returns empty map for a single isolated active day (streak < 2)', () => {
        const result = computeStreakData(31, active([15]), 0);
        expect(result.size).toBe(0);
    });

    it('detects a 2-day streak', () => {
        const result = computeStreakData(31, active([14, 15]), 0);
        expect(result.has(14)).toBe(true);
        expect(result.has(15)).toBe(true);
        expect(result.get(14)!.length).toBe(2);
        expect(result.get(15)!.length).toBe(2);
    });

    it('assigns correct length to a 3-day streak', () => {
        const result = computeStreakData(31, active([5, 6, 7]), 0);
        expect(result.get(5)!.length).toBe(3);
        expect(result.get(6)!.length).toBe(3);
        expect(result.get(7)!.length).toBe(3);
    });

    it('a gap resets the streak', () => {
        const result = computeStreakData(31, active([1, 2, 4, 5]), 0);
        expect(result.get(1)!.length).toBe(2);
        expect(result.get(4)!.length).toBe(2);
        expect(result.has(3)).toBe(false);
    });

    it('all cells in the same streak share the same streakStart', () => {
        const result = computeStreakData(31, active([10, 11, 12]), 0);
        const starts = [...result.values()].map(v => v.streakStart);
        expect(new Set(starts).size).toBe(1);
        expect(starts[0]).toBe(10);
    });

    it('seeded by prevStreakRunLength, cross-month streak includes prior days', () => {
        // prevRun=2, days 1+2 active → total length should be 4
        const result = computeStreakData(31, active([1, 2]), 2);
        expect(result.get(1)!.length).toBe(4);
        expect(result.get(2)!.length).toBe(4);
    });

    it('last day of month ongoing streak adds nextStreakRunLength', () => {
        // Only day 31 active, nextRun=3 → total = 1 + 3 = 4 (≥2, so included)
        const result = computeStreakData(31, active([31]), 0, 3);
        expect(result.has(31)).toBe(true);
        expect(result.get(31)!.length).toBe(4);
    });

    it('prevRun is wiped by first inactive day — only matters when day 1 is active', () => {
        // prevRun=1 but days 1-30 inactive resets the counter before reaching day 31
        const result = computeStreakData(31, active([31]), 1, 0);
        expect(result.has(31)).toBe(false); // isolated, length 1 < 2
    });

    it('ongoing streak with nextRun=0 and no prev is dropped (length 1 < 2)', () => {
        const result = computeStreakData(31, active([31]), 0, 0);
        expect(result.has(31)).toBe(false);
    });

    it('handles February (28 days) without crashing', () => {
        const result = computeStreakData(28, active([26, 27, 28]), 0, 2);
        expect(result.has(26)).toBe(true);
        expect(result.get(26)!.length).toBe(5); // 3 in month + 2 next
    });
});

describe('getStreakRowRole', () => {
    it('returns row-solo for isolated day', () => {
        const streak = computeStreakData(7, active([3, 4]), 0);
        // day 3, colIndex=0 → no prev at colIndex<0
        expect(getStreakRowRole(3, 0, streak)).toBe('row-start');
    });

    it('returns row-start when no prev in streak but next exists', () => {
        const streak = computeStreakData(7, active([2, 3]), 0);
        expect(getStreakRowRole(2, 1, streak)).toBe('row-start');
    });

    it('returns row-end when prev in streak but no next', () => {
        const streak = computeStreakData(7, active([2, 3]), 0);
        expect(getStreakRowRole(3, 2, streak)).toBe('row-end');
    });

    it('returns row-mid when both prev and next in streak', () => {
        const streak = computeStreakData(7, active([1, 2, 3]), 0);
        expect(getStreakRowRole(2, 1, streak)).toBe('row-mid');
    });

    it('returns row-solo when at col boundary (colIndex=0 prevents prev check)', () => {
        const streak = computeStreakData(7, active([1, 2, 3]), 0);
        // day 1 at colIndex=0 has no prev (colIndex>0 is false), next at day 2 is in streak
        expect(getStreakRowRole(1, 0, streak)).toBe('row-start');
    });
});

describe('absoluteStreakId', () => {
    it('returns ISO date of the streak start day within the month', () => {
        expect(absoluteStreakId(2026, 3, 15, 0)).toBe('2026-03-15');
    });

    it('walks back prevRun days for a cross-month streak', () => {
        // streakStart=1 and prevRun=3 → true start is Mar 29 (Apr 1 minus 3)
        expect(absoluteStreakId(2026, 4, 1, 3)).toBe('2026-03-29');
    });

    it('does not walk back when streakStart > 1', () => {
        // streakStart=5, prevRun=3 → still returns the in-month start
        expect(absoluteStreakId(2026, 3, 5, 3)).toBe('2026-03-05');
    });
});
