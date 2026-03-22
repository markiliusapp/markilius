import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { arenaAPI } from '@/services/api';
import type { ArenaResponse } from '@/types';
import BrandLogo from '@/components/brandLogo/BrandLogo';
import ArenaManagerList from '@/components/arenaManagerList/ArenaManagerList';
import './Onboarding.css';

const OnboardingPage = () => {
    const navigate = useNavigate();
    const [statement, setStatement] = useState('');
    const [arenas, setArenas] = useState<ArenaResponse[]>([]);

    useEffect(() => {
        arenaAPI.getAll().then(setArenas).catch(console.error);
    }, []);

    const handleColorChange = async (arena: ArenaResponse, color: string) => {
        setArenas(prev => prev.map(a => a.id === arena.id ? { ...a, color } : a));
        try {
            await arenaAPI.updateColor(arena.id, { color });
        } catch (err) {
            console.error(err);
        }
    };

    const handleNameBlur = async (arena: ArenaResponse, newName: string) => {
        if (!newName.trim() || newName.trim() === arena.name) return;
        try {
            await arenaAPI.update(arena.id, { name: newName.trim() });
            setArenas(prev => prev.map(a => a.id === arena.id ? { ...a, name: newName.trim() } : a));
        } catch (err) {
            console.error(err);
        }
    };

    const handleRemove = async (arenaId: number) => {
        setArenas(prev => prev.filter(a => a.id !== arenaId));
        try {
            await arenaAPI.archive(arenaId);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="onboarding-page">
            <div className="onboarding-header">
                <BrandLogo size="sm" />
            </div>

            <div className="onboarding-content">
                <div className="onboarding-section">
                    <h1 className="onboarding-question">What are you working on becoming?</h1>
                </div>

                <div className="onboarding-section">
                    <h2 className="onboarding-section-title">Your arenas</h2>
                    <p className="onboarding-hint">Life doesn't happen in one dimension. An arena is a pillar — a domain of your life you've decided to show up for. Every task you create belongs to one. Your heatmap breaks down by arena, so you can see exactly where you're showing up and where you're not.</p>
                    <ArenaManagerList
                        arenas={arenas}
                        onColorChange={handleColorChange}
                        onNameBlur={handleNameBlur}
                        onRemove={handleRemove}
                    />
                </div>

                <div className="onboarding-actions">
                    <button className="onboarding-skip-btn" onClick={() => navigate('/dashboard/year')}>
                        Skip for now
                    </button>
                    <button className="onboarding-continue-btn" onClick={() => navigate('/dashboard/year')}>
                        Continue
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OnboardingPage;
