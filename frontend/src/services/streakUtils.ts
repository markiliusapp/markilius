import type { DailyProductivityResponse } from '@/types';

function getPct(dayData: DailyProductivityResponse, selectedArenaId: number | null): number {
    return selectedArenaId
        ? dayData.arenas.find(a => a.arena_id === selectedArenaId)?.completion_percentage ?? 0
        : dayData.completion_percentage;
}

/**
 * Returns the number of consecutive 100%-complete days immediately before
 * `monthStart` — used to seed cross-month streak counts going into the month.
 */
export function getPrevStreakRunLength(
    dailyBreakdown: DailyProductivityResponse[],
    monthStart: Date,
    selectedArenaId: number | null,
): number {
    let count = 0;
    const checkDate = new Date(monthStart);
    checkDate.setDate(checkDate.getDate() - 1);

    while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        const dayData = dailyBreakdown.find(d => d.date === dateStr);
        if (!dayData) break;
        if (getPct(dayData, selectedArenaId) < 100) break;
        count++;
        checkDate.setDate(checkDate.getDate() - 1);
    }

    return count;
}

/**
 * Returns the number of consecutive 100%-complete days immediately after
 * `monthEnd` — used to extend ongoing streaks with the next month's contribution.
 */
export function getNextStreakRunLength(
    dailyBreakdown: DailyProductivityResponse[],
    monthEnd: Date,
    selectedArenaId: number | null,
): number {
    let count = 0;
    const checkDate = new Date(monthEnd);
    checkDate.setDate(checkDate.getDate() + 1);

    while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        const dayData = dailyBreakdown.find(d => d.date === dateStr);
        if (!dayData) break;
        if (getPct(dayData, selectedArenaId) < 100) break;
        count++;
        checkDate.setDate(checkDate.getDate() + 1);
    }

    return count;
}
