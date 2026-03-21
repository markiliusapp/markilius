import { useEffect, useState } from "react"
import IndividualTask from "../individualTask/IndividualTask"
import type { TaskResponse } from "@/types"
import { taskAPI } from "@/services/api"
import './ActiveTasks.css'

interface ActiveTasksProps {
    refreshKey: number;
    onToggle: () => void;
    selectedDate: string;
    selectedArenaId?: number | null;
    compact?: boolean;
}

const ActiveTasks = ({ refreshKey, onToggle, selectedDate, selectedArenaId, compact }: ActiveTasksProps) => {
    const [taskList, setTaskList] = useState<TaskResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchTasks = async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await taskAPI.getAll({
                due_date: selectedDate,
                status: false
            })
            setTaskList(response)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load tasks')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTasks()
    }, [refreshKey, selectedDate])

    if (loading) {
        return (
            <div className="tasks-loading">
                <div className="spinner-large" />
                <p>Loading tasks...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="tasks-error">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p>{error}</p>
                <button onClick={fetchTasks} className="btn-retry">
                    Try Again
                </button>
            </div>
        )
    }

    if (taskList.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                </div>
                <h3>No active tasks</h3>
            </div>
        )
    }

    const displayed = selectedArenaId
        ? taskList.filter(t => t.arena?.id === selectedArenaId)
        : [...taskList].sort((a, b) => (a.arena?.name ?? '').localeCompare(b.arena?.name ?? ''))

    return (
        <div className="tasks-list">
            {displayed.map((task) => (
                <IndividualTask
                    key={task.id}
                    task={task}
                    onToggle={onToggle}
                    compact={compact}
                />
            ))}
        </div>
    )
}

export default ActiveTasks