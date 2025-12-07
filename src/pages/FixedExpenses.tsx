import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Trash2, Edit2, Wallet } from 'lucide-react';
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

const FixedExpenses = () => {
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
      .eq('type', 'fixed')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading transactions:', error);
      toast.error('Erro ao carregar gastos fixos');
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
      toast.success('Gasto fixo removido com sucesso');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Erro ao remover gasto fixo');
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
      toast.success('Gasto fixo atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error('Erro ao atualizar gasto fixo');
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-primary animate-pulse-soft text-lg font-medium">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4 animate-fade-in">
          <Button variant="ghost" onClick={() => navigate('/')} className="hover-scale">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Gastos Fixos</h1>
        </div>

        <Card className="animate-fade-in stagger-1 hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Total em Gastos Fixos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">
              R$ {formatCurrency(calculateTotal())}
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in stagger-2">
          <CardHeader>
            <CardTitle>Todos os Gastos Fixos</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum gasto fixo encontrado
              </p>
            ) : (
              <div className="space-y-2">
                {transactions.map((transaction, index) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-all duration-200 hover-scale animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{transaction.description}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDateToBrazilian(transaction.date)}
                        {transaction.is_recurrent && ' • Recorrente'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-destructive">
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
                              Tem certeza que deseja excluir este gasto fixo?
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
              <DialogTitle>Editar Gasto Fixo</DialogTitle>
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
                <Label htmlFor="edit-amount">Valor</Label>
                <CurrencyInput
                  id="edit-amount"
                  placeholder="0,00"
                  value={editTransaction.amount?.toString() || ''}
                  onValueChange={(value) => setEditTransaction({
                    ...editTransaction,
                    amount: parseFloat(value) || 0
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

export default FixedExpenses;