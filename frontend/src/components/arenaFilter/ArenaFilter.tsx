import './ArenaFilter.css'

interface Arena {
    id: number
    name: string
    color: string
}

interface ArenaFilterProps {
    arenas: Arena[]
    selectedArenaId: number | null
    onSelect: (id: number | null) => void
}

const ArenaFilter = ({ arenas, selectedArenaId, onSelect }: ArenaFilterProps) => {
    if (arenas.length === 0) return null

    return (
        <div className="arena-filter">
            <button
                className={`arena-filter-pill ${!selectedArenaId ? 'active' : ''}`}
                onClick={() => onSelect(null)}
            >
                All
            </button>
            {arenas.map(arena => (
                <button
                    key={arena.id}
                    className={`arena-filter-pill ${selectedArenaId === arena.id ? 'active' : ''}`}
                    style={{
                        borderColor: selectedArenaId === arena.id ? arena.color : `${arena.color}40`,
                        backgroundColor: selectedArenaId === arena.id ? `${arena.color}25` : `${arena.color}12`,
                        color: selectedArenaId === arena.id ? arena.color : 'var(--color-text-secondary)',
                    }}
                    onClick={() => onSelect(selectedArenaId === arena.id ? null : arena.id)}
                >
                    {arena.name}
                </button>
            ))}
        </div>
    )
}

export default ArenaFilter
