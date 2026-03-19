import { useState, useEffect } from 'react';
import { arenaAPI } from '@/services/api';
import type { ArenaResponse } from '@/types';
import DashboardLayout from '@/components/DashBoardLayout';
import './ArenasPage.css';

interface EditState {
    id: number;
    name: string;
    color: string;
}

const ArenasPage = () => {
    const [arenas, setArenas] = useState<ArenaResponse[]>([]);
    const [archived, setArchived] = useState<ArenaResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const [editState, setEditState] = useState<EditState | null>(null);
    const [editLoading, setEditLoading] = useState(false);

    const [showAddForm, setShowAddForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState('#6366f1');
    const [addLoading, setAddLoading] = useState(false);
    const [addError, setAddError] = useState('');

    const fetchArenas = async () => {
        try {
            const [active, archivedList] = await Promise.all([
                arenaAPI.getAll(),
                arenaAPI.getArchived(),
            ]);
            setArenas(active);
            setArchived(archivedList);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to load arenas.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchArenas();
    }, []);

    const startEdit = (arena: ArenaResponse) => {
        setEditState({ id: arena.id, name: arena.name, color: arena.color });
    };

    const cancelEdit = () => {
        setEditState(null);
    };

    const saveEdit = async () => {
        if (!editState) return;
        setEditLoading(true);
        try {
            await arenaAPI.update(editState.id, { name: editState.name, color: editState.color });
            await fetchArenas();
            setEditState(null);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to update arena.');
        } finally {
            setEditLoading(false);
        }
    };

    const handleArchive = async (arenaId: number) => {
        try {
            await arenaAPI.archive(arenaId);
            await fetchArenas();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to archive arena.');
        }
    };

    const handleRestore = async (arenaId: number) => {
        try {
            await arenaAPI.restore(arenaId);
            await fetchArenas();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to restore arena.');
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;
        setAddLoading(true);
        setAddError('');
        try {
            await arenaAPI.create({ name: newName.trim(), color: newColor });
            await fetchArenas();
            setNewName('');
            setNewColor('#6366f1');
            setShowAddForm(false);
        } catch (err: unknown) {
            setAddError(err instanceof Error ? err.message : 'Failed to create arena.');
        } finally {
            setAddLoading(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="page-loading">
                    <p>Loading arenas...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="arenas-page">
                <div className="page-header">
                    <h1>Manage Arenas</h1>
                    <button
                        className="arenas-add-btn"
                        onClick={() => { setShowAddForm(prev => !prev); setAddError(''); }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add Arena
                    </button>
                </div>

                {error && (
                    <div className="arenas-error">{error}</div>
                )}

                {/* Add Form */}
                {showAddForm && (
                    <div className="arenas-card arenas-add-form">
                        <h2 className="arenas-card-title">New Arena</h2>
                        {addError && <div className="arenas-error">{addError}</div>}
                        <form onSubmit={handleAdd} className="arenas-inline-form">
                            <div className="arenas-inline-form-fields">
                                <input
                                    type="text"
                                    className="arenas-input"
                                    placeholder="Arena name"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    required
                                    autoFocus
                                />
                                <div className="arenas-color-field">
                                    <input
                                        type="color"
                                        className="arenas-color-input"
                                        value={newColor}
                                        onChange={e => setNewColor(e.target.value)}
                                    />
                                    <span className="arenas-color-label">Color</span>
                                </div>
                            </div>
                            <div className="arenas-inline-form-actions">
                                <button
                                    type="button"
                                    className="arenas-btn arenas-btn--ghost"
                                    onClick={() => { setShowAddForm(false); setAddError(''); }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="arenas-btn arenas-btn--primary"
                                    disabled={addLoading}
                                >
                                    {addLoading ? 'Creating...' : 'Create Arena'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Active Arenas */}
                <div className="arenas-card">
                    <h2 className="arenas-card-title">Active Arenas</h2>
                    {arenas.length === 0 ? (
                        <p className="arenas-empty">No active arenas. Create one above.</p>
                    ) : (
                        <ul className="arenas-list">
                            {arenas.map(arena => (
                                <li key={arena.id} className="arenas-list-item">
                                    {editState?.id === arena.id ? (
                                        <div className="arenas-edit-row">
                                            <input
                                                type="color"
                                                className="arenas-color-input"
                                                value={editState.color}
                                                onChange={e => setEditState(s => s ? { ...s, color: e.target.value } : s)}
                                            />
                                            <input
                                                type="text"
                                                className="arenas-input arenas-input--inline"
                                                value={editState.name}
                                                onChange={e => setEditState(s => s ? { ...s, name: e.target.value } : s)}
                                                autoFocus
                                            />
                                            <div className="arenas-edit-actions">
                                                <button
                                                    className="arenas-btn arenas-btn--primary arenas-btn--sm"
                                                    onClick={saveEdit}
                                                    disabled={editLoading}
                                                >
                                                    {editLoading ? 'Saving...' : 'Save'}
                                                </button>
                                                <button
                                                    className="arenas-btn arenas-btn--ghost arenas-btn--sm"
                                                    onClick={cancelEdit}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="arenas-item-row">
                                            <div className="arenas-item-info">
                                                <span
                                                    className="arenas-color-swatch"
                                                    style={{ backgroundColor: arena.color }}
                                                />
                                                <span className="arenas-item-name">{arena.name}</span>
                                            </div>
                                            <div className="arenas-item-actions">
                                                <button
                                                    className="arenas-icon-btn"
                                                    onClick={() => startEdit(arena)}
                                                    title="Edit arena"
                                                >
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    className="arenas-icon-btn arenas-icon-btn--danger"
                                                    onClick={() => handleArchive(arena.id)}
                                                    title="Archive arena"
                                                >
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="21 8 21 21 3 21 3 8" />
                                                        <rect x="1" y="3" width="22" height="5" />
                                                        <line x1="10" y1="12" x2="14" y2="12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Archived Arenas */}
                <div className="arenas-card arenas-card--muted">
                    <button
                        className="arenas-archived-toggle"
                        onClick={() => setShowArchived(prev => !prev)}
                    >
                        <span className="arenas-card-title">Archived Arenas</span>
                        <div className="arenas-archived-toggle-right">
                            <span className="arenas-count">{archived.length}</span>
                            <svg
                                width="16" height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ transform: showArchived ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                            >
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </div>
                    </button>

                    {showArchived && (
                        archived.length === 0 ? (
                            <p className="arenas-empty">No archived arenas.</p>
                        ) : (
                            <ul className="arenas-list arenas-list--archived">
                                {archived.map(arena => (
                                    <li key={arena.id} className="arenas-list-item">
                                        <div className="arenas-item-row">
                                            <div className="arenas-item-info">
                                                <span
                                                    className="arenas-color-swatch arenas-color-swatch--faded"
                                                    style={{ backgroundColor: arena.color }}
                                                />
                                                <span className="arenas-item-name arenas-item-name--archived">{arena.name}</span>
                                            </div>
                                            <button
                                                className="arenas-btn arenas-btn--ghost arenas-btn--sm"
                                                onClick={() => handleRestore(arena.id)}
                                            >
                                                Restore
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ArenasPage;
