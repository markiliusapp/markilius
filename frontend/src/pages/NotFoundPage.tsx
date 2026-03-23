import { useNavigate } from 'react-router-dom';
import BrandLogo from '@/components/brandLogo/BrandLogo';
import '../pages/legal/LegalPage.css';

const NotFoundPage = () => {
    const navigate = useNavigate();

    return (
        <div className="legal-page">
            <nav className="legal-nav">
                <div onClick={() => navigate('/')} style={{ cursor: 'pointer' }}><BrandLogo size="sm" /></div>
            </nav>

            <div className="legal-container" style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '64px', fontWeight: 700, color: 'var(--color-text-muted)', lineHeight: 1, marginBottom: '24px' }}>404</p>
                <h1 className="legal-title">This page doesn't exist.</h1>
                <p className="legal-lead">The URL you followed isn't part of Markilius.</p>
                <button
                    onClick={() => navigate('/')}
                    style={{
                        marginTop: '32px',
                        padding: '10px 24px',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#fff',
                        backgroundColor: 'var(--color-primary)',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                    }}
                >
                    Go home
                </button>
            </div>
        </div>
    );
};

export default NotFoundPage;
