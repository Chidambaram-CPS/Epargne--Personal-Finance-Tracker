import { useState, useCallback } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { Transactions } from '@/pages/Transactions';
import { Masters } from '@/pages/Masters';
import { DevToolsDetector } from '@/components/Security/DevToolsDetector';

function AppContent() {
    const { user, isLoading } = useAuth();
    const [activePage, setActivePage] = useState('dashboard');

    const handleNavigate = useCallback((page: string) => {
        setActivePage(page);
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <>
                <DevToolsDetector />
                <Login />
            </>
        );
    }

    return (
        <>
            <DevToolsDetector />
            <Layout activePage={activePage} onNavigate={handleNavigate}>
                {activePage === 'dashboard' && <Dashboard />}
                {activePage === 'transactions' && <Transactions />}
                {activePage === 'masters' && <Masters />}
                {activePage === 'wallet' && <Masters />}
                {activePage === 'settings' && <div className="p-10 text-center text-muted-foreground">Settings Coming Soon</div>}
            </Layout>
        </>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}
