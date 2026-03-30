export interface StreakInfo {
    length: number;
    streakStart: number; // first day of this streak within this month (1 if cross-month)
}

// Returns a map of day → { length, streakStart }.
// All cells in the same streak share the same streakStart — used for hover highlighting.
// Streaks continuing beyond month end fall back to their running count as length.
export function computeStreakData(
    daysInMonth: number,
    getDayActive: (day: number) => boolean,
    prevStreakRunLength: number,
    nextStreakRunLength: number = 0,
): Map<number, StreakInfo> {
    // Pass 1: running counts + streakStart per day
    const running = new Map<number, { count: number; streakStart: number }>();
    let counter = prevStreakRunLength;
    let currentStart = prevStreakRunLength > 0 ? 1 : 0; // 1 = cross-month streak in progress

    for (let day = 1; day <= daysInMonth; day++) {
        if (getDayActive(day)) {
            if (counter === 0) currentStart = day;
            counter++;
            running.set(day, { count: counter, streakStart: currentStart });
        } else {
            counter = 0;
            currentStart = 0;
        }
    }

    // Pass 2: stamp total length on streaks that end within the month.
    // Exclude daysInMonth itself — if it's active it may continue into the next month
    // and must be handled by the fallback so nextStreakRunLength is applied.
    const result = new Map<number, StreakInfo>();
    for (let day = 1; day < daysInMonth; day++) {
        if (running.has(day) && !running.has(day + 1)) {
            const { count: total, streakStart } = running.get(day)!;
            let d = day;
            while (running.has(d)) {
                result.set(d, { length: total, streakStart });
                d--;
            }
        }
    }

    // Ongoing cross-month streak at month end — add next month's contribution to the total
    const ongoingDays = [...running.entries()].filter(([day]) => !result.has(day));
    if (ongoingDays.length > 0) {
        const maxCount = ongoingDays[ongoingDays.length - 1][1].count;
        const { streakStart } = ongoingDays[0][1];
        const totalLength = maxCount + nextStreakRunLength;
        for (const [day] of ongoingDays) {
            result.set(day, { length: totalLength, streakStart });
        }
    }

    // A streak requires at least 2 consecutive days
    for (const [day, { length }] of result) {
        if (length < 2) result.delete(day);
    }

    return result;
}

// Visual role within the week row — drives pill border-radius
export function getStreakRowRole(
    day: number,
    colIndex: number,
    streakData: Map<number, StreakInfo>,
): 'row-start' | 'row-mid' | 'row-end' | 'row-solo' {
    const prevInStreak = colIndex > 0 && streakData.has(day - 1);
    const nextInStreak = colIndex < 6 && streakData.has(day + 1);
    if (!prevInStreak && !nextInStreak) return 'row-solo';
    if (!prevInStreak && nextInStreak)  return 'row-start';
    if (prevInStreak  && !nextInStreak) return 'row-end';
    return 'row-mid';
}

// Derives a stable cross-month streak ID: the ISO date of the streak's true first day.
// Cross-month streaks (streakStart===1, prevStreakRunLength>0) started before this month.
export function absoluteStreakId(year: number, month: number, streakStart: number, prevRun: number): string {
    const d = new Date(year, month - 1, streakStart);
    if (streakStart === 1 && prevRun > 0) d.setDate(d.getDate() - prevRun);
    return d.toISOString().split('T')[0];
}
