import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Wallet, Plus, TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const [isRecurrent, setIsRecurrent] = useState(false);
  const [installments, setInstallments] = useState(1);
  const [idealDay, setIdealDay] = useState<number | undefined>();
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

    const currentCycle = new Date().toISOString().slice(0, 7); // YYYY-MM format
    
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
      // Cast the type to ensure TypeScript compatibility
      const typedTransactions = (data || []).map(transaction => ({
        ...transaction,
        type: transaction.type as 'income' | 'expense'
      }));
      setTransactions(typedTransactions);
      calculateBalance(typedTransactions);
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
        is_recurrent: isRecurrent,
        installments,
        current_installment: 1,
        ideal_day: idealDay
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
      setIsRecurrent(false);
      setInstallments(1);
      setIdealDay(undefined);
      
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

  const hasMoreTransactions = displayedTransactions < transactions.length;

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                R$ {balance.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Economizado</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                R$ {profile.total_saved.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ciclo Atual</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">
                {profile.current_cycle}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Transaction Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Nova Transação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Valor</label>
                <Input
                  type="number"
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Input
                  placeholder="Descrição da transação"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={type === 'income' ? 'default' : 'outline'}
                onClick={() => setType('income')}
                className="flex-1"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Receita
              </Button>
              <Button
                variant={type === 'expense' ? 'default' : 'outline'}
                onClick={() => setType('expense')}
                className="flex-1"
              >
                <TrendingDown className="h-4 w-4 mr-2" />
                Despesa
              </Button>
            </div>
            
            <Button onClick={addTransaction} className="w-full">
              Adicionar Transação
            </Button>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Transações</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhuma transação encontrada</p>
            ) : (
              <div className="space-y-2">
                {transactions.slice(0, displayedTransactions).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{transaction.description}</span>
                        {transaction.is_recurrent && (
                          <Badge variant="secondary">Recorrente</Badge>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">{transaction.date}</span>
                    </div>
                    <div className={`font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'income' ? '+' : '-'}R$ {transaction.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
                
                {hasMoreTransactions && (
                  <div className="text-center pt-4">
                    <Button variant="outline" onClick={loadMoreTransactions}>
                      Ver mais resultados ({transactions.length - displayedTransactions} restantes)
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* New Cycle Button */}
        <Card>
          <CardContent className="pt-6">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="w-full" variant="destructive">
                  Iniciar Novo Ciclo
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Início de Novo Ciclo</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação irá:
                    <br />• Salvar o saldo positivo atual (R$ {Math.max(0, balance).toFixed(2)}) no total economizado
                    <br />• Apagar todas as despesas casuais do ciclo atual
                    <br />• Renovar as compras recorrentes do cartão
                    <br /><br />
                    Tem certeza que deseja continuar?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={startNewCycle}>
                    Sim, iniciar novo ciclo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
