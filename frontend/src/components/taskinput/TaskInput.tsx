// import { useState } from 'react'
// import type { CreateTask } from '@/types'
// import { taskAPI } from "../../services/api"

// const TaskInput = ({onTaskCreated}: {onTaskCreated: () => void}) => {
//     const [task, setTask] = useState<CreateTask>({
//         title: "",
//         description: "",
//         priority: false,
//         frequency: "once",
//         due_date: new Date().toISOString().split('T')[0], // today by default
//         duration: undefined,
//     })
//     const [message, setMessage] = useState<string>("")
//     const [loading, setLoading] = useState(false)

//     const handleChange = (
//         e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
//     ) => {
//         const { name, value } = e.target
//         setTask(prev => ({
//             ...prev,
//             [name]: value === "" ? undefined : value,
//         }))
//     }

//     const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
//         e.preventDefault()
//         // Later: send to backend here
//         console.log("Task to create:", task)
//         try {
//             const response = await taskAPI.create(task)
//             setMessage("Successfully added")
//             onTaskCreated()
//             console.log(response)
//         } catch (err) {
//             console.log(err)
//         } finally {
//             setLoading(false)
//         }
//         // Optional: reset form
//         // setTask({ ...initial values })
//     }

//     return (
//         <div>
//             <h1>Task Creation</h1>

//             <form onSubmit={handleSubmit}>
//                 <div>
//                     <input
//                         name="title"
//                         type="text"
//                         placeholder="Task title"
//                         value={task.title}
//                         onChange={handleChange}
//                         required
//                     />
//                 </div>

//                 <div>
//                     <textarea
//                         name="description"
//                         placeholder="Description"
//                         value={task.description}
//                         onChange={handleChange}
//                     />
//                 </div>

//                 <div>
//                     <label>Priority</label>
//                     <select
//                         name="priority"
//                         value={task.priority ? "high" : "low"}
//                         onChange={(e) => {
//                             setTask(prev => ({
//                                 ...prev,
//                                 priority: e.target.value === "high"
//                             }));
//                         }}
//                     >
//                         <option value="high">High</option>
//                         <option value="low">Low</option>
//                     </select>
//                 </div>

//                 <div>
//                     <label>Frequency</label>
//                     <select name="frequency" value={task.frequency ?? "once"} onChange={handleChange}>
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
//                         value={task.due_date ?? ""}
//                         onChange={handleChange}
//                     />
//                 </div>

//                 <div>
//                     <label>Estimated duration (minutes)</label>
//                     <input
//                         type="number"
//                         name="duration"
//                         placeholder="e.g. 30"
//                         value={task.duration ?? ""}
//                         onChange={handleChange}
//                         min="1"
//                     />
//                 </div>

//                 <button type="submit">Create Task</button>
//             </form>
//         </div>
//     )
// }

// export default TaskInput


import { useState } from 'react'
import type { CreateTask } from '@/types'
import { taskAPI } from "../../services/api"
import './TaskInput.css'

interface TaskInputProps {
    onTaskCreated: () => void;
    onCancel: () => void;
}

const TaskInput = ({ onTaskCreated, onCancel }: TaskInputProps) => {
    const [task, setTask] = useState<CreateTask>({
        title: "",
        description: "",
        priority: false,
        frequency: "once",
        due_date: new Date().toLocaleDateString('en-CA'),
        duration: undefined,
    })
    const [error, setError] = useState<string>("")
    const [loading, setLoading] = useState(false)

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target
        setTask(prev => ({
            ...prev,
            [name]: value === "" ? undefined : value,
        }))
    }

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            await taskAPI.create(task)
            onTaskCreated()
            // Reset form
            setTask({
                title: "",
                description: "",
                priority: false,
                frequency: "once",
                due_date: new Date().toLocaleDateString('en-CA'),
                duration: undefined,
            })
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create task')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="task-input-overlay" onClick={onCancel}>
            <div className="task-input-modal" onClick={(e) => e.stopPropagation()}>
                <div className="task-input-header">
                    <h2>Add New Task</h2>
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
                            placeholder="What do you need to do?"
                            value={task.title}
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
                            value={task.description}
                            onChange={handleChange}
                            rows={3}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="frequency">Frequency</label>
                            <select
                                id="frequency"
                                name="frequency"
                                value={task.frequency ?? "once"}
                                onChange={handleChange}
                            >
                                <option value="once">Once</option>
                                <option value="daily">Daily</option>
                                <option value="saturday">Every Saturday</option>
                                <option value="sunday">Every Sunday</option>
                                <option value="weekends">Weekends</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="priority">Priority</label>
                            <select
                                id="priority"
                                name="priority"
                                value={task.priority ? "high" : "low"}
                                onChange={(e) => {
                                    setTask(prev => ({
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
                            <label htmlFor="due_date">Due Date</label>
                            <input
                                id="due_date"
                                type="date"
                                name="due_date"
                                value={task.due_date ?? ""}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="duration">Duration (minutes)</label>
                            <input
                                id="duration"
                                type="number"
                                name="duration"
                                placeholder="e.g. 30"
                                value={task.duration ?? ""}
                                onChange={handleChange}
                                min="1"
                            />
                        </div>
                    </div>

                    <div className="task-input-actions">
                        <button type="button" onClick={onCancel} className="btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? (
                                <>
                                    <div className="spinner" />
                                    Creating...
                                </>
                            ) : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default TaskInput