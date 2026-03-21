import { useNavigate } from 'react-router-dom';
import BrandLogo from '@/components/brandLogo/BrandLogo';
import './LegalPage.css';

const AboutPage = () => {
    const navigate = useNavigate();

    return (
        <div className="legal-page">
            <nav className="legal-nav">
                <div onClick={() => navigate('/')} style={{ cursor: 'pointer' }}><BrandLogo size="sm" /></div>
            </nav>

            <div className="legal-container">
                <h1 className="legal-title">About</h1>

                <p className="legal-lead">
                    Markilius is Marcus + Aurelius — compressed into one word. The product takes its name and its philosophy from the same place.
                </p>

                <section className="legal-section">
                    <h2>The origin</h2>
                    <p>
                        Marcus Aurelius kept a private journal for nearly two decades. He never intended it to be published. It was not a diary — it was a daily confrontation with the gap between who he was and who he intended to be. He called the practice <em>prosoche</em>: unflinching attention to oneself.
                    </p>
                    <p>
                        The Meditations survive not because they were written for an audience, but because the act of writing them changed behaviour. The mirror worked.
                    </p>
                    <p>
                        Markilius is that mirror made digital.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>What it is</h2>
                    <p>
                        Markilius is not a to-do app. It is not a habit tracker. It is not a productivity suite.
                    </p>
                    <p>
                        It is a consistency mirror. You log what you commit to. It shows you whether you showed up. The heatmap is the output — your identity made visible, one day at a time.
                    </p>
                    <p>
                        A green month feels earned. A grey one tells you something worth hearing. The app does not soften either.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>The arenas</h2>
                    <p>
                        Your life is not one thing. Work, fitness, learning, creativity, mindfulness — each deserves its own record. Arenas let you divide your commitments into pillars and see where you actually show up, and where you don't.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>The lock</h2>
                    <p>
                        When a task's deadline passes, it locks. It cannot be completed, edited, or deleted. Not by you, not by anyone.
                    </p>
                    <p>
                        Marcus Aurelius did not rewrite his past. Neither does Markilius. Your record is your record — honest because it cannot be revised after the fact.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>Built by</h2>
                    <p>
                        Markilius is an independent product. No investors. No growth team. No engagement metrics optimised against your attention.
                    </p>
                    <p>
                        Questions or feedback: <a href="mailto:support@markilius.com">support@markilius.com</a>
                    </p>
                </section>
            </div>

            <footer className="legal-footer">
                <div onClick={() => navigate('/')} style={{ cursor: 'pointer' }}><BrandLogo size="sm" /></div>
                <span>·</span>
                <a href="/about">About</a>
                <span>·</span>
                <a href="/privacy">Privacy</a>
                <span>·</span>
                <a href="/contact">Contact</a>
            </footer>
        </div>
    );
};

export default AboutPage;
