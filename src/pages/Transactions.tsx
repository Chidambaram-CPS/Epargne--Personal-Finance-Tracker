import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/components/ui/combined';
import { Plus, Trash2, Search } from 'lucide-react';

interface Transaction {
    id: string;
    type: 'income' | 'expense';
    amount: number;
    description: string;
    category: string;
    wallet: string;
    date: string;
}

export function Transactions() {
    const { user, token } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        type: 'expense',
        category: '',
        wallet: 'Cash',
        description: ''
    });

    const loadTransactions = useCallback(async () => {
        if (!user?.id || !token) return;

        try {
            const data = await apiRequest<Transaction[]>(`/transactions?userId=${user.id}`, { token });
            setTransactions(data);
        } catch (err) {
            console.error('Failed to load transactions:', err);
        }
    }, [user?.id, token]);

    useEffect(() => {
        loadTransactions();
    }, [loadTransactions]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id || !token) return;

        try {
            await apiRequest('/transactions', {
                method: 'POST',
                token,
                body: JSON.stringify({
                    user_id: user.id,
                    ...formData,
                    amount: parseFloat(formData.amount)
                })
            });
            setIsFormOpen(false);
            await loadTransactions();
            setFormData({ 
                date: new Date().toISOString().split('T')[0],
                amount: '', 
                type: 'expense',
                category: '',
                wallet: 'Cash',
                description: '' 
            });
        } catch (err) {
            console.error('Failed to add transaction:', err);
            alert('Failed to add transaction');
        }
    }, [user?.id, token, formData, loadTransactions]);

    const handleDelete = useCallback(async (id: string) => {
        if (!confirm('Are you sure?')) return;
        if (!user?.id || !token) return;

        try {
            await apiRequest(`/transactions/${id}`, {
                method: 'DELETE',
                token,
                body: JSON.stringify({ user_id: user.id })
            });
            await loadTransactions();
        } catch (err) {
            console.error('Failed to delete transaction:', err);
        }
    }, [user?.id, token, loadTransactions]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
                <Button onClick={() => setIsFormOpen(!isFormOpen)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add New
                </Button>
            </div>

            {isFormOpen && (
                <Card className="glass animate-in slide-in-from-top-4">
                    <CardHeader>
                        <CardTitle>New Transaction</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Type</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="expense">Expense</option>
                                    <option value="income">Income</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Date</label>
                                <Input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Amount</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Category</label>
                                <Input
                                    placeholder="Food, Rent, Salary..."
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Wallet</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={formData.wallet}
                                    onChange={(e) => setFormData({ ...formData, wallet: e.target.value })}
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Bank">Bank AC</option>
                                    <option value="Card">Credit Card</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Description</label>
                                <Input
                                    placeholder="What was this for?"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="col-span-full pt-4 flex gap-2 justify-end">
                                <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                                <Button type="submit">Save Transaction</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <Card className="glass">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>History</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search..." className="pl-8" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Description</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Category</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Wallet</th>
                                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Amount</th>
                                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {transactions.map((t) => (
                                    <tr key={t.id} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4 align-middle">{t.date}</td>
                                        <td className="p-4 align-middle">{t.description}</td>
                                        <td className="p-4 align-middle">
                                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                                {t.category}
                                            </span>
                                        </td>
                                        <td className="p-4 align-middle">{t.wallet}</td>
                                        <td className={`p-4 align-middle text-right font-medium ${t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                                        </td>
                                        <td className="p-4 align-middle text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
