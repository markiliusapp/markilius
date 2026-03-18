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
import { useState } from 'react'

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

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null

    const total = payload.reduce((sum: number, p: any) => sum + (p.value || 0), 0)

    return (
        <div className="weekly-chart-tooltip">
            <p className="weekly-chart-tooltip-label">{label}</p>
            {payload.map((p: any) => (
                p.value > 0 && (
                    <div key={p.dataKey} className="weekly-chart-tooltip-row">
                        <span
                            className="weekly-chart-tooltip-dot"
                            style={{ backgroundColor: p.fill }}
                        />
                        <span className="weekly-chart-tooltip-name">{p.name}</span>
                        <span className="weekly-chart-tooltip-val">{p.value.toFixed(1)}h</span>
                    </div>
                )
            ))}
            <div className="weekly-chart-tooltip-total">
                <span>Total</span>
                <span>{total.toFixed(1)}h</span>
            </div>
        </div>
    )
}

const WeeklyChart = ({ dailyBreakdown, averageDuration }: WeeklyChartProps) => {
    // Collect all unique arenas across the week
    const [selectedArenaId, setSelectedArenaId] = useState<number | null>(null)
    const arenaMap = new Map<number, ArenaBreakdown>()
    dailyBreakdown.forEach(day => {
        day.arenas.forEach(arena => {
            if (!arenaMap.has(arena.arena_id)) {
                arenaMap.set(arena.arena_id, arena)
            }
        })
    })
    const allArenas = Array.from(arenaMap.values())

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

        // Add each arena's hours as a key
        allArenas.forEach(arena => {
            const match = day.arenas.find(a => a.arena_id === arena.arena_id)
            point[`arena_${arena.arena_id}`] = match ? match.total_hours : 0
        })

        return point
    })
    const maxHours = Math.max(...chartData.map(d => d.total), averageDuration)
    const ticks = Array.from({ length: Math.ceil(maxHours) + 1 }, (_, i) => i)

    return (
        <div className="weekly-chart-wrapper">
            <div className="weekly-chart-header">
                <h2>Time by Arena</h2>
                <div className="weekly-chart-legend">
                    <button
                        className={`weekly-chart-pill ${!selectedArenaId ? 'active' : ''}`}
                        onClick={() => setSelectedArenaId(null)}
                    >
                        All
                    </button>
                    {allArenas.map(arena => (
                        <button
                            key={arena.arena_id}
                            className={`weekly-chart-pill ${selectedArenaId === arena.arena_id ? 'active' : ''}`}
                            style={{
                                borderColor: selectedArenaId === arena.arena_id ? arena.arena_color : 'var(--color-border)',
                                backgroundColor: selectedArenaId === arena.arena_id ? `${arena.arena_color}20` : 'transparent',
                                color: selectedArenaId === arena.arena_id ? arena.arena_color : 'var(--color-text-secondary)',
                            }}
                            onClick={() => setSelectedArenaId(selectedArenaId === arena.arena_id ? null : arena.arena_id)}
                        >
                            <span className="weekly-chart-legend-dot" style={{ backgroundColor: arena.arena_color }} />
                            {arena.arena_name}
                        </button>
                    ))}
                </div>
            </div>
            <div className='week-chart-container'>
                <ResponsiveContainer width="100%" height={240}>
                    <BarChart
                        data={chartData}
                        margin={{ top: 16, right: 0, left: 0, bottom: 0 }}
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
                            content={<CustomTooltip />}
                            cursor={false}
                        />
                        {averageDuration > 0 && (
                            <ReferenceLine
                                y={averageDuration}
                                stroke="var(--color-text-muted)"
                                strokeDasharray="4 4"
                                strokeWidth={1.5}
                                label={{
                                    value: `avg ${averageDuration.toFixed(1)}h`,
                                    position: 'insideTopRight',
                                    fontSize: 11,
                                    fill: 'var(--color-text-muted)',
                                }}
                            />
                        )}
                        {visibleArenas.map((arena, idx) => (
                            <Bar
                                key={arena.arena_id}
                                dataKey={`arena_${arena.arena_id}`}
                                name={arena.arena_name}
                                stackId="a"
                                fill={arena.arena_color}
                                radius={idx === visibleArenas.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                            />
                        ))}
                    </BarChart>
                </ResponsiveContainer> 
            </div>
            
        </div>
    )
}

export default WeeklyChart