import './ArenaBreakdown.css'
import type { ArenaBreakdown as ArenaBreakdownType } from '@/types'

interface ArenaBreakdownProps {
    arenas: ArenaBreakdownType[]
    prevArenas?: ArenaBreakdownType[]
}

const getDelta = (current: number, previous: number) => {
    if (previous === 0) return null
    const diff = current - previous
    const pct = Math.round((diff / previous) * 100)
    return { diff, pct, positive: diff >= 0 }
}

const ArenaBreakdown = ({ arenas, prevArenas }: ArenaBreakdownProps) => {
    if (arenas.length === 0) return (
        <div className="mab-section">
            <h2>Arena Breakdown</h2>
            <div className="mab-empty">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 20V10M12 20V4M6 20v-6" />
                </svg>
                <p className="mab-empty-title">No arena data yet</p>
                <p className="mab-empty-sub">Complete tasks to see your breakdown</p>
            </div>
        </div>
    )

    const totalTasks = arenas.reduce((sum, a) => sum + a.total_tasks, 0)
    const completedTasks = arenas.reduce((sum, a) => sum + a.completed_tasks, 0)
    const overallPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    const totalHours = arenas.reduce((sum, a) => sum + a.total_hours, 0)

    const prevTotalHours = prevArenas?.reduce((sum, a) => sum + a.total_hours, 0) ?? 0
    const overallDelta = prevArenas ? getDelta(totalHours, prevTotalHours) : null

    const sorted = [...arenas].sort((a, b) => b.completion_percentage - a.completion_percentage)

    return (
        <div className="mab-section">
            <h2>Arena Breakdown</h2>
            <div className="mab-list">

                {/* Overall row */}
                <div className="mab-row">
                    <span className="mab-label">Overall</span>
                    <div className="mab-track">
                        <div
                            className="mab-fill"
                            style={{ width: `${overallPct}%`, backgroundColor: 'var(--color-text-muted)' }}
                        >
                            <span className="mab-fill-pct">{overallPct}%</span>
                        </div>
                    </div>
                    <div className="mab-right-meta">
                        {overallDelta && (
                            <span
                                className={`mab-delta ${overallDelta.positive ? 'mab-delta-pos' : 'mab-delta-neg'}`}
                                data-tooltip={overallDelta.positive
                                    ? `${Math.abs(overallDelta.pct)}% more hours logged vs last period`
                                    : `${Math.abs(overallDelta.pct)}% fewer hours logged vs last period`}
                            >
                                {overallDelta.positive ? '↑' : '↓'}{Math.abs(overallDelta.pct)}%
                            </span>
                        )}
                        <span className="mab-hours">{totalHours.toFixed(1)}h</span>
                    </div>
                </div>

                {/* Arena rows */}
                {sorted.map(arena => {
                    const prevArena = prevArenas?.find(a => a.arena_id === arena.arena_id)
                    const delta = prevArena ? getDelta(arena.total_hours, prevArena.total_hours) : null
                    const pct = Math.round(arena.completion_percentage)

                    return (
                        <div key={arena.arena_id} className="mab-row">
                            <span className="mab-label">{arena.arena_name}</span>
                            <div className="mab-track">
                                <div
                                    className="mab-fill"
                                    style={{ width: `${pct}%`, backgroundColor: arena.arena_color }}
                                >
                                    <span className="mab-fill-pct">{pct}%</span>
                                </div>
                            </div>
                            <div className="mab-right-meta">
                                {delta && (
                                    <span
                                        className={`mab-delta ${delta.positive ? 'mab-delta-pos' : 'mab-delta-neg'}`}
                                        data-tooltip={delta.positive
                                            ? `${Math.abs(delta.pct)}% more hours logged vs last period`
                                            : `${Math.abs(delta.pct)}% fewer hours logged vs last period`}
                                    >
                                        {delta.positive ? '↑' : '↓'}{Math.abs(delta.pct)}%
                                    </span>
                                )}
                                <span className="mab-hours">{arena.total_hours.toFixed(1)}h</span>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default ArenaBreakdown
