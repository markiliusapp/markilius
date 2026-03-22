import { useNavigate } from 'react-router-dom';
import BrandLogo from '@/components/brandLogo/BrandLogo';
import './LegalPage.css';
import Footer from '@/components/footer/Footer';

const PrivacyPage = () => {
    const navigate = useNavigate();

    return (
        <div className="legal-page">
            <nav className="legal-nav">
                <div onClick={() => navigate('/')} style={{ cursor: 'pointer' }}><BrandLogo size="sm" /></div>
            </nav>

            <div className="legal-container">
                <h1 className="legal-title">Privacy Policy</h1>
                <p className="legal-meta">Last updated: March 2026</p>

                <p className="legal-lead">
                    Markilius is a personal consistency mirror. We collect what we need to run the product. Nothing more.
                </p>

                <section className="legal-section">
                    <h2>What we collect</h2>
                    <ul>
                        <li><strong>Account data</strong> — your name, email address, and hashed password.</li>
                        <li><strong>Task and arena data</strong> — the tasks you create, their due dates, durations, completion status, and the arena they belong to.</li>
                        <li><strong>Usage data</strong> — your timezone, email preferences, and the last time a weekly summary was sent to you.</li>
                        <li><strong>Payment data</strong> — your Stripe customer ID and subscription status. We do not store card numbers. Stripe handles all payment processing.</li>
                        <li><strong>Public profile ID</strong> — a randomly generated identifier used to generate your shareable heatmap link, if you choose to share it.</li>
                    </ul>
                </section>

                <section className="legal-section">
                    <h2>What we don't collect</h2>
                    <ul>
                        <li>We do not use tracking pixels or analytics scripts.</li>
                        <li>We do not run ads. We do not sell your data.</li>
                        <li>We do not share your data with third parties beyond Stripe (payments) and Resend (transactional email).</li>
                        <li>We do not read your task content for any purpose other than displaying it back to you.</li>
                    </ul>
                </section>

                <section className="legal-section">
                    <h2>Why we collect it</h2>
                    <ul>
                        <li><strong>Name and email</strong> — to identify your account and send you your weekly summary.</li>
                        <li><strong>Task and arena data</strong> — to generate your heatmap. This is the entire product.</li>
                        <li><strong>Timezone</strong> — to send your Sunday summary at the right time.</li>
                        <li><strong>Payment data</strong> — to manage your subscription.</li>
                    </ul>
                </section>

                <section className="legal-section">
                    <h2>Emails we send</h2>
                    <p>We send two types of email:</p>
                    <ul>
                        <li><strong>Transactional</strong> — account verification, password reset. These cannot be opted out of.</li>
                        <li><strong>Weekly summary</strong> — your week returned to you every Sunday morning, only if you had activity that week. You can turn this off in your profile at any time.</li>
                    </ul>
                    <p>We do not send marketing emails.</p>
                </section>

                <section className="legal-section">
                    <h2>Data retention</h2>
                    <p>
                        Your data is kept for as long as your account is active. If you delete your account, your data is permanently removed. There is no recovery after deletion.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>Your rights</h2>
                    <p>
                        You can export, correct, or delete your data at any time by contacting us at <a href="mailto:support@markilius.com">support@markilius.com</a>. If you are in the EU or UK, you have rights under GDPR. We will respond within 30 days.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>Contact</h2>
                    <p>
                        Questions about this policy: <a href="mailto:support@markilius.com">support@markilius.com</a>
                    </p>
                </section>
            </div>

            <Footer />
        </div>
    );
};

export default PrivacyPage;
