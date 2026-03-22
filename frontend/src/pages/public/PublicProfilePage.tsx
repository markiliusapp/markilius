import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { publicAPI } from '@/services/api';
import CompactHeatmap from '@/components/compactHeatmap/CompactHeatmap';
import Heatmap from '@/components/heatmap/Heatmap';
import { HeatmapLegend } from '@/components/heatmapLegend/HeatmapLegend';
import AuthHeader from '@/components/authHeader/AuthHeader';
import { hexToRgb } from '@/services/colorIntensity';
import type { YearlyProductivity, MonthlyProductivity } from '@/types';
import './PublicProfilePage.css';
import Footer from '@/components/footer/Footer';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const PublicProfilePage = () => {
    const { publicId } = useParams<{ publicId: string }>();
    const [searchParams] = useSearchParams();

    const arenaIdParam = searchParams.get('arena');
    const filteredArenaId = arenaIdParam ? parseInt(arenaIdParam) : null;
    const yearParam = searchParams.get('year');
    const monthParam = searchParams.get('month');
    const isMonthView = !!yearParam && !!monthParam;

    const [firstName, setFirstName] = useState<string | null>(null);
    const [yearlyData, setYearlyData] = useState<YearlyProductivity | null>(null);
    const [monthlyData, setMonthlyData] = useState<MonthlyProductivity | null>(null);
    const [year] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!publicId) return;
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const profile = await publicAPI.getProfile(publicId);
                setFirstName(profile.first_name);
                if (isMonthView) {
                    const data = await publicAPI.getMonthlyProductivity(publicId, parseInt(yearParam!), parseInt(monthParam!));
                    setMonthlyData(data);
                } else {
                    const data = await publicAPI.getYearlyProductivity(publicId, year);
                    setYearlyData(data);
                }
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

    if (isMonthView && monthlyData) {
        const m = parseInt(monthParam!);
        const y = parseInt(yearParam!);
        const completion = monthlyData.summary.completion_percentage;
        const filteredArena = filteredArenaId
            ? monthlyData.summary.arenas.find(a => a.arena_id === filteredArenaId)
            : null;
        const legendColor = filteredArena ? hexToRgb(filteredArena.arena_color) : undefined;
        return (
            <div className="public-page">
                <AuthHeader />
                <div className="public-container public-container--month">
                    <div className="public-header">
                        <div>
                            <h1 className="public-name">{firstName}</h1>
                            <p className="public-sub">Proof of work</p>
                        </div>
                    </div>
                    {filteredArena && (
                        <div className="public-arena-badge">
                            <span className="public-arena-dot" style={{ backgroundColor: filteredArena.arena_color }} />
                            <span className="public-arena-name">{filteredArena.arena_name}</span>
                            <span className="public-arena-period">· {MONTH_NAMES[m - 1]} {y}</span>
                        </div>
                    )}
                    <div className="public-heatmap-card">
                        <Heatmap
                            year={y}
                            month={m}
                            data={monthlyData.daily_breakdown}
                            completion={completion}
                            selectedArenaId={filteredArenaId}
                        />
                        <HeatmapLegend color={legendColor} />
                    </div>
                </div>
                <Footer />
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
                    <div>
                        <h1 className="public-name">{firstName}</h1>
                        <p className="public-sub">Proof of work</p>
                    </div>
                </div>
                <div className="public-heatmap-card">
                    <div className="public-heatmap-header">
                        <span className="public-heatmap-title">{year}</span>
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
            </div>
            <Footer />
        </div>
    );
};

export default PublicProfilePage;
