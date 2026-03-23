import { useNavigate } from 'react-router-dom';
import BrandLogo from '@/components/brandLogo/BrandLogo';
import './LegalPage.css';
import Footer from '@/components/footer/Footer';

const TermsPage = () => {
    const navigate = useNavigate();

    return (
        <div className="legal-page">
            <nav className="legal-nav">
                <div onClick={() => navigate('/')} style={{ cursor: 'pointer' }}><BrandLogo size="sm" /></div>
            </nav>

            <div className="legal-container">
                <h1 className="legal-title">Terms of Service</h1>
                <p className="legal-meta">Last updated: March 2026</p>

                <p className="legal-lead">
                    By using Markilius, you agree to these terms. They are written plainly. Read them.
                </p>

                <section className="legal-section">
                    <h2>What Markilius is</h2>
                    <p>
                        Markilius is a personal consistency tracking tool. It shows you your own record — nothing more. It is not a wellness product, a coaching service, or a mental health tool. It is a mirror.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>Your account</h2>
                    <ul>
                        <li>You must be at least 16 years old to use Markilius.</li>
                        <li>You are responsible for keeping your login credentials secure.</li>
                        <li>You may not share your account with others.</li>
                        <li>One account per person.</li>
                    </ul>
                </section>

                <section className="legal-section">
                    <h2>Your data</h2>
                    <ul>
                        <li>Your tasks, arenas, and history belong to you.</li>
                        <li>You can export or delete your data at any time by contacting <a href="mailto:support@markilius.com">support@markilius.com</a>.</li>
                        <li>Deleted accounts are permanently removed. There is no recovery.</li>
                        <li>Task locking is permanent and intentional — locked records cannot be altered by you or by us.</li>
                    </ul>
                </section>

                <section className="legal-section">
                    <h2>Payments and subscriptions</h2>
                    <ul>
                        <li>Paid plans are billed monthly or annually via Stripe.</li>
                        <li>You can cancel at any time. Your access continues until the end of the billing period.</li>
                        <li>We do not offer refunds for partial billing periods.</li>
                        <li>If a payment fails, your account will be suspended after a grace period.</li>
                    </ul>
                </section>

                <section className="legal-section">
                    <h2>What you may not do</h2>
                    <ul>
                        <li>Attempt to access other users' accounts or data.</li>
                        <li>Reverse-engineer, scrape, or abuse the Markilius API.</li>
                        <li>Use Markilius for any unlawful purpose.</li>
                        <li>Resell or redistribute access to the service.</li>
                    </ul>
                </section>

                <section className="legal-section">
                    <h2>Service availability</h2>
                    <p>
                        We aim for high availability but do not guarantee it. We may modify or discontinue features at any time. We will give reasonable notice for significant changes.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>Limitation of liability</h2>
                    <p>
                        Markilius is provided as-is. We are not liable for any loss of data, missed deadlines, or indirect damages arising from your use of the service.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>Changes to these terms</h2>
                    <p>
                        If we make material changes, we will notify you by email before they take effect. Continued use after that date constitutes acceptance.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>Contact</h2>
                    <p>
                        Questions about these terms: <a href="mailto:support@markilius.com">support@markilius.com</a>
                    </p>
                </section>
            </div>

            <Footer />
        </div>
    );
};

export default TermsPage;
