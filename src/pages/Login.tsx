import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/components/ui/combined';

// Simple HTML escaping function to prevent XSS
const escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

export function Login() {
    const { login } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                const res = await apiRequest<{ token: string; user: any }>('/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ email, password }),
                });
                login(res.token, res.user);
            } else {
                const res = await apiRequest<{ token: string; user: any }>('/auth/signup', {
                    method: 'POST',
                    body: JSON.stringify({ name, email, password }),
                });
                login(res.token, res.user);
            }
        } catch (err: any) {
            const errorMessage = err?.message || 'An unexpected error occurred';
            setError(escapeHtml(errorMessage));
        } finally {
            setLoading(false);
        }
    }, [isLogin, email, password, name, login]);

    const toggleMode = useCallback(() => {
        setIsLogin(!isLogin);
        setError('');
    }, [isLogin]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <Card className="w-full max-w-md glass">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                        <span className="text-primary-foreground font-bold text-2xl">É</span>
                    </div>
                    <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
                        {isLogin ? 'Welcome Back' : 'Create Vault'}
                    </CardTitle>
                    <p className="text-muted-foreground">
                        {isLogin ? 'Enter your credentials to unlock' : 'Setup your secure local vault'}
                    </p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                                {error}
                            </div>
                        )}

                        {!isLogin && (
                            <div className="space-y-2">
                                <Input
                                    placeholder="Full Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Input
                                type="email"
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Input
                                type="password"
                                placeholder="Master Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <Button type="submit" className="w-full h-11 text-base shadow-lg shadow-primary/20" disabled={loading}>
                            {loading ? 'Processing...' : (isLogin ? 'Unlock Vault' : 'Initialize Vault')}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <button
                            onClick={toggleMode}
                            className="text-muted-foreground hover:text-primary transition-colors"
                        >
                            {isLogin ? "First time? Initialize Vault" : "Already have a vault? Unlock"}
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
