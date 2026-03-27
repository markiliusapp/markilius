import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashBoardLayout';
import { productivityAPI } from '@/services/api';
import type { WeeklyProductivityResponse, DailyBreakDownWithTasks, TaskResponse } from '@/types';
import IndividualTask from '@/components/individualTask/IndividualTask';
import './WeekPage.css';
import { useNavigate } from 'react-router-dom';
import AddTaskButton from '@/components/addTaskButton/AddTaskButton';
import FloatingAddButton from '@/components/floatingAddButton/FloatingAddButton';
import TaskInput from '@/components/taskinput/TaskInput';
import WeeklyChart from '@/components/weeklyChart/WeeklyChart'
import ArenaBreakdown from '@/components/arenaBreakdown/ArenaBreakdown'
import ArenaFilter from '@/components/arenaFilter/ArenaFilter'
import WeekNavStrip from '@/components/weekNavStrip/WeekNavStrip'


const WeekPage = () => {
    const navigate = useNavigate()
    const [weekData, setWeekData] = useState<WeeklyProductivityResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentSunday, setCurrentSunday] = useState<string>(getSundayOfWeek(new Date()));
    const [refreshKey, setRefreshKey] = useState(0);
    const [showTaskInput, setShowTaskInput] = useState(false)
    const [prevWeekData, setPrevWeekData] = useState<WeeklyProductivityResponse | null>(null)
    const [selectedArenaId, setSelectedArenaId] = useState<number | null>(null)
    const [compact, setCompact] = useState(() => localStorage.getItem('taskCompact') === 'true')
    const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())

    const toggleSection = (key: string) => {
        setCollapsedSections(prev => {
            const next = new Set(prev)
            next.has(key) ? next.delete(key) : next.add(key)
            return next
        })
    }



    useEffect(() => {
        fetchWeekData();
    }, [currentSunday, refreshKey]);

    const getPrevSunday = (sunday: string): string => {
        const [year, month, day] = sunday.split('-').map(Number)
        const date = new Date(year, month - 1, day)
        date.setDate(date.getDate() - 7)
        return date.toLocaleDateString('en-CA')
    }

    function getSundayOfWeek(date: Date): string {
        const d = new Date(date);
        const day = d.getDay();           
        const diff = (day === 0 ? 0 : day); // days to subtract to reach Sunday
        d.setDate(d.getDate() - diff);
        return d.toLocaleDateString('en-CA');
    }

    const fetchWeekData = async () => {
        setLoading(true);
        try {
            const [current, prev] = await Promise.all([
                productivityAPI.getWeekly(currentSunday),
                productivityAPI.getWeekly(getPrevSunday(currentSunday)),
            ])
            setWeekData(current)
            setPrevWeekData(prev)
        } catch (err) {
            console.error('Failed to fetch week data:', err);
        } finally {
            setLoading(false);
        }
    };

    const getDelta = (current: number, previous: number) => {
        if (previous === 0) return null
        const diff = current - previous
        const pct = Math.round((diff / previous) * 100)
        return { diff, pct, positive: diff >= 0 }
    }

    const handlePrevWeek = () => {
        const [year, month, day] = currentSunday.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        date.setDate(date.getDate() - 7);
        setCurrentSunday(date.toLocaleDateString('en-CA'));
    };

    const handleNextWeek = () => {
        const [year, month, day] = currentSunday.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        date.setDate(date.getDate() + 7);
        setCurrentSunday(date.toLocaleDateString('en-CA'));
    };

    const handleToggle = () => {
        setRefreshKey(prev => prev + 1);
    };

    const getArenas = () => {
        const map = new Map<number, { id: number; name: string; color: string }>()
        weekData?.daily_breakdown.forEach(day => {
            ;[...day.incomplete, ...day.completed].forEach(task => {
                if (task.arena && !map.has(task.arena.id))
                    map.set(task.arena.id, { id: task.arena.id, name: task.arena.name, color: task.arena.color })
            })
        })
        return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
    }

    const getDayStats = (day: DailyBreakDownWithTasks) => {
        if (selectedArenaId) {
            const arena = day.arenas.find(a => a.arena_id === selectedArenaId)
            if (!arena) return null
            return {
                completion_percentage: arena.completion_percentage,
                completed_tasks: arena.completed_tasks,
                total_tasks: arena.total_tasks,
                color: arena.arena_color,
            }
        }
        return {
            completion_percentage: day.completion_percentage,
            completed_tasks: day.completed_tasks,
            total_tasks: day.total_tasks,
            color: 'var(--color-primary)',
        }
    }

    const filterAndSort = (tasks: TaskResponse[]) => {
        if (selectedArenaId) return tasks.filter(t => t.arena?.id === selectedArenaId)
        return [...tasks].sort((a, b) => (a.arena?.name ?? '').localeCompare(b.arena?.name ?? ''))
    }

    const getDayName = (dateStr: string, useToday = false) => {
        if (useToday && dateStr === new Date().toLocaleDateString('en-CA')) return 'Today'
        const [year, month, day] = dateStr.split('-').map(Number)
        const date = new Date(year, month - 1, day)
        return date.toLocaleDateString('en-US', { weekday: 'short' })
    }

    const getDayNumber = (dateStr: string) => {
        return parseInt(dateStr.split('-')[2])
    }

    const formatNavDate = (dateStr: string, options: Intl.DateTimeFormatOptions) => {
        const [year, month, day] = dateStr.split('-').map(Number)
        return new Date(year, month - 1, day).toLocaleDateString('en-US', options)
    }

    const formatWeekLabel = (): string => {
        const thisWeek = getSundayOfWeek(new Date())
        const lastWeek = getPrevSunday(thisWeek)
        if (currentSunday === thisWeek) return 'This Week'
        if (currentSunday === lastWeek) return 'Last Week'
        if (!weekData) return ''
        return `${formatNavDate(weekData.start_date, { month: 'short', day: 'numeric' })} – ${formatNavDate(weekData.end_date, { month: 'short', day: 'numeric', year: 'numeric' })}`
    }

    const summaryArena = selectedArenaId
        ? weekData?.summary.arenas.find(a => a.arena_id === selectedArenaId) ?? null
        : null

    const displayStats = (() => {
        if (summaryArena && weekData) {
            const total_tasks = summaryArena.total_tasks
            const completed_tasks = summaryArena.completed_tasks
            const completion_percentage = total_tasks > 0 ? Math.round((completed_tasks / total_tasks) * 100) : 0
            const total_duration_hours = summaryArena.total_hours
            const average_tasks_per_day = total_tasks / 7
            const average_duration_per_day = total_duration_hours / 7
            const daysWithArena = weekData.daily_breakdown
                .map(day => ({ date: day.date, arena: day.arenas.find(a => a.arena_id === selectedArenaId) }))
                .filter((d): d is { date: string; arena: NonNullable<typeof d.arena> } => !!d.arena)
            const days_with_tasks = daysWithArena.filter(d => d.arena.total_tasks > 0).length
            const mostProd = daysWithArena.length > 0
                ? daysWithArena.reduce((best, d) => {
                    if (d.arena.completion_percentage > best.arena.completion_percentage) return d
                    if (d.arena.completion_percentage === best.arena.completion_percentage && d.arena.total_hours > best.arena.total_hours) return d
                    return best
                })
                : null
            const most_productive_day = mostProd
                ? { date: mostProd.date, completion_percentage: Math.round(mostProd.arena.completion_percentage), total_hours: mostProd.arena.total_hours }
                : null
            return { completion_percentage, completed_tasks, total_tasks, total_duration_hours, average_tasks_per_day, average_duration_per_day, days_with_tasks, most_productive_day }
        }
        return {
            completion_percentage: weekData?.summary.completion_percentage ?? 0,
            completed_tasks: weekData?.summary.completed_tasks ?? 0,
            total_tasks: weekData?.summary.total_tasks ?? 0,
            total_duration_hours: weekData?.summary.total_duration_hours ?? 0,
            average_tasks_per_day: weekData?.summary.average_tasks_per_day ?? 0,
            average_duration_per_day: weekData?.summary.average_duration_per_day ?? 0,
            days_with_tasks: weekData?.summary.days_with_tasks ?? 0,
            most_productive_day: weekData?.most_productive_day ?? null,
        }
    })()

    const accentColor = summaryArena?.arena_color ?? 'var(--color-primary)'

    const prevSummaryArena = selectedArenaId
        ? prevWeekData?.summary.arenas.find(a => a.arena_id === selectedArenaId) ?? null
        : null

    const prevCompletionPct = prevSummaryArena
        ? prevSummaryArena.total_tasks > 0 ? Math.round((prevSummaryArena.completed_tasks / prevSummaryArena.total_tasks) * 100) : 0
        : prevWeekData?.summary.completion_percentage ?? 0

    const prevTotalHours = prevSummaryArena
        ? prevSummaryArena.total_hours
        : prevWeekData?.summary.total_duration_hours ?? 0

    if (loading) {
        return (
            <DashboardLayout>
                <div className="week-loading">
                    <div className="spinner-large" />
                    <p>Loading week data...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (!weekData) {
        return (
            <DashboardLayout>
                <div className="week-error">
                    <p>Failed to load week data</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="week-page">
                {/* Header */}
                <div className="week-header">
                    <WeekNavStrip
                        currentSunday={currentSunday}
                        onSelectWeek={setCurrentSunday}
                        selectedArenaId={selectedArenaId}
                        refreshKey={refreshKey}
                    />
                    <div className="header-actions">
                        <button className={`compact-toggle ${compact ? 'active' : ''}`} onClick={() => setCompact(v => { localStorage.setItem('taskCompact', String(!v)); return !v })} title={compact ? 'Expand' : 'Compact'}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                {compact ? (
                                    /* expand: card icon */
                                    <>
                                        <rect x="3" y="3" width="18" height="18" rx="2" />
                                        <line x1="7" y1="9" x2="17" y2="9" />
                                        <line x1="7" y1="13" x2="13" y2="13" />
                                    </>
                                ) : (
                                    /* compact: list icon */
                                    <>
                                        <line x1="3" y1="6" x2="21" y2="6" />
                                        <line x1="3" y1="12" x2="21" y2="12" />
                                        <line x1="3" y1="18" x2="21" y2="18" />
                                    </>
                                )}
                            </svg>
                        </button>
                        <AddTaskButton onClick={() => setShowTaskInput(true)} />
                    </div>
                </div>

                {showTaskInput && (
                    <TaskInput
                        onTaskCreated={() => { setShowTaskInput(false); setRefreshKey(prev => prev + 1); }}
                        onCancel={() => setShowTaskInput(false)}
                        onArenaChange={() => setRefreshKey(prev => prev + 1)}
                    />
                )}

                {/* Arena Filter */}
                <ArenaFilter
                    arenas={getArenas()}
                    selectedArenaId={selectedArenaId}
                    onSelect={setSelectedArenaId}
                />

                {/* 7 Day Columns */}
                <div className="week-grid-wrapper">
                    <div className="week-grid">
                        {weekData.daily_breakdown.map((day) => {
                            const dayStats = getDayStats(day)
                            const accentColor = dayStats?.color
                                ?? weekData.summary.arenas.find(a => a.arena_id === selectedArenaId)?.arena_color
                                ?? 'var(--color-primary)'
                            return (
                            <div
                                key={day.date}
                                className={`day-column ${day.date === new Date().toLocaleDateString('en-CA') ? 'day-column-today' : ''}`}
                            >
                                {/* Day Header */}
                                <div className="day-header" onClick={() => navigate(`/dashboard?date=${day.date}`)}>
                                    <div className="day-header-top">
                                        <span className="day-name">{getDayName(day.date, true)}</span>
                                        <span className="day-number">{getDayNumber(day.date)}</span>
                                    </div>
                                    <div className="day-stats-mini">
                                        <span className="day-completion" style={{ color: accentColor }}>
                                            {Math.round(dayStats?.completion_percentage ?? 0)}%
                                        </span>
                                        {dayStats && <span className="day-count">{dayStats.completed_tasks}/{dayStats.total_tasks}</span>}
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="day-progress-bar">
                                    {dayStats && (
                                        <div
                                            className="day-progress-fill"
                                            style={{ width: `${dayStats.completion_percentage}%`, backgroundColor: accentColor }}
                                        />
                                    )}
                                </div>

                                {/* Tasks */}
                                <div className="day-tasks">
                                    {/* Incomplete tasks */}
                                    {(() => {
                                        const tasks = filterAndSort(day.incomplete)
                                        if (tasks.length === 0) return null
                                        const key = `${day.date}-active`
                                        const collapsed = collapsedSections.has(key)
                                        return (
                                            <div className="day-tasks-section">
                                                <div className="day-tasks-header day-tasks-header-toggle" onClick={() => toggleSection(key)}>
                                                    <span className="day-tasks-label">Active</span>
                                                    <div className="day-tasks-header-right">
                                                        <svg className={`day-tasks-chevron ${collapsed ? 'collapsed' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="6 9 12 15 18 9" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                {!collapsed && (
                                                    <div className="day-tasks-list">
                                                        {tasks.map(task => (
                                                            <IndividualTask key={task.id} task={task} onToggle={handleToggle} compact={compact} />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })()}

                                    {/* Completed tasks */}
                                    {(() => {
                                        const tasks = filterAndSort(day.completed)
                                        if (tasks.length === 0) return null
                                        const key = `${day.date}-completed`
                                        const collapsed = collapsedSections.has(key)
                                        return (
                                            <div className="day-tasks-section">
                                                <div className="day-tasks-header day-tasks-header-toggle" onClick={() => toggleSection(key)}>
                                                    <span className="day-tasks-label">Completed</span>
                                                    <div className="day-tasks-header-right">
                                                        <svg className={`day-tasks-chevron ${collapsed ? 'collapsed' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="6 9 12 15 18 9" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                {!collapsed && (
                                                    <div className="day-tasks-list">
                                                        {tasks.map(task => (
                                                            <IndividualTask key={task.id} task={task} onToggle={handleToggle} compact={compact} />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })()}

                                    {/* Empty state */}
                                    {filterAndSort(day.incomplete).length === 0 && filterAndSort(day.completed).length === 0 && (
                                        <div className="day-empty">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <circle cx="12" cy="12" r="10" opacity="0.3" />
                                            </svg>
                                            <p>No tasks</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )})}
                    </div>
                </div>
                <div className='week-stats-section'>
                    <WeeklyChart
                        dailyBreakdown={weekData.daily_breakdown}
                        averageDuration={weekData.summary.average_duration_per_day}
                        selectedArenaId={selectedArenaId}
                    />
                    <div className="week-chart-section">
                        <ArenaBreakdown
                            arenas={weekData.summary.arenas}
                            prevArenas={prevWeekData?.summary.arenas}
                        />
                    </div>
                    {/* Week Summary Stats */}
                    <div className="week-summary">
                        <h2>Week Summary</h2>

                        <div className="summary-grid">
                            {/* Completion Rate */}
                            {(() => {
                                const delta = prevWeekData
                                    ? getDelta(displayStats.completion_percentage, prevCompletionPct)
                                    : null
                                return (
                                    <div className="summary-card">
                                        <div className="summary-card-icon" style={{ color: accentColor }}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                                            </svg>
                                        </div>
                                        <div className="summary-card-content">
                                            <div className="summary-card-value-row">
                                                <span className="summary-card-value">{displayStats.completion_percentage}%</span>
                                                {delta && (
                                                    <span
                                                        className={`summary-delta ${delta.positive ? 'positive' : 'negative'}`}
                                                        data-tooltip={delta.positive
                                                            ? `${Math.abs(delta.pct)}% higher completion rate vs last week`
                                                            : `${Math.abs(delta.pct)}% lower completion rate vs last week`}
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

                            {/* Tasks Completed */}
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

                            {/* Total Time */}
                            {(() => {
                                const delta = prevWeekData
                                    ? getDelta(displayStats.total_duration_hours, prevTotalHours)
                                    : null
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
                                                            ? `${Math.abs(delta.diff).toFixed(1)}h more time logged vs last week`
                                                            : `${Math.abs(delta.diff).toFixed(1)}h less time logged vs last week`}
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

                            {/* Avg Tasks/Day */}
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

                            {/* Active Days */}
                            <div className="summary-card">
                                <div className="summary-card-icon" style={{ color: accentColor }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                        <line x1="16" y1="2" x2="16" y2="6" />
                                        <line x1="8" y1="2" x2="8" y2="6" />
                                        <line x1="3" y1="10" x2="21" y2="10" />
                                    </svg>
                                </div>
                                <div className="summary-card-content">
                                    <span className="summary-card-value">{displayStats.days_with_tasks}</span>
                                    <span className="summary-card-label">Active Days</span>
                                </div>
                            </div>

                            {/* Best Day */}
                            {displayStats.most_productive_day && (
                                <div
                                    className="summary-card summary-card-highlight summary-card-clickable"
                                    onClick={() => navigate(`/dashboard?date=${displayStats.most_productive_day!.date}`)}
                                >
                                    <div className="summary-card-icon" style={{ color: accentColor }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                        </svg>
                                    </div>
                                    <div className="summary-card-content">
                                        <span className="summary-card-value">
                                            {getDayName(displayStats.most_productive_day.date)}
                                        </span>
                                        <span className="summary-card-label">Best Day</span>
                                        <span className="summary-card-sub">{displayStats.most_productive_day.completion_percentage}% · {displayStats.most_productive_day.total_hours.toFixed(1)}h</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <FloatingAddButton onClick={() => setShowTaskInput(true)} />
        </DashboardLayout>
    );
};

export default WeekPage;