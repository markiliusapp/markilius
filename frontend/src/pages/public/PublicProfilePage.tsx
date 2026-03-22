import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { publicAPI } from '@/services/api';
import CompactHeatmap from '@/components/compactHeatmap/CompactHeatmap';
import AuthHeader from '@/components/authHeader/AuthHeader';
import type { YearlyProductivity } from '@/types';
import './PublicProfilePage.css';

const PublicProfilePage = () => {
    const { publicId } = useParams<{ publicId: string }>();
    const [searchParams] = useSearchParams();
    const arenaIdParam = searchParams.get('arena');
    const filteredArenaId = arenaIdParam ? parseInt(arenaIdParam) : null;
    const [firstName, setFirstName] = useState<string | null>(null);
    const [yearlyData, setYearlyData] = useState<YearlyProductivity | null>(null);
    const [year, setYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!publicId) return;
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const profile = await publicAPI.getProfile(publicId);
                setFirstName(profile.first_name);
                const data = await publicAPI.getYearlyProductivity(publicId, year);
                setYearlyData(data);
            } catch {
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [publicId, year]);

    if (loading) {
        return (
            <div className="public-page">
                <AuthHeader />
                <div className="public-loading">Loading...</div>
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="public-page">
                <AuthHeader />
                <div className="public-not-found">
                    <h2>Profile not found</h2>
                    <p>This profile doesn't exist or has been made private.</p>
                </div>
            </div>
        );
    }

    const allArenas = yearlyData?.summary?.arenas ?? [];
    const arenas = filteredArenaId
        ? allArenas.filter(a => a.arena_id === filteredArenaId)
        : allArenas;

    return (
        <div className="public-page">
            <AuthHeader />
            <div className="public-container">
                <div className="public-header">
                    <div className="public-avatar">
                        {firstName?.[0]?.toUpperCase()}
                    </div>
                    <div>
                        <h1 className="public-name">{firstName} on Markilius</h1>
                        <p className="public-sub">markilius</p>
                    </div>
                </div>

                <div className="public-heatmap-card">
                    <div className="public-heatmap-header">
                        <span className="public-heatmap-title">Activity in {year}</span>
                        <div className="public-year-nav">
                            <button
                                className="public-year-btn"
                                onClick={() => setYear(y => y - 1)}
                            >&#8249;</button>
                            <span className="public-year-label">{year}</span>
                            <button
                                className="public-year-btn"
                                onClick={() => setYear(y => y + 1)}
                                disabled={year >= new Date().getFullYear()}
                            >&#8250;</button>
                        </div>
                    </div>
                    {yearlyData && (
                        <CompactHeatmap
                            year={year}
                            data={yearlyData.daily_breakdown}
                            arenas={arenas}
                            showOverall={!filteredArenaId}
                        />

                    )}
                </div>

                <div className="public-footer">
                    <a href="/" className="public-footer-link">Powered by Markilius</a>
                </div>
            </div>
        </div>
    );
};

export default PublicProfilePage;
