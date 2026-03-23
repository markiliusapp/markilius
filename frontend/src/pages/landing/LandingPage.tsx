import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import BrandLogo from '../../components/brandLogo/BrandLogo';
import HeatmapMock from '../../components/heatmapMock/HeatmapMock';
import { MOCK_CELLS, MOCK_ARENAS } from '../../components/heatmapMock/mockData';
import './LandingPage.css';
import Footer from '../../components/footer/Footer';



const LandingPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    return (
        <div className="landing">
            {/* Nav */}
            <nav className="landing-nav">
                <BrandLogo size="sm" />
                <div className="landing-nav-links">
                    <button className="landing-nav-link" onClick={() => navigate('/manifesto')}>Who it's for</button>
                    <button className="landing-nav-link" onClick={() => navigate('/pricing')}>Pricing</button>
                    {user ? (
                        <button className="landing-btn-primary" onClick={() => navigate('/dashboard')}>Go to app</button>
                    ) : (
                        <>
                            <button className="landing-nav-cta-ghost" onClick={() => navigate('/login')}>Log in</button>
                            <button className="landing-btn-primary" onClick={() => navigate('/register')}>Get started</button>
                        </>
                    )}
                </div>
            </nav>

            {/* Hero */}
            <section className="landing-hero">
                <div className="landing-hero-inner">
                    <p className="landing-hero-eyebrow">Your consistency, made visible.</p>
                    <h1 className="landing-hero-headline">
                        See who you<br />actually are.
                    </h1>
                    <p className="landing-hero-sub">
                        Markilius is a consistency mirror. You add what you commit to.
                        It shows you whether you showed up. That's it.
                    </p>
                    <div className="landing-hero-actions">
                        <button className="landing-btn-primary landing-btn-lg" onClick={() => navigate('/register')}>
                            Get started
                        </button>
                        <button className="landing-btn-ghost landing-btn-lg" onClick={() => navigate('/pricing')}>
                            View pricing
                        </button>
                    </div>
                </div>

                <div className="landing-hero-visual">
                    <HeatmapMock
                        title="March 2026"
                        subtitle="68% consistent"
                        cells={MOCK_CELLS}
                        arenas={MOCK_ARENAS}
                    />
                </div>
            </section>

            {/* Divider quote */}
            <div className="landing-quote">
                <blockquote>
                    "Waste no more time arguing what a good man should be. Be one."
                    <cite>— Marcus Aurelius, Meditations</cite>
                </blockquote>
            </div>

            {/* Philosophy */}
            <section className="landing-section">
                <div className="landing-section-inner">
                    <div className="landing-philosophy-grid">
                        <div className="landing-philosophy-left">
                            <h2 className="landing-philosophy-headline">
                                The gap between<br />
                                <em>who you are</em><br />
                                and who you<br />
                                intend to be.
                            </h2>
                        </div>
                        <div className="landing-philosophy-right">
                            <div className="landing-philosophy-item">
                                <p className="landing-philosophy-item-label">The mirror</p>
                                <p className="landing-philosophy-item-body">Marcus Aurelius kept the Meditations not for an audience — but as a private confrontation with himself. Markilius is that practice made digital. Your record is your record.</p>
                            </div>
                            <div className="landing-philosophy-item">
                                <p className="landing-philosophy-item-label">No judgment</p>
                                <p className="landing-philosophy-item-body">The app doesn't motivate. It doesn't guilt. A 60% month isn't a failure — it's a number. What you do with it is yours.</p>
                            </div>
                            <div className="landing-philosophy-item">
                                <p className="landing-philosophy-item-label">The lock</p>
                                <p className="landing-philosophy-item-body">Once a deadline passes, that task is sealed. You cannot go back. You cannot quietly delete the evidence. Your record is permanent, exactly like it should be.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Quote */}
            <div className="landing-quote">
                <blockquote>
                    "You have power over your mind — not outside events. Realize this, and you will find strength."
                    <cite>— Marcus Aurelius, Meditations</cite>
                </blockquote>
            </div>

            {/* How it works */}
            <section className="landing-section" id="how">
                <div className="landing-section-inner">
                    <p className="landing-how-label">How it works</p>
                    <div className="landing-steps">
                        <div className="landing-step">
                            <span className="landing-step-num">01</span>
                            <h3 className="landing-step-title">Set your arenas</h3>
                            <p className="landing-step-body">Arenas are your life pillars — Fitness, Learning, Work, whatever matters to you. Every task belongs to one. No untagged tasks, no vague intentions.</p>
                        </div>
                        <div className="landing-step">
                            <span className="landing-step-num">02</span>
                            <h3 className="landing-step-title">Log what you intend to do</h3>
                            <p className="landing-step-body">Add tasks with deadlines. Not aspirations — commitments. The app records what you said you'd do.</p>
                        </div>
                        <div className="landing-step">
                            <span className="landing-step-num">03</span>
                            <h3 className="landing-step-title">Show up — or don't</h3>
                            <p className="landing-step-body">When the deadline passes, the task locks. Permanently. You complete it or you don't. Either way, the heatmap remembers.</p>
                        </div>
                        <div className="landing-step">
                            <span className="landing-step-num">04</span>
                            <h3 className="landing-step-title">Read your record</h3>
                            <p className="landing-step-body">The heatmap is your year, made visible. Every Sunday, a plain summary of your week. Every month, your number — no commentary, no spin.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <div className="landing-final">
                <div className="landing-final-inner">
                    <h2 className="landing-final-headline">
                        This is your<br />
                        <em>record.</em><br />
                        It starts today.
                    </h2>
                    <button
                        className="landing-btn-primary landing-btn-lg"
                        onClick={() => navigate(user ? '/dashboard' : '/register')}
                    >
                        {user ? 'Go to your record' : 'Get started'}
                    </button>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default LandingPage;
