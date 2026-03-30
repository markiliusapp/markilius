import { useState } from 'react'
import type { CreateTask, TaskResponse, UpdateTask } from '@/types'
import { taskAPI } from "../../services/api"
import Arena from '../arena/Arena'
import './TaskInput.css'
import { useDismissOnClick } from '@/hooks/useDismissOnClick'

interface TaskInputProps {
    onTaskCreated: () => void;
    onCancel: () => void;
    task?: TaskResponse;
    onArenaChange?: () => void;
}

const WEEKLY_DAY_MAP: Record<string, string> = {
    weekly_monday: "monday",
    weekly_tuesday: "tuesday",
    weekly_wednesday: "wednesday",
    weekly_thursday: "thursday",
    weekly_friday: "friday",
    weekly_saturday: "saturday",
    weekly_sunday: "sunday",
}

const TaskInput = ({ onTaskCreated, onCancel, task, onArenaChange }: TaskInputProps) => {
    const editMode = !!task
    const [formData, setFormData] = useState<CreateTask>({
        title: task?.title ?? "",
        description: task?.description ?? "",
        frequency: task?.frequency ?? "once",
        due_date: task?.due_date ?? new Date().toLocaleDateString('en-CA'),
        duration: task?.duration ?? undefined,
        arena_id: task?.arena?.id ?? 0,
    })
    const [error, setError] = useState<string>("")
    const [loading, setLoading] = useState(false)

    useDismissOnClick(() => setError(""), !!error)

    const currentFreq = formData.frequency ?? "once"
    const isWeekly = currentFreq.startsWith("weekly_")
    const weeklyDay = isWeekly ? WEEKLY_DAY_MAP[currentFreq] ?? "monday" : "monday"

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value === "" ? undefined : type === "number" ? Number(value) : value,
        }))
    }

    const handleFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value
        setFormData(prev => ({
            ...prev,
            frequency: val === "weekly" ? "weekly_monday" : val as CreateTask["frequency"],
        }))
    }

    const handleWeeklyDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            frequency: `weekly_${e.target.value}` as CreateTask["frequency"],
        }))
    }

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            if (editMode) {
                const { frequency: _freq, ...updatePayload } = formData
                await taskAPI.update(task!.id, updatePayload as UpdateTask)
            } else {
                await taskAPI.create(formData)
            }
            onTaskCreated()
        } catch (err) {
            setError(err instanceof Error ? err.message : `Failed to ${editMode ? 'update' : 'create'} task`)
        } finally {
            setLoading(false)
        }
    }


    return (
        <div className="task-input-overlay" onClick={onCancel}>
            <div className="task-input-modal" onClick={(e) => e.stopPropagation()}>
                <div className="task-input-header">
                    <h2>{editMode ? 'Edit Task' : 'Add New Task'}</h2>
                    <button onClick={onCancel} className="task-input-close">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {error && (
                    <div className="task-input-error">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <p>{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="task-input-form">
                    <div className="form-group">
                        <label htmlFor="title">Title</label>
                        <input
                            id="title"
                            name="title"
                            type="text"
                            placeholder="What are you committing to?"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            placeholder="Add more details..."
                            value={formData.description ?? ""}
                            onChange={handleChange}
                            rows={3}
                        />
                    </div>
                    <Arena
                        selectedArenaId={formData.arena_id}
                        onSelect={(arenaId) => setFormData(prev => ({ ...prev, arena_id: arenaId }))}
                        onArenaChange={onArenaChange}
                    />
                    <div className="form-group">
                        <label htmlFor="frequency">Frequency</label>
                        <div className={`select-wrapper ${editMode ? 'select-wrapper-disabled' : ''}`}>
                            <select
                                id="frequency"
                                name="frequency"
                                value={isWeekly ? "weekly" : currentFreq}
                                onChange={handleFrequencyChange}
                                disabled={editMode}
                            >
                                <option value="once">Once</option>
                                <option value="daily">Daily</option>
                                <option value="weekdays">Weekdays</option>
                                <option value="weekly">Weekly</option>
                                <option value="saturday">Every Saturday</option>
                                <option value="sunday">Every Sunday</option>
                                <option value="weekends">Weekends</option>
                                <option value="monthly">Monthly</option>
                            </select>
                            {editMode && (
                                <div className="select-tooltip">
                                    To change frequency, delete and recreate the task.
                                </div>
                            )}
                        </div>
                        {isWeekly && !editMode && (
                            <div className="select-wrapper">
                                <select value={weeklyDay} onChange={handleWeeklyDayChange}>
                                    <option value="monday">Monday</option>
                                    <option value="tuesday">Tuesday</option>
                                    <option value="wednesday">Wednesday</option>
                                    <option value="thursday">Thursday</option>
                                    <option value="friday">Friday</option>
                                    <option value="saturday">Saturday</option>
                                    <option value="sunday">Sunday</option>
                                </select>
                            </div>
                        )}
                        {isWeekly && editMode && (
                            <div className="select-wrapper select-wrapper-disabled">
                                <select value={weeklyDay} disabled>
                                    <option value="monday">Monday</option>
                                    <option value="tuesday">Tuesday</option>
                                    <option value="wednesday">Wednesday</option>
                                    <option value="thursday">Thursday</option>
                                    <option value="friday">Friday</option>
                                    <option value="saturday">Saturday</option>
                                    <option value="sunday">Sunday</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Duration</label>
                        <div className="duration-pills">
                            {[15, 30, 45, 60, 90, 120].map(min => (
                                <button
                                    key={min}
                                    type="button"
                                    className={`duration-pill${formData.duration === min ? ' duration-pill--active' : ''}`}
                                    onClick={() => setFormData(prev => ({ ...prev, duration: prev.duration === min ? undefined : min }))}
                                >
                                    {min >= 60 ? `${min / 60}h` : `${min}m`}
                                </button>
                            ))}
                            <input
                                id="duration"
                                type="number"
                                name="duration"
                                placeholder="Custom"
                                value={[15, 30, 45, 60, 90, 120].includes(formData.duration ?? 0) ? "" : (formData.duration ?? "")}
                                onChange={handleChange}
                                min="1"
                                max="1440"
                                className="duration-custom-input"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="due_date">Due Date</label>
                        <input id="due_date" type="date" name="due_date" value={formData.due_date ?? ""} onChange={handleChange} />
                    </div>

                    <div className="task-input-actions">
                        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? <><div className="spinner" />{editMode ? 'Saving...' : 'Creating...'}</> : editMode ? 'Save Changes' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default TaskInput