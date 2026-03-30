import { describe, it, expect } from 'vitest';
import { getPrevStreakRunLength, getNextStreakRunLength } from '../streakUtils';
import type { DailyProductivityResponse } from '@/types';

function makeDay(date: string, pct: number): DailyProductivityResponse {
    return {
        date,
        total_tasks: 1,
        completed_tasks: pct === 100 ? 1 : 0,
        completion_percentage: pct,
        total_hours: 0,
        active_hours: 0,
        arenas: [],
    };
}

describe('getPrevStreakRunLength', () => {
    it('returns 0 when no data precedes month start', () => {
        const monthStart = new Date('2026-04-01');
        expect(getPrevStreakRunLength([], monthStart, null)).toBe(0);
    });

    it('returns 0 when the day before is incomplete', () => {
        const data = [makeDay('2026-03-31', 80)];
        expect(getPrevStreakRunLength(data, new Date('2026-04-01'), null)).toBe(0);
    });

    it('counts 1 consecutive 100% day before month start', () => {
        const data = [makeDay('2026-03-31', 100)];
        expect(getPrevStreakRunLength(data, new Date('2026-04-01'), null)).toBe(1);
    });

    it('counts multiple consecutive 100% days before month start', () => {
        const data = [
            makeDay('2026-03-29', 100),
            makeDay('2026-03-30', 100),
            makeDay('2026-03-31', 100),
        ];
        expect(getPrevStreakRunLength(data, new Date('2026-04-01'), null)).toBe(3);
    });

    it('stops counting when a day is missing from the data', () => {
        // 03-31 is 100%, but 03-30 is absent — streak only goes 1 day back
        const data = [makeDay('2026-03-31', 100)];
        expect(getPrevStreakRunLength(data, new Date('2026-04-01'), null)).toBe(1);
    });

    it('stops at a sub-100% day in the middle', () => {
        const data = [
            makeDay('2026-03-29', 100),
            makeDay('2026-03-30', 80),
            makeDay('2026-03-31', 100),
        ];
        expect(getPrevStreakRunLength(data, new Date('2026-04-01'), null)).toBe(1);
    });

    it('filters by selectedArenaId when provided', () => {
        const day = {
            ...makeDay('2026-03-31', 0), // overall 0%
            arenas: [{ arena_id: 7, arena_name: 'Fitness', arena_color: '#f97316', total_tasks: 1, completed_tasks: 1, completion_percentage: 100, total_hours: 0, active_hours: 0 }],
        };
        expect(getPrevStreakRunLength([day], new Date('2026-04-01'), 7)).toBe(1);
        expect(getPrevStreakRunLength([day], new Date('2026-04-01'), 99)).toBe(0);
    });
});

describe('getNextStreakRunLength', () => {
    it('returns 0 when no data follows month end', () => {
        const monthEnd = new Date('2026-03-31');
        expect(getNextStreakRunLength([], monthEnd, null)).toBe(0);
    });

    it('returns 0 when the day after is incomplete', () => {
        const data = [makeDay('2026-04-01', 50)];
        expect(getNextStreakRunLength(data, new Date('2026-03-31'), null)).toBe(0);
    });

    it('counts 1 consecutive 100% day after month end', () => {
        const data = [makeDay('2026-04-01', 100)];
        expect(getNextStreakRunLength(data, new Date('2026-03-31'), null)).toBe(1);
    });

    it('counts multiple consecutive 100% days after month end', () => {
        const data = [
            makeDay('2026-04-01', 100),
            makeDay('2026-04-02', 100),
            makeDay('2026-04-03', 100),
        ];
        expect(getNextStreakRunLength(data, new Date('2026-03-31'), null)).toBe(3);
    });

    it('stops at a sub-100% day', () => {
        const data = [
            makeDay('2026-04-01', 100),
            makeDay('2026-04-02', 60),
            makeDay('2026-04-03', 100),
        ];
        expect(getNextStreakRunLength(data, new Date('2026-03-31'), null)).toBe(1);
    });

    it('filters by selectedArenaId when provided', () => {
        const day = {
            ...makeDay('2026-04-01', 0),
            arenas: [{ arena_id: 7, arena_name: 'Fitness', arena_color: '#f97316', total_tasks: 1, completed_tasks: 1, completion_percentage: 100, total_hours: 0, active_hours: 0 }],
        };
        expect(getNextStreakRunLength([day], new Date('2026-03-31'), 7)).toBe(1);
        expect(getNextStreakRunLength([day], new Date('2026-03-31'), 99)).toBe(0);
    });
});
