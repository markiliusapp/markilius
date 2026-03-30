import { useState, useMemo, memo } from 'react';
import './Heatmap.css';
import type { DailyProductivityResponse } from '@/types';
import { getIntensityColor, hexToRgb } from '@/services/colorIntensity';
import { computeStreakData, getStreakRowRole, absoluteStreakId } from '@/services/heatmapUtils';
import type { StreakInfo } from '@/services/heatmapUtils';

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
