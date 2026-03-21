// src/components/weeklyChart/WeeklyChart.tsx
import './WeeklyChart.css'
import type { DailyBreakDownWithTasks, ArenaBreakdown } from '@/types'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts'
import { useState, useMemo } from 'react'

interface WeeklyChartProps {
    dailyBreakdown: DailyBreakDownWithTasks[]
    averageDuration: number
}

interface ChartDataPoint {
    day: string
    date: string
    total: number
    arenas: ArenaBreakdown[]
    [key: string]: any
}

type Layout = 'grouped' | 'stacked'
type SortOrder = 'asc' | 'desc' | null

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconGrouped = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <rect x="1" y="6" width="3" height="9" rx="1" />
        <rect x="6" y="2" width="3" height="13" rx="1" />
        <rect x="11" y="9" width="3" height="6" rx="1" />
    </svg>
)

const IconStacked = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <rect x="4" y="10" width="8" height="5" rx="0" />
        <rect x="4" y="5.5" width="8" height="4" rx="0" opacity="0.65" />
        <rect x="4" y="1" width="8" height="4" rx="1" opacity="0.35" />
    </svg>
)

const IconSortAsc = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <rect x="1" y="11" width="3" height="4" rx="1" />
        <rect x="6"  y="7"  width="3" height="8" rx="1" />
        <rect x="11" y="3"  width="3" height="12" rx="1" />
    </svg>
)

const IconSortDesc = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <rect x="1" y="3"  width="3" height="12" rx="1" />
        <rect x="6"  y="7"  width="3" height="8" rx="1" />
        <rect x="11" y="11" width="3" height="4" rx="1" />
    </svg>
)

// ─── Tooltip ──────────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label, visibleArenas }: any) => {
    if (!active || !payload?.length) return null
    const dataPoint = payload[0]?.payload
    if (!dataPoint) return null

    const arenaData = (visibleArenas as ArenaBreakdown[])
        .map(a => ({ arena: a, value: dataPoint[`arena_${a.arena_id}`] || 0 }))
        .filter(({ value }) => value > 0)

    const total = arenaData.reduce((sum, { value }) => sum + value, 0)

    return (
        <div className="weekly-chart-tooltip">
            <p className="weekly-chart-tooltip-label">{label}</p>
            {arenaData.map(({ arena, value }) => (
                <div key={arena.arena_id} className="weekly-chart-tooltip-row">
                    <span className="weekly-chart-tooltip-dot" style={{ backgroundColor: arena.arena_color }} />
                    <span className="weekly-chart-tooltip-name">{arena.arena_name}</span>
                    <span className="weekly-chart-tooltip-val">{value.toFixed(1)}h</span>
                </div>
            ))}
            <div className="weekly-chart-tooltip-total">
                <span>Total</span>
                <span>{total.toFixed(1)}h</span>
            </div>
        </div>
    )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const sortArenas = (
    arenas: ArenaBreakdown[],
    payload: Record<string, any>,
    sortOrder: SortOrder
): ArenaBreakdown[] => {
    if (!sortOrder) return arenas
    return [...arenas].sort((a, b) => {
        const va = payload[`arena_${a.arena_id}`] || 0
        const vb = payload[`arena_${b.arena_id}`] || 0
        return sortOrder === 'asc' ? va - vb : vb - va
    })
}

// ─── Custom bar shapes ────────────────────────────────────────────────────────

const makeGroupedShape = (
    visibleArenas: ArenaBreakdown[],
    yMax: number,
    sortOrder: SortOrder
) =>
    (props: any) => {
        const { x, width, background, payload } = props
        if (!background || yMax <= 0) return <g />

        const chartHeight = background.height
        const chartBottom = background.y + chartHeight

        const activeArenas = sortArenas(
            visibleArenas.filter(a => (payload[`arena_${a.arena_id}`] || 0) > 0),
            payload,
            sortOrder
        )
        if (activeArenas.length === 0) return <g />

        const gap = 2
        const totalGap = Math.max(0, (activeArenas.length - 1) * gap)
        const barW = Math.max(4, Math.floor((width - totalGap) / activeArenas.length))
        const totalW = activeArenas.length * barW + totalGap
        const startX = Math.round(x + (width - totalW) / 2)
        const r = Math.min(3, barW / 2)

        return (
            <g>
                {activeArenas.map((arena, i) => {
                    const value = payload[`arena_${arena.arena_id}`] || 0
                    const barH = Math.max(0, (value / yMax) * chartHeight)
                    if (barH < 1) return null
                    const barX = startX + i * (barW + gap)
                    const barY = chartBottom - barH
                    return (
                        <path
                            key={arena.arena_id}
                            d={`M ${barX + r} ${barY} h ${barW - 2 * r} q ${r} 0 ${r} ${r} v ${barH - r} h ${-barW} v ${-(barH - r)} q 0 ${-r} ${r} ${-r} z`}
                            fill={arena.arena_color}
                        />
                    )
                })}
            </g>
        )
    }

