// import { useState } from "react"
// import { taskAPI } from "@/services/api"
// import type { TaskResponse, UpdateTask } from "@/types"
// import './IndividualTask.css'

// const InidividualTask = ({task, onToggle} : {task: TaskResponse, onToggle: () => void}) => {
//     const [editMode, setEditMode] = useState(false)
//     const [isCompleted, setIsCompleted] = useState<boolean>(task.is_completed)

//     const [modifiedTask, setModifiedTask] = useState<UpdateTask>({
//             title: task.title,
//             description: task.description,
//             priority: task.priority,
//             frequency: task.frequency,
//             due_date: task.due_date,
//             duration: task.duration,
//         })
//     const [message, setMessage] = useState<string>("")
//     const [loading, setLoading] = useState(false)

//     const handleChange = (
//         e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
//     ) => {
//         const { name, value } = e.target
//         setModifiedTask(prev => ({
//             ...prev,
//             [name]: value === "" ? undefined : value,
//         }))
//     }

//     const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
//         e.preventDefault()
//         setMessage("")
//         setLoading(true)
//         // Later: send to backend here
//         try {
//             console.log("Printing modified task: ", modifiedTask)
//             const response = await taskAPI.update(task.id, modifiedTask)
//             setMessage("Successfully updated")

//         } catch (err) {
//             console.log(err)
//         } finally {
//             setLoading(false)
//         }
//         // Optional: reset form
//         // setTask({ ...initial values })
//     }

//     const handleCompleteToggle = async () => {
//         try {
//             await taskAPI.toggleComplete(task.id)
//             setIsCompleted(prev => !prev)
//             onToggle()
//         } catch (err) {
//             console.log(err)
//         }
//     }

//     const handleDeletion = async() => {
//         try {
//             await taskAPI.delete(task.id)
//             onToggle()
//         } catch (err) {
//             console.log(err)
//         }

//     }

//     const handleEditMode = () => {
//         if (!task.is_locked) {
//             setEditMode(prev => !prev) 
//         }
//     }

//     return (
//         <div className="wrapper">
//             <button onClick={handleEditMode} disabled={task.is_locked}>Edit Task</button>
//             <button onClick={handleDeletion} disabled={task.is_locked}>Delete Task</button>
//             {message && <p>{message}</p>}
//             <form onSubmit={handleSubmit}>
//                 <div>
//                     <input
//                         name="title"
//                         type="text"
//                         placeholder="Task title"
//                         value={modifiedTask.title}
//                         onChange={handleChange}
//                         required
//                         disabled={!editMode}
//                     />
//                 </div>

//                 <div>
//                     <textarea
//                         name="description"
//                         placeholder="Description"
//                         value={modifiedTask.description ?? ""}
//                         onChange={handleChange}
//                         disabled={!editMode}
//                     />
//                 </div>

//                 <div>
//                     <label>Priority</label>
//                     <select
//                         name="priority"
//                         value={modifiedTask.priority ? "high" : "low"}
//                         onChange={(e) => {
//                             setModifiedTask(prev => ({
//                                 ...prev,
//                                 priority: e.target.value === "high"
//                             }));
//                         }}
//                         disabled={!editMode}
//                     >
//                         <option value="high">High</option>
//                         <option value="low">Low</option>
//                     </select>
//                 </div>

//                 <div>
//                     <label>Frequency</label>
//                     <select name="frequency" value={modifiedTask.frequency ?? "once"} onChange={handleChange} disabled={!editMode}>
//                         <option value="once">Once</option>
//                         <option value="daily">Daily</option>
//                         <option value="saturday">Every Saturday</option>
//                         <option value="sunday">Every Sunday</option>
//                         <option value="weekend">Weekends</option>
//                         <option value="monthly">Monthly</option>
//                     </select>
//                 </div>

//                 <div>
//                     <label>Due date</label>
//                     <input
//                         type="date"
//                         name="due_date"
//                         value={modifiedTask.due_date ?? ""}
//                         onChange={handleChange}
//                         disabled={!editMode}
//                     />
//                 </div>

//                 <div>
//                     <label>Estimated duration (minutes)</label>
//                     <input
//                         type="number"
//                         name="duration"
//                         placeholder="e.g. 30"
//                         value={modifiedTask.duration ?? ""}
//                         onChange={handleChange}
//                         disabled={!editMode}
//                     />
//                 </div>
//                 {editMode && <button type="submit" disabled={!loading}>
//                     {loading ? "submitting" : "Submit Changes" }
//                 </button>}
//             </form>
//             <div>
//                 <label>Task Completion Status</label>
//                 <input
//                     type="checkbox"
//                     checked={task.is_completed}
//                     onChange={handleCompleteToggle}
//                     disabled={task.is_locked}
//                 />
//             </div>

//         </div>
//     )
// }

// export default InidividualTask


// ------------------------------------------------------------------------


import { useState } from "react"
import { taskAPI } from "@/services/api"
import type { TaskResponse, UpdateTask } from "@/types"
import './IndividualTask.css'

