import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Trash2, Plus, DollarSign, CreditCard, TrendingUp, Wallet, LogOut, User, ChevronDown, Edit, RotateCcw, Edit2, CalendarIcon } from 'lucide-react';
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

interface UserProfile {
  id: string;
  username: string;
  salary: number;
  ideal_day: number;
  total_saved: number;
  current_cycle: string;
}

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [visibleTransactions, setVisibleTransactions] = useState(5);
  const [showEditIdealDay, setShowEditIdealDay] = useState(false);
  const [showEditCycle, setShowEditCycle] = useState(false);
  const [showAddTransactionDialog, setShowAddTransactionDialog] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [transactionFilters, setTransactionFilters] = useState({
    income: true,
    fixed: true,
    cardInstallment: true,
    cardRecurrent: true,
    casual: true
  });

  // Form states
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: 0,
    type: 'casual' as Transaction['type'],
    is_recurrent: false,
    installments: 1,
    ideal_day: 5,
    totalAmount: 0 // Valor total para compras parceladas
  });

  const [editTransaction, setEditTransaction] = useState({
    description: '',
    amount: 0,
    type: 'casual' as Transaction['type'],
    installments: 1
  });

  const [setupData, setSetupData] = useState({
    salary: 0,
    ideal_day: 5
  });

  const [editIdealDay, setEditIdealDay] = useState(5);
  const [editCycle, setEditCycle] = useState('');

  // Function to format currency with Brazilian standard (comma as decimal separator)
  const formatCurrency = (value: number) => {
    return value.toFixed(2).replace('.', ',');
  };

  // Function to translate transaction types to Portuguese
  const getTransactionTypeInPortuguese = (type: Transaction['type']) => {
    const typeTranslations = {
      'income': 'Renda Extra',
      'fixed': 'Gasto Fixo',
      'card': 'Cartão de Crédito',
      'casual': 'Gasto Avulso'
    };
    return typeTranslations[type];
  };

  // Function to format date for display
  const formatDateForDisplay = (dateString: string) => {
    return formatDateToBrazilian(dateString);
  };

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Load user data
  useEffect(() => {
    if (user) {
      loadUserProfile();
      loadTransactions();
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error loading profile:', error);
      toast.error('Erro ao carregar perfil');
    } else if (data) {
      setUserProfile(data);
      setIsFirstTime(data.salary === 0);
    }
    setLoading(false);
  };

  const loadTransactions = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading transactions:', error);
      toast.error('Erro ao carregar transações');
    } else {
      // Type-safe mapping to ensure compatibility
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
  };

  const calculateTotals = () => {
    if (!userProfile) return {
      totalIncome: 0,
      totalFixed: 0,
      totalCard: 0,
      totalCasual: 0,
      totalExpenses: 0,
      availableBalance: 0
    };

    const currentMonthTransactions = transactions.filter(t => 
      t.date.startsWith(userProfile.current_cycle)
    );

    const totalIncome = userProfile.salary + currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalFixed = currentMonthTransactions
      .filter(t => t.type === 'fixed')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalCard = currentMonthTransactions
      .filter(t => t.type === 'card')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalCasual = currentMonthTransactions
      .filter(t => t.type === 'casual')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpenses = totalFixed + totalCard + totalCasual;
    const availableBalance = totalIncome - totalExpenses;

    return {
      totalIncome,
      totalFixed,
      totalCard,
      totalCasual,
      totalExpenses,
      availableBalance
    };
  };

  const setupInitialData = async () => {
    if (!user || !userProfile) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        salary: setupData.salary,
        ideal_day: setupData.ideal_day
      })
      .eq('id', user.id);

    if (error) {
      toast.error('Erro ao salvar configuração');
    } else {
      setUserProfile({
        ...userProfile,
        salary: setupData.salary,
        ideal_day: setupData.ideal_day
      });
      setIsFirstTime(false);
      toast.success('Configuração inicial concluída!');
    }
  };

  const addTransaction = async () => {
    if (!user || !newTransaction.description || newTransaction.amount <= 0) {
      toast.error('Preencha todos os campos corretamente');
      return;
    }

    const transactionData = {
      user_id: user.id,
      type: newTransaction.type,
      description: newTransaction.description,
      amount: newTransaction.amount,
      date: userProfile?.current_cycle + '-01',
      is_recurrent: newTransaction.is_recurrent,
      installments: newTransaction.installments,
      current_installment: 1,
      ideal_day: newTransaction.ideal_day
    };

    if (newTransaction.type === 'card' && !newTransaction.is_recurrent) {
      // Handle installments - each installment should be in a different month
      const transactionsToInsert = [];
      
      // Parse the current cycle to get year and month
      const [currentYear, currentMonth] = (userProfile?.current_cycle || '').split('-').map(Number);
      
      console.log('Current cycle:', userProfile?.current_cycle);
      console.log('Parsed year:', currentYear, 'month:', currentMonth);
      console.log('Number of installments:', newTransaction.installments);
      
      for (let i = 0; i < newTransaction.installments; i++) {
        // Calculate the date for each installment
        // First installment (i=0) should be in current month
        // Second installment (i=1) should be in next month, etc.
        const targetMonth = currentMonth + i;
        const targetYear = currentYear + Math.floor((targetMonth - 1) / 12);
        const finalMonth = ((targetMonth - 1) % 12) + 1;
        
        // Format the date string
        const dateString = `${targetYear}-${String(finalMonth).padStart(2, '0')}-01`;
        
        console.log(`Installment ${i + 1}: Target month = ${targetMonth}, Final year = ${targetYear}, Final month = ${finalMonth}, Date = ${dateString}`);
        
        transactionsToInsert.push({
          ...transactionData,
          date: dateString,
          current_installment: i + 1,
          description: `${transactionData.description} (${i + 1}/${newTransaction.installments})`
        });
      }

      console.log('Transactions to insert:', transactionsToInsert);

      const { error } = await supabase
        .from('transactions')
        .insert(transactionsToInsert);

      if (error) {
        console.error('Error adding installment transactions:', error);
        toast.error('Erro ao adicionar transação parcelada');
        return;
      } else {
        loadTransactions();
        toast.success('Transação parcelada adicionada com sucesso!');
      }
    } else {
      const { error } = await supabase
        .from('transactions')
        .insert([transactionData]);

      if (error) {
        console.error('Error adding transaction:', error);
        toast.error('Erro ao adicionar transação');
        return;
      } else {
        loadTransactions();
        toast.success('Transação adicionada com sucesso!');
      }
    }

    // Reset form and close dialog
    setNewTransaction({
      description: '',
      amount: 0,
      type: 'casual',
      is_recurrent: false,
      installments: 1,
      ideal_day: userProfile?.ideal_day || 5,
      totalAmount: 0
    });
    setShowAddTransactionDialog(false);
  };

  const deleteTransaction = async (id: string) => {
    // Get the transaction to check if it's part of installments
    const transactionToDelete = transactions.find(t => t.id === id);
    if (!transactionToDelete) {
      toast.error('Transação não encontrada');
      return;
    }

    try {
      // If it's a card transaction with installments, we need to find and delete all related installments
      if (transactionToDelete.type === 'card' && transactionToDelete.installments && transactionToDelete.installments > 1) {
        // Extract the base description (remove the installment part)
        const baseDescription = transactionToDelete.description.replace(/ \(\d+\/\d+\)$/, '');
        
        // Delete all transactions with the same base description, amount, and type
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('user_id', user?.id)
          .eq('type', 'card')
          .eq('amount', transactionToDelete.amount)
          .like('description', `${baseDescription}%`);

        if (error) {
          console.error('Error deleting installment transactions:', error);
          throw error;
        }
      } else {
        // Delete single transaction
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Error deleting transaction:', error);
          throw error;
        }
      }

      loadTransactions();
      toast.success('Transação removida com sucesso');
    } catch (error) {
      console.error('Error in deleteTransaction:', error);
      toast.error('Erro ao remover transação');
    }
  };

  const updateTransaction = async () => {
    if (!editingTransaction || !editTransaction.description || editTransaction.amount <= 0) {
      toast.error('Preencha todos os campos corretamente');
      return;
    }

    try {
      // Check if it's a card transaction with installments
      if (editingTransaction.type === 'card' && editingTransaction.installments && editingTransaction.installments > 1) {
        // Extract the base description (remove the installment part)
        const baseDescription = editingTransaction.description.replace(/ \(\d+\/\d+\)$/, '');
        
        // If changing installment count, we need to handle this specially
        if (editTransaction.installments !== editingTransaction.installments) {
          // Delete existing installments
          await supabase
            .from('transactions')
            .delete()
            .eq('user_id', user?.id)
            .eq('type', 'card')
            .eq('amount', editingTransaction.amount)
            .like('description', `${baseDescription}%`);

          // Create new installments with the new count
          const transactionsToInsert = [];
          const [currentYear, currentMonth] = (userProfile?.current_cycle || '').split('-').map(Number);
          
          for (let i = 0; i < editTransaction.installments; i++) {
            const targetMonth = currentMonth + i;
            const targetYear = currentYear + Math.floor((targetMonth - 1) / 12);
            const finalMonth = ((targetMonth - 1) % 12) + 1;
            const dateString = `${targetYear}-${String(finalMonth).padStart(2, '0')}-01`;
            
            transactionsToInsert.push({
              user_id: user?.id,
              type: editTransaction.type,
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
          // Update all related installments with the same base description
          const { error } = await supabase
            .from('transactions')
            .update({
              description: editTransaction.description,
              amount: editTransaction.amount,
              type: editTransaction.type
            })
            .eq('user_id', user?.id)
            .eq('type', 'card')
            .eq('amount', editingTransaction.amount)
            .like('description', `${baseDescription}%`);

          if (error) throw error;

          // Update descriptions to include installment info
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
        // Update single transaction
        const { error } = await supabase
          .from('transactions')
          .update({
            description: editTransaction.description,
            amount: editTransaction.amount,
            type: editTransaction.type
          })
          .eq('id', editingTransaction.id);

        if (error) throw error;
      }

      loadTransactions();
      setEditingTransaction(null);
      toast.success('Transação atualizada com sucesso!');
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error('Erro ao atualizar transação');
    }
  };

  const startNewCycle = async () => {
    if (!user || !userProfile) return;

    const { availableBalance } = calculateTotals();
    const newCycle = new Date().toISOString().slice(0, 7);
    
    const updates: any = {
      current_cycle: newCycle
    };

    if (availableBalance > 0) {
      updates.total_saved = userProfile.total_saved + availableBalance;
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      toast.error('Erro ao iniciar novo ciclo');
    } else {
      // Remove casual transactions from previous cycle
      await supabase
        .from('transactions')
        .delete()
        .eq('user_id', user.id)
        .eq('type', 'casual')
        .like('date', `${userProfile.current_cycle}%`);

      // Get current cycle installment purchases
      const currentCycleTransactions = transactions.filter(t => 
        t.date.startsWith(userProfile.current_cycle) && 
        t.type === 'card' && 
        !t.is_recurrent
      );

      // Group installment purchases by base description and amount
      const installmentGroups = new Map();
      currentCycleTransactions.forEach(t => {
        const baseDescription = t.description.replace(/ \(\d+\/\d+\)$/, '');
        const key = `${baseDescription}-${t.amount}`;
        
        if (!installmentGroups.has(key)) {
          installmentGroups.set(key, {
            baseDescription,
            amount: t.amount,
            installments: t.installments || 1,
            ideal_day: t.ideal_day,
            transactions: []
          });
        }
        installmentGroups.get(key).transactions.push(t);
      });

      // Process each installment group
      for (const [key, group] of installmentGroups) {
        if (group.installments > 1) {
          // For multi-installment purchases, advance to next installment
          // First, delete all current installments
          await supabase
            .from('transactions')
            .delete()
            .eq('user_id', user.id)
            .eq('type', 'card')
            .eq('amount', group.amount)
            .like('description', `${group.baseDescription}%`)
            .like('date', `${userProfile.current_cycle}%`);

          // Then create new installments for remaining months
          const remainingInstallments = group.installments - 1;
          if (remainingInstallments > 0) {
            const transactionsToInsert = [];
            const [currentYear, currentMonth] = newCycle.split('-').map(Number);

            for (let i = 0; i < remainingInstallments; i++) {
              const targetMonth = currentMonth + i;
              const targetYear = currentYear + Math.floor((targetMonth - 1) / 12);
              const finalMonth = ((targetMonth - 1) % 12) + 1;
              const dateString = `${targetYear}-${String(finalMonth).padStart(2, '0')}-01`;
              
              transactionsToInsert.push({
                user_id: user.id,
                type: 'card',
                description: `${group.baseDescription} (${i + 1}/${remainingInstallments})`,
                amount: group.amount,
                date: dateString,
                is_recurrent: false,
                installments: remainingInstallments,
                current_installment: i + 1,
                ideal_day: group.ideal_day
              });
            }

            if (transactionsToInsert.length > 0) {
              await supabase
                .from('transactions')
                .insert(transactionsToInsert);
            }
          }
        } else {
          // For single installment purchases, they are already removed since they are in current cycle
          // and we're starting a new cycle
        }
      }

      // Add recurrent card transactions to new cycle
      const recurrentTransactions = transactions
        .filter(t => t.is_recurrent && t.type === 'card')
        .map(t => ({
          user_id: user.id,
          type: t.type,
          description: t.description,
          amount: t.amount,
          date: newCycle + '-01',
          is_recurrent: t.is_recurrent,
          installments: t.installments,
          current_installment: t.current_installment,
          ideal_day: t.ideal_day
        }));

      if (recurrentTransactions.length > 0) {
        await supabase
          .from('transactions')
          .insert(recurrentTransactions);
      }

      loadUserProfile();
      loadTransactions();
      toast.success('Novo ciclo iniciado!');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  // Helper function to get current cycle transactions with filters
  const getCurrentCycleTransactions = () => {
    const currentTransactions = transactions.filter(t => t.date.startsWith(userProfile?.current_cycle || ''));
    
    return currentTransactions.filter(transaction => {
      if (transaction.type === 'income' && !transactionFilters.income) return false;
      if (transaction.type === 'fixed' && !transactionFilters.fixed) return false;
      if (transaction.type === 'casual' && !transactionFilters.casual) return false;
      if (transaction.type === 'card') {
        if (transaction.is_recurrent && !transactionFilters.cardRecurrent) return false;
        if (!transaction.is_recurrent && !transactionFilters.cardInstallment) return false;
      }
      return true;
    });
  };

  // Helper function to load more transactions
  const loadMoreTransactions = () => {
    setVisibleTransactions(prev => prev + 5);
  };

  const updateIdealDay = async () => {
    if (!user || !userProfile) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        ideal_day: editIdealDay
      })
      .eq('id', user.id);

    if (error) {
      toast.error('Erro ao atualizar dia ideal');
    } else {
      setUserProfile({
        ...userProfile,
        ideal_day: editIdealDay
      });
      setShowEditIdealDay(false);
      toast.success('Dia ideal atualizado com sucesso!');
    }
  };

  const updateCycle = async () => {
    if (!user || !userProfile || !editCycle) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        current_cycle: editCycle
      })
      .eq('id', user.id);

    if (error) {
      toast.error('Erro ao atualizar ciclo');
    } else {
      // Reload user profile to ensure data is fresh
      await loadUserProfile();
      setShowEditCycle(false);
      toast.success('Ciclo atualizado com sucesso!');
    }
  };

  const resetAllData = async () => {
    if (!user || !userProfile) return;

    try {
      // Delete all transactions
      const { error: transactionsError } = await supabase
        .from('transactions')
        .delete()
        .eq('user_id', user.id);

      if (transactionsError) throw transactionsError;

      // Reset profile to default values
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          salary: 0,
          ideal_day: 5,
          total_saved: 0,
          current_cycle: new Date().toISOString().slice(0, 7)
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Reload data
      await loadUserProfile();
      await loadTransactions();
      
      toast.success('Todos os dados foram resetados com sucesso!');
    } catch (error) {
      console.error('Error resetting data:', error);
      toast.error('Erro ao resetar os dados');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-green-600">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const totals = calculateTotals();
  const currentCycleTransactions = getCurrentCycleTransactions();
  const visibleTransactionsList = currentCycleTransactions.slice(0, visibleTransactions);
  const hasMoreTransactions = currentCycleTransactions.length > visibleTransactions;

  if (isFirstTime && userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-md mx-auto pt-8">
          <Card className="border-green-200 shadow-lg">
            <CardHeader className="text-center bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                <Wallet className="h-6 w-6" />
                Budget Control
              </CardTitle>
              <p className="text-green-100">Bem-vindo, {userProfile.username}!</p>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label htmlFor="salary">Salário Mensal (R$)</Label>
                <Input
                  id="salary"
                  type="number"
                  placeholder="0,00"
                  value={setupData.salary || ''}
                  onChange={(e) => setSetupData({...setupData, salary: Number(e.target.value)})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="idealDay">Dia Ideal do Cartão</Label>
                <Select 
                  value={setupData.ideal_day.toString()} 
                  onValueChange={(value) => setSetupData({...setupData, ideal_day: Number(value)})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({length: 31}, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        Dia {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={setupInitialData} className="w-full bg-green-600 hover:bg-green-700">
                Começar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <Card className="border-green-200 shadow-lg">
          <CardHeader className="text-center bg-gradient-to-r from-green-500 to-emerald-600 text-white">
            <CardTitle className="text-xl flex items-center justify-center gap-2">
              <Wallet className="h-5 w-5" />
              Budget Control
            </CardTitle>
            <div className="flex items-center justify-between text-sm text-green-100">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {userProfile?.username}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-green-100 hover:text-white hover:bg-green-600"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Navigation Menu */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gerenciar por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-4 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/income')}
                className="flex flex-col items-center p-3 h-auto"
              >
                <TrendingUp className="h-4 w-4 mb-1" />
                <span className="text-xs">Rendas</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/instalment-purchases')}
                className="flex flex-col items-center p-3 h-auto"
              >
                <CreditCard className="h-4 w-4 mb-1" />
                <span className="text-xs">Parceladas</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/recurring-purchases')}
                className="flex flex-col items-center p-3 h-auto"
              >
                <RotateCcw className="h-4 w-4 mb-1" />
                <span className="text-xs">Recorrentes</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/fixed-expenses')}
                className="flex flex-col items-center p-3 h-auto"
              >
                <Wallet className="h-4 w-4 mb-1" />
                <span className="text-xs">Fixos</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Balance Overview */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-green-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                R$ {formatCurrency(totals.availableBalance)}
              </div>
              <div className="text-sm text-gray-600">Saldo Disponível</div>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                R$ {formatCurrency(userProfile?.total_saved || 0)}
              </div>
              <div className="text-sm text-gray-600">Total Guardado</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Renda:</span>
                <span className="text-green-600 font-medium">R$ {formatCurrency(totals.totalIncome)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Gastos Totais:</span>
                <span className="text-red-600 font-medium">R$ {formatCurrency(totals.totalExpenses)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Dialog open={showAddTransactionDialog} onOpenChange={setShowAddTransactionDialog}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Nova Transação</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Tipo</Label>
                  <Select 
                    value={newTransaction.type} 
                    onValueChange={(value: Transaction['type']) => setNewTransaction({...newTransaction, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Renda Extra</SelectItem>
                      <SelectItem value="fixed">Gasto Fixo</SelectItem>
                      <SelectItem value="card">Cartão de Crédito</SelectItem>
                      <SelectItem value="casual">Gasto Avulso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Input
                    value={newTransaction.description}
                    onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                    placeholder="Ex: Supermercado"
                  />
                </div>
                {newTransaction.type === 'card' && !newTransaction.is_recurrent && newTransaction.installments > 1 ? (
                  <>
                    <div>
                      <Label>Valor Total (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newTransaction.totalAmount || ''}
                        onChange={(e) => {
                          const totalAmount = Number(e.target.value);
                          const amountPerInstallment = totalAmount / newTransaction.installments;
                          setNewTransaction({
                            ...newTransaction, 
                            totalAmount: totalAmount,
                            amount: Math.round(amountPerInstallment * 100) / 100
                          });
                        }}
                        placeholder="0,00"
                      />
                    </div>
                    <div>
                      <Label>Valor por Parcela (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newTransaction.amount || ''}
                        onChange={(e) => {
                          const amountPerInstallment = Number(e.target.value);
                          const totalAmount = amountPerInstallment * newTransaction.installments;
                          setNewTransaction({
                            ...newTransaction, 
                            amount: amountPerInstallment,
                            totalAmount: Math.round(totalAmount * 100) / 100
                          });
                        }}
                        placeholder="0,00"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <Label>Valor (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newTransaction.amount || ''}
                      onChange={(e) => setNewTransaction({...newTransaction, amount: Number(e.target.value)})}
                      placeholder="0,00"
                    />
                  </div>
                )}
                
                {newTransaction.type === 'card' && (
                  <>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="recurrent"
                        checked={newTransaction.is_recurrent}
                        onCheckedChange={(checked) => setNewTransaction({...newTransaction, is_recurrent: !!checked})}
                      />
                      <Label htmlFor="recurrent">Compra Recorrente</Label>
                    </div>
                    
                     {!newTransaction.is_recurrent && (
                       <div>
                         <Label>Parcelas</Label>
                         <Input
                           type="number"
                           min="1"
                           value={newTransaction.installments}
                           onChange={(e) => {
                             const installments = Number(e.target.value);
                             // Se já tem um valor total definido, recalcula o valor por parcela
                             if (newTransaction.totalAmount > 0) {
                               const amountPerInstallment = newTransaction.totalAmount / installments;
                               setNewTransaction({
                                 ...newTransaction, 
                                 installments: installments,
                                 amount: Math.round(amountPerInstallment * 100) / 100
                               });
                             } else {
                               setNewTransaction({...newTransaction, installments: installments});
                             }
                           }}
                         />
                       </div>
                     )}
                  </>
                )}
                
                <Button onClick={addTransaction} className="w-full">
                  Adicionar
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button 
            onClick={() => setShowHistory(!showHistory)}
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Histórico
          </Button>
        </div>

        {/* Transaction History */}
        {showHistory && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Transações do Mês</span>
                <span className="text-sm font-normal text-gray-500">
                  {currentCycleTransactions.length} total
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {/* Resumo dos valores filtrados */}
              {(() => {
                const filteredTransactions = currentCycleTransactions;
                const totalIncome = filteredTransactions
                  .filter(t => t.type === 'income')
                  .reduce((sum, t) => sum + Number(t.amount), 0);
                const totalExpenses = filteredTransactions
                  .filter(t => t.type !== 'income')
                  .reduce((sum, t) => sum + Number(t.amount), 0);
                const netTotal = totalIncome - totalExpenses;
                
                return (
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <div className="text-sm font-medium text-blue-900 mb-2">Resumo dos Valores Filtrados</div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <div className="text-green-600 font-medium">+R$ {formatCurrency(totalIncome)}</div>
                        <div className="text-gray-500">Rendas</div>
                      </div>
                      <div className="text-center">
                        <div className="text-red-600 font-medium">-R$ {formatCurrency(totalExpenses)}</div>
                        <div className="text-gray-500">Gastos</div>
                      </div>
                      <div className="text-center">
                        <div className={`font-medium ${netTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {netTotal >= 0 ? '+' : ''}R$ {formatCurrency(Math.abs(netTotal))}
                        </div>
                        <div className="text-gray-500">Líquido</div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Filtros */}
              <Accordion type="single" collapsible>
                <AccordionItem value="filters">
                  <AccordionTrigger className="text-sm font-medium">
                    Filtros
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setTransactionFilters({
                              income: true,
                              fixed: true,
                              cardInstallment: true,
                              cardRecurrent: true,
                              casual: true
                            })}
                            className="h-6 text-xs px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            Todos
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setTransactionFilters({
                              income: false,
                              fixed: false,
                              cardInstallment: false,
                              cardRecurrent: false,
                              casual: false
                            })}
                            className="h-6 text-xs px-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100"
                          >
                            Limpar
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="filter-income"
                            checked={transactionFilters.income}
                            onCheckedChange={(checked) => setTransactionFilters(prev => ({...prev, income: !!checked}))}
                          />
                          <Label htmlFor="filter-income" className="text-sm">Renda Extra</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="filter-fixed"
                            checked={transactionFilters.fixed}
                            onCheckedChange={(checked) => setTransactionFilters(prev => ({...prev, fixed: !!checked}))}
                          />
                          <Label htmlFor="filter-fixed" className="text-sm">Gasto Fixo</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="filter-card-installment"
                            checked={transactionFilters.cardInstallment}
                            onCheckedChange={(checked) => setTransactionFilters(prev => ({...prev, cardInstallment: !!checked}))}
                          />
                          <Label htmlFor="filter-card-installment" className="text-sm">Parceladas</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="filter-card-recurrent"
                            checked={transactionFilters.cardRecurrent}
                            onCheckedChange={(checked) => setTransactionFilters(prev => ({...prev, cardRecurrent: !!checked}))}
                          />
                          <Label htmlFor="filter-card-recurrent" className="text-sm">Cartão Recorrente</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="filter-casual"
                            checked={transactionFilters.casual}
                            onCheckedChange={(checked) => setTransactionFilters(prev => ({...prev, casual: !!checked}))}
                          />
                          <Label htmlFor="filter-casual" className="text-sm">Gasto Avulso</Label>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {visibleTransactionsList.map((transaction) => (
                <div key={transaction.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{transaction.description}</div>
                    <div className="text-xs text-gray-500">
                      {getTransactionTypeInPortuguese(transaction.type)}
                    </div>
                    {transaction.created_at && (
                      <div className="text-xs text-gray-400 mt-1">
                        Adicionado em: {formatDateForDisplay(transaction.created_at)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <div className="text-right">
                      <span className={`font-medium text-sm ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}R$ {formatCurrency(Number(transaction.amount))}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingTransaction(transaction);
                          setEditTransaction({
                            description: transaction.description.replace(/ \(\d+\/\d+\)$/, ''),
                            amount: Number(transaction.amount),
                            type: transaction.type,
                            installments: transaction.installments || 1
                          });
                        }}
                        className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50 flex-shrink-0"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setTransactionToDelete(transaction.id)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {currentCycleTransactions.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  Nenhuma transação este mês
                </div>
              )}
              
              {hasMoreTransactions && (
                <div className="text-center pt-2">
                  <Button
                    onClick={loadMoreTransactions}
                    variant="outline"
                    size="sm"
                    className="text-green-600 border-green-600 hover:bg-green-50"
                  >
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Ver mais resultados ({currentCycleTransactions.length - visibleTransactions} restantes)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Delete Transaction Confirmation */}
        <AlertDialog open={!!transactionToDelete} onOpenChange={() => setTransactionToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setTransactionToDelete(null)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => {
                  if (transactionToDelete) {
                    deleteTransaction(transactionToDelete);
                    setTransactionToDelete(null);
                  }
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* New Cycle Button with Confirmation */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 py-3"
              size="lg"
            >
              <DollarSign className="h-5 w-5 mr-2" />
              Iniciar Novo Ciclo
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Novo Ciclo</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja iniciar um novo ciclo? Esta ação irá:
                <br />
                • Salvar o saldo atual ({totals.availableBalance > 0 ? `+R$ ${formatCurrency(totals.availableBalance)}` : 'R$ 0,00'}) na sua reserva
                <br />
                • Remover todos os gastos avulsos do ciclo atual
                <br />
                • Renovar as compras recorrentes do cartão
                <br /><br />
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={startNewCycle} className="bg-blue-600 hover:bg-blue-700">
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Reset Data Button with Confirmation */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="destructive"
              className="w-full py-3"
              size="lg"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Resetar Todos os Dados
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>⚠️ Confirmar Reset Completo</AlertDialogTitle>
              <AlertDialogDescription>
                <strong>ATENÇÃO:</strong> Esta ação irá apagar PERMANENTEMENTE todos os seus dados:
                <br /><br />
                • Todas as transações do histórico
                <br />
                • Valor do salário (voltará para R$ 0,00)
                <br />
                • Total guardado (voltará para R$ 0,00)
                <br />
                • Dia ideal do cartão (voltará para dia 5)
                <br />
                • Ciclo atual será reiniciado
                <br /><br />
                <strong>Esta ação NÃO PODE ser desfeita!</strong>
                <br /><br />
                Tem certeza que deseja continuar?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={resetAllData}
                className="bg-red-600 hover:bg-red-700"
              >
                Sim, Resetar Tudo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit Transaction Dialog */}
        <Dialog open={!!editingTransaction} onOpenChange={() => setEditingTransaction(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Editar Transação</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Tipo</Label>
                <Select 
                  value={editTransaction.type} 
                  onValueChange={(value: Transaction['type']) => setEditTransaction({...editTransaction, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Renda Extra</SelectItem>
                    <SelectItem value="fixed">Gasto Fixo</SelectItem>
                    <SelectItem value="card">Cartão de Crédito</SelectItem>
                    <SelectItem value="casual">Gasto Avulso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Descrição</Label>
                <Input
                  value={editTransaction.description}
                  onChange={(e) => setEditTransaction({...editTransaction, description: e.target.value})}
                  placeholder="Ex: Supermercado"
                />
              </div>
              <div>
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  value={editTransaction.amount || ''}
                  onChange={(e) => setEditTransaction({...editTransaction, amount: Number(e.target.value)})}
                  placeholder="0,00"
                />
              </div>
              
              {editTransaction.type === 'card' && editingTransaction && editingTransaction.installments && editingTransaction.installments > 1 && (
                <div>
                  <Label>Parcelas</Label>
                  <Input
                    type="number"
                    min="1"
                    value={editTransaction.installments}
                    onChange={(e) => setEditTransaction({...editTransaction, installments: Number(e.target.value)})}
                  />
                </div>
              )}
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingTransaction(null)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button onClick={updateTransaction} className="flex-1">
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Footer Info */}
        <Card className="border-gray-200">
          <CardContent className="p-4 text-center text-sm text-gray-600">
            <div className="flex items-center justify-center gap-2">
              <span>Ciclo Atual: {new Date(userProfile?.current_cycle + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
              <Dialog open={showEditCycle} onOpenChange={setShowEditCycle}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                    onClick={() => {
                      setEditCycle(userProfile?.current_cycle || '');
                      setShowEditCycle(true);
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Alterar Mês do Ciclo</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Selecionar Mês/Ano</Label>
                      <Input
                        type="month"
                        value={editCycle}
                        onChange={(e) => setEditCycle(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowEditCycle(false)}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button onClick={updateCycle} className="flex-1">
                        Salvar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span>Dia Ideal do Cartão: {userProfile?.ideal_day}</span>
              <Dialog open={showEditIdealDay} onOpenChange={setShowEditIdealDay}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                    onClick={() => {
                      setEditIdealDay(userProfile?.ideal_day || 5);
                      setShowEditIdealDay(true);
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Editar Dia Ideal do Cartão</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Dia Ideal</Label>
                      <Select 
                        value={editIdealDay.toString()} 
                        onValueChange={(value) => setEditIdealDay(Number(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({length: 31}, (_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              Dia {i + 1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowEditIdealDay(false)}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button onClick={updateIdealDay} className="flex-1">
                        Salvar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
