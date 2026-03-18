import { useState, useEffect } from 'react'
import type { ArenaResponse } from '@/types'
import { arenaAPI } from '@/services/api'
import './Arena.css'

interface ArenaProps {
    selectedArenaId?: number;
    onSelect: (arenaId: number) => void;
}

const Arena = ({ selectedArenaId, onSelect }: ArenaProps) => {
    const [arenas, setArenas] = useState<ArenaResponse[]>([])
    const [archivedArenas, setArchivedArenas] = useState<ArenaResponse[]>([])
    const [managing, setManaging] = useState(false)
    const [showArchived, setShowArchived] = useState(false)
    const [newArenaName, setNewArenaName] = useState("")
    const [newArenaColor, setNewArenaColor] = useState("#f97316")
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const fetchArenas = async () => {
            try {
                const data = await arenaAPI.getAll()
                setArenas(data)
                if (!selectedArenaId && data.length > 0) {
                    onSelect(data[0].id)
                }
            } catch (err) {
                console.error(err)
            }
        }
        fetchArenas()
    }, [])

    const refreshArenas = async () => {
        const updated = await arenaAPI.getAll()
        setArenas(updated)
    }

    const refreshArchivedArenas = async () => {
        const updated = await arenaAPI.getArchived()
        setArchivedArenas(updated)
    }

    const handleToggleArchived = async () => {
        const next = !showArchived
        setShowArchived(next)
        if (next && archivedArenas.length === 0) {
            try {
                await refreshArchivedArenas()
            } catch (err) {
                console.error(err)
            }
        }
    }

    const handleCreate = async () => {
        if (!newArenaName.trim()) return
        setLoading(true)
        try {
            const created = await arenaAPI.create({ name: newArenaName.trim(), color: newArenaColor })
            setArenas(prev => [...prev, created])
            onSelect(created.id)
            setNewArenaName("")
            setNewArenaColor("#f97316")
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleArchive = async (arenaId: number) => {
        try {
            await arenaAPI.archive(arenaId)
            const updated = arenas.filter(a => a.id !== arenaId)
            setArenas(updated)
            if (selectedArenaId === arenaId && updated.length > 0) {
                onSelect(updated[0].id)
            }
            if (showArchived) {
                await refreshArchivedArenas()
            }
        } catch (err) {
            console.error(err)
        }
    }

    const handleRestore = async (arenaId: number) => {
        try {
            await arenaAPI.restore(arenaId)
            await refreshArenas()
            await refreshArchivedArenas()
        } catch (err) {
            console.error(err)
        }
    }

    const handleNameBlur = async (arena: ArenaResponse, newName: string) => {
        if (newName.trim() === arena.name || !newName.trim()) return
        try {
            await arenaAPI.update(arena.id, { name: newName.trim() })
            await refreshArenas()
        } catch (err) {
            console.error(err)
        }
    }

    const handleColorChange = async (arena: ArenaResponse, color: string) => {
        try {
            await arenaAPI.update(arena.id, { color })
            await refreshArenas()
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <div className="arena-container">
            <label className="arena-label">Arena</label>

            {/* Arena selector pills */}
            <div className="arena-selector">
                {arenas.map(arena => (
                    <button
                        key={arena.id}
                        type="button"
                        className="arena-pill"
                        style={{
                            borderColor: selectedArenaId === arena.id ? arena.color : 'var(--color-border)',
                            backgroundColor: selectedArenaId === arena.id ? `${arena.color}20` : 'transparent',
                        }}
                        onClick={() => onSelect(arena.id)}
                    >
                        <span className="arena-dot" style={{ backgroundColor: arena.color }} />
                        {arena.name}
                    </button>
                ))}
            </div>

            {/* Manage toggle */}
            <div className="arena-selector-footer">
                <button
                    type="button"
                    className="arena-manage-btn"
                    onClick={() => setManaging(!managing)}
                >
                    {managing ? 'Done' : 'Manage arenas'}
                </button>
            </div>

            {/* Inline manager */}
            {managing && (
                <div className="arena-manager">
                    {/* Active arenas */}
                    {arenas.map(arena => (
                        <div key={arena.id} className="arena-manager-row">
                            <input
                                type="color"
                                defaultValue={arena.color}
                                className="arena-color-picker"
                                onChange={(e) => handleColorChange(arena, e.target.value)}
                            />
                            <input
                                type="text"
                                defaultValue={arena.name}
                                className="arena-name-input"
                                onBlur={(e) => handleNameBlur(arena, e.target.value)}
                            />
                            <button
                                type="button"
                                className="arena-archive-btn"
                                title="Archive arena"
                                onClick={() => handleArchive(arena.id)}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="21 8 21 21 3 21 3 8" />
                                    <rect x="1" y="3" width="22" height="5" />
                                    <line x1="10" y1="12" x2="14" y2="12" />
                                </svg>
                            </button>
                        </div>
                    ))}

                    {/* New arena row */}
                    {arenas.length < 10 && (
                        <div className="arena-manager-row">
                            <input
                                type="color"
                                value={newArenaColor}
                                className="arena-color-picker"
                                onChange={(e) => setNewArenaColor(e.target.value)}
                            />
                            <input
                                type="text"
                                placeholder="New arena name..."
                                value={newArenaName}
                                className="arena-name-input"
                                onChange={(e) => setNewArenaName(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreate(); } }}
                            />
                            <button
                                type="button"
                                className="arena-add-btn"
                                onClick={handleCreate}
                                disabled={loading || !newArenaName.trim()}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                            </button>
                        </div>
                    )}

                    {/* Archived arenas section */}
                    <div className="arena-archived-section">
                        <button
                            type="button"
                            className="arena-archived-toggle"
                            onClick={handleToggleArchived}
                        >
                            <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={`arena-archived-chevron ${showArchived ? 'arena-archived-chevron--open' : ''}`}
                            >
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                            Archived arenas
                            {archivedArenas.length > 0 && (
                                <span className="arena-archived-count">{archivedArenas.length}</span>
                            )}
                        </button>

                        {showArchived && (
                            <div className="arena-archived-list">
                                {archivedArenas.length === 0 ? (
                                    <p className="arena-archived-empty">No archived arenas</p>
                                ) : (
                                    archivedArenas.map(arena => (
                                        <div key={arena.id} className="arena-manager-row arena-archived-row">
                                            <span className="arena-dot" style={{ backgroundColor: arena.color }} />
                                            <span className="arena-archived-name">{arena.name}</span>
                                            <button
                                                type="button"
                                                className="arena-restore-btn"
                                                title="Restore arena"
                                                onClick={() => handleRestore(arena.id)}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="1 4 1 10 7 10" />
                                                    <path d="M3.51 15a9 9 0 1 0 .49-4.46" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default Arena
