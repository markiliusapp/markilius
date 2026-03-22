import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/authContext';
import BrandLogo from '@/components/brandLogo/BrandLogo';
import '../landing/LandingPage.css';
import './ManifestoPage.css';
import Footer from '@/components/footer/Footer';

const ManifestoPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    return (
        <div className="manifesto-page">
            <nav className="landing-nav">
                <div onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                    <BrandLogo size="sm" />
                </div>
                <div className="landing-nav-links">
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
            <section className="mf-hero">
                <p className="mf-eyebrow">Markilius</p>
                <h1 className="mf-headline">
                    You don't have<br />a planning problem.
                </h1>
                <p className="mf-subhead">
                    You have a consistency problem.<br />
                    Most apps make the first one worse.
                </p>
            </section>

            <div className="mf-divider" />

            {/* What it is */}
            <section className="mf-section">
                <div className="mf-inner">
                    <h2 className="mf-label">What Markilius is</h2>
                    <p className="mf-statement">A consistency mirror.</p>
                    <p className="mf-body">
                        Not a to-do app. Not a habit tracker. Not a productivity suite.
                        A mirror. You log what you commit to. It shows you whether you showed up.
                        The heatmap is the output — your entire year, laid out as a grid of days.
                        Green means you showed up. Grey means you didn't. No interpretation needed.
                    </p>
                    <p className="mf-body">
                        The heatmap is not data. It is identity made visible.
                    </p>
                </div>
            </section>

            {/* The lock */}
            <section className="mf-section mf-section--highlight">
                <div className="mf-inner">
                    <h2 className="mf-label">The thing that makes it honest</h2>
                    <p className="mf-statement">
                        When a deadline passes, the task locks. Permanently.
                    </p>
                    <p className="mf-body">
                        You cannot go back and complete something you didn't do. You cannot edit it.
                        You cannot delete it. Not by you, not by anyone.
                    </p>
                    <p className="mf-body">
                        Marcus Aurelius did not rewrite his past. The Meditations were honest
                        precisely because they could not be revised after the fact.
                        Markilius applies the same principle: your record is your record.
                        A grey month stays grey.
                    </p>
                    <p className="mf-body mf-body--accent">
                        This is not a punishment. It is what makes the green worth anything.
                    </p>
                </div>
            </section>

            {/* The arenas */}
            <section className="mf-section">
                <div className="mf-inner">
                    <h2 className="mf-label">Your life is not one thing</h2>
                    <p className="mf-statement">
                        Arenas. The pillars that give a task meaning.
                    </p>
                    <p className="mf-body">
                        Work, fitness, learning, creativity — each has its own record.
                        The heatmap breaks down by arena. You can see exactly where you
                        show up and where you disappear. Most people are surprised.
                    </p>
                </div>
            </section>

            {/* Who it's for */}
            <section className="mf-section mf-section--highlight">
                <div className="mf-inner">
                    <h2 className="mf-label">Who this is for</h2>
                    <p className="mf-statement">
                        Someone who already knows what they should be doing.
                    </p>
                    <p className="mf-body">
                        The knowledge is not the problem. You know you should train.
                        You know you should read. You know you should do the work.
                        Markilius is not for someone who needs reminding to show up.
                        It is not for someone who wants to be encouraged after a bad week.
                        It will not send you a notification at 9pm asking if you've worked out.
                        It will show you your record and say nothing.
                    </p>
                    <p className="mf-body">
                        It is for someone who holds themselves to a standard.
                        Who has decided — not announced, decided — what kind of person they are building.
                        Who feels the difference between a week they showed up and a week they didn't,
                        even when no one else can see it.
                    </p>
                    <p className="mf-body">
                        It is for someone who can look at a grey month, tell the truth about it,
                        and do better next month. Not because the app asked them to.
                        Because they already know what the answer should be.
                    </p>
                    <p className="mf-body">
                        The first question Markilius asks you is the only one that matters:
                        <span className="mf-inline-question"> "What are you working on becoming?"</span>
                    </p>
                    <button
                        className="landing-btn-primary mf-section-cta"
                        onClick={() => navigate(user ? '/dashboard' : '/register')}
                    >
                        {user ? 'Go to your record' : 'Start your record'}
                    </button>
                </div>
            </section>
            <Footer />
        </div>
    );
};

export default ManifestoPage;
