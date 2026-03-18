import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashBoardLayout';
import { productivityAPI } from '@/services/api';
import type { YearlyProductivity, ArenaBreakdown as ArenaBreakdownType } from '@/types';
import ArenaBreakdown from '@/components/arenaBreakdown/ArenaBreakdown'
import Heatmap from '@/components/heatmap/Heatmap';
import './YearPage.css';
import { useNavigate } from 'react-router-dom';
import { HeatmapLegend } from '@/components/heatmapLegend/HeatmapLegend';
import { hexToRgb } from '@/services/colorIntensity';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import AddTaskButton from '@/components/addTaskButton/AddTaskButton';
import TaskInput from '@/components/taskinput/TaskInput';
import CompactHeatmap from '@/components/compactHeatmap/CompactHeatmap';
import type { StreakResponse } from '@/types';
import Streaks from '@/components/streaks/Streaks';
import ArenaFilter from '@/components/arenaFilter/ArenaFilter'

const YearChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null
    const total = payload.reduce((sum: number, p: any) => sum + (p.value || 0), 0)
    return (
        <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '10px 14px', fontSize: '12px' }}>
            <p style={{ marginBottom: 6, fontWeight: 600, color: 'var(--color-text)' }}>{label}</p>
            {payload.map((p: any) => p.value > 0 && (
                <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: p.fill, flexShrink: 0 }} />
                    <span style={{ color: 'var(--color-text-secondary)', flex: 1 }}>{p.name}</span>
                    <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>{p.value.toFixed(1)}h</span>
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
    const [yearData, setYearData] = useState<YearlyProductivity | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [selectedArenaId, setSelectedArenaId] = useState<number | null>(null);
    const [showTaskInput, setShowTaskInput] = useState(false)
    const [compactView, setCompactView] = useState(false)
    const [streaks, setStreaks] = useState<StreakResponse | null>(null)
    



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
            }
            arenaList.forEach(arena => {
                const a = m.arenas.find(a => a.arena_id === arena.arena_id)
                point[`arena_${arena.arena_id}`] = a?.total_hours ?? 0
            })
            return point
        })
    }

    const handleDayClick = (date: string) => navigate(`/dashboard?date=${date}`);

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

    const arenas = getArenas()
    const monthlyChartData = getMonthlyChartData()
    const selectedArena = arenas.find(a => a.arena_id === selectedArenaId)
    const rgbColor = selectedArena ? hexToRgb(selectedArena.arena_color) : undefined

    return (
        <DashboardLayout>
            <div className="year-page">
                {/* Header */}
                <div className="year-header">
                    <h1>Current Year</h1>
                    <div className="year-nav center-button">
                        <button onClick={handlePrevYear} aria-label="Previous year">←</button>
                        <span className="year-name">{currentYear}</span>
                        <button onClick={handleNextYear} aria-label="Next year">→</button>
                    </div>
                    <div className="header-actions">
                        <button className={`compact-toggle ${compactView ? 'active' : ''}`} onClick={() => setCompactView(!compactView)} title={compactView ? 'Expand' : 'Compact'}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                {compactView ? (
                                    <>
                                        <rect x="3" y="3" width="18" height="18" rx="2" />
                                        <line x1="7" y1="9" x2="17" y2="9" />
                                        <line x1="7" y1="13" x2="13" y2="13" />
                                    </>
                                ) : (
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
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="heatmap-legend">
                                <HeatmapLegend color={rgbColor} />
                            </div>
                        </div>                
                    </>
                )}
                {/* Monthly Arena Chart */}
                <div className="year-chart-section year-chart-section--standalone">
                    <div className="year-chart-header">
                        <h2>Monthly Hours by Arena</h2>
                        <div className="year-chart-legend">
                            {arenas.map(arena => (
                                <div key={arena.arena_id} className="year-chart-legend-item">
                                    <span className="year-chart-legend-dot" style={{ backgroundColor: arena.arena_color }} />
                                    <span>{arena.arena_name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="year-bar-chart">
                        <ResponsiveContainer width="100%" height="100%" minHeight={250}>
                            <BarChart data={monthlyChartData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }} barCategoryGap="30%">
                                <XAxis
                                    dataKey="month"
                                    tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tickFormatter={(v) => `${v}h`}
                                    tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={35}
                                />
                                <Tooltip content={<YearChartTooltip />} cursor={false} />
                                {arenas.map((arena, idx) => (
                                    <Bar
                                        key={arena.arena_id}
                                        dataKey={`arena_${arena.arena_id}`}
                                        name={arena.arena_name}
                                        stackId="a"
                                        fill={arena.arena_color}
                                        radius={idx === arenas.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                                    />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
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
                                <div className="overview-card-content">
                                    <span className="overview-card-value">{yearData.summary.completion_percentage}%</span>
                                    <span className="overview-card-label">Year Completion Rate</span>
                                </div>
                            </div>

                            <div className="overview-card overview-card-large">
                                <div className="overview-card-content">
                                    <span className="overview-card-value">
                                        {yearData.months.reduce((sum, m) => sum + m.days_with_tasks, 0)}
                                    </span>
                                    <span className="overview-card-label">Active Days</span>
                                </div>
                            </div>

                            <div className="overview-card">
                                <div className="overview-card-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 11l3 3L22 4" />
                                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                    </svg>
                                </div>
                                <div className="overview-card-content">
                                    <span className="overview-card-value">{yearData.summary.completed_tasks}/{yearData.summary.total_tasks}</span>
                                    <span className="overview-card-label">Tasks Completed</span>
                                </div>
                            </div>

                            <div className="overview-card">
                                <div className="overview-card-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <polyline points="12 6 12 12 16 14" />
                                    </svg>
                                </div>
                                <div className="overview-card-content">
                                    <span className="overview-card-value">
                                        {yearData.months.reduce((sum, m) => sum + m.total_duration_hours, 0).toFixed(1)}h
                                    </span>
                                    <span className="overview-card-label">Total Hours Spent</span>
                                </div>
                            </div>

                            <div className="overview-card">
                                <div className="overview-card-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                        <line x1="16" y1="2" x2="16" y2="6" />
                                        <line x1="8" y1="2" x2="8" y2="6" />
                                        <line x1="3" y1="10" x2="21" y2="10" />
                                    </svg>
                                </div>
                                <div className="overview-card-content">
                                    <span className="overview-card-value">
                                        {yearData.months.filter(m => m.total_tasks > 0).length}/12
                                    </span>
                                    <span className="overview-card-label">Active Months</span>
                                </div>
                            </div>

                            <div className="overview-card">
                                <div className="overview-card-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="20" x2="18" y2="10" />
                                        <line x1="12" y1="20" x2="12" y2="4" />
                                        <line x1="6" y1="20" x2="6" y2="14" />
                                    </svg>
                                </div>
                                <div className="overview-card-content">
                                    <span className="overview-card-value">
                                        {yearData.summary.total_tasks > 0
                                            ? (yearData.summary.total_tasks / Math.max(yearData.months.reduce((sum, m) => sum + m.days_with_tasks, 0), 1)).toFixed(1)
                                            : 0}
                                    </span>
                                    <span className="overview-card-label">Avg Tasks / Active Day</span>
                                </div>
                            </div>

                            {yearData.best_month && (
                                <div className="overview-card overview-card-highlight">
                                    <div className="overview-card-icon">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                        </svg>
                                    </div>
                                    <div className="overview-card-content">
                                        <span className="overview-card-value">{getMonthName(yearData.best_month.month)}</span>
                                        <span className="overview-card-label">Best Month · {yearData.best_month.completion_percentage}% · {yearData.best_month.average_duration_per_day}h/day</span>
                                    </div>
                                </div>
                            )}

                            {yearData.best_day && (
                                <div className="overview-card overview-card-highlight">
                                    <div className="overview-card-icon">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                        </svg>
                                    </div>
                                    <div className="overview-card-content">
                                        <span className="overview-card-value">
                                            {(() => {
                                                const [y, m, d] = yearData.best_day!.date.split('-').map(Number)
                                                return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                            })()}
                                        </span>
                                        <span className="overview-card-label">Best Day · {yearData.best_day.completion_percentage}% . {yearData.best_day.total_hours}h</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
        </DashboardLayout>
    );
};

export default YearPage;