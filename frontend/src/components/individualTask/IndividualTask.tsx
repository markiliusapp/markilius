import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { taskAPI } from "@/services/api"
import type { TaskResponse } from "@/types"
import TaskInput from '../taskinput/TaskInput'
import './IndividualTask.css'

interface IndividualTaskProps {
    task: TaskResponse;
    onToggle: () => void;
    compact?: boolean;
}

const IndividualTask = ({ task, onToggle, compact }: IndividualTaskProps) => {
    const [editMode, setEditMode] = useState(false)
    const [showActions, setShowActions] = useState(false)
    const [expanded, setExpanded] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!showActions) return
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node))
                setShowActions(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [showActions])

    const handleCompleteToggle = async () => {
        if (task.is_locked) return;
        try {
            await taskAPI.toggleComplete(task.id)
            onToggle()
        } catch (err) {
            console.error(err)
        }
    }

    const handleDelete = async () => {
        try {
            await taskAPI.delete(task.id)
            onToggle()
        } catch (err) {
            console.error(err)
        }
    }

    const handleEditClick = () => {
        setEditMode(true)
        setShowActions(false)
    }

    const handleDeleteSeries = async () => {
        try {
            await taskAPI.deleteSeries(task.id)
            onToggle()
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <>
            {editMode && createPortal(
                <TaskInput
                    task={task}
                    onTaskCreated={() => { setEditMode(false); onToggle(); }}
                    onCancel={() => setEditMode(false)}
                />,
                document.body
            )}

            <div
                className={`individual-task ${task.is_locked ? 'task-locked' : ''} ${task.is_completed ? 'task-completed' : ''} ${compact ? 'task-compact' : ''} ${compact && expanded ? 'task-compact-expanded' : ''}`}
                style={{
                    '--arena-color': task.arena?.color,
                    backgroundColor: task.arena ? `${task.arena.color}12` : undefined,
                } as React.CSSProperties}
                onClick={compact ? () => setExpanded(v => !v) : undefined}
            >
                <div className="task-content">
                    {task.is_locked && (
                        <div className="task-locked-badge">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            Locked
                        </div>
                    )}

                    <div className="task-header">
                        <div className="task-header-left">
                            <button
                                onClick={e => { e.stopPropagation(); handleCompleteToggle(); }}
                                className={`task-checkbox ${task.is_completed ? 'task-checkbox-checked' : ''}`}
                                style={{ borderColor: task.arena?.color ?? 'var(--color-border)' }}
                                title={task.is_locked ? 'Can not modify past due date tasks' : undefined}
                            >
                                {task.is_completed && (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                )}
                            </button>
                            <h3 className={task.is_completed ? 'task-completed' : ''}>{task.title}</h3>
                        </div>

                        <div className="task-header-right" ref={menuRef}>
                            {compact && !expanded && task.is_locked ? (
                                <span className="task-compact-lock">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                </span>
                            ) : (!compact || expanded) && (
                                task.is_locked ? (
                                    <button
                                        className="task-menu-btn task-menu-btn--locked"
                                        title="This task is locked. The deadline passed."
                                        disabled
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" />
                                        </svg>
                                    </button>
                                ) : (
                                    <button onClick={e => { e.stopPropagation(); setShowActions(!showActions); }} className="task-menu-btn">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" />
                                        </svg>
                                    </button>
                                )
                            )}

                            {(!compact || expanded) && showActions && (
                                <div className="task-actions-menu">
                                    <button onClick={handleEditClick}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                        Edit
                                    </button>
                                    <button onClick={handleDelete} className="delete-btn">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                        Delete
                                    </button>
                                    {task.group_id && task.frequency !== 'once' && (
                                        <button onClick={handleDeleteSeries} className="delete-btn">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                <line x1="10" y1="11" x2="10" y2="17" />
                                                <line x1="14" y1="11" x2="14" y2="17" />
                                            </svg>
                                            Delete Series
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="task-details">
                        {task.description && <p className="task-description">{task.description}</p>}
                        <div className="task-meta">
                            {task.arena && (
                                <span className="task-meta-item">
                                    <span className="task-arena-dot" style={{ backgroundColor: task.arena.color }} />
                                    {task.arena.name}
                                </span>
                            )}
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
                </div>
            </div>

        </>
    )
}

export default IndividualTask