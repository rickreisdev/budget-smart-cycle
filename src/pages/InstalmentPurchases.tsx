import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Trash2, Edit2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
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

const InstalmentPurchases = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

  const [editTransaction, setEditTransaction] = useState({
    description: '',
    amount: 0,
    installments: 1
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
      .eq('type', 'card')
      .eq('is_recurrent', false)
      .gt('installments', 1)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading transactions:', error);
      toast.error('Erro ao carregar compras parceladas');
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
    const transactionToDelete = transactions.find(t => t.id === id);
    if (!transactionToDelete) {
      toast.error('Transação não encontrada');
      return;
    }

    try {
      if (transactionToDelete.installments && transactionToDelete.installments > 1) {
        const baseDescription = transactionToDelete.description.replace(/ \(\d+\/\d+\)$/, '');
        
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('user_id', user?.id)
          .eq('type', 'card')
          .eq('amount', transactionToDelete.amount)
          .like('description', `${baseDescription}%`);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', id);

        if (error) throw error;
      }

      loadTransactions();
      toast.success('Compra parcelada removida com sucesso');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Erro ao remover compra parcelada');
    }
  };

  const updateTransaction = async () => {
    if (!editingTransaction || !editTransaction.description || editTransaction.amount <= 0) {
      toast.error('Preencha todos os campos corretamente');
      return;
    }

    try {
      if (editingTransaction.installments && editingTransaction.installments > 1) {
        const baseDescription = editingTransaction.description.replace(/ \(\d+\/\d+\)$/, '');
        
        if (editTransaction.installments !== editingTransaction.installments) {
          // Delete existing installments and create new ones
          await supabase
            .from('transactions')
            .delete()
            .eq('user_id', user?.id)
            .eq('type', 'card')
            .eq('amount', editingTransaction.amount)
            .like('description', `${baseDescription}%`);

          // Create new installments
          const transactionsToInsert = [];
          const currentDate = new Date();
          const currentYear = currentDate.getFullYear();
          const currentMonth = currentDate.getMonth() + 1;
          
          for (let i = 0; i < editTransaction.installments; i++) {
            const targetMonth = currentMonth + i;
            const targetYear = currentYear + Math.floor((targetMonth - 1) / 12);
            const finalMonth = ((targetMonth - 1) % 12) + 1;
            const dateString = `${targetYear}-${String(finalMonth).padStart(2, '0')}-01`;
            
            transactionsToInsert.push({
              user_id: user?.id,
              type: 'card',
              description: `${editTransaction.description} (${i + 1}/${editTransaction.installments})`,
              amount: editTransaction.amount,
              date: dateString,
              is_recurrent: false,
              installments: editTransaction.installments,
              current_installment: i + 1,
              ideal_day: editingTransaction.ideal_day
            });
          }

          const { error } = await supabase
            .from('transactions')
            .insert(transactionsToInsert);

          if (error) throw error;
        } else {
          // Update all related installments
          const { error } = await supabase
            .from('transactions')
            .update({
              amount: editTransaction.amount
            })
            .eq('user_id', user?.id)
            .eq('type', 'card')
            .eq('amount', editingTransaction.amount)
            .like('description', `${baseDescription}%`);

          if (error) throw error;

          // Update descriptions
          const relatedTransactions = transactions.filter(t => 
            t.type === 'card' && 
            t.description.includes(baseDescription) &&
            t.amount === editingTransaction.amount
          );

          for (let i = 0; i < relatedTransactions.length; i++) {
            const transaction = relatedTransactions[i];
            await supabase
              .from('transactions')
              .update({
                description: `${editTransaction.description} (${i + 1}/${editTransaction.installments})`
              })
              .eq('id', transaction.id);
          }
        }
      } else {
        const { error } = await supabase
          .from('transactions')
          .update({
            description: editTransaction.description,
            amount: editTransaction.amount
          })
          .eq('id', editingTransaction.id);

        if (error) throw error;
      }

      loadTransactions();
      setEditingTransaction(null);
      toast.success('Compra parcelada atualizada com sucesso!');
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error('Erro ao atualizar compra parcelada');
    }
  };

  const startEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    const baseDescription = transaction.description.replace(/ \(\d+\/\d+\)$/, '');
    setEditTransaction({
      description: baseDescription,
      amount: transaction.amount,
      installments: transaction.installments || 1
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
          <h1 className="text-2xl font-bold">Compras Parceladas</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Total em Compras Parceladas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              R$ {formatCurrency(calculateTotal())}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Todas as Compras Parceladas</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma compra parcelada encontrada
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
                        {transaction.date} • {transaction.installments} parcelas
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
                              Tem certeza que deseja excluir esta compra parcelada? 
                              {transaction.installments && transaction.installments > 1 && 
                                ' Todas as parcelas serão removidas.'}
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
              <DialogTitle>Editar Compra Parcelada</DialogTitle>
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
              <div>
                <Label htmlFor="edit-installments">Número de Parcelas</Label>
                <Input
                  id="edit-installments"
                  type="number"
                  min="1"
                  value={editTransaction.installments}
                  onChange={(e) => setEditTransaction({
                    ...editTransaction,
                    installments: parseInt(e.target.value) || 1
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

export default InstalmentPurchases;