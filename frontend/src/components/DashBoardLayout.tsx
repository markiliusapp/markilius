import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/authContext';
import { useTheme } from '../context/themeContext';
import { NavLink } from 'react-router-dom';
import BrandLogo from './brandLogo/BrandLogo';
import { paymentAPI } from '../services/api';
import './DashBoardLayout.css';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [portalLoading, setPortalLoading] = useState(false);
    const [bannerDismissed, setBannerDismissed] = useState(
        () => sessionStorage.getItem('payment-banner-dismissed') === 'true'
    );

    const handleUpdatePayment = async () => {
        setPortalLoading(true);
        try {
            const { url } = await paymentAPI.createPortalSession();
            window.location.href = url;
        } catch {
            setPortalLoading(false);
        }
    };
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);

    const closeSidebar = () => setSidebarOpen(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false);
            }
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
                setMobileMenuOpen(false);
            }
        };
        if (userMenuOpen || mobileMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [userMenuOpen, mobileMenuOpen]);

    return (
        <div className="dashboard-layout">
            {/* Mobile menu toggle */}
            {!sidebarOpen && <button
                className="mobile-menu-toggle"
                onClick={() => setSidebarOpen(true)}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
            </button>}

            {/* Overlay */}
            <div
                className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
                onClick={closeSidebar}
            />

            {/* Mobile bottom tab bar */}
            <div className="mobile-bottom-nav-wrapper" ref={mobileMenuRef}>
                {/* Mobile user menu popup */}
                {mobileMenuOpen && (
                    <div className="mobile-user-menu">
                        <NavLink to="/dashboard/profile" className="user-menu-item" onClick={() => setMobileMenuOpen(false)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                            <span>Profile</span>
                        </NavLink>
                        <NavLink to="/dashboard/arenas" className="user-menu-item" onClick={() => setMobileMenuOpen(false)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="3" />
                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
                            </svg>
                            <span>Manage Arenas</span>
                        </NavLink>
                        <button className="user-menu-item" onClick={toggleTheme}>
                            {theme === 'light' ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                                </svg>
                            ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                                </svg>
                            )}
                            <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                        </button>
                        <div className="user-menu-divider" />
                        <button className="user-menu-item user-menu-item--danger" onClick={() => { setMobileMenuOpen(false); logout(); }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                            <span>Logout</span>
                        </button>
                    </div>
                )}
                <nav className="mobile-bottom-nav">
                    <NavLink to="/dashboard" end className="mobile-tab-link">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        <span>Home</span>
                    </NavLink>
                    <NavLink to="/dashboard/week" className="mobile-tab-link">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                            <line x1="3" y1="16" x2="21" y2="16" />
                            <line x1="9" y1="10" x2="9" y2="16" />
                            <line x1="15" y1="10" x2="15" y2="16" />
                        </svg>
                        <span>Week</span>
                    </NavLink>
                    <NavLink to="/dashboard/month" className="mobile-tab-link">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                            <circle cx="8" cy="15" r="1" fill="currentColor" />
                            <circle cx="12" cy="15" r="1" fill="currentColor" />
                            <circle cx="16" cy="15" r="1" fill="currentColor" />
                            <circle cx="8" cy="19" r="1" fill="currentColor" />
                            <circle cx="12" cy="19" r="1" fill="currentColor" />
                        </svg>
                        <span>Month</span>
                    </NavLink>
                    <NavLink to="/dashboard/year" className="mobile-tab-link">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="3" y1="20" x2="21" y2="20" />
                            <rect x="5" y="14" width="3" height="6" rx="1" />
                            <rect x="10" y="9" width="3" height="11" rx="1" />
                            <rect x="15" y="4" width="3" height="16" rx="1" />
                        </svg>
                        <span>Year</span>
                    </NavLink>
                    <button className="mobile-tab-link" onClick={() => setMobileMenuOpen(p => !p)}>
                        <div className="mobile-tab-avatar">{user?.first_name.charAt(0).toUpperCase()}{user?.last_name.charAt(0).toUpperCase()}</div>
                        <span>Account</span>
                    </button>
                </nav>
            </div>

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                {/* Brand */}
                <div className="sidebar-brand">
                    <BrandLogo size="sm" />
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    <NavLink to="/dashboard" end className="nav-link" onClick={closeSidebar}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        <span>Home</span>
                    </NavLink>

                    <NavLink to="/dashboard/week" className="nav-link" onClick={closeSidebar}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                            <line x1="3" y1="16" x2="21" y2="16" />
                            <line x1="9" y1="10" x2="9" y2="16" />
                            <line x1="15" y1="10" x2="15" y2="16" />
                        </svg>
                        <span>Week</span>
                    </NavLink>

                    <NavLink to="/dashboard/month" className="nav-link" onClick={closeSidebar}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                            <circle cx="8" cy="15" r="1" fill="currentColor" />
                            <circle cx="12" cy="15" r="1" fill="currentColor" />
                            <circle cx="16" cy="15" r="1" fill="currentColor" />
                            <circle cx="8" cy="19" r="1" fill="currentColor" />
                            <circle cx="12" cy="19" r="1" fill="currentColor" />
                        </svg>
                        <span>Month</span>
                    </NavLink>

                    <NavLink to="/dashboard/year" className="nav-link" onClick={closeSidebar}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="3" y1="20" x2="21" y2="20" />
                            <rect x="5" y="14" width="3" height="6" rx="1" />
                            <rect x="10" y="9" width="3" height="11" rx="1" />
                            <rect x="15" y="4" width="3" height="16" rx="1" />
                        </svg>
                        <span>Year</span>
                    </NavLink>
                </nav>

                {/* User section */}
                <div className="sidebar-footer-wrapper" ref={userMenuRef}>
                    {/* User menu popup */}
                    {userMenuOpen && (
                        <div className="user-menu">
                            <NavLink
                                to="/dashboard/profile"
                                className="user-menu-item"
                                onClick={() => { setUserMenuOpen(false); closeSidebar(); }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                                <span>Profile</span>
                            </NavLink>
                            <NavLink
                                to="/dashboard/arenas"
                                className="user-menu-item"
                                onClick={() => { setUserMenuOpen(false); closeSidebar(); }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="3" />
                                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
                                </svg>
                                <span>Manage Arenas</span>
                            </NavLink>
                            <button
                                className="user-menu-item"
                                onClick={toggleTheme}
                            >
                                {theme === 'light' ? (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                                    </svg>
                                ) : (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="5" />
                                        <line x1="12" y1="1" x2="12" y2="3" />
                                        <line x1="12" y1="21" x2="12" y2="23" />
                                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                        <line x1="1" y1="12" x2="3" y2="12" />
                                        <line x1="21" y1="12" x2="23" y2="12" />
                                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                                    </svg>
                                )}
                                <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                            </button>
                            <div className="user-menu-divider" />
                            <button
                                className="user-menu-item user-menu-item--danger"
                                onClick={() => { setUserMenuOpen(false); logout(); }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <polyline points="16 17 21 12 16 7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                                <span>Logout</span>
                            </button>
                        </div>
                    )}

                    <div
                        className="sidebar-footer"
                        onClick={() => setUserMenuOpen(prev => !prev)}
                    >
                        <div className="sidebar-user">
                            <div className="sidebar-user-avatar">
                                {user?.first_name.charAt(0).toUpperCase()}{user?.last_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="sidebar-user-info">
                                <div className="sidebar-user-name">
                                    {user?.first_name} {user?.last_name}
                                </div>
                                <div className="sidebar-user-email">{user?.email}</div>
                            </div>
                        </div>
                        <div className="sidebar-footer-chevron">
                            {userMenuOpen ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="18 15 12 9 6 15" />
                                </svg>
                            ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            )}
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <main className="dashboard-main">
                {user?.subscription_status === 'past_due' && !bannerDismissed && (
                    <div className="payment-failed-banner">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <div className="payment-failed-banner__body">
                            <span className="payment-failed-banner__text">
                                Your last payment failed. You have 7 days to update your payment method before losing access.
                            </span>
                            <button
                                className="payment-failed-banner__action"
                                onClick={handleUpdatePayment}
                                disabled={portalLoading}
                            >
                                {portalLoading ? 'Loading...' : 'Update payment method'}
                            </button>
                        </div>
                        <button
                            className="payment-failed-banner__dismiss"
                            onClick={() => {
                                sessionStorage.setItem('payment-banner-dismissed', 'true');
                                setBannerDismissed(true);
                            }}
                            aria-label="Dismiss"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                )}
                {children}
            </main>
        </div>
    );
};

export default DashboardLayout;
