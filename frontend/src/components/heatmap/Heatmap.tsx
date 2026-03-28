import { useState, useMemo, memo } from 'react';
import './Heatmap.css';
import type { DailyProductivityResponse } from '@/types';
import { getIntensityColor, hexToRgb } from '@/services/colorIntensity';

interface HeatmapProps {
    year: number;
    month: number;
    data: DailyProductivityResponse[];
    completion: number;
    selectedArenaId?: number | null;
    onDayClick?: (date: string) => void;
    showDates?: boolean;
    showPercentage?: boolean;
    showStreaks?: boolean;
    prevStreakRunLength?: number;
    nextStreakRunLength?: number;
    activeStreakId?: string | null;
    onStreakHover?: (id: string | null) => void;
}

interface StreakInfo {
    length: number;
    streakStart: number; // first day of this streak within this month (1 if cross-month)
}

// Returns a map of day → { length, streakStart }.
// All cells in the same streak share the same streakStart — used for hover highlighting.
// Streaks continuing beyond month end fall back to their running count as length.
function computeStreakData(
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
function getStreakRowRole(
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
function absoluteStreakId(year: number, month: number, streakStart: number, prevRun: number): string {
    const d = new Date(year, month - 1, streakStart);
    if (streakStart === 1 && prevRun > 0) d.setDate(d.getDate() - prevRun);
    return d.toISOString().split('T')[0];
}

const Heatmap = ({ year, month, data, completion, selectedArenaId, onDayClick, showDates = true, showPercentage = false, showStreaks = false, prevStreakRunLength = 0, nextStreakRunLength = 0, activeStreakId, onStreakHover }: HeatmapProps) => {
    const [internalHoveredId, setInternalHoveredId] = useState<string | null>(null);
    const hoveredId = activeStreakId !== undefined ? activeStreakId : internalHoveredId;

    const handleStreakEnter = (id: string) => {
        setInternalHoveredId(id);
        onStreakHover?.(id);
    };
    const handleStreakLeave = () => {
        setInternalHoveredId(null);
        onStreakHover?.(null);
    };

    const getDaysInMonth = () => new Date(year, month, 0).getDate();
    const getFirstDayOfMonth = () => new Date(year, month - 1, 1).getDay();

    const dayDataMap = useMemo(() => {
        const map = new Map<string, DailyProductivityResponse>();
        data.forEach(d => map.set(d.date, d));
        return map;
    }, [data]);

    const getDayData = (day: number) => {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return dayDataMap.get(dateStr);
    };

    const getArenaCompletion = (dayData: DailyProductivityResponse | undefined): number => {
        if (!dayData) return 0;
        if (!selectedArenaId) return dayData.completion_percentage;
        const arena = dayData.arenas.find(a => a.arena_id === selectedArenaId);
        return arena?.completion_percentage ?? 0;
    };

    const getMonthArenaCompletion = (): number => {
        if (!selectedArenaId) return completion;
        const daysWithArena = data.filter(d =>
            d.arenas.some(a => a.arena_id === selectedArenaId)
        );
        if (daysWithArena.length === 0) return 0;
        const total = daysWithArena.reduce((sum, d) => {
            const arena = d.arenas.find(a => a.arena_id === selectedArenaId);
            return sum + (arena?.completion_percentage ?? 0);
        }, 0);
        return Math.round(total / daysWithArena.length);
    };

    const selectedArena = useMemo(() => {
        if (!selectedArenaId) return null;
        for (const d of data) {
            const arena = d.arenas.find(a => a.arena_id === selectedArenaId);
            if (arena) return arena;
        }
        return null;
    }, [data, selectedArenaId]);
    const rgbColor = selectedArena ? hexToRgb(selectedArena.arena_color) : undefined;

    const today = new Date();
    const isToday = (day: number) =>
        today.getFullYear() === year &&
        today.getMonth() + 1 === month &&
        today.getDate() === day;

    const daysInMonth = getDaysInMonth();
    const firstDayOfMonth = getFirstDayOfMonth();
    const displayCompletion = getMonthArenaCompletion();

    const streakData = showStreaks
        ? computeStreakData(
            daysInMonth,
            (day) => getArenaCompletion(getDayData(day)) >= 100,
            prevStreakRunLength,
            nextStreakRunLength,
        )
        : null;

    const longestStreak = streakData && streakData.size > 0
        ? Math.max(...[...streakData.values()].map(info => info.length))
        : 0;

    return (
        <div
            className={`heatmap-container${showDates ? '' : ' heatmap-dates-hidden'}${showPercentage ? ' heatmap-pct-visible' : ''}`}
            style={selectedArena ? { '--hover-border-color': selectedArena.arena_color } as React.CSSProperties : undefined}
        >
            <div className="heatmap-month-header">
                <p className="month-completion">{Math.round(displayCompletion) || 0}%</p>
                <p className="heatmap-month-title">
                    {new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long' })}
                </p>
                {longestStreak > 0 && (
                    <p className="heatmap-longest-streak">{longestStreak}</p>
                )}
            </div>
            <div className="heatmap-grid">
                <div className="heatmap-day-labels">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="heatmap-day-label">{day}</div>
                    ))}
                </div>

                <div className={`heatmap-calendar${hoveredId !== null && hoveredId !== undefined ? ' heatmap-streak-hover-active' : ''}`}>
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                        <div key={`empty-${i}`} className="heatmap-cell heatmap-cell-empty" />
                    ))}

                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const dayData = getDayData(day);
                        const percentage = getArenaCompletion(dayData);
                        const color = getIntensityColor(percentage, rgbColor);

                        const todayCell = isToday(day);
                        const hasTasks = (dayData?.total_tasks ?? 0) > 0;
                        const info = streakData?.get(day) ?? null;
                        const colIndex = (firstDayOfMonth + day - 1) % 7;
                        const rowRole = info ? getStreakRowRole(day, colIndex, streakData!) : null;
                        const cellStreakId = info ? absoluteStreakId(year, month, info.streakStart, prevStreakRunLength) : null;
                        const isHighlighted = cellStreakId !== null && cellStreakId === hoveredId;

                        return (
                            <div
                                key={day}
                                className={[
                                    'heatmap-cell',
                                    onDayClick ? 'heatmap-cell-clickable' : '',
                                    todayCell ? 'heatmap-cell-today' : '',
                                    hasTasks ? 'heatmap-cell-has-tasks' : '',
                                    rowRole ? 'heatmap-cell-in-streak' : '',
                                    rowRole ? `heatmap-cell-streak-${rowRole}` : '',
                                    isHighlighted ? 'heatmap-cell-streak-highlighted' : '',
                                ].filter(Boolean).join(' ')}
                                style={{
                                    backgroundColor: color,
                                    ...(todayCell && selectedArena ? { '--today-border-color': selectedArena.arena_color } as React.CSSProperties : {}),
                                }}
                                onClick={() => onDayClick && onDayClick(dayData?.date || '')}
                                onMouseEnter={() => cellStreakId && handleStreakEnter(cellStreakId)}
                                onMouseLeave={handleStreakLeave}
                            >
                                <span className="heatmap-cell-day">{day}</span>
                                <span className="heatmap-cell-percentage">{Math.round(percentage)}%</span>
                                {rowRole && (
                                    <>
                                        <span className="heatmap-cell-slash heatmap-cell-slash-streak" />
                                        <span className="heatmap-streak-tooltip">{info!.length}</span>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default memo(Heatmap);
