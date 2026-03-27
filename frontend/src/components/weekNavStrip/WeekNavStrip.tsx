// src/components/weekNavStrip/WeekNavStrip.tsx
import './WeekNavStrip.css'
import { useState, useEffect } from 'react'
import { productivityAPI } from '@/services/api'
import { getIntensityColor, hexToRgb } from '@/services/colorIntensity'
import type { DailyProductivityResponse } from '@/types'

interface WeekNavStripProps {
    currentSunday: string
    onSelectWeek: (sunday: string) => void
    selectedArenaId: number | null
    refreshKey: number
    compact?: boolean
    onToggleCompact?: () => void
}

const addDays = (dateStr: string, n: number): string => {
    const [y, m, d] = dateStr.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    date.setDate(date.getDate() + n)
    return date.toLocaleDateString('en-CA')
}

const getSundayOfWeek = (dateStr: string): string => {
    const [y, m, d] = dateStr.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    date.setDate(date.getDate() - date.getDay())
    return date.toLocaleDateString('en-CA')
}

const getWeeksOfMonth = (year: number, month: number): string[] => {
    const firstDay = new Date(year, month - 1, 1)
    const firstSunday = new Date(firstDay)
    firstSunday.setDate(firstDay.getDate() - firstDay.getDay())
    const lastDay = new Date(year, month, 0)
    const weeks: string[] = []
    const current = new Date(firstSunday)
    while (current <= lastDay) {
        weeks.push(current.toLocaleDateString('en-CA'))
        current.setDate(current.getDate() + 7)
    }
    return weeks
}

const WeekNavStrip = ({ currentSunday, onSelectWeek, selectedArenaId, refreshKey, compact, onToggleCompact }: WeekNavStripProps) => {
    const [allDayData, setAllDayData] = useState<DailyProductivityResponse[]>([])

    const [y, m] = currentSunday.split('-').map(Number)
    const thisWeekSunday = getSundayOfWeek(new Date().toLocaleDateString('en-CA'))
    const weeks = getWeeksOfMonth(y, m)

    useEffect(() => {
        // Collect all unique year-month combos touched by any day in any week of the strip
        const monthSet = new Set<string>()
        for (const sunday of weeks) {
            for (let i = 0; i < 7; i++) {
                const day = addDays(sunday, i)
                const [dy, dm] = day.split('-').map(Number)
                monthSet.add(`${dy}-${dm}`)
            }
        }
        const fetches = Array.from(monthSet).map(ym => {
            const [my, mm] = ym.split('-').map(Number)
            return productivityAPI.getMonthly(my, mm)
        })
        Promise.all(fetches)
            .then(results => setAllDayData(results.flatMap(r => r.daily_breakdown)))
            .catch(() => setAllDayData([]))
    }, [y, m, refreshKey])

    const getWeekCompletion = (sunday: string): { pct: number; arenaRgb?: string } => {
        const weekDays = Array.from({ length: 7 }, (_, i) => addDays(sunday, i))
        const days = allDayData.filter(d => weekDays.includes(d.date.toString()))

        if (selectedArenaId) {
            const arenaDays = days.map(d => d.arenas.find(a => a.arena_id === selectedArenaId)).filter(Boolean) as any[]
            if (arenaDays.length === 0) return { pct: 0 }
            const completed = arenaDays.reduce((s, a) => s + a.completed_tasks, 0)
            const total = arenaDays.reduce((s, a) => s + a.total_tasks, 0)
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0
            const rgb = arenaDays[0]?.arena_color ? hexToRgb(arenaDays[0].arena_color) : undefined
            return { pct, arenaRgb: rgb }
        }

        const completed = days.reduce((s, d) => s + d.completed_tasks, 0)
        const total = days.reduce((s, d) => s + d.total_tasks, 0)
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0
        return { pct }
    }

    const monthLabel = new Date(y, m - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

    return (
        <div className="week-nav-strip-wrapper">
            <div className="week-nav-strip-nav">
                <div className="week-nav-strip-top">
                    {onToggleCompact && (
                        <button
                            className={`week-nav-strip-compact-icon${compact ? ' active' : ''}`}
                            onClick={onToggleCompact}
                            title={compact ? 'Expand' : 'Compact'}
                        >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                {compact ? (
                                    <><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="7" y1="9" x2="17" y2="9" /><line x1="7" y1="13" x2="13" y2="13" /></>
                                ) : (
                                    <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>
                                )}
                            </svg>
                        </button>
                    )}
                    <span className="week-nav-strip-month">{monthLabel}</span>
                    {currentSunday !== thisWeekSunday && (
                        <button
                            className="week-nav-strip-today-icon"
                            onClick={() => onSelectWeek(thisWeekSunday)}
                            aria-label="This week"
                            title="This Week"
                        >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                                <circle cx="12" cy="16" r="2" fill="currentColor" stroke="none" />
                            </svg>
                        </button>
                    )}
                </div>

                <div className="week-nav-strip-controls">
                    <button
                        className="week-nav-strip-arrow"
                        onClick={() => onSelectWeek(addDays(currentSunday, -7))}
                        aria-label="Previous week"
                    >
                        ←
                    </button>

                    <div className="week-nav-strip-cells">
                        {weeks.map((sunday) => {
                            const [sy, sm, sd] = sunday.split('-').map(Number)
                            const isSelected = sunday === currentSunday
                            const { pct, arenaRgb } = getWeekCompletion(sunday)
                            const squareBg = pct === 0
                                ? 'var(--color-bg-subtle)'
                                : getIntensityColor(pct, arenaRgb)
                            const tooltipText = pct > 0 ? `${pct}%` : undefined

                            return (
                                <div
                                    key={sunday}
                                    className={`week-nav-strip-cell${isSelected ? ' week-nav-strip-selected' : ''}`}
                                    onClick={() => onSelectWeek(sunday)}
                                    {...(tooltipText ? { 'data-tooltip': tooltipText } : {})}
                                >
                                    <div className="week-nav-strip-square" style={{ backgroundColor: squareBg }} />
                                    <span className="week-nav-strip-date">{sd}</span>
                                </div>
                            )
                        })}
                    </div>

                    <button
                        className="week-nav-strip-arrow"
                        onClick={() => onSelectWeek(addDays(currentSunday, 7))}
                        aria-label="Next week"
                    >
                        →
                    </button>
                </div>
            </div>
        </div>
    )
}

export default WeekNavStrip
