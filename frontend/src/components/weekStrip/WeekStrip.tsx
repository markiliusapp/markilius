// src/components/weekStrip/WeekStrip.tsx
import './WeekStrip.css'
import { useState, useEffect } from 'react'
import { productivityAPI } from '@/services/api'
import { getIntensityColor, hexToRgb } from '@/services/colorIntensity'
import type { WeeklyProductivityResponse } from '@/types'

interface WeekStripProps {
    selectedDate: string
    onSelectDate: (date: string) => void
    selectedArenaId: number | null
    refreshKey: number
    compact?: boolean
    onToggleCompact?: () => void
}

const DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const getSundayOfWeek = (dateStr: string): string => {
    const [y, m, d] = dateStr.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    date.setDate(date.getDate() - date.getDay())
    return date.toLocaleDateString('en-CA')
}

const addDays = (dateStr: string, n: number): string => {
    const [y, m, d] = dateStr.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    date.setDate(date.getDate() + n)
    return date.toLocaleDateString('en-CA')
}

const WeekStrip = ({ selectedDate, onSelectDate, selectedArenaId, refreshKey, compact, onToggleCompact }: WeekStripProps) => {
    const [weekData, setWeekData] = useState<WeeklyProductivityResponse | null>(null)

    const today = new Date().toLocaleDateString('en-CA')
    const weekStart = getSundayOfWeek(selectedDate)
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

    useEffect(() => {
        productivityAPI.getWeekly(weekStart).then(setWeekData).catch(() => setWeekData(null))
    }, [weekStart, refreshKey])

    const isToday = selectedDate === today
    const [wy, wm] = weekStart.split('-').map(Number)
    const weekLabel = new Date(wy, wm - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

    return (
        <div className="week-strip-wrapper">
            <div className="week-strip-nav">
                <div className="week-strip-top">
                    {onToggleCompact && (
                        <button
                            className={`week-strip-compact-icon${compact ? ' active' : ''}`}
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
                    <span className="week-strip-month">{weekLabel}</span>
                    {!isToday && (
                        <button
                            className="week-strip-today-icon"
                            onClick={() => onSelectDate(today)}
                            aria-label="Today"
                            title="Today"
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

                <div className="week-strip-controls">
                    <button
                        className="week-strip-arrow"
                        onClick={() => onSelectDate(addDays(selectedDate, -1))}
                        aria-label="Previous day"
                    >
                        ←
                    </button>

                    <div className="week-strip-cells">
                        {days.map((dateStr) => {
                            const [y, m, d] = dateStr.split('-').map(Number)
                            const dow = new Date(y, m - 1, d).getDay()
                            const dayData = weekData?.daily_breakdown.find(day => day.date.toString() === dateStr)
                            const isSelected = dateStr === selectedDate

                            const arenaData = selectedArenaId && dayData
                                ? dayData.arenas.find(a => a.arena_id === selectedArenaId)
                                : null

                            const pct = selectedArenaId
                                ? (arenaData?.completion_percentage ?? 0)
                                : (dayData?.completion_percentage ?? 0)

                            const rgbColor = arenaData ? hexToRgb(arenaData.arena_color) : undefined
                            const squareBg = !dayData || pct === 0
                                ? 'var(--color-bg-subtle)'
                                : getIntensityColor(pct, rgbColor)

                            const tooltipText = dayData && pct > 0 ? `${Math.round(pct)}%` : undefined

                            return (
                                <div
                                    key={dateStr}
                                    className={`week-strip-cell${isSelected ? ' week-strip-selected' : ''}`}
                                    onClick={() => onSelectDate(dateStr)}
                                    {...(tooltipText ? { 'data-tooltip': tooltipText } : {})}
                                >
                                    <span className="week-strip-day">{DAY_INITIALS[dow]}</span>
                                    <div className="week-strip-square" style={{ backgroundColor: squareBg }} />
                                    <span className="week-strip-date">{d}</span>
                                </div>
                            )
                        })}
                    </div>

                    <button
                        className="week-strip-arrow"
                        onClick={() => onSelectDate(addDays(selectedDate, 1))}
                        aria-label="Next day"
                    >
                        →
                    </button>
                </div>
            </div>
        </div>
    )
}

export default WeekStrip
