import DashboardLayout from '../../components/DashBoardLayout';
import TaskInput from '@/components/taskinput/TaskInput';
import './DashboardPage.css'
import ActiveTasks from '@/components/activeTasks/ActiveTasks';
import CompletedTasks from '@/components/completedTasks/CompletedTasks';
import { useState, useEffect } from 'react';
import { productivityAPI } from '@/services/api';
import type { DailyProductivityResponse } from '@/types';
import { useSearchParams } from 'react-router-dom'

const DashboardPage = () => {
    const [searchParams] = useSearchParams()
    const [refreshKey, setRefreshKey] = useState<number>(0)
    const [selectedDate, setSelectedDate] = useState<string>(
        searchParams.get('date') || new Date().toLocaleDateString('en-CA')
    )
    const [showTaskInput, setShowTaskInput] = useState(false)
    const [productivity, setProductivity] = useState<DailyProductivityResponse | null>(null)
    const [loading, setLoading] = useState(true)

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
                    <h1>Today</h1>

                    <div className="date-nav">
                        <button onClick={handlePrevDay} aria-label="Previous day">←</button>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={handleDateChange}
                        />
                        <button onClick={handleNextDay} aria-label="Next day">→</button>
                    </div>

                    <button onClick={() => setShowTaskInput(true)} className="btn-add-task">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add Task
                    </button>
                </div>

                {/* Task Input Modal */}
                {showTaskInput && (
                    <TaskInput
                        onTaskCreated={handleTaskCreated}
                        onCancel={() => setShowTaskInput(false)}
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
                    productivity && (
                        <div className="stats-section">
                            <div className="stats-grid">
                                {/* Progress side - 2/3 width */}
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

                                    {/* High Priority Progress */}
                                    <div className="progress-item">
                                        <div className="progress-item-header">
                                            <span className="progress-item-label">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <line x1="12" y1="8" x2="12" y2="12" />
                                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                                </svg>
                                                High Priority
                                            </span>
                                            <div className="progress-item-meta">
                                                <span className="progress-item-count">
                                                    {productivity.high_priority_completed}/{productivity.high_priority_tasks}
                                                </span>
                                                <span className="progress-item-percentage">
                                                    {productivity.high_priority_completion_percentage}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="progress-bar">
                                            <div
                                                className="progress-fill progress-fill-medium"
                                                style={{ width: `${productivity.high_priority_completion_percentage}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Normal Priority Progress */}
                                    <div className="progress-item">
                                        <div className="progress-item-header">
                                            <span className="progress-item-label">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10" />
                                                </svg>
                                                Normal Priority
                                            </span>
                                            <div className="progress-item-meta">
                                                <span className="progress-item-count">
                                                    {productivity.low_priority_completed}/{productivity.low_priority_tasks}
                                                </span>
                                                <span className="progress-item-percentage">
                                                    {productivity.low_priority_completion_percentage}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="progress-bar">
                                            <div
                                                className="progress-fill progress-fill-light"
                                                style={{ width: `${productivity.low_priority_completion_percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Time stats side - 1/3 width */}
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

                                    <div className="time-stat-item">
                                        <div className="time-stat-icon time-stat-icon-medium">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10" />
                                                <polyline points="12 6 12 12 16 14" />
                                            </svg>
                                        </div>
                                        <div className="time-stat-content">
                                            <span className="time-stat-value">{productivity.high_priority_hours.toFixed(1)}h</span>
                                            <span className="time-stat-label">High Priority</span>
                                        </div>
                                    </div>

                                    <div className="time-stat-item">
                                        <div className="time-stat-icon time-stat-icon-light">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10" />
                                                <polyline points="12 6 12 12 16 14" />
                                            </svg>
                                        </div>
                                        <div className="time-stat-content">
                                            <span className="time-stat-value">{productivity.low_priority_hours.toFixed(1)}h</span>
                                            <span className="time-stat-label">Normal Priority</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                )}

            </div>
        </DashboardLayout>
    );
};

export default DashboardPage;