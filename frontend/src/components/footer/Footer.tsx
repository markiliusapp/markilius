import { useNavigate } from 'react-router-dom';
import BrandLogo from '@/components/brandLogo/BrandLogo';
import './Footer.css';

const Footer = () => {
    const navigate = useNavigate();

    return (
        <footer className="site-footer">
            <div className="site-footer-inner">
                <div className="site-footer-brand" onClick={() => navigate('/')}>
                    <BrandLogo size="sm" />
                </div>
                <nav className="site-footer-links">
                    <a href="/pricing">Pricing</a>
                    <a href="/manifesto">Who it's for</a>
                    <a href="/about">About</a>
                    <a href="/privacy">Privacy</a>
                    <a href="/contact">Contact</a>
                </nav>
                <p className="site-footer-copy">© {new Date().getFullYear()} Markilius</p>
            </div>
        </footer>
    );
};

export default Footer;
