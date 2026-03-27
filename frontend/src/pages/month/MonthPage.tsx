import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../components/DashBoardLayout';
import { productivityAPI } from '@/services/api';
import type { MonthlyProductivity, ArenaBreakdown as ArenaBreakdownType } from '@/types';
import Heatmap from '@/components/heatmap/Heatmap';
import './MonthPage.css';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { HeatmapLegend } from '@/components/heatmapLegend/HeatmapLegend';
import { hexToRgb } from '@/services/colorIntensity';
import AddTaskButton from '@/components/addTaskButton/AddTaskButton';
import FloatingAddButton from '@/components/floatingAddButton/FloatingAddButton';
import TaskInput from '@/components/taskinput/TaskInput';
import MonthlyArenaChart from '@/components/monthArenaChart/MonthlyArenaChart';
import ArenaBreakdown from '@/components/arenaBreakdown/ArenaBreakdown'
import ArenaFilter from '@/components/arenaFilter/ArenaFilter'
import { useAuth } from '@/context/authContext'


const MonthPage = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [searchParams] = useSearchParams()
    const [monthData, setMonthData] = useState<MonthlyProductivity | null>(null);
    const [prevMonthData, setPrevMonthData] = useState<MonthlyProductivity | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentYear, setCurrentYear] = useState(() => {
        const y = parseInt(searchParams.get('year') ?? '')
        return isNaN(y) ? new Date().getFullYear() : y
    });
    const [currentMonth, setCurrentMonth] = useState(() => {
        const m = parseInt(searchParams.get('month') ?? '')
        return isNaN(m) || m < 1 || m > 12 ? new Date().getMonth() + 1 : m
    });
    const [selectedArenaId, setSelectedArenaId] = useState<number | null>(null);
    const [showTaskInput, setShowTaskInput] = useState(false)
    const [copied, setCopied] = useState(false)
    const [shareOpen, setShareOpen] = useState(false)
    const [showDates, setShowDates] = useState(true)
    const [showPercentage, setShowPercentage] = useState(false)
    const [controlsVisible, setControlsVisible] = useState(false)
    const shareRef = useRef<HTMLDivElement>(null)

    const handleHeatmapSectionTouch = (e: React.TouchEvent) => {
        if ((e.target as HTMLElement).closest('.heatmap-controls')) return
        if ((e.target as HTMLElement).closest('.heatmap-cell')) return
        setControlsVisible(v => !v)
    }

    useEffect(() => {
        if (!shareOpen) return
        const handler = (e: MouseEvent) => {
            if (shareRef.current && !shareRef.current.contains(e.target as Node))
                setShareOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [shareOpen])


    const handleShareArena = (arenaId: number | null) => {
        if (!user?.public_id) return
        const base = `${window.location.origin}/u/${user.public_id}?year=${currentYear}&month=${currentMonth}`
        const url = arenaId ? `${base}&arena=${arenaId}` : base
        navigator.clipboard.writeText(url)
        setCopied(true)
        setShareOpen(false)
        setTimeout(() => setCopied(false), 2000)
    }

    useEffect(() => {
        fetchMonthData();
    }, [currentYear, currentMonth]);

    const getPrevMonth = () => {
        if (currentMonth === 1) return { year: currentYear - 1, month: 12 }
        return { year: currentYear, month: currentMonth - 1 }
    }

    const fetchMonthData = async () => {
        setLoading(true);
        try {
            const prev = getPrevMonth()
            const [current, previous] = await Promise.all([
                productivityAPI.getMonthly(currentYear, currentMonth),
                productivityAPI.getMonthly(prev.year, prev.month),
            ])
            setMonthData(current)
            setPrevMonthData(previous)
        } catch (err) {
            console.error('Failed to fetch month data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrevMonth = () => {
        if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear(currentYear - 1); }
        else setCurrentMonth(currentMonth - 1);
    };

    const handleNextMonth = () => {
        if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear(currentYear + 1); }
        else setCurrentMonth(currentMonth + 1);
    };

    const getMonthName = () => {
        return new Date(currentYear, currentMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const isCurrentMonth = currentYear === new Date().getFullYear() && currentMonth === new Date().getMonth() + 1;

    const handleDayClick = (date: string) => navigate(`/dashboard?date=${date}`);

    const getArenas = (): ArenaBreakdownType[] => {
        if (!monthData) return []
        const arenaMap = new Map<number, ArenaBreakdownType>()
        monthData.daily_breakdown.forEach(day => {
            day.arenas.forEach(arena => {
                if (!arenaMap.has(arena.arena_id)) arenaMap.set(arena.arena_id, arena)
            })
        })
        return Array.from(arenaMap.values())
    }

    const getDelta = (current: number, previous: number) => {
        if (previous === 0) return null
        const diff = current - previous
        const pct = Math.round((diff / previous) * 100)
        return { diff, pct, positive: diff >= 0 }
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="month-loading">
                    <div className="spinner-large" />
                    <p>Loading month data...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (!monthData) {
        return (
            <DashboardLayout>
                <div className="month-error"><p>Failed to load month data</p></div>
            </DashboardLayout>
        );
    }

    const arenas = getArenas()
    const selectedArena = arenas.find(a => a.arena_id === selectedArenaId)
    const rgbColor = selectedArena ? hexToRgb(selectedArena.arena_color) : undefined

    // Arena-aware summary stats
    const summaryArena = monthData.summary.arenas.find(a => a.arena_id === selectedArenaId) ?? null
    const accentColor = summaryArena?.arena_color ?? 'var(--color-primary)'

    const displayStats = (() => {
        if (summaryArena) {
            const daysWithArena = monthData.daily_breakdown
                .map(day => ({ date: day.date, arena: day.arenas.find(a => a.arena_id === selectedArenaId) }))
                .filter((d): d is { date: string; arena: ArenaBreakdownType } => !!d.arena)

            const daysWithTasks = daysWithArena.filter(d => d.arena.total_tasks > 0).length
            const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
            const busiestDayTasks = daysWithArena.length > 0 ? Math.max(...daysWithArena.map(d => d.arena.total_tasks)) : 0
            const perfectDays = daysWithArena.filter(d => Math.round(d.arena.completion_percentage) === 100).length
            const avgTasksPerDay = summaryArena.total_tasks / daysInMonth
            const avgTimePerDay = summaryArena.total_hours / daysInMonth
            const mostProductiveDay = daysWithArena.reduce<{ date: string; completion_percentage: number; total_hours: number } | null>((best, d) => {
                if (d.arena.total_tasks === 0) return best
                if (!best || d.arena.completion_percentage > best.completion_percentage ||
                    (d.arena.completion_percentage === best.completion_percentage && d.arena.total_hours > best.total_hours))
                    return { date: d.date, completion_percentage: d.arena.completion_percentage, total_hours: d.arena.total_hours }
                return best
            }, null)

            return {
                completion_percentage: summaryArena.completion_percentage,
                completed_tasks: summaryArena.completed_tasks,
                total_tasks: summaryArena.total_tasks,
                total_duration_hours: summaryArena.total_hours,
                average_tasks_per_day: avgTasksPerDay,
                average_duration_per_day: avgTimePerDay,
                days_with_tasks: daysWithTasks,
                busiest_day_tasks: busiestDayTasks,
                perfect_days: perfectDays,
                most_productive_day: mostProductiveDay,
            }
        }
        return {
            completion_percentage: monthData.summary.completion_percentage,
            completed_tasks: monthData.summary.completed_tasks,
            total_tasks: monthData.summary.total_tasks,
            total_duration_hours: monthData.summary.total_duration_hours,
            average_tasks_per_day: monthData.summary.average_tasks_per_day,
            average_duration_per_day: monthData.summary.average_duration_per_day,
            days_with_tasks: monthData.summary.days_with_tasks,
            busiest_day_tasks: monthData.daily_breakdown.length > 0 ? Math.max(...monthData.daily_breakdown.map(d => d.total_tasks)) : 0,
            perfect_days: monthData.daily_breakdown.filter(d => Math.round(d.completion_percentage) === 100).length,
            most_productive_day: monthData.most_productive_day
                ? { date: monthData.most_productive_day.date, completion_percentage: monthData.most_productive_day.completion_percentage, total_hours: monthData.most_productive_day.total_hours }
                : null,
        }
    })()

    const prevCompletionPct = selectedArenaId
        ? prevMonthData?.summary.arenas.find(a => a.arena_id === selectedArenaId)?.completion_percentage ?? 0
        : prevMonthData?.summary.completion_percentage ?? 0
    const prevTotalHours = selectedArenaId
        ? prevMonthData?.summary.arenas.find(a => a.arena_id === selectedArenaId)?.total_hours ?? 0
        : prevMonthData?.summary.total_duration_hours ?? 0

    return (
        <DashboardLayout>
            <div className="month-page">
                {/* Header */}
                <div className="month-header">
                    <div className="month-nav-wrapper">
                        <div className="month-nav">
                            <button onClick={handlePrevMonth} aria-label="Previous month">←</button>
                            <span className="month-name">{getMonthName()}</span>
                            <button onClick={handleNextMonth} aria-label="Next month">→</button>
                        </div>
                        {!isCurrentMonth && (
                            <button className="today-btn" onClick={() => { setCurrentYear(new Date().getFullYear()); setCurrentMonth(new Date().getMonth() + 1); }}>
                                This Month
                            </button>
                        )}
                    </div>
                    <div className="header-actions">
                        <AddTaskButton onClick={() => setShowTaskInput(true)} />
                    </div>
                </div>

                {showTaskInput && (
                    <TaskInput
                        onTaskCreated={() => { setShowTaskInput(false); }}
                        onCancel={() => setShowTaskInput(false)}
                        onArenaChange={fetchMonthData}
                    />
                )}

                {/* Arena Filter */}
                <ArenaFilter
                    arenas={arenas.map(a => ({ id: a.arena_id, name: a.arena_name, color: a.arena_color }))}
                    selectedArenaId={selectedArenaId}
                    onSelect={setSelectedArenaId}
                />

                {/* 4-Section Grid */}
                <div className="month-content">
                    {/* Section 1: Heatmap */}
                    <div className={`heatmap-section${controlsVisible ? ' controls-visible' : ''}`} style={{ position: 'relative' }} onTouchEnd={handleHeatmapSectionTouch}>
                        <div className="heatmap-controls">
                            {/* Day numbers toggle */}
                            <button
                                className={`heatmap-share-btn ${showDates ? 'active' : ''}`}
                                onClick={() => setShowDates(v => !v)}
                                title="Toggle day numbers"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                            </button>
                            {/* Completion % toggle */}
                            <button
                                className={`heatmap-share-btn ${showPercentage ? 'active' : ''}`}
                                onClick={() => setShowPercentage(v => !v)}
                                title="Toggle completion %"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" />
                                </svg>
                            </button>
                            {/* Share */}
                            {user?.public_id && (
                                <div className="heatmap-share-wrapper" ref={shareRef} style={{ position: 'relative' }}>
                                    <button
                                        className={`heatmap-share-btn ${shareOpen ? 'active' : ''}`}
                                        onClick={() => setShareOpen(o => !o)}
                                        title="Share this month's heatmap"
                                    >
                                        {copied ? (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        ) : (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                                            </svg>
                                        )}
                                    </button>
                                    {shareOpen && (
                                        <div className="share-dropdown">
                                            <button className="share-dropdown-item" onClick={() => handleShareArena(null)}>
                                                All arenas
                                            </button>
                                            {arenas.map(arena => (
                                                <button key={arena.arena_id} className="share-dropdown-item" onClick={() => handleShareArena(arena.arena_id)}>
                                                    <span className="share-dropdown-dot" style={{ backgroundColor: arena.arena_color }} />
                                                    {arena.arena_name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <Heatmap
                            year={currentYear}
                            month={currentMonth}
                            data={monthData.daily_breakdown}
                            completion={selectedArena ? selectedArena.completion_percentage : monthData.summary.completion_percentage}
                            selectedArenaId={selectedArenaId}
                            onDayClick={handleDayClick}
                            showDates={showDates}
                            showPercentage={showPercentage}
                        />
                        <HeatmapLegend color={rgbColor} />
                    </div>

                    {/* Section 2: Monthly Arena Chart */}
                    <div className="chart-section">
                        <MonthlyArenaChart
                            dailyBreakdown={monthData.daily_breakdown}
                            year={currentYear}
                            month={currentMonth}
                            selectedArenaId={selectedArenaId}
                        />
                    </div>

                    {/* Section 4: Month Summary */}
                    <div className="month-summary">
                        <h2>Month Summary</h2>
                        <div className="summary-grid">

                            {/* Completion Rate */}
                            {(() => {
                                const delta = prevCompletionPct ? getDelta(displayStats.completion_percentage, prevCompletionPct) : null
                                return (
                                    <div className="summary-card">
                                        <div className="summary-card-icon" style={{ color: accentColor }}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                                            </svg>
                                        </div>
                                        <div className="summary-card-content">
                                            <div className="summary-card-value-row">
                                                <span className="summary-card-value">{Math.round(displayStats.completion_percentage)}%</span>
                                                {delta && (
                                                    <span
                                                        className={`summary-delta ${delta.positive ? 'positive' : 'negative'}`}
                                                        data-tooltip={delta.positive
                                                            ? `${Math.abs(delta.pct)}% higher completion rate vs last month`
                                                            : `${Math.abs(delta.pct)}% lower completion rate vs last month`}
                                                    >
                                                        {delta.positive ? '↑' : '↓'} {Math.abs(delta.pct)}%
                                                    </span>
                                                )}
                                            </div>
                                            <span className="summary-card-label">Completion Rate</span>
                                        </div>
                                    </div>
                                )
                            })()}

                            <div className="summary-card">
                                <div className="summary-card-icon" style={{ color: accentColor }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 11l3 3L22 4" />
                                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                    </svg>
                                </div>
                                <div className="summary-card-content">
                                    <span className="summary-card-value">{displayStats.completed_tasks}/{displayStats.total_tasks}</span>
                                    <span className="summary-card-label">Tasks Completed</span>
                                </div>
                            </div>

                            <div className="summary-card">
                                <div className="summary-card-icon" style={{ color: accentColor }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
                                    </svg>
                                </div>
                                <div className="summary-card-content">
                                    <span className="summary-card-value">{displayStats.busiest_day_tasks}</span>
                                    <span className="summary-card-label">Busiest Day Tasks</span>
                                </div>
                            </div>

                            <div className="summary-card">
                                <div className="summary-card-icon" style={{ color: accentColor }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                </div>
                                <div className="summary-card-content">
                                    <span className="summary-card-value">{displayStats.perfect_days}</span>
                                    <span className="summary-card-label">Perfect Days</span>
                                </div>
                            </div>

                            {/* Total Time */}
                            {(() => {
                                const delta = prevTotalHours ? getDelta(displayStats.total_duration_hours, prevTotalHours) : null
                                return (
                                    <div className="summary-card">
                                        <div className="summary-card-icon" style={{ color: accentColor }}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10" />
                                                <polyline points="12 6 12 12 16 14" />
                                            </svg>
                                        </div>
                                        <div className="summary-card-content">
                                            <div className="summary-card-value-row">
                                                <span className="summary-card-value">{displayStats.total_duration_hours.toFixed(1)}h</span>
                                                {delta && (
                                                    <span
                                                        className={`summary-delta ${delta.positive ? 'positive' : 'negative'}`}
                                                        data-tooltip={delta.positive
                                                            ? `${Math.abs(delta.diff).toFixed(1)}h more time logged vs last month`
                                                            : `${Math.abs(delta.diff).toFixed(1)}h less time logged vs last month`}
                                                    >
                                                        {delta.positive ? '↑' : '↓'} {Math.abs(delta.diff).toFixed(1)}h
                                                    </span>
                                                )}
                                            </div>
                                            <span className="summary-card-label">Total Time</span>
                                        </div>
                                    </div>
                                )
                            })()}

                            <div className="summary-card">
                                <div className="summary-card-icon" style={{ color: accentColor }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="12" y1="1" x2="12" y2="23" />
                                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                    </svg>
                                </div>
                                <div className="summary-card-content">
                                    <span className="summary-card-value">{displayStats.average_tasks_per_day.toFixed(1)}</span>
                                    <span className="summary-card-label">Avg Tasks/Day</span>
                                </div>
                            </div>

                            <div className="summary-card">
                                <div className="summary-card-icon" style={{ color: accentColor }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <polyline points="12 6 12 12 16 14" />
                                    </svg>
                                </div>
                                <div className="summary-card-content">
                                    <span className="summary-card-value">{displayStats.average_duration_per_day.toFixed(1)}h</span>
                                    <span className="summary-card-label">Avg Time/Day</span>
                                </div>
                            </div>

                            <div className="summary-card">
                                <div className="summary-card-icon" style={{ color: accentColor }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                        <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                                        <line x1="3" y1="10" x2="21" y2="10" />
                                    </svg>
                                </div>
                                <div className="summary-card-content">
                                    <span className="summary-card-value">{displayStats.days_with_tasks}</span>
                                    <span className="summary-card-label">Active Days</span>
                                </div>
                            </div>

                            {displayStats.most_productive_day && (
                                <div
                                    className="summary-card summary-card-highlight summary-card-clickable"
                                    onClick={() => handleDayClick(displayStats.most_productive_day!.date)}
                                >
                                    <div className="summary-card-icon" style={{ color: accentColor }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                        </svg>
                                    </div>
                                    <div className="summary-card-content">
                                        <span className="summary-card-value">
                                            {(() => {
                                                const [y, m, d] = displayStats.most_productive_day.date.split('-').map(Number)
                                                return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                            })()}
                                        </span>
                                        <span className="summary-card-label">Most Productive</span>
                                        <span className="summary-card-sub">{Math.round(displayStats.most_productive_day.completion_percentage)}% · {displayStats.most_productive_day.total_hours.toFixed(1)}h</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Section 3: Insights */}
                    <div className="stats-section">
                        {/* Section 5: Arena Breakdown */}
                        <ArenaBreakdown
                            arenas={monthData.summary.arenas}
                            prevArenas={prevMonthData?.summary.arenas}
                        />
                    </div>
                </div>
            </div>
            <FloatingAddButton onClick={() => setShowTaskInput(true)} />
        </DashboardLayout>
    );
};

export default MonthPage;