// src/components/monthNavStrip/MonthNavStrip.tsx
import './MonthNavStrip.css'
import { useState, useEffect } from 'react'
import { productivityAPI } from '@/services/api'
import { getIntensityColor, hexToRgb } from '@/services/colorIntensity'
import type { MonthlySummary } from '@/types'

interface MonthNavStripProps {
    currentYear: number
    currentMonth: number
    onSelectMonth: (year: number, month: number) => void
    selectedArenaId: number | null
    refreshKey?: number
}

const MONTH_ABBREVS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const MonthNavStrip = ({ currentYear, currentMonth, onSelectMonth, selectedArenaId, refreshKey = 0 }: MonthNavStripProps) => {
    const [months, setMonths] = useState<MonthlySummary[]>([])

    const today = new Date()
    const thisYear = today.getFullYear()
    const thisMonth = today.getMonth() + 1

    useEffect(() => {
        productivityAPI.getYearly(currentYear)
            .then(data => setMonths(data.months ?? []))
            .catch(() => setMonths([]))
    }, [currentYear, refreshKey])

    const getMonthCompletion = (month: number): { pct: number; arenaRgb?: string } => {
        const m = months.find(m => m.month === month)
        if (!m) return { pct: 0 }

        if (selectedArenaId) {
            const arena = m.arenas.find(a => a.arena_id === selectedArenaId)
            if (!arena) return { pct: 0 }
            const rgb = arena.arena_color ? hexToRgb(arena.arena_color) : undefined
            return { pct: Math.round(arena.completion_percentage), arenaRgb: rgb }
        }

        return { pct: Math.round(m.completion_percentage) }
    }

    return (
        <div className="month-nav-strip-wrapper">
            <div className="month-nav-strip-nav">
                <div className="month-nav-strip-top">
                    <span className="month-nav-strip-year">{currentYear}</span>
                    {!(currentYear === thisYear && currentMonth === thisMonth) && (
                        <button
                            className="month-nav-strip-today-icon"
                            onClick={() => onSelectMonth(thisYear, thisMonth)}
                            aria-label="This month"
                            title="This Month"
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

                <div className="month-nav-strip-controls">
                    <button
                        className="month-nav-strip-arrow"
                        onClick={() => currentMonth === 1
                            ? onSelectMonth(currentYear - 1, 12)
                            : onSelectMonth(currentYear, currentMonth - 1)
                        }
                        aria-label="Previous month"
                    >
                        ←
                    </button>

                    <div className="month-nav-strip-cells">
                        {MONTH_ABBREVS.map((abbrev, idx) => {
                            const month = idx + 1
                            const isSelected = month === currentMonth
                            const { pct, arenaRgb } = getMonthCompletion(month)
                            const squareBg = pct === 0
                                ? 'var(--color-bg-subtle)'
                                : getIntensityColor(pct, arenaRgb)
                            const tooltipText = pct > 0 ? `${pct}%` : undefined

                            return (
                                <div
                                    key={month}
                                    className={`month-nav-strip-cell${isSelected ? ' month-nav-strip-selected' : ''}`}
                                    onClick={() => onSelectMonth(currentYear, month)}
                                    {...(tooltipText ? { 'data-tooltip': tooltipText } : {})}
                                >
                                    <div className="month-nav-strip-square" style={{ backgroundColor: squareBg }} />
                                    <span className="month-nav-strip-abbrev">{abbrev}</span>
                                </div>
                            )
                        })}
                    </div>

                    <button
                        className="month-nav-strip-arrow"
                        onClick={() => currentMonth === 12
                            ? onSelectMonth(currentYear + 1, 1)
                            : onSelectMonth(currentYear, currentMonth + 1)
                        }
                        aria-label="Next month"
                    >
                        →
                    </button>
                </div>
            </div>

        </div>
    )
}

export default MonthNavStrip
