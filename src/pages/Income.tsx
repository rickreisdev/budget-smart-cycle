import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Trash2, Edit2, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatDateToBrazilian } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface Transaction {
  id: string;
  type: 'income' | 'fixed' | 'card' | 'casual';
  description: string;
  amount: number;
  date: string;
  is_recurrent?: boolean;
  installments?: number;
  current_installment?: number;
  ideal_day?: number;
  created_at?: string;
}

const Income = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [editTransaction, setEditTransaction] = useState({
    description: '',
    amount: 0
  });

  const formatCurrency = (value: number) => {
    return value.toFixed(2).replace('.', ',');
  };

  useEffect(() => {
    loadTransactions();
  }, [user]);

  const loadTransactions = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'income')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading transactions:', error);
      toast.error('Erro ao carregar rendas');
    } else {
      const typedTransactions: Transaction[] = (data || []).map(item => ({
        id: item.id,
        type: item.type as Transaction['type'],
        description: item.description,
        amount: Number(item.amount),
        date: item.date,
        is_recurrent: item.is_recurrent || false,
        installments: item.installments || 1,
        current_installment: item.current_installment || 1,
        ideal_day: item.ideal_day || undefined,
        created_at: item.created_at
      }));
      setTransactions(typedTransactions);
    }
    setLoading(false);
  };

  const calculateTotal = () => {
    return transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  };

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      loadTransactions();
      toast.success('Renda removida com sucesso');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Erro ao remover renda');
    }
  };

  const updateTransaction = async () => {
    if (!editingTransaction || !editTransaction.description || editTransaction.amount <= 0) {
      toast.error('Preencha todos os campos corretamente');
      return;
    }

    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          description: editTransaction.description,
          amount: editTransaction.amount
        })
        .eq('id', editingTransaction.id);

      if (error) throw error;

      loadTransactions();
      setEditingTransaction(null);
      toast.success('Renda atualizada com sucesso!');
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error('Erro ao atualizar renda');
    }
  };

  const startEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditTransaction({
      description: transaction.description,
      amount: transaction.amount
    });
  };

  if (loading) {
    return <div className="p-4">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Rendas</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Total em Rendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              R$ {formatCurrency(calculateTotal())}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Todas as Rendas</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma renda encontrada
              </p>
            ) : (
              <div className="space-y-2">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{transaction.description}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDateToBrazilian(transaction.date)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-green-600">
                        R$ {formatCurrency(transaction.amount)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(transaction)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir esta renda?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteTransaction(transaction.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={!!editingTransaction} onOpenChange={() => setEditingTransaction(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Renda</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-description">Descrição</Label>
                <Input
                  id="edit-description"
                  value={editTransaction.description}
                  onChange={(e) => setEditTransaction({
                    ...editTransaction,
                    description: e.target.value
                  })}
                />
              </div>
              <div>
                <Label htmlFor="edit-amount">Valor (R$)</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  value={editTransaction.amount}
                  onChange={(e) => setEditTransaction({
                    ...editTransaction,
                    amount: parseFloat(e.target.value) || 0
                  })}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={updateTransaction}>Salvar</Button>
                <Button variant="outline" onClick={() => setEditingTransaction(null)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Income;