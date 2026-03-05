import { useState } from 'react';
import { useAuth } from '../context/authContext';
import { NavLink } from 'react-router-dom';
import './DashboardLayout.css';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const closeSidebar = () => setSidebarOpen(false);

    return (
        <div className="dashboard-layout">
            {/* Mobile menu toggle */}
            <button
                className="mobile-menu-toggle"
                onClick={() => setSidebarOpen(true)}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
            </button>

            {/* Overlay */}
            <div
                className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
                onClick={closeSidebar}
            />

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                {/* Brand */}
                <div className="sidebar-brand">
                    <div className="sidebar-brand-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>
                    <span className="sidebar-brand-name">Checkly</span>
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
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <span>Week</span>
                    </NavLink>

                    <NavLink to="/dashboard/month" className="nav-link" onClick={closeSidebar}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <span>Month</span>
                    </NavLink>

                    <NavLink to="/dashboard/year" className="nav-link" onClick={closeSidebar}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="2" x2="12" y2="22" />
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                        <span>Year</span>
                    </NavLink>
                </nav>

                {/* User section */}
                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="sidebar-user-avatar">
                            {user?.first_name.charAt(0)}{user?.last_name.charAt(0)}
                        </div>
                        <div className="sidebar-user-info">
                            <div className="sidebar-user-name">
                                {user?.first_name} {user?.last_name}
                            </div>
                            <div className="sidebar-user-email">{user?.email}</div>
                        </div>
                    </div>
                    <button onClick={logout} className="sidebar-logout">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="dashboard-main">
                {children}
            </main>
        </div>
    );
};

export default DashboardLayout;