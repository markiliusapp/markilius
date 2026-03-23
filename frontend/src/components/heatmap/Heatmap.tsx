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
}

const Heatmap = ({ year, month, data, completion, selectedArenaId, onDayClick, showDates = true, showPercentage = false }: HeatmapProps) => {
    const getDaysInMonth = () => {
        return new Date(year, month, 0).getDate();
    };

    const getFirstDayOfMonth = () => {
        return new Date(year, month - 1, 1).getDay();
    };

    const getDayData = (day: number) => {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return data.find(d => d.date === dateStr);
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

    // Resolve arena color for cells
    const selectedArena = selectedArenaId
        ? data.flatMap(d => d.arenas).find(a => a.arena_id === selectedArenaId)
        : null
    const rgbColor = selectedArena ? hexToRgb(selectedArena.arena_color) : undefined

    const today = new Date();
    const isToday = (day: number) =>
        today.getFullYear() === year &&
        today.getMonth() + 1 === month &&
        today.getDate() === day;

    const daysInMonth = getDaysInMonth();
    const firstDayOfMonth = getFirstDayOfMonth();
    const displayCompletion = getMonthArenaCompletion();

    return (
        <div className={`heatmap-container${showDates ? '' : ' heatmap-dates-hidden'}${showPercentage ? ' heatmap-pct-visible' : ''}`}>
            <div className="heatmap-month-header">
                <p className="month-completion">{Math.round(displayCompletion)|| 0}%</p>
                <p className="heatmap-month-title">
                    {new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long' })}
                </p>
            </div>
            <div className="heatmap-grid">
                <div className="heatmap-day-labels">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="heatmap-day-label">{day}</div>
                    ))}
                </div>

                <div className="heatmap-calendar">
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
                        return (
                            <div
                                key={day}
                                className={`heatmap-cell ${onDayClick ? 'heatmap-cell-clickable' : ''} ${todayCell ? 'heatmap-cell-today' : ''} ${hasTasks ? 'heatmap-cell-has-tasks' : ''}`}
                                style={{
                                    backgroundColor: color,
                                    ...(todayCell && selectedArena ? { '--today-border-color': selectedArena.arena_color } as React.CSSProperties : {}),
                                }}
                                onClick={() => onDayClick && onDayClick(dayData?.date || '')}
                            >
                                <span className="heatmap-cell-day">{day}</span>
                                <span className="heatmap-cell-percentage">{Math.round(percentage)}%</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Heatmap;