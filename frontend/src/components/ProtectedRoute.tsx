import { useAuth } from "@/context/authContext"
import { Navigate } from "react-router-dom";

export const ProtectedRoute = ({children}: {children: React.ReactNode}) => {
    const { user, loading} = useAuth()
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh'
            }}>
                <div className="spinner" style={{ width: '40px', height: '40px' }} />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }

    const isSubscribed = user.subscription_status === 'active' || user.subscription_status === 'lifetime';
    if (!isSubscribed) {
        return <Navigate to="/pricing" replace />
    }

    return (
        <>{children}</>
    )
}