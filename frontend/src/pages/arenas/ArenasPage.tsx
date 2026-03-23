import { useState, useEffect } from 'react';
import { arenaAPI } from '@/services/api';
import type { ArenaResponse } from '@/types';
import DashboardLayout from '@/components/DashBoardLayout';
import ArenaManagerList from '@/components/arenaManagerList/ArenaManagerList';
import './ArenasPage.css';
import { useDismissOnClick } from '@/hooks/useDismissOnClick';

const ArenasPage = () => {
    const [arenas, setArenas] = useState<ArenaResponse[]>([]);
    const [archived, setArchived] = useState<ArenaResponse[]>([]);
    const [showArchived, setShowArchived] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useDismissOnClick(() => setError(''), !!error)

    const fetchAll = async () => {
        try {
            const [active, archivedList] = await Promise.all([
                arenaAPI.getAll(),
                arenaAPI.getArchived(),
            ]);
            setArenas(active);
            setArchived(archivedList);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load arenas.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    const handleColorChange = async (arena: ArenaResponse, color: string) => {
        setArenas(prev => prev.map(a => a.id === arena.id ? { ...a, color } : a));
        try {
            await arenaAPI.updateColor(arena.id, { color });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update color.');
        }
    };

    const handleNameBlur = async (arena: ArenaResponse, newName: string) => {
        if (!newName.trim() || newName.trim() === arena.name) return;
        try {
            await arenaAPI.update(arena.id, { name: newName.trim() });
            setArenas(prev => prev.map(a => a.id === arena.id ? { ...a, name: newName.trim() } : a));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update name.');
        }
    };

    const handleRemove = async (arenaId: number) => {
        const removed = arenas.find(a => a.id === arenaId);
        setArenas(prev => prev.filter(a => a.id !== arenaId));
        if (removed) setArchived(prev => [{ ...removed, is_archived: true }, ...prev]);
        try {
            await arenaAPI.archive(arenaId);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to archive arena.');
        }
    };

    const handleAdd = async (name: string, color: string) => {
        try {
            const created = await arenaAPI.create({ name, color });
            setArenas(prev => [...prev, created]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create arena.');
        }
    };

    const handleRestore = async (arenaId: number) => {
        try {
            await arenaAPI.restore(arenaId);
            await fetchAll();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to restore arena.');
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="page-loading"><p>Loading arenas...</p></div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="arenas-page">
                <div className="page-header">
                    <h1>Arenas</h1>
                </div>

                {error && <div className="arenas-error">{error}</div>}

                <div className="arenas-card">
                    <ArenaManagerList
                        arenas={arenas}
                        onColorChange={handleColorChange}
                        onNameBlur={handleNameBlur}
                        onRemove={handleRemove}
                        showAdd
                        onAdd={handleAdd}
                        archivedArenas={archived}
                        showArchived={showArchived}
                        onToggleArchived={() => setShowArchived(p => !p)}
                        onRestore={handleRestore}
                    />
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ArenasPage;
