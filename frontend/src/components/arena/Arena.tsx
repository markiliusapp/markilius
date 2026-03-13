import { useState, useEffect } from 'react'
import type { ArenaResponse } from '@/types'
import { arenaAPI } from '@/services/api'
import './Arena.css'

interface ArenaProps {
    selectedArenaId?: number;
    onSelect: (arenaId: number | undefined) => void;
}

const Arena = ({ selectedArenaId, onSelect }: ArenaProps) => {
    const [arenas, setArenas] = useState<ArenaResponse[]>([])
    const [managing, setManaging] = useState(false)
    const [newArenaName, setNewArenaName] = useState("")
    const [newArenaColor, setNewArenaColor] = useState("#f97316")
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const fetchArenas = async () => {
            try {
                const data = await arenaAPI.getAll()
                setArenas(data)
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

    const handleCreate = async () => {
        if (!newArenaName.trim()) return
        setLoading(true)
        try {
            const created = await arenaAPI.create({ name: newArenaName.trim(), color: newArenaColor })
            setArenas(prev => [...prev, created])
            setNewArenaName("")
            setNewArenaColor("#f97316")
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (arenaId: number) => {
        try {
            await arenaAPI.delete(arenaId)
            setArenas(prev => prev.filter(a => a.id !== arenaId))
            if (selectedArenaId === arenaId) onSelect(undefined)
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
                <button
                    type="button"
                    className="arena-pill"
                    style={{
                        borderColor: !selectedArenaId ? 'var(--color-primary)' : 'var(--color-border)',
                        backgroundColor: !selectedArenaId ? 'var(--color-bg-muted)' : 'transparent',
                    }}
                    onClick={() => onSelect(undefined)}
                >
                    None
                </button>
                {arenas.map(arena => (
                    <button
                        key={arena.id}
                        type="button"
                        className="arena-pill"
                        style={{
                            borderColor: selectedArenaId === arena.id ? arena.color : 'var(--color-border)',
                            backgroundColor: selectedArenaId === arena.id ? `${arena.color}20` : 'transparent',
                        }}
                        onClick={() => onSelect(selectedArenaId === arena.id ? undefined : arena.id)}
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
                                className="arena-delete-btn"
                                onClick={() => handleDelete(arena.id)}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
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
                </div>
            )}
        </div>
    )
}

export default Arena