import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/authContext';
import BrandLogo from '@/components/brandLogo/BrandLogo';
import Footer from '@/components/footer/Footer';
import '../landing/LandingPage.css';
import './ManifestoPage.css';

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

            {/* Hero — lead with the person */}
            <section className="mf-hero">
                <p className="mf-eyebrow">Who this is for</p>
                <h1 className="mf-headline">
                    For someone serious<br />about who they're becoming.
                </h1>
                <p className="mf-subhead">
                    Not a productivity app. A consistency mirror.
                    It shows you whether you actually showed up.
                </p>
            </section>

            <div className="mf-divider" />

            {/* What makes it the right tool — light touch */}
            <section className="mf-section">
                <div className="mf-inner">
                    <h2 className="mf-label">What makes it different</h2>
                    <p className="mf-statement">The heatmap is not data. It is identity made visible.</p>
                    <p className="mf-body">
                        You log what you commit to. Markilius shows whether you kept it —
                        your year as a grid of days, green where you showed up, grey where you didn't.
                        No encouragement. No interpretation. Just the truth.
                    </p>
                    <p className="mf-body">
                        When a deadline passes, the task locks. You cannot go back and complete something
                        you didn't do. Your record cannot be revised after the fact.
                        A grey month stays grey. That is what makes the green worth anything.
                    </p>
                    <p className="mf-body">
                        Your life is not one thing. Work, fitness, learning, creativity — each has its own record.
                        The heatmap breaks down by arena, so you can see exactly where you show up
                        and where you disappear.
                    </p>
                </div>
            </section>

            {/* Who it's for — the full portrait, closing with the question */}
            <section className="mf-section mf-section--highlight">
                <div className="mf-inner">
                    <h2 className="mf-label">Who this is for</h2>
                    <p className="mf-statement">
                        Someone who already knows what they should be doing.
                    </p>
                    <p className="mf-body">
                        The knowledge is not the problem. You know you should train.
                        You know you should read. You know you should do the work.
                        Markilius is not for someone who needs reminding.
                        It is not for someone who wants to be encouraged after a bad week.
                        It will not chase you. It will show you your record and say nothing.
                    </p>
                    <p className="mf-body">
                        It is for someone who holds themselves to a standard.
                        Who has decided — not announced, decided — what kind of person they are building.
                        Who feels the difference between a week they showed up and a week they didn't,
                        even when no one else can see it.
                    </p>
                    <p className="mf-body">
                        Someone who can look at a grey month, tell the truth about it,
                        and do better next month. Not because the app asked them to.
                        Because they already know what the answer should be.
                    </p>
                    <p className="mf-body">
                        The first question Markilius asks is the only one that matters:
                        <span className="mf-inline-question">"What are you working on becoming?"</span>
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
