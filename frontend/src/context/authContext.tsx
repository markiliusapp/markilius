import { authAPI } from "@/services/api";
import type { AuthContextType } from "@/types";
import {createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User, } from "../types/index"
import { useNavigate } from "react-router-dom";


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('token');

        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const userData = await authAPI.getMe();
            setUser(userData);
        } catch (err) {
            // Token invalid or expired
            localStorage.removeItem('token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (token: string) => {
        localStorage.setItem("token", token)
        try {
            const user = await authAPI.getMe()
            setUser(user)
            navigate("/dashboard")
        } catch (err) {
            localStorage.removeItem('token');
            throw err;
        }
    }

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
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