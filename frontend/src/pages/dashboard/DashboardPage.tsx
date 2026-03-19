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
                    <div className="date-nav">
                        <button onClick={handlePrevDay} aria-label="Previous day">←</button>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={handleDateChange}
                        />
                        <button onClick={handleNextDay} aria-label="Next day">→</button>
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
                        <h1>Active Tasks</h1>
                        <div className="task-list-container">
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
                        <h1>Completed Tasks</h1>
                        <div className="task-list-container">
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
                        {
                        productivity && (
                            <div className="stats-section">
                                <div className="stats-grid">
                                    {/* Progress side */}
                                    <div className="progress-column">
                                        {/* Overall Progress */}
                                        <div className="progress-item">
                                            <div className="progress-item-header">
                                                <span className="progress-item-label">Overall Progress</span>
                                                <div className="progress-item-meta">
                                                    <span className="progress-item-count">
                                                        {productivity.completed_tasks}/{productivity.total_tasks}
                                                    </span>
                                                    <span className="progress-item-percentage">
                                                        {productivity.completion_percentage}%
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="progress-bar">
                                                <div
                                                    className="progress-fill progress-fill-dark"
                                                    style={{ width: `${productivity.completion_percentage}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Arena Breakdown */}
                                        {productivity.arenas.map(arena => (
                                            <div key={arena.arena_id} className="progress-item">
                                                <div className="progress-item-header">
                                                    <span className="progress-item-label">
                                                        {arena.arena_name}
                                                    </span>
                                                    <div className="progress-item-meta">
                                                        <span className="progress-item-count">
                                                            {arena.completed_tasks}/{arena.total_tasks}
                                                        </span>
                                                        <span className="progress-item-percentage">
                                                            {arena.completion_percentage}%
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="progress-bar">
                                                    <div
                                                        className="progress-fill"
                                                        style={{
                                                            width: `${arena.completion_percentage}%`,
                                                            backgroundColor: arena.arena_color,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Time stats side */}
                                    <div className="time-column">
                                        <div className="time-stat-item">
                                            <div className="time-stat-icon time-stat-icon-dark">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <polyline points="12 6 12 12 16 14" />
                                                </svg>
                                            </div>
                                            <div className="time-stat-content">
                                                <span className="time-stat-value">{productivity.total_hours.toFixed(1)}h</span>
                                                <span className="time-stat-label">Total</span>
                                            </div>
                                        </div>

                                        {productivity.arenas.map(arena => (
                                            <div key={arena.arena_id} className="time-stat-item">
                                                <div
                                                    className="time-stat-icon"
                                                    style={{ backgroundColor: `${arena.arena_color}20`, color: arena.arena_color }}
                                                >
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <circle cx="12" cy="12" r="10" />
                                                        <polyline points="12 6 12 12 16 14" />
                                                    </svg>
                                                </div>
                                                <div className="time-stat-content">
                                                    <span className="time-stat-value">{arena.total_hours.toFixed(1)}h</span>
                                                    <span className="time-stat-label">{arena.arena_name}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )
                    }</div>
                )}
            </div>
            <FloatingAddButton onClick={() => setShowTaskInput(true)} />
        </DashboardLayout>
    );
};

export default DashboardPage;