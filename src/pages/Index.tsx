
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Wallet } from 'lucide-react';
import { BalanceCards } from '@/components/BalanceCards';
import { TransactionForm } from '@/components/TransactionForm';
import { TransactionList } from '@/components/TransactionList';
import { NewCycleDialog } from '@/components/NewCycleDialog';

interface Profile {
  id: string;
  username: string;
  salary: number;
  ideal_day: number;
  total_saved: number;
  current_cycle: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  description: string;
  date: string;
  is_recurrent: boolean;
  installments: number;
  current_installment: number;
  ideal_day?: number;
}

const TRANSACTIONS_PER_PAGE = 5;

const Index = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [loading, setLoading] = useState(true);
  const [displayedTransactions, setDisplayedTransactions] = useState(TRANSACTIONS_PER_PAGE);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchTransactions();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar perfil.",
        variant: "destructive",
      });
    } else {
      setProfile(data);
    }
    setLoading(false);
  };

  const fetchTransactions = async () => {
    if (!user) return;

    const currentCycle = new Date().toISOString().slice(0, 7);
    
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .like('date', `${currentCycle}%`)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar transações.",
        variant: "destructive",
      });
    } else {
      setTransactions(data as Transaction[] || []);
      calculateBalance(data as Transaction[] || []);
    }
  };

  const calculateBalance = (transactionList: Transaction[]) => {
    const total = transactionList.reduce((acc, transaction) => {
      return transaction.type === 'income' 
        ? acc + Number(transaction.amount)
        : acc - Number(transaction.amount);
    }, 0);
    setBalance(total);
  };

  const addTransaction = async () => {
    if (!user || !amount || !description) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const currentDate = new Date().toISOString().slice(0, 10);
    
    const { error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        amount: parseFloat(amount),
        type,
        description,
        date: currentDate,
        is_recurrent: false,
        installments: 1,
        current_installment: 1
      });

    if (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar transação.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Transação adicionada com sucesso!",
      });
      
      setAmount('');
      setDescription('');
      setType('expense');
      
      fetchTransactions();
    }
  };

  const startNewCycle = async () => {
    if (!user || !profile) return;

    const newCycle = new Date().toISOString().slice(0, 7);
    const positiveBalance = Math.max(0, balance);

    const { error } = await supabase
      .from('profiles')
      .update({
        total_saved: profile.total_saved + positiveBalance,
        current_cycle: newCycle
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error starting new cycle:', error);
      toast({
        title: "Erro",
        description: "Erro ao iniciar novo ciclo.",
        variant: "destructive",
      });
    } else {
      await supabase
        .from('transactions')
        .delete()
        .eq('user_id', user.id)
        .eq('is_recurrent', false);

      toast({
        title: "Novo Ciclo Iniciado",
        description: `Saldo positivo de R$ ${positiveBalance.toFixed(2)} foi salvo!`,
      });
      
      fetchProfile();
      fetchTransactions();
      setDisplayedTransactions(TRANSACTIONS_PER_PAGE);
    }
  };

  const loadMoreTransactions = () => {
    setDisplayedTransactions(prev => prev + TRANSACTIONS_PER_PAGE);
  };

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">Carregando...</div>;
  }

  if (!profile) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">Perfil não encontrado</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Wallet className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">Controle Financeiro</h1>
          </div>
          <p className="text-gray-600">Olá, {profile.username}!</p>
        </div>

        {/* Balance Cards */}
        <BalanceCards balance={balance} profile={profile} />

        {/* Add Transaction Form */}
        <TransactionForm
          amount={amount}
          description={description}
          type={type}
          onAmountChange={setAmount}
          onDescriptionChange={setDescription}
          onTypeChange={setType}
          onSubmit={addTransaction}
        />

        {/* Transaction History */}
        <TransactionList
          transactions={transactions}
          displayedTransactions={displayedTransactions}
          onLoadMore={loadMoreTransactions}
        />

        {/* New Cycle Button */}
        <NewCycleDialog
          balance={balance}
          onStartNewCycle={startNewCycle}
        />
      </div>
    </div>
  );
};

export default Index;
