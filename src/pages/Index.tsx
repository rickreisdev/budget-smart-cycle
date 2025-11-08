import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Trash2, Plus, DollarSign, CreditCard, TrendingUp, Wallet, LogOut, User, ChevronDown, Edit, RotateCcw, Edit2, CalendarIcon, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatDateToBrazilian } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import MonthSelector from '@/components/MonthSelector';

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
  salary: number; // Deprecated, kept for backward compatibility
  initial_income: number;
  monthly_salary: number;
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
  const [recurrentToDelete, setRecurrentToDelete] = useState<Transaction | null>(null);
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
    initial_income: 0,
    monthly_salary: 0,
    ideal_day: 5
  });

  const [editIdealDay, setEditIdealDay] = useState(5);
  const [editCycle, setEditCycle] = useState('');
  
  // Double confirmation states
  const [showNewCycleConfirmation, setShowNewCycleConfirmation] = useState(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [showMonthSelectorAfterReset, setShowMonthSelectorAfterReset] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [showIncomeChoiceDialog, setShowIncomeChoiceDialog] = useState(false);

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
      // Check if it's first time based on new fields
      setIsFirstTime(data.initial_income === 0 && data.monthly_salary === 0);
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

    // Calculate total income based on initial income + any additional income transactions
    const totalIncome = userProfile.initial_income + currentMonthTransactions
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
        initial_income: setupData.initial_income,
        monthly_salary: setupData.monthly_salary,
        ideal_day: setupData.ideal_day
      })
      .eq('id', user.id);

    if (error) {
      toast.error('Erro ao salvar configuração');
    } else {
      setUserProfile({
        ...userProfile,
        initial_income: setupData.initial_income,
        monthly_salary: setupData.monthly_salary,
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

    // Check if it's a recurrent transaction
    if (transactionToDelete.is_recurrent) {
      setRecurrentToDelete(transactionToDelete);
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

  const deleteRecurrentFromCurrentCycle = async () => {
    if (!recurrentToDelete || !userProfile) return;

    try {
      // Delete only from current cycle
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', recurrentToDelete.id);

      if (error) throw error;

      loadTransactions();
      toast.success('Transação removida apenas do ciclo atual');
      setRecurrentToDelete(null);
    } catch (error) {
      console.error('Error deleting recurrent from current cycle:', error);
      toast.error('Erro ao remover transação');
    }
  };

  const deleteRecurrentFromAllCycles = async () => {
    if (!recurrentToDelete || !userProfile) return;

    try {
      // Delete all instances of this recurrent transaction
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('user_id', user?.id)
        .eq('description', recurrentToDelete.description)
        .eq('amount', recurrentToDelete.amount)
        .eq('type', recurrentToDelete.type)
        .eq('is_recurrent', true);

      if (error) throw error;

      loadTransactions();
      toast.success('Transação recorrente removida de todos os ciclos');
      setRecurrentToDelete(null);
    } catch (error) {
      console.error('Error deleting recurrent from all cycles:', error);
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

  const startNewCycleWithIncome = async (incomeToAdd: 'monthly_salary' | 'initial_income' | 'none') => {
    if (!user || !userProfile) return;

    const { availableBalance } = calculateTotals();
    
    // Increment the current cycle month
    const [currentYear, currentMonth] = userProfile.current_cycle.split('-').map(Number);
    const nextMonth = currentMonth + 1;
    const nextYear = currentYear + Math.floor((nextMonth - 1) / 12);
    const finalMonth = ((nextMonth - 1) % 12) + 1;
    const newCycle = `${nextYear}-${String(finalMonth).padStart(2, '0')}`;
    
    const updates: any = {
      current_cycle: newCycle
    };

    // Add current balance to total saved
    if (availableBalance > 0) {
      updates.total_saved = userProfile.total_saved + availableBalance;
    }

    // Add the chosen income value
    if (incomeToAdd === 'monthly_salary' && userProfile.monthly_salary > 0) {
      updates.initial_income = userProfile.monthly_salary;
    } else if (incomeToAdd === 'initial_income' && userProfile.initial_income > 0) {
      updates.initial_income = userProfile.initial_income;
    } else if (incomeToAdd === 'none') {
      updates.initial_income = 0;
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
        // Simply delete the current cycle's installment
        // Future installments already exist from when the purchase was created
        await supabase
          .from('transactions')
          .delete()
          .eq('user_id', user.id)
          .eq('type', 'card')
          .eq('amount', group.amount)
          .like('description', `${group.baseDescription}%`)
          .like('date', `${userProfile.current_cycle}%`);
      }

      // Handle recurrent transactions for new cycle
      // Get all unique recurrent transactions that should exist
      const uniqueRecurrentMap = new Map();
      
      transactions
        .filter(t => t.is_recurrent === true)
        .forEach(t => {
          const uniqueKey = `${t.description}_${t.amount}_${t.type}`;
          if (!uniqueRecurrentMap.has(uniqueKey)) {
            uniqueRecurrentMap.set(uniqueKey, t);
          }
        });

      // Check which recurrent transactions already exist in the new cycle
      const { data: existingRecurrentInNewCycle } = await supabase
        .from('transactions')
        .select('description, amount, type')
        .eq('user_id', user.id)
        .eq('is_recurrent', true)
        .like('date', `${newCycle}%`);

      const existingKeys = new Set(
        (existingRecurrentInNewCycle || []).map(t => `${t.description}_${t.amount}_${t.type}`)
      );

      // Only create recurrent transactions that don't already exist in the new cycle
      const recurrentTransactionsToInsert = Array.from(uniqueRecurrentMap.values())
        .filter(t => {
          const key = `${t.description}_${t.amount}_${t.type}`;
          return !existingKeys.has(key);
        })
        .map(t => ({
          user_id: user.id,
          type: t.type,
          description: t.description,
          amount: t.amount,
          date: newCycle + '-01',
          is_recurrent: true,
          installments: t.installments,
          current_installment: t.current_installment,
          ideal_day: t.ideal_day
        }));

      if (recurrentTransactionsToInsert.length > 0) {
        await supabase
          .from('transactions')
          .insert(recurrentTransactionsToInsert);
      }

      loadUserProfile();
      loadTransactions();
      setShowIncomeChoiceDialog(false);
      toast.success('Novo ciclo iniciado!');
    }
  };

  const startNewCycle = () => {
    if (!user || !userProfile) return;
    
    // Check if user has monthly_salary or initial_income to ask
    const hasMonthlyIncome = userProfile.monthly_salary > 0;
    const hasInitialIncome = userProfile.initial_income > 0;
    
    if (hasMonthlyIncome || hasInitialIncome) {
      // Show dialog to choose income
      setShowIncomeChoiceDialog(true);
    } else {
      // No income to add, proceed directly
      startNewCycleWithIncome('none');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  // Helper function to get current cycle transactions with filters
  const getCurrentCycleTransactions = () => {
    const currentTransactions = transactions.filter(t => t.date.startsWith(userProfile?.current_cycle || ''));
    
    // Remove duplicates for recurrent transactions - show only one instance of each
    const uniqueTransactions = new Map();
    const filteredTransactions = currentTransactions.filter(transaction => {
      if (transaction.type === 'income' && !transactionFilters.income) return false;
      if (transaction.type === 'fixed' && !transactionFilters.fixed) return false;
      if (transaction.type === 'casual' && !transactionFilters.casual) return false;
      if (transaction.type === 'card') {
        if (transaction.is_recurrent && !transactionFilters.cardRecurrent) return false;
        if (!transaction.is_recurrent && !transactionFilters.cardInstallment) return false;
      }
      return true;
    });

    // For recurrent transactions, keep only one instance
    filteredTransactions.forEach(transaction => {
      if (transaction.is_recurrent) {
        const uniqueKey = `${transaction.description}_${transaction.amount}_${transaction.type}`;
        if (!uniqueTransactions.has(uniqueKey)) {
          uniqueTransactions.set(uniqueKey, transaction);
        }
      } else {
        // For non-recurrent transactions, use the transaction ID as key to keep all
        uniqueTransactions.set(transaction.id, transaction);
      }
    });

    return Array.from(uniqueTransactions.values());
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
    
    setShowResetConfirmation(false);
    setShowMonthSelectorAfterReset(true);
  };

  const exportTransactionsToCSV = () => {
    if (!userProfile) return;

    // Filter transactions from current cycle
    const currentTransactions = transactions.filter(t => 
      t.date.startsWith(userProfile.current_cycle)
    );

    if (currentTransactions.length === 0) {
      toast.error('Não há transações para exportar neste ciclo');
      return;
    }

    // Define CSV headers
    const headers = ['Tipo', 'Descrição', 'Valor', 'Data', 'Recorrente', 'Parcela', 'Dia Ideal'];
    
    // Map transaction types to Portuguese
    const typeMap = {
      income: 'Renda Extra',
      fixed: 'Despesa Fixa',
      card: 'Cartão',
      casual: 'Avulso'
    };

    // Convert transactions to CSV rows
    const rows = currentTransactions.map(t => {
      const installmentInfo = t.installments && t.installments > 1 
        ? `${t.current_installment}/${t.installments}`
        : '-';
      
      return [
        typeMap[t.type] || t.type,
        t.description,
        `R$ ${formatCurrency(t.amount)}`,
        formatDateToBrazilian(t.date),
        t.is_recurrent ? 'Sim' : 'Não',
        installmentInfo,
        t.ideal_day || '-'
      ];
    });

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `transacoes_${userProfile.current_cycle}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Transações exportadas com sucesso!');
  };

  const handleMonthSelectedAfterReset = async (selectedMonth: string) => {
    if (!user || !userProfile) return;

    try {
      // Delete all transactions
      const { error: transactionsError } = await supabase
        .from('transactions')
        .delete()
        .eq('user_id', user.id);

      if (transactionsError) throw transactionsError;

      // Reset profile to default values with selected month
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          initial_income: 0,
          monthly_salary: 0,
          salary: 0, // Keep for backward compatibility
          ideal_day: 5,
          total_saved: 0,
          current_cycle: selectedMonth
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Reload data
      await loadUserProfile();
      await loadTransactions();
      
      setShowMonthSelectorAfterReset(false);
      toast.success('Todos os dados foram resetados com sucesso!');
    } catch (error) {
      console.error('Error resetting data:', error);
      toast.error('Erro ao resetar os dados');
      setShowMonthSelectorAfterReset(false);
    }
  };

  if (showMonthSelectorAfterReset) {
    return (
      <MonthSelector 
        onMonthSelected={handleMonthSelectedAfterReset}
        loading={false}
        title="Selecionar Novo Mês"
        description="Após resetar os dados, selecione o mês atual para reiniciar seu controle financeiro."
      />
    );
  }

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
                <Label htmlFor="initial_income">Receita Inicial</Label>
                <CurrencyInput
                  id="initial_income"
                  placeholder="0,00"
                  value={setupData.initial_income?.toString() || ''}
                  onValueChange={(value) => setSetupData({...setupData, initial_income: Number(value)})}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Valor que você possui disponível no início do ciclo</p>
              </div>
              <div>
                <Label htmlFor="monthly_salary">Salário Mensal</Label>
                <CurrencyInput
                  id="monthly_salary"
                  placeholder="0,00"
                  value={setupData.monthly_salary?.toString() || ''}
                  onValueChange={(value) => setSetupData({...setupData, monthly_salary: Number(value)})}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Valor que será adicionado a cada novo ciclo (pode ser zero)</p>
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
        <div className="grid grid-cols-3 gap-3">
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
                      <Label>Valor Total</Label>
                      <CurrencyInput
                        value={newTransaction.totalAmount?.toString() || ''}
                        onValueChange={(value) => {
                          const totalAmount = Number(value);
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
                      <Label>Valor por Parcela</Label>
                      <CurrencyInput
                        value={newTransaction.amount?.toString() || ''}
                        onValueChange={(value) => {
                          const amountPerInstallment = Number(value);
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
                    <Label>Valor</Label>
                    <CurrencyInput
                      value={newTransaction.amount?.toString() || ''}
                      onValueChange={(value) => setNewTransaction({...newTransaction, amount: Number(value)})}
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
            onClick={exportTransactionsToCSV}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>

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

        {/* Recurrent Transaction Delete Options Dialog */}
        <AlertDialog open={!!recurrentToDelete} onOpenChange={() => setRecurrentToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover Transação Recorrente</AlertDialogTitle>
              <AlertDialogDescription>
                Esta é uma transação recorrente. Como você gostaria de removê-la?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-3">
              <Button
                onClick={deleteRecurrentFromCurrentCycle}
                variant="outline"
                className="w-full justify-start"
              >
                <span className="text-left">
                  <div className="font-medium">Remover apenas do ciclo atual</div>
                  <div className="text-sm text-gray-500">A transação continuará aparecendo nos próximos ciclos</div>
                </span>
              </Button>
              <Button
                onClick={deleteRecurrentFromAllCycles}
                variant="destructive"
                className="w-full justify-start"
              >
                <span className="text-left">
                  <div className="font-medium">Remover de todos os ciclos</div>
                  <div className="text-sm text-red-200">A transação será removida permanentemente</div>
                </span>
              </Button>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* New Cycle Button with Confirmation */}
        <AlertDialog open={showNewCycleConfirmation} onOpenChange={setShowNewCycleConfirmation}>
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
              <AlertDialogAction 
                onClick={() => {
                  setShowNewCycleConfirmation(false);
                  // Open second confirmation dialog
                  setTimeout(() => {
                    const secondDialog = document.getElementById('new-cycle-final-confirmation');
                    if (secondDialog) secondDialog.click();
                  }, 100);
                }} 
                className="bg-blue-600 hover:bg-blue-700"
              >
                Continuar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Second confirmation for new cycle */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button id="new-cycle-final-confirmation" className="hidden" />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>⚠️ Confirmação Final</AlertDialogTitle>
              <AlertDialogDescription>
                <strong>ÚLTIMA CONFIRMAÇÃO:</strong> Para iniciar um novo ciclo, digite <strong>"CONFIRMAR"</strong> no campo abaixo:
                <br /><br />
                <Input
                  placeholder="Digite CONFIRMAR"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  className="mt-2"
                />
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmationText('')}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => {
                  if (confirmationText === 'CONFIRMAR') {
                    startNewCycle();
                    setConfirmationText('');
                  } else {
                    toast.error('Digite "CONFIRMAR" para prosseguir');
                  }
                }}
                disabled={confirmationText !== 'CONFIRMAR'}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Iniciar Novo Ciclo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Reset Data Button with Confirmation */}
        <AlertDialog open={showResetConfirmation} onOpenChange={setShowResetConfirmation}>
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
                onClick={() => {
                  setShowResetConfirmation(false);
                  // Open second confirmation dialog
                  setTimeout(() => {
                    const secondDialog = document.getElementById('reset-final-confirmation');
                    if (secondDialog) secondDialog.click();
                  }, 100);
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Continuar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Second confirmation for reset */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button id="reset-final-confirmation" className="hidden" />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>🚨 CONFIRMAÇÃO DEFINITIVA</AlertDialogTitle>
              <AlertDialogDescription>
                <strong>ÚLTIMA CHANCE:</strong> Para resetar TODOS os dados permanentemente, digite <strong>"RESETAR TUDO"</strong> no campo abaixo:
                <br /><br />
                <div className="bg-red-50 border border-red-200 p-3 rounded mb-3">
                  <strong className="text-red-600">AÇÃO IRREVERSÍVEL:</strong> Todos os seus dados serão perdidos para sempre!
                </div>
                <Input
                  placeholder="Digite RESETAR TUDO"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  className="mt-2"
                />
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmationText('')}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => {
                  if (confirmationText === 'RESETAR TUDO') {
                    resetAllData();
                    setConfirmationText('');
                  } else {
                    toast.error('Digite "RESETAR TUDO" para prosseguir');
                  }
                }}
                disabled={confirmationText !== 'RESETAR TUDO'}
                className="bg-red-600 hover:bg-red-700"
              >
                Resetar Definitivamente
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Income Choice Dialog for New Cycle */}
        <Dialog open={showIncomeChoiceDialog} onOpenChange={setShowIncomeChoiceDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Escolha a Renda para o Próximo Ciclo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Qual valor você deseja adicionar como renda no próximo ciclo?
              </p>
              
              <div className="space-y-3">
                {userProfile?.monthly_salary && userProfile.monthly_salary > 0 && (
                  <Button
                    onClick={() => startNewCycleWithIncome('monthly_salary')}
                    className="w-full justify-between"
                    variant="outline"
                  >
                    <span>Salário Mensal</span>
                    <span className="font-semibold">R$ {formatCurrency(userProfile.monthly_salary)}</span>
                  </Button>
                )}
                
                {userProfile?.initial_income && userProfile.initial_income > 0 && (
                  <Button
                    onClick={() => startNewCycleWithIncome('initial_income')}
                    className="w-full justify-between"
                    variant="outline"
                  >
                    <span>Receita Inicial Atual</span>
                    <span className="font-semibold">R$ {formatCurrency(userProfile.initial_income)}</span>
                  </Button>
                )}
                
                <Button
                  onClick={() => startNewCycleWithIncome('none')}
                  className="w-full"
                  variant="secondary"
                >
                  Não adicionar renda
                </Button>
              </div>
              
              <Button
                onClick={() => setShowIncomeChoiceDialog(false)}
                variant="ghost"
                className="w-full"
              >
                Cancelar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

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