interface IndividualTaskProps {
    task: TaskResponse;
    onToggle: () => void;
}

const IndividualTask = ({ task, onToggle }: IndividualTaskProps) => {
    const [editMode, setEditMode] = useState(false)
    const [showActions, setShowActions] = useState(false)

    const [modifiedTask, setModifiedTask] = useState<UpdateTask>({
        title: task.title,
        description: task.description,
        priority: task.priority,
        frequency: task.frequency,
        due_date: task.due_date,
        duration: task.duration,
    })
    const [error, setError] = useState<string>("")
    const [loading, setLoading] = useState(false)

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target
        setModifiedTask(prev => ({
            ...prev,
            [name]: value === "" ? undefined : value,
        }))
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            await taskAPI.update(task.id, modifiedTask)
            setEditMode(false)
            onToggle() // Refresh parent
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update task')
        } finally {
            setLoading(false)
        }
    }

    const handleCompleteToggle = async () => {
        if (task.is_locked) return; // Cannot toggle locked tasks

        try {
            await taskAPI.toggleComplete(task.id)
            onToggle()
        } catch (err) {
            console.error(err)
        }
    }

    const handleDelete = async () => {
        if (task.is_locked) {
            alert('Cannot delete a locked task');
            return;
        }

        if (!confirm('Delete this task?')) return;

        try {
            await taskAPI.delete(task.id)
            onToggle()
        } catch (err) {
            console.error(err)
        }
    }

    const handleEditClick = () => {
        if (task.is_locked) {
            alert('This task is locked and cannot be edited');
            return;
        }
        setEditMode(true);
        setShowActions(false);
    }

    return (
        <div className={`individual-task ${task.is_locked ? 'task-locked' : ''}`}>
            {/* Locked indicator */}
            {task.is_locked && (
                <div className="task-locked-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Locked
                </div>
            )}

            {/* Task Header */}
            <div className="task-header">
                <div className="task-header-left">
                    <button
                        onClick={handleCompleteToggle}
                        className={`task-checkbox ${task.is_completed ? 'task-checkbox-checked' : ''}`}
                        disabled={task.is_locked}
                    >
                        {task.is_completed && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        )}
                    </button>
                    <h3 className={task.is_completed ? 'task-completed' : ''}>{task.title}</h3>
                    {task.priority && <span className="task-priority-badge">High</span>}
                </div>

                <div className="task-header-right">
                    <button
                        onClick={() => setShowActions(!showActions)}
                        className="task-menu-btn"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" />
                        </svg>
                    </button>

                    {showActions && (
                        <div className="task-actions-menu">
                            <button
                                onClick={handleEditClick}
                                disabled={task.is_locked}
                                className={task.is_locked ? 'disabled' : ''}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                Edit
                            </button>
                            <button
                                onClick={handleDelete}
                                className={`delete-btn ${task.is_locked ? 'disabled' : ''}`}
                                disabled={task.is_locked}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Task Details (when not editing) */}
            {!editMode && (
                <div className="task-details">
                    {task.description && <p className="task-description">{task.description}</p>}
                    <div className="task-meta">
                        <span className="task-meta-item">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            {task.frequency}
                        </span>
                        {task.duration && (
                            <span className="task-meta-item">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                                </svg>
                                {task.duration} min
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Edit Form */}
            {editMode && (
                <form onSubmit={handleSubmit} className="task-edit-form">
                    {error && (
                        <div className="task-error">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="form-group">
                        <label>Title</label>
                        <input
                            name="title"
                            type="text"
                            value={modifiedTask.title}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            name="description"
                            value={modifiedTask.description ?? ""}
                            onChange={handleChange}
                            rows={3}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Frequency</label>
                            <select name="frequency" value={modifiedTask.frequency ?? "once"} onChange={handleChange}>
                                <option value="once">Once</option>
                                <option value="daily">Daily</option>
                                <option value="saturday">Every Saturday</option>
                                <option value="sunday">Every Sunday</option>
                                <option value="weekends">Weekends</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Priority</label>
                            <select
                                name="priority"
                                value={modifiedTask.priority ? "high" : "low"}
                                onChange={(e) => {
                                    setModifiedTask(prev => ({
                                        ...prev,
                                        priority: e.target.value === "high"
                                    }));
                                }}
                            >
                                <option value="low">Normal</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Due date</label>
                            <input
                                type="date"
                                name="due_date"
                                value={modifiedTask.due_date ?? ""}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Duration (minutes)</label>
                            <input
                                type="number"
                                name="duration"
                                value={modifiedTask.duration ?? ""}
                                onChange={handleChange}
                                min="1"
                            />
                        </div>
                    </div>

                    <div className="task-edit-actions">
                        <button
                            type="button"
                            onClick={() => setEditMode(false)}
                            className="btn-cancel"
                        >
                            Cancel
                        </button>
                        <button type="submit" className="btn-save" disabled={loading}>
                            {loading ? (
                                <>
                                    <div className="spinner" />
                                    Saving...
                                </>
                            ) : 'Save Changes'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    )
}

export default IndividualTask