// import { getIntensityColor } from "@/services/colorIntensity";
// export const HeatmapLegend = () => {
//     return (
//         <div className="heatmap-legend">
//             <span className="heatmap-legend-label">Less</span>
//             <div className="heatmap-legend-colors">
//                 {[0, 25, 50, 75, 100].map(val => (
//                     <div
//                         key={val}
//                         className="heatmap-legend-color"
//                         style={{ backgroundColor: getIntensityColor(val) }}
//                     />
//                 ))}
//             </div>
//             <span className="heatmap-legend-label">More</span>
//         </div>
//     )
// }

// HeatmapLegend.tsx

// HeatmapLegend.tsx

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