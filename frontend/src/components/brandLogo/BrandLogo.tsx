import './BrandLogo.css';

interface BrandLogoProps {
    size?: 'sm' | 'md' | 'lg';
}

const BrandLogo = ({ size = 'md' }: BrandLogoProps) => (
    <a href="/" className={`brand-logo brand-logo-${size}`}>
        <div className="brand-logo-icon">
            <svg viewBox="0 0 64 64" fill="none">
                <rect x="9"  y="9"  width="10" height="10" rx="2" fill="#f97316"/>
                <rect x="21" y="9"  width="10" height="10" rx="2" fill="rgba(249,115,22,0.5)"/>
                <rect x="33" y="9"  width="10" height="10" rx="2" fill="#f97316"/>
                <rect x="45" y="9"  width="10" height="10" rx="2" fill="#f97316"/>
                <rect x="9"  y="21" width="10" height="10" rx="2" fill="rgba(249,115,22,0.5)"/>
                <rect x="21" y="21" width="10" height="10" rx="2" fill="#f97316"/>
                <rect x="33" y="21" width="10" height="10" rx="2" fill="#f97316"/>
                <rect x="45" y="21" width="10" height="10" rx="2" fill="rgba(249,115,22,0.2)"/>
                <rect x="9"  y="33" width="10" height="10" rx="2" fill="#f97316"/>
                <rect x="21" y="33" width="10" height="10" rx="2" fill="rgba(249,115,22,0.5)"/>
                <rect x="33" y="33" width="10" height="10" rx="2" fill="rgba(249,115,22,0.2)"/>
                <rect x="45" y="33" width="10" height="10" rx="2" fill="#f97316"/>
                <rect x="9"  y="45" width="10" height="10" rx="2" fill="#f97316"/>
                <rect x="21" y="45" width="10" height="10" rx="2" fill="rgba(249,115,22,0.2)"/>
                <rect x="33" y="45" width="10" height="10" rx="2" fill="rgba(249,115,22,0.5)"/>
                <rect x="45" y="45" width="10" height="10" rx="2" fill="#f97316"/>
            </svg>
        </div>
        <span className="brand-logo-name">Markilius</span>
    </a>
);

export default BrandLogo;
