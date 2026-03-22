import { useState, useEffect, useRef } from 'react';
import type { ArenaResponse } from '@/types';
import './ArenaManagerList.css';

export const ARENA_PALETTE = [
    '#f97316', // orange (brand)
    '#ef4444', // red
    '#f59e0b', // amber
    '#84cc16', // lime
    '#22c55e', // green
    '#10b981', // emerald
    '#14b8a6', // teal
    '#06b6d4', // cyan
    '#3b82f6', // blue
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#d946ef', // fuchsia
    '#ec4899', // pink
    '#a8a29e', // stone
    '#64748b', // slate
];

interface ArenaManagerListProps {
    arenas: ArenaResponse[];
    onColorChange: (arena: ArenaResponse, color: string) => void;
    onNameBlur: (arena: ArenaResponse, newName: string) => void;
    onRemove: (arenaId: number) => void;
    showAdd?: boolean;
    onAdd?: (name: string, color: string) => void;
    archivedArenas?: ArenaResponse[];
    showArchived?: boolean;
    onToggleArchived?: () => void;
    onRestore?: (arenaId: number) => void;
}

const ArenaManagerList = ({
    arenas,
    onColorChange,
    onNameBlur,
    onRemove,
    showAdd,
    onAdd,
    archivedArenas,
    showArchived,
    onToggleArchived,
    onRestore,
}: ArenaManagerListProps) => {
    const [editNames, setEditNames] = useState<Record<number, string>>({});
    const [openPaletteId, setOpenPaletteId] = useState<string | null>(null);
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState(ARENA_PALETTE[0]);
    const [addLoading, setAddLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!openPaletteId) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpenPaletteId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openPaletteId]);

    useEffect(() => {
        const names: Record<number, string> = {};
        arenas.forEach(a => { names[a.id] = a.name; });
        setEditNames(prev => {
            const merged = { ...names };
            // preserve any unsaved edits
            arenas.forEach(a => {
                if (prev[a.id] !== undefined && prev[a.id] !== a.name) {
                    merged[a.id] = prev[a.id];
                }
            });
            return merged;
        });
    }, [arenas]);

    const handleAdd = async () => {
        if (!newName.trim() || !onAdd) return;
        setAddLoading(true);
        try {
            await onAdd(newName.trim(), newColor);
            setNewName('');
            setNewColor(ARENA_PALETTE[0]);
        } finally {
            setAddLoading(false);
        }
    };

    const PalettePop = ({ currentColor, onSelect }: { currentColor: string; onSelect: (c: string) => void }) => (
        <div className="aml-palette">
            {ARENA_PALETTE.map(color => (
                <button
                    key={color}
                    type="button"
                    className={`aml-palette-swatch ${currentColor === color ? 'selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => onSelect(color)}
                />
            ))}
        </div>
    );

    return (
        <div className="aml-container" ref={containerRef}>
            {arenas.map(arena => (
                <div key={arena.id} className="aml-row">
                    <div className="aml-row-left">
                        <div className="aml-swatch-wrapper">
                            <button
                                type="button"
                                className="aml-swatch"
                                style={{ backgroundColor: arena.color }}
                                onClick={() => setOpenPaletteId(openPaletteId === `a-${arena.id}` ? null : `a-${arena.id}`)}
                                title="Change color"
                            />
                            {openPaletteId === `a-${arena.id}` && (
                                <PalettePop
                                    currentColor={arena.color}
                                    onSelect={color => { onColorChange(arena, color); setOpenPaletteId(null); }}
                                />
                            )}
                        </div>
                        <input
                            type="text"
                            className="aml-name-input"
                            value={editNames[arena.id] ?? arena.name}
                            onChange={e => setEditNames(prev => ({ ...prev, [arena.id]: e.target.value }))}
                            onBlur={() => onNameBlur(arena, editNames[arena.id] ?? arena.name)}
                        />
                    </div>
                    <button
                        type="button"
                        className="aml-remove-btn"
                        title="Archive arena"
                        onClick={() => onRemove(arena.id)}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="21 8 21 21 3 21 3 8" />
                            <rect x="1" y="3" width="22" height="5" />
                            <line x1="10" y1="12" x2="14" y2="12" />
                        </svg>
                    </button>
                </div>
            ))}

            {/* Add row */}
            {showAdd && onAdd && (
                <div className={`aml-row aml-add-row ${arenas.length >= 8 ? 'aml-add-row--disabled' : ''}`} title={arenas.length >= 8 ? 'Arena limit reached. Remove one to add another.' : undefined}>
                    <div className="aml-row-left">
                        <div className="aml-swatch-wrapper">
                            <button
                                type="button"
                                className="aml-swatch"
                                style={{ backgroundColor: newColor }}
                                onClick={() => arenas.length < 8 && setOpenPaletteId(openPaletteId === 'new' ? null : 'new')}
                                disabled={arenas.length >= 8}
                                title="Pick color"
                            />
                            {openPaletteId === 'new' && (
                                <PalettePop
                                    currentColor={newColor}
                                    onSelect={color => { setNewColor(color); setOpenPaletteId(null); }}
                                />
                            )}
                        </div>
                        <input
                            type="text"
                            className="aml-name-input"
                            placeholder={arenas.length >= 8 ? 'Arena limit reached' : 'New arena...'}
                            value={newName}
                            disabled={arenas.length >= 8}
                            onChange={e => setNewName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
                        />
                    </div>
                    <button
                        type="button"
                        className="aml-add-btn"
                        onClick={handleAdd}
                        disabled={addLoading || !newName.trim() || arenas.length >= 8}
                        title={arenas.length >= 8 ? 'Arena limit reached. Remove one to add another.' : 'Add arena'}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Archived section */}
            {archivedArenas !== undefined && onToggleArchived && (
                <div className="aml-archived-section">
                    <button type="button" className="aml-archived-toggle" onClick={onToggleArchived}>
                        <svg
                            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            className={`aml-archived-chevron ${showArchived ? 'aml-archived-chevron--open' : ''}`}
                        >
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                        Archived
                        {archivedArenas.length > 0 && (
                            <span className="aml-archived-count">{archivedArenas.length}</span>
                        )}
                    </button>
                    {showArchived && (
                        <div className="aml-archived-list">
                            {archivedArenas.length === 0 ? (
                                <p className="aml-archived-empty">No archived arenas</p>
                            ) : (
                                archivedArenas.map(arena => (
                                    <div key={arena.id} className="aml-archived-row">
                                        <span className="aml-dot" style={{ backgroundColor: arena.color }} />
                                        <span className="aml-archived-name">{arena.name}</span>
                                        {onRestore && (
                                            <button type="button" className="aml-restore-btn" onClick={() => onRestore(arena.id)} title="Restore">
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="1 4 1 10 7 10" />
                                                    <path d="M3.51 15a9 9 0 1 0 .49-4.46" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ArenaManagerList;
