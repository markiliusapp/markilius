import './HeatmapMock.css';

interface Arena {
    label: string;
    color: string;
    pct: string;
}

interface HeatmapMockProps {
    title: string;
    subtitle: string;
    cells: number[];
    arenas: Arena[];
}

const HeatmapMock = ({ title, subtitle, cells, arenas }: HeatmapMockProps) => (
    <div className="heatmap-mock">
        <div className="heatmap-mock-bar">
            <span className="heatmap-mock-title">{title}</span>
            <span className="heatmap-mock-sub">{subtitle}</span>
        </div>
        <div className="heatmap-mock-grid">
            {cells.map((intensity, i) => (
                <div
                    key={i}
                    className="heatmap-mock-cell"
                    style={{
                        opacity: intensity === 0 ? 0.1 : 0.2 + intensity * 0.8,
                        background: intensity === 0 ? 'var(--color-text-muted)' : '#f97316',
                    }}
                />
            ))}
        </div>
        <div className="heatmap-mock-arenas">
            {arenas.map(a => (
                <div key={a.label} className="heatmap-mock-arena-row">
                    <span className="heatmap-mock-arena-dot" style={{ background: a.color }} />
                    <span className="heatmap-mock-arena-name">{a.label}</span>
                    <div className="heatmap-mock-arena-track">
                        <div className="heatmap-mock-arena-fill" style={{ width: a.pct, background: a.color }} />
                    </div>
                    <span className="heatmap-mock-arena-pct">{a.pct}</span>
                </div>
            ))}
        </div>
    </div>
);

export default HeatmapMock;