const makeStackedShape = (
    visibleArenas: ArenaBreakdown[],
    yMax: number,
    sortOrder: SortOrder
) =>
    (props: any) => {
        const { x, width, background, payload } = props
        if (!background || yMax <= 0) return <g />

        const chartHeight = background.height
        const chartBottom = background.y + chartHeight

        const activeArenas = sortArenas(
            visibleArenas.filter(a => (payload[`arena_${a.arena_id}`] || 0) > 0),
            payload,
            sortOrder
        )
        if (activeArenas.length === 0) return <g />

        const r = 3
        let currentBottom = chartBottom

        return (
            <g>
                {activeArenas.map((arena, i) => {
                    const value = payload[`arena_${arena.arena_id}`] || 0
                    const segH = Math.max(0, (value / yMax) * chartHeight)
                    if (segH < 1) return null

                    const segY = currentBottom - segH
                    currentBottom -= segH
                    const isTop = i === activeArenas.length - 1

                    if (isTop) {
                        return (
                            <path
                                key={arena.arena_id}
                                d={`M ${x + r} ${segY} h ${width - 2 * r} q ${r} 0 ${r} ${r} v ${segH - r} h ${-width} v ${-(segH - r)} q 0 ${-r} ${r} ${-r} z`}
                                fill={arena.arena_color}
                            />
                        )
                    }
                    return (
                        <rect
                            key={arena.arena_id}
                            x={x}
                            y={segY}
                            width={width}
                            height={segH}
                            fill={arena.arena_color}
                        />
                    )
                })}
            </g>
        )
    }

// ─── Component ────────────────────────────────────────────────────────────────

