import { useNavigate } from 'react-router-dom';
import BrandLogo from '@/components/brandLogo/BrandLogo';
import './LegalPage.css';

const ContactPage = () => {
    const navigate = useNavigate();

    return (
        <div className="legal-page">
            <nav className="legal-nav">
                <div onClick={() => navigate('/')} style={{ cursor: 'pointer' }}><BrandLogo size="sm" /></div>
            </nav>

            <div className="legal-container">
                <h1 className="legal-title">Contact</h1>

                <p className="legal-lead">
                    One address. No ticket system, no chatbot.
                </p>

                <section className="legal-section">
                    <h2>Email</h2>
                    <p>
                        <a href="mailto:support@markilius.com">support@markilius.com</a>
                    </p>
                    <p>
                        For questions about your account, billing, or the product. We respond within a few days.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>Billing and subscriptions</h2>
                    <p>
                        If you have a billing issue, include the email address on your account and a brief description. We'll sort it out.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>Data requests</h2>
                    <p>
                        To export or delete your data, email us with your account email. We'll respond within 30 days.
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

export default ContactPage;
