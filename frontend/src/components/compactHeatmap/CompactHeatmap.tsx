// src/components/compactHeatmap/CompactHeatmap.tsx
import './CompactHeatmap.css';
import type { DailyProductivityResponse, ArenaBreakdown } from '@/types';
import { getIntensityColor, hexToRgb } from '@/services/colorIntensity';

const COLS = 53; // 53 weeks 
const ROWS = 7;

interface CompactHeatmapRowProps {
    label: string;
    color?: string;
    dotColor?: string;
    year: number;
    data: DailyProductivityResponse[];
    getPercentage: (day: DailyProductivityResponse) => number;
    showMonthLabels?: boolean;
}

const buildYearGrid = (year: number) => {
    // Start from the Sunday on or before Jan 1
    const jan1 = new Date(year, 0, 1);
    const start = new Date(jan1);
    start.setDate(start.getDate() - start.getDay());

    // Build 54 × 7 grid
    const grid: (Date | null)[][] = Array.from({ length: COLS }, (_, col) =>
        Array.from({ length: ROWS }, (_, row) => {
            const d = new Date(start);
            d.setDate(start.getDate() + col * 7 + row);
            return d.getFullYear() === year ? d : null;
        })
    );

    return grid;
};

const buildMonthLabels = (grid: (Date | null)[][]) => {
    // For each column, check if this is the first week of a new month
    const labels: (string | null)[] = Array(COLS).fill(null);
    let lastMonth = -1;

    grid.forEach((col, colIdx) => {
        const firstReal = col.find(d => d !== null);
        if (firstReal) {
            const month = firstReal.getMonth();
            if (month !== lastMonth) {
                labels[colIdx] = firstReal.toLocaleDateString('en-US', { month: 'short' });
                lastMonth = month;
            }
        }
    });

    return labels;
};

const CompactHeatmapRow = ({
    label,
    color,
    dotColor,
    year,
    data,
    getPercentage,
    showMonthLabels = false,
}: CompactHeatmapRowProps) => {
    const grid = buildYearGrid(year);
    const monthLabels = buildMonthLabels(grid);

    const getDateStr = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const getDayData = (d: Date) => {
        const dateStr = getDateStr(d);
        return data.find(day => day.date === dateStr);
    };


    return (
        <div className="compact-row">
            {/* Row label */}
            <div className="compact-row-label">
                {dotColor && <span className="compact-dot" style={{ backgroundColor: dotColor }} />}
                <span>{label}</span>
            </div>

            {/* Grid */}
            <div className="compact-grid-wrapper">
                <div className="compact-scroll">
                    {showMonthLabels && (
                        <div className="compact-month-row">
                            {monthLabels.map((label, i) => (
                                <div key={i} className="compact-month-cell">
                                    {label ?? ''}
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="compact-grid">
                        {grid.map((col, colIdx) =>
                            col.map((day, rowIdx) => {
                                if (day === null) {
                                    return <div key={`${colIdx}-${rowIdx}`} className="compact-cell compact-cell-outside" />;
                                }
                                const dayData = getDayData(day);
                                const percentage = dayData ? getPercentage(dayData) : 0;
                                const cellColor = getIntensityColor(percentage, color);
                                return (
                                    <div
                                        key={`${colIdx}-${rowIdx}`}
                                        className="compact-cell"
                                        style={{ backgroundColor: cellColor }}
                                        title={`${getDateStr(day)}: ${Math.round(percentage)}%`}
                                    />
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

interface CompactHeatmapProps {
    year: number;
    data: DailyProductivityResponse[];
    arenas: ArenaBreakdown[];
    showOverall?: boolean;
}

const CompactHeatmap = ({ year, data, arenas, showOverall = true }: CompactHeatmapProps) => {
    return (
        <div className="compact-heatmap">
            {showOverall && (
                <CompactHeatmapRow
                    label="Overall"
                    year={year}
                    data={data}
                    getPercentage={(day) => day.completion_percentage}
                    showMonthLabels={true}
                />
            )}
            {arenas.map((arena) => (
                <CompactHeatmapRow
                    key={arena.arena_id}
                    label={arena.arena_name}
                    dotColor={arena.arena_color}
                    color={hexToRgb(arena.arena_color)}
                    year={year}
                    data={data}
                    showMonthLabels={!showOverall && arenas.indexOf(arena) === 0}
                    getPercentage={(day) => {
                        const a = day.arenas.find(a => a.arena_id === arena.arena_id);
                        return a?.completion_percentage ?? 0;
                    }}
                />
            ))}
        </div>
    );
};

export default CompactHeatmap;