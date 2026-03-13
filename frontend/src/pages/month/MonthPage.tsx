// import { useState, useEffect } from 'react';
// import DashboardLayout from '../../components/DashBoardLayout';
// import { productivityAPI } from '@/services/api';
// import type { MonthlyProductivity } from '@/types';
// import Heatmap from '@/components/heatmap/Heatmap';
// import './MonthPage.css';
// import { useNavigate } from 'react-router-dom';
// import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Label } from 'recharts'
// import { HeatmapLegend } from '@/components/HeatmapLegend';

// const MonthPage = () => {
//     const navigate = useNavigate()
//     const [monthData, setMonthData] = useState<MonthlyProductivity | null>(null);
//     const [loading, setLoading] = useState(true);
//     const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
//     const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    

//     useEffect(() => {
//         fetchMonthData();
//     }, [currentYear, currentMonth]);

//     const fetchMonthData = async () => {
//         setLoading(true);
//         try {
//             const data = await productivityAPI.getMonthly(currentYear, currentMonth);
//             setMonthData(data);
//         } catch (err) {
//             console.error('Failed to fetch month data:', err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handlePrevMonth = () => {
//         if (currentMonth === 1) {
//             setCurrentMonth(12);
//             setCurrentYear(currentYear - 1);
//         } else {
//             setCurrentMonth(currentMonth - 1);
//         }
//     };

//     const handleNextMonth = () => {
//         if (currentMonth === 12) {
//             setCurrentMonth(1);
//             setCurrentYear(currentYear + 1);
//         } else {
//             setCurrentMonth(currentMonth + 1);
//         }
//     };

//     const getMonthName = () => {
//         return new Date(currentYear, currentMonth - 1).toLocaleDateString('en-US', {
//             month: 'long',
//             year: 'numeric'
//         });
//     };

//     const handleDayClick = (date: string) => {
//         navigate(`/dashboard?date=${date}`)
//     };

//     if (loading) {
//         return (
//             <DashboardLayout>
//                 <div className="month-loading">
//                     <div className="spinner-large" />
//                     <p>Loading month data...</p>
//                 </div>
//             </DashboardLayout>
//         );
//     }

//     if (!monthData) {
//         return (
//             <DashboardLayout>
//                 <div className="month-error">
//                     <p>Failed to load month data</p>
//                 </div>
//             </DashboardLayout>
//         );
//     }

//     return (
//         <DashboardLayout>
//             <div className="month-page">
//                 {/* Header */}
//                 <div className="month-header">
//                     <div className="month-nav">
//                         <button onClick={handlePrevMonth} aria-label="Previous month">←</button>
//                         <span className="month-name">{getMonthName()}</span>
//                         <button onClick={handleNextMonth} aria-label="Next month">→</button>
//                     </div>
//                 </div>

//                 {/* 4-Section Grid */}
//                 <div className="month-content">
//                     {/* Section 1: Heatmap (Top Left) */}
//                     <div className="heatmap-section">
//                         <Heatmap
//                             year={currentYear}
//                             month={currentMonth}
//                             data={monthData.daily_breakdown}
//                             completion={monthData.summary.completion_percentage}
//                             onDayClick={handleDayClick}
//                         />
//                         <HeatmapLegend />
//                     </div>

