import { useState, useEffect, useMemo, useRef } from 'react';
import DashboardLayout from '../../components/DashBoardLayout';
import { productivityAPI } from '@/services/api';
import type { YearlyProductivity, ArenaBreakdown as ArenaBreakdownType } from '@/types';
import ArenaBreakdown from '@/components/arenaBreakdown/ArenaBreakdown'
import Heatmap from '@/components/heatmap/Heatmap';
import './YearPage.css';
import { useNavigate } from 'react-router-dom';
import { HeatmapLegend } from '@/components/heatmapLegend/HeatmapLegend';
import { hexToRgb } from '@/services/colorIntensity';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import AddTaskButton from '@/components/addTaskButton/AddTaskButton';
import FloatingAddButton from '@/components/floatingAddButton/FloatingAddButton';
import TaskInput from '@/components/taskinput/TaskInput';
import CompactHeatmap from '@/components/compactHeatmap/CompactHeatmap';
import type { StreakResponse } from '@/types';
import Streaks from '@/components/streaks/Streaks';
import ArenaFilter from '@/components/arenaFilter/ArenaFilter'
import { useAuth } from '@/context/authContext';

type ChartLayout = 'grouped' | 'stacked'
type ChartSortOrder = 'asc' | 'desc' | null

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
        <rect x="6" y="7" width="3" height="8" rx="1" />
        <rect x="11" y="3" width="3" height="12" rx="1" />
    </svg>
)
const IconSortDesc = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <rect x="1" y="3" width="3" height="12" rx="1" />
        <rect x="6" y="7" width="3" height="8" rx="1" />
        <rect x="11" y="11" width="3" height="4" rx="1" />
    </svg>
)

const sortChartArenas = (
    arenas: ArenaBreakdownType[],
    payload: Record<string, any>,
    sortOrder: ChartSortOrder
): ArenaBreakdownType[] => {
    if (!sortOrder) return arenas
    return [...arenas].sort((a, b) => {
        const va = payload[`arena_${a.arena_id}`] || 0
        const vb = payload[`arena_${b.arena_id}`] || 0
        return sortOrder === 'asc' ? va - vb : vb - va
    })
}

const makeYearGroupedShape = (
    visibleArenas: ArenaBreakdownType[],
    yMax: number,
    sortOrder: ChartSortOrder
) =>
    (props: any) => {
        const { x, y: chartTop, width, height: chartHeight, payload } = props
        if (!chartHeight || yMax <= 0) return <g />
        const chartBottom = chartTop + chartHeight
        const activeArenas = sortChartArenas(
            visibleArenas.filter(a => (payload[`arena_${a.arena_id}`] || 0) > 0),
            payload, sortOrder
        )
        if (activeArenas.length === 0) return <g />
        const gap = 2
        const barW = Math.min(28, Math.max(4, Math.floor((width - Math.max(0, (visibleArenas.length - 1) * gap)) / visibleArenas.length)))
        const totalW = activeArenas.length * barW + Math.max(0, (activeArenas.length - 1) * gap)
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
                        <path key={arena.arena_id}
                            d={`M ${barX + r} ${barY} h ${barW - 2 * r} q ${r} 0 ${r} ${r} v ${barH - r} h ${-barW} v ${-(barH - r)} q 0 ${-r} ${r} ${-r} z`}
                            fill={arena.arena_color}
                        />
                    )
                })}
            </g>
        )
    }

const makeYearStackedShape = (
    visibleArenas: ArenaBreakdownType[],
    yMax: number,
    sortOrder: ChartSortOrder
) =>
    (props: any) => {
        const { x, y: chartTop, width, height: chartHeight, payload } = props
        if (!chartHeight || yMax <= 0) return <g />
        const chartBottom = chartTop + chartHeight
        const activeArenas = sortChartArenas(
            visibleArenas.filter(a => (payload[`arena_${a.arena_id}`] || 0) > 0),
            payload, sortOrder
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
                            <path key={arena.arena_id}
                                d={`M ${x + r} ${segY} h ${width - 2 * r} q ${r} 0 ${r} ${r} v ${segH - r} h ${-width} v ${-(segH - r)} q 0 ${-r} ${r} ${-r} z`}
                                fill={arena.arena_color}
                            />
                        )
                    }
                    return <rect key={arena.arena_id} x={x} y={segY} width={width} height={segH} fill={arena.arena_color} />
                })}
            </g>
        )
    }

