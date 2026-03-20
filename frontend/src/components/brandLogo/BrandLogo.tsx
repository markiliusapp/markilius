import './BrandLogo.css';

interface BrandLogoProps {
    size?: 'sm' | 'md' | 'lg';
}

const BrandLogo = ({ size = 'md' }: BrandLogoProps) => (
    <div className={`brand-logo brand-logo-${size}`}>
        <div className="brand-logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
            </svg>
        </div>
        <span className="brand-logo-name">Markilius</span>
    </div>
);

export default BrandLogo;