//                     {/* Section 2: Bar Chart (Top Right) */}
//                     <div className="chart-section">
//                         <h2>Daily Task Trends</h2>
//                         <ResponsiveContainer width="100%" height="100%" minHeight={250}>
//                             <AreaChart
//                                 data={monthData.daily_breakdown}
//                                 margin={{ bottom: 20 }}
//                             >
//                                 <XAxis
//                                     dataKey="date"
//                                     tickFormatter={(date) => parseInt(date.split('-')[2]).toString()}
//                                     tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
//                                     axisLine={false}
//                                     tickLine={false}
//                                 >
//                                     <Label
//                                         value={getMonthName()}
//                                         position="insideBottom"
//                                         offset={-10}
//                                         style={{ fontSize: '14px', fill: 'var(--color-text-muted)' }}
//                                     />
//                                 </XAxis>
//                                 <YAxis
//                                     domain={[0, 100]}
//                                     ticks={[0, 25, 50, 75, 100]}
//                                     tickFormatter={(value) => `${value}%`}
//                                     tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
//                                     axisLine={false}
//                                     tickLine={false}
//                                     width={35}
//                                 />
//                                 <Tooltip
//                                     contentStyle={{
//                                         border: '1px solid var(--color-border)',
//                                         borderRadius: '8px',
//                                         fontSize: '12px',
//                                     }}
//                                     labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
//                                     formatter={(value) => [`${value}%`, 'Completion']}
//                                 />
//                                 <Area
//                                     type="monotone"
//                                     dataKey="completion_percentage"
//                                     stroke="var(--color-primary)"
//                                     strokeWidth={2}
//                                     fill="rgba(249, 115, 22, 0.1)"
//                                     dot={false}
//                                     activeDot={{ r: 5 }}
//                                 />
//                             </AreaChart>
//                         </ResponsiveContainer>
//                     </div>

                    
//                     {/* Section 3: Additional Stats (Bottom left) - Placeholder for now */}
//                     <div className="stats-section">
//                         <h2>Insights</h2>
//                         <div className="summary-grid">
//                             <div className="summary-card">
//                                 <div className="summary-card-icon">
//                                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                                         <path d="M18 20V10" />
//                                         <path d="M12 20V4" />
//                                         <path d="M6 20v-6" />
//                                     </svg>
//                                 </div>
//                                 <div className="summary-card-content">
//                                     <span className="summary-card-value">
//                                         {Math.max(...monthData.daily_breakdown.map(d => d.total_tasks))}
//                                     </span>
//                                     <span className="summary-card-label">Busiest Day Tasks</span>
//                                 </div>
//                             </div>

//                             <div className="summary-card">
//                                 <div className="summary-card-icon">
//                                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                                         <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
//                                         <polyline points="22 4 12 14.01 9 11.01" />
//                                     </svg>
//                                 </div>
//                                 <div className="summary-card-content">
//                                     <span className="summary-card-value">
//                                         {monthData.daily_breakdown.filter(d => d.completion_percentage === 100).length}
//                                     </span>
//                                     <span className="summary-card-label">Perfect Days</span>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                     {/* Section 4: Month Summary (Bottom right) */}
//                     <div className="month-summary">
//                         <h2>Month Summary</h2>

//                         <div className="summary-grid">
//                             <div className="summary-card">
//                                 <div className="summary-card-icon">
//                                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                                         <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
//                                     </svg>
//                                 </div>
//                                 <div className="summary-card-content">
//                                     <span className="summary-card-value">{monthData.summary.completion_percentage}%</span>
//                                     <span className="summary-card-label">Completion Rate</span>
//                                 </div>
//                             </div>

//                             <div className="summary-card">
//                                 <div className="summary-card-icon">
//                                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                                         <path d="M9 11l3 3L22 4" />
//                                         <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
//                                     </svg>
//                                 </div>
//                                 <div className="summary-card-content">
//                                     <span className="summary-card-value">{monthData.summary.completed_tasks}/{monthData.summary.total_tasks}</span>
//                                     <span className="summary-card-label">Tasks Completed</span>
//                                 </div>
//                             </div>

//                             <div className="summary-card">
//                                 <div className="summary-card-icon">
//                                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                                         <circle cx="12" cy="12" r="10" />
//                                         <polyline points="12 6 12 12 16 14" />
//                                     </svg>
//                                 </div>
//                                 <div className="summary-card-content">
//                                     <span className="summary-card-value">{monthData.summary.total_duration_hours.toFixed(1)}h</span>
//                                     <span className="summary-card-label">Total Time</span>
//                                 </div>
//                             </div>

