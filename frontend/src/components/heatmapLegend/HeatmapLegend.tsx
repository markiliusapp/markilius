import './HeatmapLegend.css'
import { getIntensityColor } from '@/services/colorIntensity';
interface HeatmapLegendProps {
    color?: string;
}

export const HeatmapLegend = ({ color }: HeatmapLegendProps) => (
    <div className="heatmap-legend">
        <span className="legend-label">Less</span>
        {[0, 20, 40, 60, 80, 100].map(pct => (
            <div
                key={pct}
                className="legend-cell"
                style={{ backgroundColor: getIntensityColor(pct, color) }}
            />
        ))}
        <span className="legend-label">More</span>
    </div>
)