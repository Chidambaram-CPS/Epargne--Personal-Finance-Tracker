import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/combined';
import {
    LayoutDashboard,
    Receipt,
    Settings,
    Tags,
    Wallet,
    LogOut,
    Menu,
    X
} from 'lucide-react';

interface LayoutProps {
    children: React.ReactNode;
    activePage: string;
    onNavigate: (page: string) => void;
}

export function Layout({ children, activePage, onNavigate }: LayoutProps) {
    const { user, logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    const menuItems = [
        { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
        { id: 'transactions', label: 'Transactions', icon: Receipt },
        { id: 'masters', label: 'Masters', icon: Tags },
        { id: 'wallet', label: 'Wallet', icon: Wallet },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-background flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-background/80 backdrop-blur-xl border-r transform transition-transform duration-200 ease-in-out md:static md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                <div className="flex flex-col h-full p-4">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
                            Épargne
                        </h1>
                        <button className="md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <nav className="flex-1 space-y-2">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onNavigate(item.id);
                                    setIsMobileMenuOpen(false);
                                }}
                                className={`
                  flex items-center w-full p-3 rounded-lg transition-all duration-200
                  ${activePage === item.id
                                        ? 'bg-primary/10 text-primary font-medium'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'}
                `}
                            >
                                <item.icon className="w-5 h-5 mr-3" />
                                {item.label}
                            </button>
                        ))}
                    </nav>

                    <div className="border-t pt-4">
                        <div className="mb-4">
                            <p className="text-sm font-medium">{user?.name}</p>
                            <p className="text-xs text-muted-foreground">{user?.email}</p>
                        </div>
                        <Button
                            variant="outline"
                            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={logout}
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Disconnect
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-h-screen overflow-y-auto">
                <div className="p-4 md:hidden flex items-center justify-between border-b bg-background/50 backdrop-blur">
                    <h1 className="font-bold text-lg">Épargne</h1>
                    <button onClick={() => setIsMobileMenuOpen(true)}>
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