//                             <div className="summary-card">
//                                 <div className="summary-card-icon">
//                                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                                         <line x1="12" y1="1" x2="12" y2="23" />
//                                         <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
//                                     </svg>
//                                 </div>
//                                 <div className="summary-card-content">
//                                     <span className="summary-card-value">{monthData.summary.average_tasks_per_day.toFixed(1)}</span>
//                                     <span className="summary-card-label">Avg Tasks/Day</span>
//                                 </div>
//                             </div>

//                             <div className="summary-card">
//                                 <div className="summary-card-icon">
//                                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                                         <circle cx="12" cy="12" r="10" />
//                                         <polyline points="12 6 12 12 16 14" />
//                                     </svg>
//                                 </div>
//                                 <div className="summary-card-content">
//                                     <span className="summary-card-value">{monthData.summary.average_duration_per_day.toFixed(1)}h</span>
//                                     <span className="summary-card-label">Avg Time/Day</span>
//                                 </div>
//                             </div>

//                             <div className="summary-card">
//                                 <div className="summary-card-icon">
//                                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                                         <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
//                                         <line x1="16" y1="2" x2="16" y2="6" />
//                                         <line x1="8" y1="2" x2="8" y2="6" />
//                                         <line x1="3" y1="10" x2="21" y2="10" />
//                                     </svg>
//                                 </div>
//                                 <div className="summary-card-content">
//                                     <span className="summary-card-value">{monthData.summary.days_with_tasks}</span>
//                                     <span className="summary-card-label">Active Days</span>
//                                 </div>
//                             </div>

//                             {monthData.most_productive_day && (
//                                 <div className="summary-card summary-card-highlight">
//                                     <div className="summary-card-icon">
//                                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                                             <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
//                                         </svg>
//                                     </div>
//                                     <div className="summary-card-content">
//                                         <span className="summary-card-value">
//                                             {new Date(monthData.most_productive_day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
//                                         </span>
//                                         <span className="summary-card-label">Most Productive ({monthData.most_productive_day.completion_percentage}%)</span>
//                                     </div>
//                                 </div>
//                             )}
//                         </div>
//                     </div>

//                 </div>
//             </div>
//         </DashboardLayout>
//     );
// };

// export default MonthPage;

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashBoardLayout';
import { productivityAPI } from '@/services/api';
import type { MonthlyProductivity, ArenaBreakdown } from '@/types';
import Heatmap from '@/components/heatmap/Heatmap';
import './MonthPage.css';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Label } from 'recharts'
import { HeatmapLegend } from '@/components/heatmapLegend/HeatmapLegend';
import { hexToRgb } from '@/services/colorIntensity';

