// src/components/monthlyArenaChart/MonthlyArenaChart.tsx
import './MonthlyArenaChart.css'
import type { DailyProductivityResponse, ArenaBreakdown } from '@/types'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts'

interface MonthlyArenaChartProps {
    dailyBreakdown: DailyProductivityResponse[]
    year: number
    month: number
}

interface WeekDataPoint {
    week: string
    total: number
    [key: string]: any
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null
    const total = payload.reduce((sum: number, p: any) => sum + (p.value || 0), 0)
    return (
        <div className="mac-tooltip">
            <p className="mac-tooltip-label">{label}</p>
            {payload.map((p: any) =>
                p.value > 0 ? (
                    <div key={p.dataKey} className="mac-tooltip-row">
                        <span className="mac-tooltip-dot" style={{ backgroundColor: p.fill }} />
                        <span className="mac-tooltip-name">{p.name}</span>
                        <span className="mac-tooltip-val">{p.value.toFixed(1)}h</span>
                    </div>
                ) : null
            )}
            <div className="mac-tooltip-total">
                <span>Total</span>
                <span>{total.toFixed(1)}h</span>
            </div>
        </div>
    )
}

const MonthlyArenaChart = ({ dailyBreakdown, year, month }: MonthlyArenaChartProps) => {
    // Collect all unique arenas
    const arenaMap = new Map<number, ArenaBreakdown>()
    dailyBreakdown.forEach(day => {
        day.arenas.forEach(arena => {
            if (!arenaMap.has(arena.arena_id)) arenaMap.set(arena.arena_id, arena)
        })
    })
    const allArenas = Array.from(arenaMap.values())

    // Group days into weeks
    const weeks: Map<number, DailyProductivityResponse[]> = new Map()
    dailyBreakdown.forEach(day => {
        const [y, m, d] = day.date.toString().split('-').map(Number)
        const date = new Date(y, m - 1, d)
        const weekNum = Math.ceil(date.getDate() / 7)
        if (!weeks.has(weekNum)) weeks.set(weekNum, [])
        weeks.get(weekNum)!.push(day)
    })

    // Build chart data
    const chartData: WeekDataPoint[] = Array.from(weeks.entries()).map(([weekNum, days]) => {
        const point: WeekDataPoint = {
            week: `Week ${weekNum}`,
            total: 0,
        }
        allArenas.forEach(arena => {
            const hours = days.reduce((sum, day) => {
                const a = day.arenas.find(a => a.arena_id === arena.arena_id)
                return sum + (a?.total_hours ?? 0)
            }, 0)
            point[`arena_${arena.arena_id}`] = Math.round(hours * 10) / 10
            point.total += hours
        })
        point.total = Math.round(point.total * 10) / 10
        return point
    })

    const maxHours = Math.max(...chartData.map(d => d.total))
    const tickCount = 3
    const tickInterval = Math.ceil(maxHours / tickCount)
    const ticks = Array.from({ length: tickCount + 1 }, (_, i) => i * tickInterval)
    const weekCount = chartData.length
    const barSize = Math.max(24, Math.min(64, Math.floor(320 / weekCount)))
    console.log('chartData', JSON.stringify(chartData, null, 2))

    if (allArenas.length === 0) {
        return (
            <div className="mac-empty">
                <p>No time tracked this month</p>
            </div>
        )
    }

    return (
        <div className="mac-wrapper">
            <div className="mac-header">
                <h2>Time by Arena</h2>
                <div className="mac-legend">
                    {allArenas.map(arena => (
                        <div key={arena.arena_id} className="mac-legend-item">
                            <span className="mac-legend-dot" style={{ backgroundColor: arena.arena_color }} />
                            <span className="mac-legend-name">{arena.arena_name}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="mac-chart-container">
                <ResponsiveContainer width="100%" height='100%'>
                    <BarChart
                        data={chartData}
                        margin={{ top: 8, right: 0, left: 0, bottom: 0 }}
                        barSize={barSize}
                        barCategoryGap="30%"
                        barGap={2}
                    >
                        <XAxis
                            dataKey="week"
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
                        <Tooltip content={<CustomTooltip />} cursor={false} />
                        {allArenas.map((arena, idx) => (
                            <Bar
                                key={arena.arena_id}
                                dataKey={`arena_${arena.arena_id}`}
                                name={arena.arena_name}
                                fill={arena.arena_color}
                                radius={[4, 4, 0, 0]}
                            />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

export default MonthlyArenaChart