import { useState, useEffect } from 'react'
import type { ArenaResponse } from '@/types'
import { arenaAPI } from '@/services/api'
import ArenaManagerList from '@/components/arenaManagerList/ArenaManagerList'
import './Arena.css'

interface ArenaProps {
    selectedArenaId?: number;
    onSelect: (arenaId: number) => void;
    onArenaChange?: () => void;
}

const Arena = ({ selectedArenaId, onSelect, onArenaChange }: ArenaProps) => {
    const [arenas, setArenas] = useState<ArenaResponse[]>([])
    const [archivedArenas, setArchivedArenas] = useState<ArenaResponse[]>([])
    const [managing, setManaging] = useState(false)
    const [showArchived, setShowArchived] = useState(false)

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

    const handleCreate = async (name: string, color: string) => {
        try {
            const created = await arenaAPI.create({ name, color })
            setArenas(prev => [...prev, created])
            onSelect(created.id)
        } catch (err) {
            console.error(err)
        }
    }

    const handleRemove = async (arenaId: number) => {
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
            onArenaChange?.()
        } catch (err) {
            console.error(err)
        }
    }

    const handleRestore = async (arenaId: number) => {
        try {
            await arenaAPI.restore(arenaId)
            await refreshArenas()
            await refreshArchivedArenas()
            onArenaChange?.()
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
            await arenaAPI.updateColor(arena.id, { color })
            await refreshArenas()
            onArenaChange?.()
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <div className="arena-container">
            <label className="arena-label">Arena</label>

            {/* Arena selector pills */}
            <div className="arena-selector">
                {arenas.length === 0 && (
                    <p className="arena-selector-empty">No arenas yet — create one below</p>
                )}
                {arenas.map(arena => (
                    <button
                        key={arena.id}
                        type="button"
                        className="arena-pill"
                        style={{
                            borderColor: selectedArenaId === arena.id ? arena.color : `${arena.color}40`,
                            backgroundColor: selectedArenaId === arena.id ? `${arena.color}25` : `${arena.color}12`,
                            color: selectedArenaId === arena.id ? arena.color : 'var(--color-text-secondary)',
                        }}
                        onClick={() => onSelect(arena.id)}
                    >
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
                    <ArenaManagerList
                        arenas={arenas}
                        onColorChange={handleColorChange}
                        onNameBlur={handleNameBlur}
                        onRemove={handleRemove}
                        showAdd
                        onAdd={handleCreate}
                        archivedArenas={archivedArenas}
                        showArchived={showArchived}
                        onToggleArchived={handleToggleArchived}
                        onRestore={handleRestore}
                    />
                </div>
            )}
        </div>
    )
}

export default Arena
