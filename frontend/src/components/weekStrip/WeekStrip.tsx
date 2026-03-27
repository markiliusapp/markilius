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

const WeekStrip = ({ selectedDate, onSelectDate, selectedArenaId, refreshKey }: WeekStripProps) => {
    const [weekData, setWeekData] = useState<WeeklyProductivityResponse | null>(null)

    const today = new Date().toLocaleDateString('en-CA')
    const weekStart = getSundayOfWeek(selectedDate)
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

    useEffect(() => {
        productivityAPI.getWeekly(weekStart).then(setWeekData).catch(() => setWeekData(null))
    }, [weekStart, refreshKey])

    const isToday = selectedDate === today

    return (
        <div className="week-strip-wrapper">
        <div className="week-strip-nav">
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
                    const isFuture = dateStr > today
                    const isTodayCell = dateStr === today
                    const isSelected = dateStr === selectedDate
                    const isToday = isTodayCell

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
                            className={`week-strip-cell${isToday ? ' week-strip-today' : ''}${isSelected ? ' week-strip-selected' : ''}`}
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
        {!isToday && (
            <button className="today-btn" onClick={() => onSelectDate(today)}>Today</button>
        )}
        </div>
    )
}

export default WeekStrip
