import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashBoardLayout';
import { productivityAPI } from '@/services/api';
import type { YearlyProductivity } from '@/types';
import Heatmap from '@/components/heatmap/Heatmap';
import './YearPage.css';
import { useNavigate } from 'react-router-dom';
import { HeatmapLegend } from '@/components/HeatmapLegend';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Label } from 'recharts'


const YearPage = () => {
    const navigate = useNavigate()
    const [yearData, setYearData] = useState<YearlyProductivity | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

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

    const handlePrevYear = () => {
        setCurrentYear(currentYear - 1);
    };

    const handleNextYear = () => {
        setCurrentYear(currentYear + 1);
    };

    const getMonthData = (month: number) => {
        if (!yearData) return [];
        return yearData.daily_breakdown.filter(day => {
            const date = new Date(day.date);
            return date.getFullYear() === currentYear && date.getMonth() + 1 === month;
        });
    };

    const getMonthName = (month: number) => {
        return new Date(currentYear, month - 1).toLocaleDateString('en-US', { month: 'long' });
    };

    const getMonthSummary = (month: number) => {
        return yearData?.months.find(m => m.month === month);
    };

    const handleDayClick = (date: string) => {
        navigate(`/dashboard?date=${date}`)
    };

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
                <div className="year-error">
                    <p>Failed to load year data</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="year-page">
                {/* Header */}
                <div className="year-header">
                    <h1>Year View</h1>
                    <div className="year-nav">
                        <button onClick={handlePrevYear} aria-label="Previous year">←</button>
                        <span className="year-name">{currentYear}</span>
                        <button onClick={handleNextYear} aria-label="Next year">→</button>
                    </div>
                </div>
                {/* 12 Month Heatmaps */}
                <div >
                    <div className="year-heatmaps">
                       {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => {
                        const monthData = getMonthData(month);
                        const monthSummary = getMonthSummary(month);

                        return (
                            <div key={month} className="month-heatmap-card">
                                <Heatmap
                                    year={currentYear}
                                    month={month}
                                    data={monthData}
                                    completion={monthSummary?.completion_percentage || 0}
                                    onDayClick={handleDayClick}
                                />
                            </div>
                        );
                        })} 
                    </div>
                    <div className="heatmap-legend">
                        <HeatmapLegend />
                    </div>
                </div>

                {/* Monthly Bar Chart */}
                <div className="year-chart-section">
                    <h2>Monthly Progress</h2>
                    <div className="year-bar-chart">
                        <ResponsiveContainer width="100%" height="100%" minHeight={250}>
                            <AreaChart
                                data={yearData.months}
                                margin={{ bottom: 20 }}
                            >
                                <XAxis
                                    dataKey="month"
                                    tickFormatter={(month) => new Date(currentYear, month - 1).toLocaleDateString('en-US', { month: 'short' })}
                                    tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                                    axisLine={false}
                                    tickLine={false}
                                >
                                    <Label
                                        value={currentYear}
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
                                    labelFormatter={(month) => new Date(currentYear, month - 1).toLocaleDateString('en-US', { month: 'long' })}
                                    formatter={(value) => [`${value}%`, 'Completion']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="completion_percentage"
                                    stroke="var(--color-primary)"
                                    strokeWidth={2}
                                    fill="rgba(249, 115, 22, 0.1)"
                                    dot={false}
                                    activeDot={{ r: 5 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                {/* Year Overview Stats */}
                <div className="year-overview">
                    <div className="overview-card overview-card-large">
                        <div className="overview-card-content">
                            <span className="overview-card-value">{yearData.summary.completion_percentage}%</span>
                            <span className="overview-card-label">Year Completion Rate</span>
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
                            <span className="overview-card-label">Total Tasks</span>
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
                                <span className="overview-card-value">
                                    {getMonthName(yearData.best_month.month)}
                                </span>
                                <span className="overview-card-label">Best Month ({yearData.best_month.completion_percentage}%)</span>
                            </div>
                        </div>
                    )}

                    {yearData.best_day && (
                        <div className="overview-card">
                            <div className="overview-card-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                </svg>
                            </div>
                            <div className="overview-card-content">
                                <span className="overview-card-value">
                                    {new Date(yearData.best_day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                                <span className="overview-card-label">Best Day ({yearData.best_day.completion_percentage}%)</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default YearPage;