const MonthPage = () => {
    const navigate = useNavigate()
    const [monthData, setMonthData] = useState<MonthlyProductivity | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [selectedArenaId, setSelectedArenaId] = useState<number | null>(null);

    useEffect(() => {
        fetchMonthData();
    }, [currentYear, currentMonth]);

    const fetchMonthData = async () => {
        setLoading(true);
        try {
            const data = await productivityAPI.getMonthly(currentYear, currentMonth);
            setMonthData(data);
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

    const handleDayClick = (date: string) => navigate(`/dashboard?date=${date}`);

    // Collect unique arenas from daily breakdown
    const getArenas = (): ArenaBreakdown[] => {
        if (!monthData) return []
        const arenaMap = new Map<number, ArenaBreakdown>()
        monthData.daily_breakdown.forEach(day => {
            day.arenas.forEach(arena => {
                if (!arenaMap.has(arena.arena_id)) arenaMap.set(arena.arena_id, arena)
            })
        })
        return Array.from(arenaMap.values())
    }

    // Get chart data filtered by arena
    const getChartData = () => {
        if (!monthData) return []
        if (!selectedArenaId) return monthData.daily_breakdown
        return monthData.daily_breakdown.map(day => {
            const arena = day.arenas.find(a => a.arena_id === selectedArenaId)
            return { ...day, completion_percentage: arena?.completion_percentage ?? 0 }
        })
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
    const chartData = getChartData()
    const selectedArena = arenas.find(a => a.arena_id === selectedArenaId)

    const rgbColor = selectedArena
        ? hexToRgb(selectedArena.arena_color) 
        : undefined

    return (
        <DashboardLayout>
            <div className="month-page">
                {/* Header */}
                <div className="month-header">
                    <div className="month-nav">
                        <button onClick={handlePrevMonth} aria-label="Previous month">←</button>
                        <span className="month-name">{getMonthName()}</span>
                        <button onClick={handleNextMonth} aria-label="Next month">→</button>
                    </div>
                </div>

                {/* Arena Filter */}
                {arenas.length > 0 && (
                    <div className="arena-filter">
                        <button
                            className={`arena-filter-pill ${!selectedArenaId ? 'active' : ''}`}
                            onClick={() => setSelectedArenaId(null)}
                        >
                            All
                        </button>
                        {arenas.map(arena => (
                            <button
                                key={arena.arena_id}
                                className={`arena-filter-pill ${selectedArenaId === arena.arena_id ? 'active' : ''}`}
                                style={{
                                    borderColor: selectedArenaId === arena.arena_id ? arena.arena_color : 'var(--color-border)',
                                    backgroundColor: selectedArenaId === arena.arena_id ? `${arena.arena_color}20` : 'transparent',
                                    color: selectedArenaId === arena.arena_id ? arena.arena_color : 'var(--color-text-secondary)',
                                }}
                                onClick={() => setSelectedArenaId(selectedArenaId === arena.arena_id ? null : arena.arena_id)}
                            >
                                <span className="arena-filter-dot" style={{ backgroundColor: arena.arena_color }} />
                                {arena.arena_name}
                            </button>
                        ))}
                    </div>
                )}

                {/* 4-Section Grid */}
                <div className="month-content">
                    {/* Section 1: Heatmap */}
                    <div className="heatmap-section">
                        <Heatmap
                            year={currentYear}
                            month={currentMonth}
                            data={monthData.daily_breakdown}
                            completion={selectedArena ? selectedArena.completion_percentage : monthData.summary.completion_percentage}
                            selectedArenaId={selectedArenaId}
                            onDayClick={handleDayClick}
                        />
                        <HeatmapLegend color={rgbColor}/>
                    </div>

                    {/* Section 2: Area Chart */}
                    <div className="chart-section">
                        <h2>Daily Task Trends</h2>
                        <ResponsiveContainer width="100%" height="100%" minHeight={250}>
                            <AreaChart data={chartData} margin={{ bottom: 20 }}>
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(date) => parseInt(date.split('-')[2]).toString()}
                                    tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                                    axisLine={false}
                                    tickLine={false}
                                >
                                    <Label
                                        value={getMonthName()}
                                        position="insideBottom"
                                        offset={-10}
                                        style={{ fontSize: '14px', fill: 'var(--color-text-muted)' }}
                                    />
                                </XAxis>
                                <YAxis
                                    domain={[0, 100]}
                                    ticks={[0, 25, 50, 75, 100]}
                                    tickFormatter={(value) => `${value}%`}
                                    tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={35}
                                />
                                <Tooltip
                                    contentStyle={{
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                    }}
                                    labelFormatter={(date) => {
                                        const [y, m, d] = date.split('-').map(Number)
                                        return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                    }}
                                    formatter={(value) => [`${value}%`, selectedArena ? selectedArena.arena_name : 'Completion']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="completion_percentage"
                                    stroke={selectedArena ? selectedArena.arena_color : 'var(--color-primary)'}
                                    strokeWidth={2}
                                    fill={selectedArena ? `${selectedArena.arena_color}20` : 'rgba(249, 115, 22, 0.1)'}
                                    dot={false}
                                    activeDot={{ r: 5 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Section 3: Insights */}
                    <div className="stats-section">
                        <h2>Insights</h2>
                        <div className="summary-grid">
                            <div className="summary-card">
                                <div className="summary-card-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
                                    </svg>
                                </div>
                                <div className="summary-card-content">
                                    <span className="summary-card-value">
                                        {Math.max(...monthData.daily_breakdown.map(d => d.total_tasks))}
                                    </span>
                                    <span className="summary-card-label">Busiest Day Tasks</span>
                                </div>
                            </div>

                            <div className="summary-card">
                                <div className="summary-card-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                </div>
                                <div className="summary-card-content">
                                    <span className="summary-card-value">
                                        {monthData.daily_breakdown.filter(d => d.completion_percentage === 100).length}
                                    </span>
                                    <span className="summary-card-label">Perfect Days</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Month Summary */}
                    <div className="month-summary">
                        <h2>Month Summary</h2>
                        <div className="summary-grid">
                            <div className="summary-card">
                                <div className="summary-card-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                                    </svg>
                                </div>
                                <div className="summary-card-content">
                                    <span className="summary-card-value">{monthData.summary.completion_percentage}%</span>
                                    <span className="summary-card-label">Completion Rate</span>
                                </div>
                            </div>

                            <div className="summary-card">
                                <div className="summary-card-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 11l3 3L22 4" />
                                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                    </svg>
                                </div>
                                <div className="summary-card-content">
                                    <span className="summary-card-value">{monthData.summary.completed_tasks}/{monthData.summary.total_tasks}</span>
                                    <span className="summary-card-label">Tasks Completed</span>
                                </div>
                            </div>

                            <div className="summary-card">
                                <div className="summary-card-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <polyline points="12 6 12 12 16 14" />
                                    </svg>
                                </div>
                                <div className="summary-card-content">
                                    <span className="summary-card-value">{monthData.summary.total_duration_hours.toFixed(1)}h</span>
                                    <span className="summary-card-label">Total Time</span>
                                </div>
                            </div>

                            <div className="summary-card">
                                <div className="summary-card-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="12" y1="1" x2="12" y2="23" />
                                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                    </svg>
                                </div>
                                <div className="summary-card-content">
                                    <span className="summary-card-value">{monthData.summary.average_tasks_per_day.toFixed(1)}</span>
                                    <span className="summary-card-label">Avg Tasks/Day</span>
                                </div>
                            </div>

                            <div className="summary-card">
                                <div className="summary-card-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <polyline points="12 6 12 12 16 14" />
                                    </svg>
                                </div>
                                <div className="summary-card-content">
                                    <span className="summary-card-value">{monthData.summary.average_duration_per_day.toFixed(1)}h</span>
                                    <span className="summary-card-label">Avg Time/Day</span>
                                </div>
                            </div>

                            <div className="summary-card">
                                <div className="summary-card-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                        <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                                        <line x1="3" y1="10" x2="21" y2="10" />
                                    </svg>
                                </div>
                                <div className="summary-card-content">
                                    <span className="summary-card-value">{monthData.summary.days_with_tasks}</span>
                                    <span className="summary-card-label">Active Days</span>
                                </div>
                            </div>

                            {monthData.most_productive_day && (
                                <div className="summary-card summary-card-highlight">
                                    <div className="summary-card-icon">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                        </svg>
                                    </div>
                                    <div className="summary-card-content">
                                        <span className="summary-card-value">
                                            {(() => {
                                                const [y, m, d] = monthData.most_productive_day.date.split('-').map(Number)
                                                return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                            })()}
                                        </span>
                                        <span className="summary-card-label">Most Productive ({monthData.most_productive_day.completion_percentage}%)</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default MonthPage;