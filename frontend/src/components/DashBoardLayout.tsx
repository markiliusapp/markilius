import { useAuth } from '../context/authContext';
import { NavLink } from 'react-router-dom';
import { Home, LogOut, Calendar, CalendarDays, CalendarRange} from 'lucide-react';
import './DashboardLayout.css';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    const { user, logout } = useAuth();

    return (
        <div className="dashboard-layout">
            {/* Sidebar */}
            <aside className="sidebar">
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
                    <NavLink to="/dashboard" end className="nav-link">
                        <Home />
                        <span>Home</span>
                    </NavLink>

                    <NavLink to="/dashboard/week" className="nav-link">
                        <CalendarRange />
                        <span>Week</span>
                    </NavLink>

                    <NavLink to="/dashboard/month" className="nav-link">
                        <Calendar />
                        <span>Month</span>
                    </NavLink>

                    <NavLink to="/dashboard/year" className="nav-link">
                        <CalendarDays />
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
                        <LogOut />
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