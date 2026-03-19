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
    if (arenas.length === 0) return null

    const totalTasks = arenas.reduce((sum, a) => sum + a.total_tasks, 0)
    const completedTasks = arenas.reduce((sum, a) => sum + a.completed_tasks, 0)
    const overallPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    const totalHours = arenas.reduce((sum, a) => sum + a.total_hours, 0)

    const prevTotalHours = prevArenas?.reduce((sum, a) => sum + a.total_hours, 0) ?? 0
    const overallDelta = prevArenas ? getDelta(totalHours, prevTotalHours) : null

    return (
        <div className="mab-section">
            <h2>Arena Breakdown</h2>
            <div className="mab-list">

                {/* Overall row */}
                <div className="mab-row mab-row-overall">
                    <div className="mab-left">
                        <span className="mab-big-pct" style={{ color: 'var(--color-primary)' }}>
                            {overallPct}
                        </span>
                        <span className="mab-pct-label">% done</span>
                    </div>
                    <div className="mab-right">
                        <div className="mab-name-row">
                            <span className="mab-name" style={{ fontWeight: 600 }}>Overall</span>
                            <div className="mab-meta">
                                {overallDelta && (
                                    <span className={`mab-delta ${overallDelta.positive ? 'mab-delta-pos' : 'mab-delta-neg'}`}>
                                        {overallDelta.positive ? '↑' : '↓'} {Math.abs(overallDelta.pct)}%
                                    </span>
                                )}
                                <span className="mab-hours">{totalHours.toFixed(1)}h</span>
                            </div>
                        </div>
                        <div className="mab-track">
                            <div
                                className="mab-fill"
                                style={{
                                    width: `${overallPct}%`,
                                    backgroundColor: 'var(--color-primary)',
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Arena rows */}
                {arenas
                    .sort((a, b) => b.completion_percentage - a.completion_percentage)
                    .map(arena => {
                        const prevArena = prevArenas?.find(a => a.arena_id === arena.arena_id)
                        const delta = prevArena
                            ? getDelta(arena.total_hours, prevArena.total_hours)
                            : null

                        return (
                            <div key={arena.arena_id} className="mab-row">
                                <div className="mab-left">
                                    <span
                                        className="mab-big-pct"
                                        style={{ color: arena.arena_color }}
                                    >
                                        {Math.round(arena.completion_percentage)}%
                                    </span>
                                </div>
                                <div className="mab-right">
                                    <div className="mab-name-row">
                                        <span className="mab-name">{arena.arena_name}</span>
                                        <div className="mab-meta">
                                            {delta && (
                                                <span className={`mab-delta ${delta.positive ? 'mab-delta-pos' : 'mab-delta-neg'}`}>
                                                    {delta.positive ? '↑' : '↓'} {Math.abs(delta.pct)}%
                                                </span>
                                            )}
                                            <span className="mab-hours">{arena.total_hours.toFixed(1)}h</span>
                                        </div>
                                    </div>
                                    <div className="mab-track">
                                        <div
                                            className="mab-fill"
                                            style={{
                                                width: `${arena.completion_percentage}%`,
                                                backgroundColor: arena.arena_color,
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )
                    })}
            </div>
        </div>
    )
}

export default ArenaBreakdown
