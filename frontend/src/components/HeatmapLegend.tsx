import { getIntensityColor } from "@/services/colorIntensity";
export const HeatmapLegend = () => {
    return (
        <div className="heatmap-legend">
            <span className="heatmap-legend-label">Less</span>
            <div className="heatmap-legend-colors">
                {[0, 25, 50, 75, 100].map(val => (
                    <div
                        key={val}
                        className="heatmap-legend-color"
                        style={{ backgroundColor: getIntensityColor(val) }}
                    />
                ))}
            </div>
            <span className="heatmap-legend-label">More</span>
        </div>
    )
}