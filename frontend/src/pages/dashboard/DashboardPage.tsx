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
import type { StreakResponse } from '@/types';
import Streaks from '@/components/streaks/Streaks'
import ArenaFilter from '@/components/arenaFilter/ArenaFilter'

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
    const [streaks, setStreaks] = useState<StreakResponse | null>(null)
    const [selectedArenaId, setSelectedArenaId] = useState<number | null>(null)
    const [compact, setCompact] = useState(() => localStorage.getItem('taskCompact') === 'true')


    useEffect(() => {
        fetchProductivity();
    }, [selectedDate, refreshKey]);

    useEffect(() => {
        fetchStreaks();
    }, [refreshKey]);

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

    const fetchStreaks = async () => {
        try {
            const data = await productivityAPI.getStreaks();
            setStreaks(data);
        } catch (err) {
            console.error('Failed to fetch streaks:', err);
        }
    };

    const handleTaskCreated = () => {
        setRefreshKey(prev => prev + 1)
        setShowTaskInput(false)
    }

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedDate(e.target.value)
    }

    const handlePrevDay = () => {
        const [year, month, day] = selectedDate.split('-').map(Number)
        const date = new Date(year, month - 1, day)
        date.setDate(date.getDate() - 1)
        setSelectedDate(date.toLocaleDateString('en-CA'))
    }

    const handleNextDay = () => {
        const [year, month, day] = selectedDate.split('-').map(Number)
        const date = new Date(year, month - 1, day)
        date.setDate(date.getDate() + 1)
        setSelectedDate(date.toLocaleDateString('en-CA'))
    }

    return (
        <DashboardLayout>
            <div className="dashboard-today">
                {/* Header */}
                <div className="dashboard-header">
                    <div className="date-nav-wrapper">
                        <div className="date-nav">
                            <button onClick={handlePrevDay} aria-label="Previous day">←</button>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={handleDateChange}
                            />
                            <button onClick={handleNextDay} aria-label="Next day">→</button>
                        </div>
                        {selectedDate !== new Date().toLocaleDateString('en-CA') && (
                            <button className="today-btn" onClick={() => setSelectedDate(new Date().toLocaleDateString('en-CA'))}>Today</button>
                        )}
                    </div>
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
                            {productivity && productivity.active_hours > 0 && <span className="pane-hours">{formatHours(productivity.active_hours)}</span>}
                        </h1>
                        <div className="task-list-container">
                            {productivity && productivity.total_tasks - productivity.completed_tasks > 0 && (
                                <p className="pane-task-count">{productivity.total_tasks - productivity.completed_tasks} tasks</p>
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
                            {productivity && productivity.total_hours > 0 && <span className="pane-hours">{formatHours(productivity.total_hours)}</span>}
                        </h1>
                        <div className="task-list-container">
                            {productivity && productivity.completed_tasks > 0 && (
                                <p className="pane-task-count">{productivity.completed_tasks} tasks</p>
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
                        {/* Streaks */}
                        {streaks && <Streaks streaks={streaks} />}
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