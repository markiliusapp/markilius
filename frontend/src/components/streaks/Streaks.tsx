// src/components/streaks/Streaks.tsx
import './Streaks.css'
import type { StreakResponse } from '@/types'

interface StreaksProps {
    streaks: StreakResponse;
}

const FlameIcon = ({ size = 16, color = 'var(--color-primary)' }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
        <path d="M12 2C12 2 6 8 6 13a6 6 0 0 0 12 0C18 8 12 2 12 2zm0 15a3 3 0 0 1-3-3c0-2 3-6 3-6s3 4 3 6a3 3 0 0 1-3 3z" />
    </svg>
)

const RING_SIZE = 48
const STROKE_WIDTH = 4.5
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const CornerRing = ({
    progress,
    color,
    current,
}: {
    progress: number;
    color: string;
    current: number;
}) => {
    const offset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE

    return (
        <svg
            width={RING_SIZE}
            height={RING_SIZE}
            viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
            className="streak-corner-ring"
        >
            <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke="var(--color-border)"
                strokeWidth={STROKE_WIDTH}
            />
            <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={color}
                strokeWidth={STROKE_WIDTH}
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
            />
            <text
                x={RING_SIZE / 2}
                y={RING_SIZE / 2 + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="11"
                fontWeight="800"
                fill={color}
            >
                {current}
            </text>
        </svg>
    )
}

const Streaks = ({ streaks }: StreaksProps) => {
    const activeArenas = streaks.arenas.filter(
        a => a.current_streak > 0 || a.longest_streak > 0
    )

    return (
        <div className="streaks-wrapper">
            <h2 className="streaks-title">Streaks</h2>
            {/* Overall */}
            <div className="streak-panel streak-panel-overall">
                <div className="streak-panel-head">
                    <div className="streak-panel-meta">
                        <div className="streak-panel-top">
                            <FlameIcon size={12} />
                            <span className="streak-panel-eyebrow">Current Streak</span>
                        </div>
                        <div className="streak-panel-main">
                            <span className="streak-panel-number">{streaks.current_streak}</span>
                            <span className="streak-panel-unit">days</span>
                        </div>
                    </div>
                    <CornerRing
                        progress={
                            streaks.longest_streak > 0
                                ? Math.min((streaks.current_streak / streaks.longest_streak) * 100, 100)
                                : 0
                        }
                        color="var(--color-primary)"
                        current={streaks.current_streak}
                    />
                </div>
                <div className="streak-panel-best">
                    <span className="streak-panel-best-label">Best</span>
                    <span className="streak-panel-best-value">{streaks.longest_streak} days</span>
                </div>
            </div>

            {/* Arena panels */}
            {activeArenas.map(arena => {
                const progress = arena.longest_streak > 0
                    ? Math.min((arena.current_streak / arena.longest_streak) * 100, 100)
                    : 0;

                return (
                    <div key={arena.arena_id} className="streak-panel">
                        <div className="streak-panel-head">
                            <div className="streak-panel-meta">
                                <div className="streak-panel-top">
                                    <span
                                        className="streak-panel-eyebrow"
                                        style={{ color: arena.arena_color }}
                                    >
                                        {arena.arena_name}
                                    </span>
                                </div>
                                <div className="streak-panel-main">
                                    <span
                                        className="streak-panel-number"
                                        style={{ color: arena.arena_color }}
                                    >
                                        {arena.current_streak}
                                    </span>
                                    <span className="streak-panel-unit">days</span>
                                </div>
                            </div>
                            <CornerRing
                                progress={progress}
                                color={arena.arena_color}
                                current={arena.current_streak}
                            />
                        </div>
                        <div className="streak-panel-best">
                            <span className="streak-panel-best-label">Longest</span>
                            <span className="streak-panel-best-value">{arena.longest_streak} days</span>
                        </div>
                    </div>
                );
            })}
        </div>
    )
}

export default Streaks