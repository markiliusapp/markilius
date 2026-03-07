import './Heatmap.css';
import { getIntensityColor } from '@/services/colorIntensity';
interface HeatmapDay {
    date: string;
    total_tasks: number;
    completed_tasks: number;
    completion_percentage: number;
}

interface HeatmapProps {
    year: number;
    month: number;
    data: HeatmapDay[];
    completion: number;
    onDayClick?: (date: string) => void;
}

const Heatmap = ({ year, month, data, completion, onDayClick }: HeatmapProps) => {
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

    const daysInMonth = getDaysInMonth();
    const firstDayOfMonth = getFirstDayOfMonth();

    return (
        <div className="heatmap-container">
            <div className="heatmap-month-header">
                <p className="month-completion">
                    {completion || 0}%
                </p>
                <p className="heatmap-month-title">
                    {new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long' })}
                </p>
            </div>
            <div className="heatmap-grid">
                {/* Day labels */}
                <div className="heatmap-day-labels">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="heatmap-day-label">{day}</div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div className="heatmap-calendar">
                    {/* Empty cells for days before month starts */}
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                        <div key={`empty-${i}`} className="heatmap-cell heatmap-cell-empty" />
                    ))}

                    {/* Days of month */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const dayData = getDayData(day);
                        const percentage = dayData?.completion_percentage || 0;
                        const color = getIntensityColor(percentage);

                        return (
                            <div
                                key={day}
                                className={`heatmap-cell ${onDayClick ? 'heatmap-cell-clickable' : ''}`}
                                style={{ backgroundColor: color }}
                                onClick={() => onDayClick && onDayClick(dayData?.date || '')}
                            >
                                {/* <span className="heatmap-cell-day">{day}</span>
                                {dayData && dayData.total_tasks > 0 ? (
                                    <span className="heatmap-cell-percentage">{Math.round(percentage)}%</span>
                                ) : <span className="heatmap-cell-percentage">0%</span>} */}
                                {/* <span className="heatmap-cell-day">{day}</span>
                                <span className="heatmap-cell-percentage">{Math.round(percentage)}%</span> */}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Heatmap;