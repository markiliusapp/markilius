import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import BrandLogo from '../../components/brandLogo/BrandLogo';
import './LandingPage.css';

const FEATURES = [
    {
        icon: '▦',
        title: 'The Heatmap',
        description: 'Every cell is a day. Every colour is an answer to one question: did you show up? The heatmap is not data — it is identity made visible.',
    },
    {
        icon: '◈',
        title: 'Arenas',
        description: 'Divide your life into pillars — Work, Fitness, Learning, Creativity. Every task belongs to one. The heatmap breaks down by arena, not just overall.',
    },
    {
        icon: '↻',
        title: 'Recurring Commitments',
        description: 'Log what you commit to once. Daily, weekends, monthly. The schedule is set. All that remains is whether you kept it.',
    },
    {
        icon: '◎',
        title: 'Sunday Summary',
        description: 'Every Sunday morning, your week comes back to you. Not as a nudge — as a record. Your numbers, plainly. No spin.',
    },
    {
        icon: '⊞',
        title: 'The Public Profile',
        description: 'A shareable heatmap at markilius.com/u/you. Proof of work. Not followers, not likes — just your record, visible.',
    },
    {
        icon: '≡',
        title: 'Honest Numbers',
        description: 'Daily, weekly, monthly, yearly — your consistency, returned to you as data. No motivational language. Just the truth.',
    },
];

const STEPS = [
    {
        number: '01',
        title: 'Define your pillars',
        description: 'Name the areas of your life that matter — Work, Fitness, Learning, whatever they are. Give each a colour. These are your arenas.',
    },
    {
        number: '02',
        title: 'Log your commitments',
        description: 'Add what you plan to do. Set it to recur if it should. The input is simple. The log is honest.',
    },
    {
        number: '03',
        title: 'See your record',
        description: 'Your heatmap fills in day by day. A green month feels earned. A grey one tells you something worth hearing.',
    },
];

// Simulate a heatmap grid: 7 rows × 15 cols of cells
const HEATMAP_CELLS = (() => {
    const intensities = [0, 0, 0.2, 0.4, 0, 0.6, 0.8, 1, 0.4, 0, 0.2, 0.6, 0, 0.8, 0.4,
                         0.6, 0, 1, 0.2, 0.8, 0, 0.4, 0.6, 0.2, 0, 1, 0.4, 0.8, 0, 0.2,
                         0, 0.4, 0.6, 0.8, 0.2, 0.6, 0, 1, 0.4, 0, 0.8, 0.2, 0.4, 0, 0.6,
                         0.2, 0.8, 0, 0.4, 0.6, 0, 1, 0.2, 0.8, 0.4, 0, 0.6, 0.2, 0.8, 0,
                         0.8, 0.2, 0.4, 0, 1, 0.6, 0.2, 0.8, 0, 0.4, 0.6, 0.8, 0.2, 0, 0.4,
                         0, 0.6, 0.8, 0.2, 0.4, 1, 0, 0.6, 0.2, 0.8, 0.4, 0, 0.6, 0.2, 0.8,
                         0.4, 0, 1, 0.6, 0.2, 0, 0.8, 0.4, 0.6, 0.2, 0.8, 0, 0.4, 0.6, 0.2];
    return intensities;
})();

const LandingPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    return (
        <div className="landing">
            {/* Nav */}
            <nav className="landing-nav">
                <BrandLogo size="sm" />
                <div className="landing-nav-links">
                    <a href="#how-it-works" className="landing-nav-link">How it works</a>
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
                    <div className="landing-mock">
                        <div className="landing-mock-bar">
                            <span className="landing-mock-title">March 2026</span>
                            <span className="landing-mock-sub">68% consistent</span>
                        </div>
                        <div className="landing-mock-heatmap">
                            {HEATMAP_CELLS.map((intensity, i) => (
                                <div
                                    key={i}
                                    className="landing-mock-cell"
                                    style={{
                                        opacity: intensity === 0 ? 0.12 : 0.2 + intensity * 0.8,
                                        background: intensity === 0 ? 'var(--color-text-muted)' : '#f97316',
                                    }}
                                />
                            ))}
                        </div>
                        <div className="landing-mock-arenas">
                            {[
                                { label: 'Work', color: '#8b5cf6', pct: '80%' },
                                { label: 'Fitness', color: '#f97316', pct: '71%' },
                                { label: 'Learning', color: '#3b82f6', pct: '57%' },
                                { label: 'Mindfulness', color: '#10b981', pct: '43%' },
                            ].map(a => (
                                <div key={a.label} className="landing-mock-arena-row">
                                    <span className="landing-mock-arena-dot" style={{ background: a.color }} />
                                    <span className="landing-mock-arena-name">{a.label}</span>
                                    <div className="landing-mock-arena-bar-track">
                                        <div className="landing-mock-arena-bar-fill" style={{ width: a.pct, background: a.color }} />
                                    </div>
                                    <span className="landing-mock-arena-pct">{a.pct}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Divider quote */}
            <div className="landing-quote">
                <blockquote>
                    "Waste no more time arguing what a good man should be. Be one."
                    <cite>— Marcus Aurelius, Meditations</cite>
                </blockquote>
            </div>

            {/* Features */}
            <section className="landing-section" id="features">
                <div className="landing-section-inner">
                    <p className="landing-section-eyebrow">What it does</p>
                    <h2 className="landing-section-title">Everything in service of the mirror.</h2>
                    <div className="landing-features-grid">
                        {FEATURES.map(f => (
                            <div key={f.title} className="landing-feature-card">
                                <span className="landing-feature-icon">{f.icon}</span>
                                <h3 className="landing-feature-title">{f.title}</h3>
                                <p className="landing-feature-desc">{f.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="landing-section landing-section-alt" id="how-it-works">
                <div className="landing-section-inner">
                    <p className="landing-section-eyebrow">How it works</p>
                    <h2 className="landing-section-title">Three steps. No fluff.</h2>
                    <div className="landing-steps">
                        {STEPS.map(s => (
                            <div key={s.number} className="landing-step">
                                <span className="landing-step-number">{s.number}</span>
                                <div>
                                    <h3 className="landing-step-title">{s.title}</h3>
                                    <p className="landing-step-desc">{s.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing CTA */}
            <section className="landing-section landing-pricing-cta">
                <div className="landing-section-inner landing-pricing-cta-inner">
                    <h2 className="landing-pricing-cta-title">One price. Everything included.</h2>
                    <p className="landing-pricing-cta-sub">
                        No locked tiers. No feature upsells. Pay once or monthly — all features, always.
                    </p>
                    <div className="landing-pricing-pills">
                        <div className="landing-pricing-pill">
                            <span className="landing-pricing-pill-price">$2.99</span>
                            <span className="landing-pricing-pill-period">/ month</span>
                        </div>
                        <div className="landing-pricing-pill landing-pricing-pill-highlight">
                            <span className="landing-pricing-pill-badge">Best value</span>
                            <span className="landing-pricing-pill-price">$19.99</span>
                            <span className="landing-pricing-pill-period">/ year</span>
                        </div>
                        <div className="landing-pricing-pill">
                            <span className="landing-pricing-pill-price">$39.99</span>
                            <span className="landing-pricing-pill-period">lifetime</span>
                        </div>
                    </div>
                    <button className="landing-btn-primary landing-btn-lg" onClick={() => navigate('/pricing')}>
                        See full pricing
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <BrandLogo size="sm" />
                <div className="landing-footer-links">
                    <button onClick={() => navigate('/login')}>Log in</button>
                    <button onClick={() => navigate('/register')}>Register</button>
                    <button onClick={() => navigate('/pricing')}>Pricing</button>
                </div>
                <p className="landing-footer-copy">© {new Date().getFullYear()} Markilius. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default LandingPage;
