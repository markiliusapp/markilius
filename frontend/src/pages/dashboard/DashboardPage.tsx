import DashboardLayout from '../../components/DashBoardLayout';
import TaskInput from '@/components/taskinput/TaskInput';
import './DashboardPage.css'
import ActiveTasks from '@/components/activeTasks/ActiveTasks';
import CompletedTasks from '@/components/completedTasks/CompletedTasks';
import { useState, useEffect } from 'react';
import { productivityAPI } from '@/services/api';
import type { DailyProductivityResponse } from '@/types';
import { useSearchParams } from 'react-router-dom'
import AddTaskButton from '@/components/addTaskButton/AddTaskButton';
import FloatingAddButton from '@/components/floatingAddButton/FloatingAddButton';
import ArenaFilter from '@/components/arenaFilter/ArenaFilter'
import WeekStrip from '@/components/weekStrip/WeekStrip'

const formatHours = (hours: number): string => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
};


const DashboardPage = () => {
    const [searchParams] = useSearchParams()
    const [refreshKey, setRefreshKey] = useState<number>(0)
    const [selectedDate, setSelectedDate] = useState<string>(
        searchParams.get('date') || new Date().toLocaleDateString('en-CA')
    )
    const [showTaskInput, setShowTaskInput] = useState(false)
    const [productivity, setProductivity] = useState<DailyProductivityResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedArenaId, setSelectedArenaId] = useState<number | null>(null)
    const [compact, setCompact] = useState(() => localStorage.getItem('taskCompact') === 'true')


    useEffect(() => {
        fetchProductivity();
    }, [selectedDate, refreshKey]);

    const fetchProductivity = async () => {
        setLoading(true)
        try {
            const data = await productivityAPI.getDaily(selectedDate);
            setProductivity(data);
        } catch (err) {
            console.error('Failed to fetch productivity:', err);
        } finally {
            setLoading(false)
        }
    };

    const handleTaskCreated = () => {
        setRefreshKey(prev => prev + 1)
        setShowTaskInput(false)
    }

    const filteredArena = selectedArenaId && productivity
        ? productivity.arenas.find(a => a.arena_id === selectedArenaId) ?? null
        : null

    const accentColor = filteredArena?.arena_color ?? 'var(--color-primary)'

    const displayStats = filteredArena ? {
        total_tasks: filteredArena.total_tasks,
        completed_tasks: filteredArena.completed_tasks,
        completion_percentage: filteredArena.completion_percentage,
        total_hours: filteredArena.total_hours,
        active_hours: filteredArena.active_hours,
    } : productivity ? {
        total_tasks: productivity.total_tasks,
        completed_tasks: productivity.completed_tasks,
        completion_percentage: productivity.completion_percentage,
        total_hours: productivity.total_hours,
        active_hours: productivity.active_hours,
    } : null

    return (
        <DashboardLayout>
            <div className="dashboard-today">
                {/* Header */}
                <div className="dashboard-header">
                    <WeekStrip
                        selectedDate={selectedDate}
                        onSelectDate={setSelectedDate}
                        selectedArenaId={selectedArenaId}
                        refreshKey={refreshKey}
                        compact={compact}
                        onToggleCompact={() => setCompact(v => { localStorage.setItem('taskCompact', String(!v)); return !v })}
                    />
                    <div className="header-actions">
                        <button className={`compact-toggle ${compact ? 'active' : ''}`} onClick={() => setCompact(v => { localStorage.setItem('taskCompact', String(!v)); return !v })} title={compact ? 'Expand' : 'Compact'}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                {compact ? (
                                    <><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="7" y1="9" x2="17" y2="9" /><line x1="7" y1="13" x2="13" y2="13" /></>
                                ) : (
                                    <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>
                                )}
                            </svg>
                        </button>
                        <AddTaskButton onClick={() => setShowTaskInput(true)} />
                    </div>
                </div>
                {/* Task Input Modal */}
                {showTaskInput && (
                    <TaskInput
                        onTaskCreated={handleTaskCreated}
                        onCancel={() => setShowTaskInput(false)}
                        onArenaChange={() => setRefreshKey(prev => prev + 1)}
                    />
                )}

                {/* Arena Filter */}
                {productivity && (
                    <ArenaFilter
                        arenas={(productivity.arenas).map(a => ({ id: a.arena_id, name: a.arena_name, color: a.arena_color }))}
                        selectedArenaId={selectedArenaId}
                        onSelect={setSelectedArenaId}
                    />
                )}

                {/* Two Panes */}
                <div className='panes'>
                    <div className='activePane'>
                        <h1>
                            Active Tasks
                            {displayStats && displayStats.active_hours > 0 && <span className="pane-hours">{formatHours(displayStats.active_hours)}</span>}
                        </h1>
                        <div className="day-progress-bar">
                            <div className="day-progress-fill" style={{ width: '0%', backgroundColor: accentColor }} />
                        </div>
                        <div className="task-list-container">
                            {displayStats && displayStats.total_tasks - displayStats.completed_tasks > 0 && (
                                <p className="pane-task-count">{displayStats.total_tasks - displayStats.completed_tasks} tasks</p>
                            )}
                            <ActiveTasks
                                refreshKey={refreshKey}
                                onToggle={handleTaskCreated}
                                selectedDate={selectedDate}
                                selectedArenaId={selectedArenaId}
                                compact={compact}
                            />
                        </div>
                    </div>

                    <div className='completedPane'>
                        <h1>
                            Completed Tasks
                            <span className="pane-hours">
                                {displayStats && displayStats.total_tasks > 0 && <span style={{ color: accentColor }}>{Math.round(displayStats.completion_percentage)}%</span>}
                                {displayStats && displayStats.total_hours > 0 && <> · {formatHours(displayStats.total_hours)}</>}
                            </span>
                        </h1>
                        <div className="day-progress-bar">
                            <div className="day-progress-fill" style={{ width: `${displayStats?.completion_percentage ?? 0}%`, backgroundColor: accentColor }} />
                        </div>
                        <div className="task-list-container">
                            {displayStats && displayStats.completed_tasks > 0 && (
                                <p className="pane-task-count">{displayStats.completed_tasks} tasks</p>
                            )}
                            <CompletedTasks
                                refreshKey={refreshKey}
                                onToggle={handleTaskCreated}
                                selectedDate={selectedDate}
                                selectedArenaId={selectedArenaId}
                                compact={compact}
                            />
                        </div>
                    </div>
                </div>

                {/* Stats Section */}
                {loading ? (
                    <div className="tasks-loading">
                        <div className="spinner-large" />
                        <p>Loading</p>
                    </div>
                ) : (
                    <div className='streaks-and-stats'>
                        {productivity && (
                            <div className="stats-section">
                                <h2>Arena Breakdown</h2>
                                <div className="stats-list">
                                    {/* Overall row */}
                                    <div className="stats-row">
                                        <span className="stats-label">Overall</span>
                                        <div className="stats-track">
                                            <div
                                                className="stats-fill"
                                                style={{ width: `${productivity.completion_percentage}%`, backgroundColor: 'var(--color-text-muted)' }}
                                            >
                                                <span className="stats-fill-pct">{productivity.completion_percentage}%</span>
                                            </div>
                                        </div>
                                        <div className="stats-meta">
                                            <span className="stats-count">{productivity.completed_tasks}/{productivity.total_tasks}</span>
                                            <span className="stats-hours">{productivity.total_hours.toFixed(1)}h</span>
                                        </div>
                                    </div>

                                    {/* Arena rows */}
                                    {productivity.arenas.map(arena => (
                                        <div key={arena.arena_id} className="stats-row">
                                            <span className="stats-label">{arena.arena_name}</span>
                                            <div className="stats-track">
                                                <div
                                                    className="stats-fill"
                                                    style={{ width: `${arena.completion_percentage}%`, backgroundColor: arena.arena_color }}
                                                >
                                                    <span className="stats-fill-pct">{arena.completion_percentage}%</span>
                                                </div>
                                            </div>
                                            <div className="stats-meta">
                                                <span className="stats-count">{arena.completed_tasks}/{arena.total_tasks}</span>
                                                <span className="stats-hours">{arena.total_hours.toFixed(1)}h</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <FloatingAddButton onClick={() => setShowTaskInput(true)} />
        </DashboardLayout>
    );
};

export default DashboardPage;