const YearChartTooltip = ({ active, payload, label, visibleArenas }: any) => {
    if (!active || !payload?.length) return null
    const dataPoint = payload[0]?.payload
    if (!dataPoint) return null
    const arenaData = (visibleArenas as ArenaBreakdownType[])
        .map(a => ({ arena: a, value: dataPoint[`arena_${a.arena_id}`] || 0 }))
        .filter(({ value }) => value > 0)
    const total = arenaData.reduce((sum, { value }) => sum + value, 0)
    return (
        <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '10px 14px', fontSize: '12px' }}>
            <p style={{ marginBottom: 6, fontWeight: 600, color: 'var(--color-text)' }}>{label}</p>
            {arenaData.map(({ arena, value }) => (
                <div key={arena.arena_id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: arena.arena_color, flexShrink: 0 }} />
                    <span style={{ color: 'var(--color-text-secondary)', flex: 1 }}>{arena.arena_name}</span>
                    <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>{value.toFixed(1)}h</span>
                </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', marginTop: 6, paddingTop: 6, fontWeight: 600, color: 'var(--color-text)' }}>
                <span>Total</span>
                <span>{total.toFixed(1)}h</span>
            </div>
        </div>
    )
}

const YearPage = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [yearData, setYearData] = useState<YearlyProductivity | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [selectedArenaId, setSelectedArenaId] = useState<number | null>(null);
    const [showTaskInput, setShowTaskInput] = useState(false)
    const [compactView, setCompactView] = useState(false)
    const [showDates, setShowDates] = useState(true)
    const [showPercentage, setShowPercentage] = useState(false)
    const [streaks, setStreaks] = useState<StreakResponse | null>(null)
    const [chartLayout, setChartLayout] = useState<ChartLayout>('grouped')
    const [chartSortOrder, setChartSortOrder] = useState<ChartSortOrder>(null)
    const effectiveChartSortOrder: ChartSortOrder = selectedArenaId ? null : chartSortOrder
    const [copied, setCopied] = useState(false)
    const [shareOpen, setShareOpen] = useState(false)
    const [viewOpen, setViewOpen] = useState(false)
    const shareRef = useRef<HTMLDivElement>(null)
    const viewRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!shareOpen) return
        const handler = (e: MouseEvent) => {
            if (shareRef.current && !shareRef.current.contains(e.target as Node))
                setShareOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [shareOpen])

    useEffect(() => {
        if (!viewOpen) return
        const handler = (e: MouseEvent) => {
            if (viewRef.current && !viewRef.current.contains(e.target as Node))
                setViewOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [viewOpen])

    const handleShareArena = (arenaId: number | null) => {
        if (!user?.public_id) return
        const base = `${window.location.origin}/u/${user.public_id}`
        const url = arenaId ? `${base}?arena=${arenaId}` : base
        navigator.clipboard.writeText(url)
        setCopied(true)
        setShareOpen(false)
        setTimeout(() => setCopied(false), 2000)
    }
    



    useEffect(() => {
        fetchYearData();
    }, [currentYear]);

    const fetchYearData = async () => {
        setLoading(true);
        try {
            const data = await productivityAPI.getYearly(currentYear);
            setYearData(data);
        } catch (err) {
            console.error('Failed to fetch year data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStreaks();
    }, []);

    useEffect(() => { setChartSortOrder(null) }, [selectedArenaId])

    const fetchStreaks = async () => {
        try {
            const data = await productivityAPI.getStreaks();
            setStreaks(data);
        } catch (err) {
            console.error('Failed to fetch streaks:', err);
        }
    };


    const handlePrevYear = () => setCurrentYear(currentYear - 1);
    const handleNextYear = () => setCurrentYear(currentYear + 1);

    const getMonthData = (month: number) => {
        if (!yearData) return [];
        return yearData.daily_breakdown.filter(day => {
            const [y, m] = day.date.split('-').map(Number)
            return y === currentYear && m === month;
        });
    };

    const getMonthName = (month: number) => {
        return new Date(currentYear, month - 1).toLocaleDateString('en-US', { month: 'long' });
    };

    const getMonthCompletion = (month: number): number => {
        const monthSummary = yearData?.months.find(m => m.month === month);
        if (!monthSummary) return 0;
        if (!selectedArenaId) return monthSummary.completion_percentage;
        const arena = monthSummary.arenas.find(a => a.arena_id === selectedArenaId);
        return arena?.completion_percentage ?? 0;
    };

    const getArenas = (): ArenaBreakdownType[] => {
        if (!yearData) return []
        const arenaMap = new Map<number, ArenaBreakdownType>()
        yearData.summary.arenas.forEach(arena => {
            if (!arenaMap.has(arena.arena_id)) arenaMap.set(arena.arena_id, arena)
        })
        return Array.from(arenaMap.values())
    }

    const getMonthlyChartData = () => {
        if (!yearData) return []
        const arenaList = getArenas()
        return yearData.months.map(m => {
            const point: Record<string, any> = {
                month: new Date(currentYear, m.month - 1).toLocaleDateString('en-US', { month: 'short' }),
                total: 0,
            }
            arenaList.forEach(arena => {
                const a = m.arenas.find(a => a.arena_id === arena.arena_id)
                const hours = a?.total_hours ?? 0
                point[`arena_${arena.arena_id}`] = hours
                point.total += hours
            })
            return point
        })
    }

    const handleDayClick = (date: string) => navigate(`/dashboard?date=${date}`);

    // Computed before early returns so hooks are never called conditionally
    const arenas = getArenas()
    const monthlyChartData = getMonthlyChartData()
    const visibleChartArenas = selectedArenaId
        ? arenas.filter(a => a.arena_id === selectedArenaId)
        : arenas
    const chartAverage = selectedArenaId
        ? monthlyChartData.reduce((sum, d) => sum + (d[`arena_${selectedArenaId}`] || 0), 0) / (monthlyChartData.length || 1)
        : monthlyChartData.reduce((sum, d) => sum + (d.total || 0), 0) / (monthlyChartData.length || 1)
    const chartVisibleMax = selectedArenaId
        ? Math.max(...monthlyChartData.map(d => d[`arena_${selectedArenaId}`] || 0), chartAverage)
        : chartLayout === 'grouped'
            ? Math.max(...monthlyChartData.flatMap(d => arenas.map(a => d[`arena_${a.arena_id}`] || 0)), chartAverage)
            : Math.max(...monthlyChartData.map(d => d.total || 0), chartAverage)
    const chartYMax = chartVisibleMax > 0 ? Math.ceil(chartVisibleMax) : 1
    const chartDataWithAnchor = monthlyChartData.map(p => ({ ...p, _yAnchor: chartYMax }))
    const chartGroupedShape = useMemo(
        () => makeYearGroupedShape(visibleChartArenas, chartYMax, effectiveChartSortOrder),
        [visibleChartArenas, chartYMax, effectiveChartSortOrder]
    )
    const chartStackedShape = useMemo(
        () => makeYearStackedShape(visibleChartArenas, chartYMax, effectiveChartSortOrder),
        [visibleChartArenas, chartYMax, effectiveChartSortOrder]
    )

    const summaryArena = selectedArenaId
        ? yearData?.summary.arenas.find(a => a.arena_id === selectedArenaId) ?? null
        : null

    const accentColor = summaryArena?.arena_color ?? 'var(--color-primary)'

    const displayStats = (() => {
        if (summaryArena && yearData) {
            const total_tasks = summaryArena.total_tasks
            const completed_tasks = summaryArena.completed_tasks
            const completion_percentage = total_tasks > 0 ? Math.round((completed_tasks / total_tasks) * 100) : 0
            const total_hours = summaryArena.total_hours
            const daysWithArena = yearData.daily_breakdown
                .map(day => ({ date: day.date, arena: day.arenas.find(a => a.arena_id === selectedArenaId) }))
                .filter((d): d is { date: string; arena: ArenaBreakdownType } => !!d.arena && d.arena.total_tasks > 0)
            const active_days = daysWithArena.length
            const active_months = yearData.months.filter(m => {
                const a = m.arenas.find(a => a.arena_id === selectedArenaId)
                return a && a.total_tasks > 0
            }).length
            const avg_tasks_per_active_day = active_days > 0 ? total_tasks / active_days : 0
            const monthsWithArena = yearData.months
                .map(m => ({ month: m.month, arena: m.arenas.find(a => a.arena_id === selectedArenaId) }))
                .filter((m): m is { month: number; arena: ArenaBreakdownType } => !!m.arena && m.arena.total_tasks > 0)
            const bestMonthEntry = monthsWithArena.length > 0
                ? monthsWithArena.reduce((best, m) => {
                    if (m.arena.completion_percentage > best.arena.completion_percentage) return m
                    if (m.arena.completion_percentage === best.arena.completion_percentage && m.arena.total_hours > best.arena.total_hours) return m
                    return best
                })
                : null
            const best_month = bestMonthEntry
                ? { month: bestMonthEntry.month, completion_percentage: Math.round(bestMonthEntry.arena.completion_percentage), subtitle: `${bestMonthEntry.arena.total_hours.toFixed(1)}h` }
                : null
            const bestDayEntry = daysWithArena.length > 0
                ? daysWithArena.reduce((best, d) => {
                    if (d.arena.completion_percentage > best.arena.completion_percentage) return d
                    if (d.arena.completion_percentage === best.arena.completion_percentage && d.arena.total_hours > best.arena.total_hours) return d
                    return best
                })
                : null
            const best_day = bestDayEntry
                ? { date: bestDayEntry.date, completion_percentage: Math.round(bestDayEntry.arena.completion_percentage), total_hours: bestDayEntry.arena.total_hours }
                : null
            return { completion_percentage, completed_tasks, total_tasks, total_hours, active_days, active_months, avg_tasks_per_active_day, best_month, best_day }
        }
        const total_hours = yearData?.months.reduce((sum, m) => sum + m.total_duration_hours, 0) ?? 0
        const active_days = yearData?.months.reduce((sum, m) => sum + m.days_with_tasks, 0) ?? 0
        const best_month_raw = yearData?.best_month ?? null
        const best_day_raw = yearData?.best_day ?? null
        return {
            completion_percentage: yearData?.summary.completion_percentage ?? 0,
            completed_tasks: yearData?.summary.completed_tasks ?? 0,
            total_tasks: yearData?.summary.total_tasks ?? 0,
            total_hours,
            active_days,
            active_months: yearData?.months.filter(m => m.total_tasks > 0).length ?? 0,
            avg_tasks_per_active_day: active_days > 0 ? (yearData?.summary.total_tasks ?? 0) / active_days : 0,
            best_month: best_month_raw ? { month: best_month_raw.month, completion_percentage: best_month_raw.completion_percentage, subtitle: `${best_month_raw.average_duration_per_day}h/day` } : null,
            best_day: best_day_raw,
        }
    })()

    if (loading) {
        return (
            <DashboardLayout>
                <div className="year-loading">
                    <div className="spinner-large" />
                    <p>Loading year data...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (!yearData) {
        return (
            <DashboardLayout>
                <div className="year-error"><p>Failed to load year data</p></div>
            </DashboardLayout>
        );
    }

    const selectedArena = arenas.find(a => a.arena_id === selectedArenaId)
    const rgbColor = selectedArena ? hexToRgb(selectedArena.arena_color) : undefined

    return (
        <DashboardLayout>
            <div className="year-page">
                {/* Header */}
                <div className="year-header">
                    <div className="year-nav center-button">
                        <button onClick={handlePrevYear} aria-label="Previous year">←</button>
                        <span className="year-name">{currentYear}</span>
                        <button onClick={handleNextYear} aria-label="Next year">→</button>
                    </div>
                    <div className="header-actions">
                        {user?.public_id && (
                            <div className="share-dropdown-wrapper" ref={shareRef}>
                                <button
                                    className={`compact-toggle ${shareOpen ? 'active' : ''}`}
                                    onClick={() => setShareOpen(o => !o)}
                                    title="Share heatmap"
                                >
                                    {copied ? (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    ) : (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                        <div className="share-dropdown-wrapper" ref={viewRef}>
                            <button
                                className={`compact-toggle ${viewOpen ? 'active' : ''}`}
                                onClick={() => setViewOpen(o => !o)}
                            >
                                View
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </button>
                            {viewOpen && (
                                <div className="share-dropdown view-dropdown">
                                    <button className={`view-dropdown-row${compactView ? ' view-dropdown-row--disabled' : ''}`} onClick={() => !compactView && setShowDates(v => !v)}>
                                        <span>Day numbers</span>
                                        {showDates && !compactView && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                                    </button>
                                    <button className={`view-dropdown-row${compactView ? ' view-dropdown-row--disabled' : ''}`} onClick={() => !compactView && setShowPercentage(v => !v)}>
                                        <span>Completion %</span>
                                        {showPercentage && !compactView && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                                    </button>
                                    <button className="view-dropdown-row" onClick={() => setCompactView(v => !v)}>
                                        <span>Compact view</span>
                                        {compactView && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                                    </button>
                                </div>
                            )}
                        </div>
                        <AddTaskButton onClick={() => setShowTaskInput(true)} />
                    </div>
                </div>
                {showTaskInput && (
                    <TaskInput
                        onTaskCreated={() => { setShowTaskInput(false); }}
                        onCancel={() => setShowTaskInput(false)}
                        onArenaChange={() => { fetchYearData(); fetchStreaks(); }}
                    />
                )}
                {/* 12 Month Heatmaps */}
                {compactView ? (
                    <CompactHeatmap
                        year={currentYear}
                        data={yearData.daily_breakdown}
                        arenas={arenas}
                    />
                ) : (<>
                        <ArenaFilter
                            arenas={arenas.map(a => ({ id: a.arena_id, name: a.arena_name, color: a.arena_color }))}
                            selectedArenaId={selectedArenaId}
                            onSelect={setSelectedArenaId}
                        />
                        <div>
                            <div className="year-heatmaps-scroll">
                                <div className="year-heatmaps">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
                                        <div key={month} className="month-heatmap-card">
                                            <Heatmap
                                                year={currentYear}
                                                month={month}
                                                data={getMonthData(month)}
                                                completion={getMonthCompletion(month)}
                                                selectedArenaId={selectedArenaId}
                                                onDayClick={handleDayClick}
                                                showDates={showDates}
                                                showPercentage={showPercentage}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <HeatmapLegend color={rgbColor} />
                        </div>                
                    </>
                )}
                {/* Monthly Arena Chart */}
                <div className="year-chart-section year-chart-section--standalone">
                    <div className="year-chart-header">
                        <div className="year-chart-title-row">
                            <h2>Monthly Hours by Arena</h2>
                            <div className="year-chart-control-group">
                                {!selectedArenaId && (
                                    <>
                                        <button
                                            className={`year-chart-icon-btn ${effectiveChartSortOrder === 'asc' ? 'active' : ''}`}
                                            onClick={() => setChartSortOrder(s => s === 'asc' ? null : 'asc')}
                                            title="Sort ascending"
                                        >
                                            <IconSortAsc />
                                        </button>
                                        <button
                                            className={`year-chart-icon-btn ${effectiveChartSortOrder === 'desc' ? 'active' : ''}`}
                                            onClick={() => setChartSortOrder(s => s === 'desc' ? null : 'desc')}
                                            title="Sort descending"
                                        >
                                            <IconSortDesc />
                                        </button>
                                        <div className="year-chart-control-divider" />
                                    </>
                                )}
                                <button
                                    className={`year-chart-icon-btn ${chartLayout === 'grouped' ? 'active' : ''}`}
                                    onClick={() => setChartLayout('grouped')}
                                    title="Grouped"
                                >
                                    <IconGrouped />
                                </button>
                                <button
                                    className={`year-chart-icon-btn ${chartLayout === 'stacked' ? 'active' : ''}`}
                                    onClick={() => setChartLayout('stacked')}
                                    title="Stacked"
                                >
                                    <IconStacked />
                                </button>
                            </div>
                        </div>
                    </div>
                    {arenas.length === 0 ? (
                        <div className="year-chart-empty">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 20V10M12 20V4M6 20v-6" />
                            </svg>
                            <p className="year-chart-empty-title">No time logged this year</p>
                            <p className="year-chart-empty-sub">Track time on tasks to see your monthly breakdown</p>
                        </div>
                    ) : (
                    <div className="year-bar-chart" onMouseDown={e => e.preventDefault()}>
                        <div className="year-bar-chart-inner">
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={chartDataWithAnchor} margin={{ top: 16, right: 0, left: 0, bottom: 0 }} barCategoryGap="20%">
                                <XAxis
                                    dataKey="month"
                                    tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    domain={[0, chartYMax]}
                                    tickFormatter={(v) => `${v}h`}
                                    tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={35}
                                />
                                <Tooltip content={(props) => <YearChartTooltip {...props} visibleArenas={visibleChartArenas} />} cursor={false} />
                                {chartAverage > 0 && (
                                    <ReferenceLine
                                        y={chartAverage}
                                        stroke="var(--color-text-muted)"
                                        strokeDasharray="4 4"
                                        strokeWidth={1.5}
                                        label={{
                                            value: `avg ${chartAverage.toFixed(1)}h`,
                                            position: 'insideTopRight',
                                            fontSize: 11,
                                            fill: 'var(--color-text-muted)',
                                        }}
                                    />
                                )}
                                <Bar
                                    dataKey="_yAnchor"
                                    shape={chartLayout === 'grouped' ? chartGroupedShape : chartStackedShape}
                                    activeBar={false}
                                    background={false}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                        </div>
                    </div>
                    )}
                </div>

                <div className='streaks-and-year-overview'>
                    {/* Streaks */}
                        {streaks && <Streaks streaks={streaks} />}
                        <div className="year-chart-section">
                            <ArenaBreakdown arenas={yearData.summary.arenas} />
                        </div>

                        {/* Year Overview Stats */}
                        <div className="year-overview">
                            <h2 className="year-overview-title">Year Summary</h2>
                            <div className="overview-card overview-card-large">
                                <div className="overview-card-icon" style={{ color: accentColor }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <polyline points="9 12 11 14 15 10" />
                                    </svg>
                                </div>
                                <div className="overview-card-content">
                                    <span className="overview-card-value">{displayStats.completion_percentage}%</span>
                                    <span className="overview-card-label">Year Completion Rate</span>
                                </div>
                            </div>

                            <div className="overview-card overview-card-large">
                                <div className="overview-card-icon" style={{ color: accentColor }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                        <line x1="16" y1="2" x2="16" y2="6" />
                                        <line x1="8" y1="2" x2="8" y2="6" />
                                        <line x1="3" y1="10" x2="21" y2="10" />
                                        <polyline points="9 15 11 17 15 13" />
                                    </svg>
                                </div>
                                <div className="overview-card-content">
                                    <span className="overview-card-value">{displayStats.active_days}</span>
                                    <span className="overview-card-label">Active Days</span>
                                </div>
                            </div>

                            <div className="overview-card">
                                <div className="overview-card-icon" style={{ color: accentColor }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 11l3 3L22 4" />
                                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                    </svg>
                                </div>
                                <div className="overview-card-content">
                                    <span className="overview-card-value">{displayStats.completed_tasks}/{displayStats.total_tasks}</span>
                                    <span className="overview-card-label">Tasks Completed</span>
                                </div>
                            </div>

                            <div className="overview-card">
                                <div className="overview-card-icon" style={{ color: accentColor }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <polyline points="12 6 12 12 16 14" />
                                    </svg>
                                </div>
                                <div className="overview-card-content">
                                    <span className="overview-card-value">{displayStats.total_hours.toFixed(1)}h</span>
                                    <span className="overview-card-label">Total Hours Spent</span>
                                </div>
                            </div>

                            <div className="overview-card">
                                <div className="overview-card-icon" style={{ color: accentColor }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                        <line x1="16" y1="2" x2="16" y2="6" />
                                        <line x1="8" y1="2" x2="8" y2="6" />
                                        <line x1="3" y1="10" x2="21" y2="10" />
                                    </svg>
                                </div>
                                <div className="overview-card-content">
                                    <span className="overview-card-value">{displayStats.active_months}/12</span>
                                    <span className="overview-card-label">Active Months</span>
                                </div>
                            </div>

                            <div className="overview-card">
                                <div className="overview-card-icon" style={{ color: accentColor }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="20" x2="18" y2="10" />
                                        <line x1="12" y1="20" x2="12" y2="4" />
                                        <line x1="6" y1="20" x2="6" y2="14" />
                                    </svg>
                                </div>
                                <div className="overview-card-content">
                                    <span className="overview-card-value">{displayStats.avg_tasks_per_active_day.toFixed(1)}</span>
                                    <span className="overview-card-label">Avg Tasks / Active Day</span>
                                </div>
                            </div>

                            {displayStats.best_month && (
                                <div
                                    className="overview-card overview-card-highlight overview-card-clickable"
                                    style={summaryArena ? { '--overview-highlight-bg': `${summaryArena.arena_color}14`, '--overview-highlight-border': `${summaryArena.arena_color}35` } as React.CSSProperties : undefined}
                                    onClick={() => navigate(`/dashboard/month?year=${currentYear}&month=${displayStats.best_month!.month}${selectedArenaId ? `&arena=${selectedArenaId}` : ''}`)}
                                >
                                    <div className="overview-card-icon" style={{ color: accentColor }}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                        </svg>
                                    </div>
                                    <div className="overview-card-content">
                                        <span className="overview-card-value">{getMonthName(displayStats.best_month.month)}</span>
                                        <span className="overview-card-label">Best Month · {displayStats.best_month.completion_percentage}% · {displayStats.best_month.subtitle}</span>
                                    </div>
                                </div>
                            )}

                            {displayStats.best_day && (
                                <div
                                    className="overview-card overview-card-highlight overview-card-clickable"
                                    style={summaryArena ? { '--overview-highlight-bg': `${summaryArena.arena_color}14`, '--overview-highlight-border': `${summaryArena.arena_color}35` } as React.CSSProperties : undefined}
                                    onClick={() => navigate(`/dashboard?date=${displayStats.best_day!.date}`)}
                                >
                                    <div className="overview-card-icon" style={{ color: accentColor }}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                        </svg>
                                    </div>
                                    <div className="overview-card-content">
                                        <span className="overview-card-value">
                                            {(() => {
                                                const [y, m, d] = displayStats.best_day!.date.split('-').map(Number)
                                                return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                            })()}
                                        </span>
                                        <span className="overview-card-label">Best Day · {displayStats.best_day.completion_percentage}% · {displayStats.best_day.total_hours.toFixed(1)}h</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            <FloatingAddButton onClick={() => setShowTaskInput(true)} />
        </DashboardLayout>
    );
};

export default YearPage;