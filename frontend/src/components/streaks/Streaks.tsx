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

const Streaks = ({ streaks }: StreaksProps) => {
    const activeArenas = streaks.arenas.filter(
        a => a.current_streak > 0 || a.longest_streak > 0
    )

    return (
        <div className="streaks-wrapper">
            {/* Overall */}
            <div className="streak-panel streak-panel-overall">
                <div className="streak-panel-top">
                    <FlameIcon size={14} />
                    <span className="streak-panel-eyebrow">Current Streak</span>
                </div>
                <div className="streak-panel-main">
                    <span className="streak-panel-number">{streaks.current_streak}</span>
                    <span className="streak-panel-unit">days</span>
                </div>
                <div className="streak-panel-best">
                    <span className="streak-panel-best-label">All-time best</span>
                    <span className="streak-panel-best-value">{streaks.longest_streak} days</span>
                </div>
                <div className="streak-panel-track">
                    <div
                        className="streak-panel-track-fill"
                        style={{
                            width: `${streaks.longest_streak > 0
                                ? Math.min((streaks.current_streak / streaks.longest_streak) * 100, 100)
                                : 0}%`,
                            backgroundColor: 'var(--color-primary)',
                        }}
                    />
                    {streaks.longest_streak > 0 && (
                        <div className="streak-panel-track-marker" />
                    )}
                </div>
            </div>

            {/* Arena panels */}
            {activeArenas.map(arena => {
                const progress = arena.longest_streak > 0
                    ? Math.min((arena.current_streak / arena.longest_streak) * 100, 100)
                    : 0;

                return (
                    <div key={arena.arena_id} className="streak-panel">
                        <div className="streak-panel-top">
                            <span
                                className="streak-arena-dot"
                                style={{ backgroundColor: arena.arena_color }}
                            />
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
                        <div className="streak-panel-best">
                            <span className="streak-panel-best-label">All-time best</span>
                            <span className="streak-panel-best-value">{arena.longest_streak} days</span>
                        </div>
                        <div className="streak-panel-track">
                            <div
                                className="streak-panel-track-fill"
                                style={{
                                    width: `${progress}%`,
                                    backgroundColor: arena.arena_color,
                                }}
                            />
                            {arena.longest_streak > 0 && (
                                <div className="streak-panel-track-marker" />
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    )
}

export default Streaks