const WeeklyChart = ({ dailyBreakdown, averageDuration }: WeeklyChartProps) => {
    const [selectedArenaId, setSelectedArenaId] = useState<number | null>(null)
    const [layout, setLayout] = useState<Layout>('stacked')
    const [sortOrder, setSortOrder] = useState<SortOrder>(null)

    const effectiveSortOrder: SortOrder = selectedArenaId ? null : sortOrder

    // Collect all unique arenas across the week
    const arenaMap = new Map<number, ArenaBreakdown>()
    dailyBreakdown.forEach(day => {
        day.arenas.forEach(arena => {
            if (!arenaMap.has(arena.arena_id)) arenaMap.set(arena.arena_id, arena)
        })
    })
    const allArenas = Array.from(arenaMap.values())

    if (allArenas.length === 0) return (
        <div className="weekly-chart-wrapper">
            <div className="weekly-chart-header">
                <h2>Time by Arena</h2>
            </div>
            <div className="weekly-chart-empty">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 20V10M12 20V4M6 20v-6" />
                </svg>
                <p className="weekly-chart-empty-title">No time logged this week</p>
                <p className="weekly-chart-empty-sub">Track time on tasks to see your breakdown</p>
            </div>
        </div>
    )

    const visibleArenas = selectedArenaId
        ? allArenas.filter(a => a.arena_id === selectedArenaId)
        : allArenas

    // Build chart data
    const chartData: ChartDataPoint[] = dailyBreakdown.map(day => {
        const [y, m, d] = day.date.toString().split('-').map(Number)
        const dateObj = new Date(y, m - 1, d)
        const dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'short' })
        const dateLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

        const point: ChartDataPoint = {
            day: dayLabel,
            date: dateLabel,
            total: day.total_duration,
            arenas: day.arenas,
        }
        allArenas.forEach(arena => {
            const match = day.arenas.find(a => a.arena_id === arena.arena_id)
            point[`arena_${arena.arena_id}`] = match ? match.total_hours : 0
        })
        return point
    })

    const displayAverage = selectedArenaId
        ? chartData.reduce((sum, d) => sum + (d[`arena_${selectedArenaId}`] || 0), 0) / chartData.length
        : averageDuration

    const visibleMax = selectedArenaId
        ? Math.max(...chartData.map(d => d[`arena_${selectedArenaId}`] || 0), displayAverage)
        : Math.max(...chartData.map(d => d.total), averageDuration)

    const ticks = Array.from({ length: Math.ceil(visibleMax) + 1 }, (_, i) => i)
    const yMax = Math.ceil(visibleMax)

    const barSize = layout === 'stacked'
        ? Math.max(28, Math.min(80, Math.floor(280 / chartData.length)))
        : Math.max(40, Math.min(120, Math.floor(380 / chartData.length)))

    const groupedShape = useMemo(
        () => makeGroupedShape(visibleArenas, yMax, effectiveSortOrder),
        [visibleArenas, yMax, effectiveSortOrder]
    )
    const stackedShape = useMemo(
        () => makeStackedShape(visibleArenas, yMax, effectiveSortOrder),
        [visibleArenas, yMax, effectiveSortOrder]
    )

    const handleArenaClick = (arenaId: number) => {
        setSelectedArenaId(prev => prev === arenaId ? null : arenaId)
        setSortOrder(null)
    }

    return (
        <div className="weekly-chart-wrapper">
            <div className="weekly-chart-header">
                <div className="weekly-chart-title-row">
                    <h2>Time by Arena</h2>
                    <div className="weekly-chart-control-group">
                        {!selectedArenaId && (
                            <>
                                <button
                                    className={`weekly-chart-icon-btn ${effectiveSortOrder === 'asc' ? 'active' : ''}`}
                                    onClick={() => setSortOrder(s => s === 'asc' ? null : 'asc')}
                                    title="Sort ascending"
                                >
                                    <IconSortAsc />
                                </button>
                                <button
                                    className={`weekly-chart-icon-btn ${effectiveSortOrder === 'desc' ? 'active' : ''}`}
                                    onClick={() => setSortOrder(s => s === 'desc' ? null : 'desc')}
                                    title="Sort descending"
                                >
                                    <IconSortDesc />
                                </button>
                                <div className="weekly-chart-control-divider" />
                            </>
                        )}
                        <button
                            className={`weekly-chart-icon-btn ${layout === 'grouped' ? 'active' : ''}`}
                            onClick={() => setLayout('grouped')}
                            title="Grouped"
                        >
                            <IconGrouped />
                        </button>
                        <button
                            className={`weekly-chart-icon-btn ${layout === 'stacked' ? 'active' : ''}`}
                            onClick={() => setLayout('stacked')}
                            title="Stacked"
                        >
                            <IconStacked />
                        </button>
                    </div>
                </div>
                <div className="weekly-chart-legend">
                    <button
                        className={`weekly-chart-pill ${!selectedArenaId ? 'active' : ''}`}
                        onClick={() => { setSelectedArenaId(null); setSortOrder(null) }}
                    >
                        All
                    </button>
                    {allArenas.map(arena => (
                        <button
                            key={arena.arena_id}
                            className={`weekly-chart-pill ${selectedArenaId === arena.arena_id ? 'active' : ''}`}
                            style={{
                                borderColor: selectedArenaId === arena.arena_id ? arena.arena_color : `${arena.arena_color}40`,
                                backgroundColor: selectedArenaId === arena.arena_id ? `${arena.arena_color}25` : `${arena.arena_color}12`,
                                color: selectedArenaId === arena.arena_id ? arena.arena_color : 'var(--color-text-secondary)',
                            }}
                            onClick={() => handleArenaClick(arena.arena_id)}
                        >
                            {arena.arena_name}
                        </button>
                    ))}
                </div>
            </div>
            <div className="week-chart-container">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 16, right: 0, left: 0, bottom: 0 }}
                        barSize={barSize}
                        barCategoryGap="30%"
                    >
                        <XAxis
                            dataKey="day"
                            tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            ticks={ticks}
                            tickFormatter={(v) => `${v}h`}
                            tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                            axisLine={false}
                            tickLine={false}
                            width={32}
                        />
                        <Tooltip
                            content={(props) => <CustomTooltip {...props} visibleArenas={visibleArenas} />}
                            cursor={false}
                        />
                        {displayAverage > 0 && (
                            <ReferenceLine
                                y={displayAverage}
                                stroke="var(--color-text-muted)"
                                strokeDasharray="4 4"
                                strokeWidth={1.5}
                                label={{
                                    value: `avg ${displayAverage.toFixed(1)}h`,
                                    position: 'insideTopRight',
                                    fontSize: 11,
                                    fill: 'var(--color-text-muted)',
                                }}
                            />
                        )}
                        <Bar
                            dataKey="total"
                            shape={layout === 'grouped' ? groupedShape : stackedShape}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

export default WeeklyChart
