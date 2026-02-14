import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/components/ui/combined';
import { Plus, Trash2, Tags, Wallet } from 'lucide-react';

interface MasterItem {
    id: string;
    name: string;
    type: 'category' | 'wallet';
    color?: string;
    icon?: string;
}

export function Masters() {
    const { user, token } = useAuth();
    const [items, setItems] = useState<MasterItem[]>([]);
    const [activeTab, setActiveTab] = useState<'category' | 'wallet'>('category');
    const [newName, setNewName] = useState('');

    const loadMasters = useCallback(async () => {
        if (!user?.id || !token) return;

        try {
            const data = await apiRequest<MasterItem[]>(`/masters?userId=${user.id}&type=${activeTab}`, { token });
            setItems(data);
        } catch (err) {
            console.error('Failed to load masters:', err);
        }
    }, [user?.id, token, activeTab]);

    useEffect(() => {
        loadMasters();
    }, [loadMasters]);

    const handleAdd = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || !user?.id || !token) return;

        try {
            await apiRequest('/masters', {
                method: 'POST',
                token,
                body: JSON.stringify({
                    user_id: user.id,
                    type: activeTab,
                    name: newName,
                    color: 'bg-gray-100',
                    icon: 'tag'
                })
            });
            await loadMasters();
            setNewName('');
        } catch (err) {
            console.error('Failed to add master:', err);
            alert('Failed to add ' + activeTab);
        }
    }, [newName, user?.id, token, activeTab, loadMasters]);

    const handleDelete = useCallback(async (id: string) => {
        if (!confirm('Delete this item?')) return;
        if (!user?.id || !token) return;

        try {
            await apiRequest(`/masters/${id}`, {
                method: 'DELETE',
                token,
                body: JSON.stringify({ user_id: user.id })
            });
            await loadMasters();
        } catch (err) {
            console.error('Failed to delete master:', err);
        }
    }, [user?.id, token, loadMasters]);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Master Data</h2>
                <p className="text-muted-foreground">Manage your categories and wallets.</p>
            </div>

            <div className="flex space-x-4 mb-6">
                <Button
                    variant={activeTab === 'category' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('category')}
                >
                    <Tags className="w-4 h-4 mr-2" />
                    Categories
                </Button>
                <Button
                    variant={activeTab === 'wallet' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('wallet')}
                >
                    <Wallet className="w-4 h-4 mr-2" />
                    Wallets
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="glass">
                    <CardHeader>
                        <CardTitle>Add New {activeTab === 'category' ? 'Category' : 'Wallet'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAdd} className="flex gap-4">
                            <Input
                                placeholder={`Name of ${activeTab}...`}
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                            />
                            <Button type="submit">
                                <Plus className="w-4 h-4" />
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="glass md:col-span-2">
                    <CardHeader>
                        <CardTitle>Existing {activeTab === 'category' ? 'Categories' : 'Wallets'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {items.map((item) => (
                                <div key={item.id} className="p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors flex flex-col items-center justify-between gap-4 group text-center relative">
                                    <div className="p-3 bg-primary/10 rounded-full text-primary">
                                        {activeTab === 'category' ? <Tags className="w-6 h-6" /> : <Wallet className="w-6 h-6" />}
                                    </div>
                                    <span className="font-medium">{item.name}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 hover:text-destructive"
                                        onClick={() => handleDelete(item.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                            {items.length === 0 && (
                                <div className="col-span-full py-8 text-center text-muted-foreground">
                                    No items found. Add one above.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
