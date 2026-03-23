import { authAPI } from "@/services/api";
import type { AuthContextType } from "@/types";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "../types/index"
import { useNavigate } from "react-router-dom";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [authState, setAuthState] = useState<{ user: User | null, loading: boolean }>({
        user: null,
        loading: true
    })
    const navigate = useNavigate();

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        const handleSessionExpired = () => {
            localStorage.removeItem('token');
            setAuthState({ user: null, loading: false });
            window.location.href = '/login?expired=true';
        };
        window.addEventListener('session-expired', handleSessionExpired);
        return () => window.removeEventListener('session-expired', handleSessionExpired);
    }, []);

    const syncTimezone = async (userData: User) => {
        const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (detectedTz && detectedTz !== userData.timezone) {
            try {
                await authAPI.updateMe({ timezone: detectedTz });
            } catch {
                // silently fail — not critical
            }
        }
    };

    const checkAuth = async () => {
        const token = localStorage.getItem('token');

        if (!token) {
            setAuthState({ user: null, loading: false })
            return;
        }

        try {
            const userData = await authAPI.getMe();
            setAuthState({ user: userData, loading: false })
            syncTimezone(userData);
        } catch (err) {
            localStorage.removeItem('token');
            setAuthState({ user: null, loading: false })
        }
    }

    const login = async (token: string) => {
        localStorage.setItem("token", token)
        try {
            const userData = await authAPI.getMe()
            setAuthState({ user: userData, loading: false })
            syncTimezone(userData);
            const isSubscribed = userData.subscription_status === 'active' || userData.subscription_status === 'lifetime';
            navigate(isSubscribed ? "/dashboard" : "/pricing")
        } catch (err) {
            localStorage.removeItem('token');
            throw err;
        }
    }

    const logout = () => {
        localStorage.removeItem('token');
        window.location.href = '/';
    };

    const refreshUser = async () => {
        try {
            const userData = await authAPI.getMe();
            setAuthState(prev => ({ ...prev, user: userData }));
        } catch (err) {
            // silently fail
        }
    };

    return (
        <AuthContext.Provider value={{ user: authState.user, loading: authState.loading, login, logout, refreshUser }}>
            {authState.loading ? null : children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};