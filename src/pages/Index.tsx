
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, DollarSign, CreditCard, TrendingUp, Wallet } from 'lucide-react';
import { toast } from 'sonner';

interface Transaction {
  id: string;
  type: 'income' | 'fixed' | 'card' | 'casual';
  description: string;
  amount: number;
  date: string;
  isRecurrent?: boolean;
  installments?: number;
  currentInstallment?: number;
  idealDay?: number;
}

interface UserData {
  salary: number;
  idealDay: number;
  totalSaved: number;
  transactions: Transaction[];
  currentCycle: string;
}

const Index = () => {
  const [userData, setUserData] = useState<UserData>({
    salary: 0,
    idealDay: 5,
    totalSaved: 0,
    transactions: [],
    currentCycle: new Date().toISOString().slice(0, 7)
  });

  const [isFirstTime, setIsFirstTime] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  // Form states
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: 0,
    type: 'casual' as Transaction['type'],
    isRecurrent: false,
    installments: 1,
    idealDay: 5
  });

  // Load data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('budget-smart-cycle');
    if (saved) {
      const data = JSON.parse(saved);
      setUserData(data);
      setIsFirstTime(false);
    }
  }, []);

  // Save data to localStorage
  const saveData = (data: UserData) => {
    localStorage.setItem('budget-smart-cycle', JSON.stringify(data));
    setUserData(data);
  };

  // Calculate totals
  const calculateTotals = () => {
    const currentMonthTransactions = userData.transactions.filter(t => 
      t.date.startsWith(userData.currentCycle)
    );

    const totalIncome = userData.salary + currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalFixed = currentMonthTransactions
      .filter(t => t.type === 'fixed')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalCard = currentMonthTransactions
      .filter(t => t.type === 'card')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalCasual = currentMonthTransactions
      .filter(t => t.type === 'casual')
      .reduce((sum, t) => sum + t.amount, 0);

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

  const addTransaction = () => {
    if (!newTransaction.description || newTransaction.amount <= 0) {
      toast.error('Preencha todos os campos corretamente');
      return;
    }

    const transaction: Transaction = {
      id: Date.now().toString(),
      ...newTransaction,
      date: userData.currentCycle + '-01'
    };

    if (newTransaction.type === 'card' && !newTransaction.isRecurrent) {
      // Handle installments
      const transactions = [];
      for (let i = 0; i < newTransaction.installments; i++) {
        const installmentDate = new Date(userData.currentCycle + '-01');
        installmentDate.setMonth(installmentDate.getMonth() + i);
        transactions.push({
          ...transaction,
          id: `${transaction.id}-${i}`,
          date: installmentDate.toISOString().slice(0, 7) + '-01',
          currentInstallment: i + 1,
          description: `${transaction.description} (${i + 1}/${newTransaction.installments})`
        });
      }
      
      const updatedData = {
        ...userData,
        transactions: [...userData.transactions, ...transactions]
      };
      saveData(updatedData);
    } else {
      const updatedData = {
        ...userData,
        transactions: [...userData.transactions, transaction]
      };
      saveData(updatedData);
    }

    setNewTransaction({
      description: '',
      amount: 0,
      type: 'casual',
      isRecurrent: false,
      installments: 1,
      idealDay: userData.idealDay
    });

    toast.success('Transação adicionada com sucesso!');
  };

  const deleteTransaction = (id: string) => {
    const updatedData = {
      ...userData,
      transactions: userData.transactions.filter(t => !t.id.startsWith(id.split('-')[0]))
    };
    saveData(updatedData);
    toast.success('Transação removida');
  };

  const startNewCycle = () => {
    const { availableBalance } = calculateTotals();
    
    if (availableBalance > 0) {
      const updatedData = {
        ...userData,
        totalSaved: userData.totalSaved + availableBalance,
        transactions: userData.transactions.filter(t => 
          t.type === 'fixed' || 
          t.type === 'card' || 
          !t.date.startsWith(userData.currentCycle)
        ),
        currentCycle: new Date().toISOString().slice(0, 7)
      };

      // Add recurrent transactions to new cycle
      const recurrentTransactions = userData.transactions
        .filter(t => t.isRecurrent && t.type === 'card')
        .map(t => ({
          ...t,
          id: Date.now().toString() + Math.random().toString(),
          date: updatedData.currentCycle + '-01'
        }));

      updatedData.transactions = [...updatedData.transactions, ...recurrentTransactions];
      saveData(updatedData);
      toast.success('Novo ciclo iniciado!');
    } else {
      const updatedData = {
        ...userData,
        currentCycle: new Date().toISOString().slice(0, 7)
      };
      saveData(updatedData);
      toast.success('Novo ciclo iniciado!');
    }
  };

  const setupInitialData = () => {
    const updatedData = {
      ...userData,
      salary: newTransaction.amount,
      idealDay: newTransaction.idealDay
    };
    saveData(updatedData);
    setIsFirstTime(false);
    toast.success('Configuração inicial concluída!');
  };

  const totals = calculateTotals();

  if (isFirstTime) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-md mx-auto pt-8">
          <Card className="border-green-200 shadow-lg">
            <CardHeader className="text-center bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                <Wallet className="h-6 w-6" />
                Budget Smart Cycle
              </CardTitle>
              <p className="text-green-100">Configure seus dados iniciais</p>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label htmlFor="salary">Salário Mensal (R$)</Label>
                <Input
                  id="salary"
                  type="number"
                  placeholder="0,00"
                  value={newTransaction.amount || ''}
                  onChange={(e) => setNewTransaction({...newTransaction, amount: Number(e.target.value)})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="idealDay">Dia Ideal do Cartão</Label>
                <Select 
                  value={newTransaction.idealDay.toString()} 
                  onValueChange={(value) => setNewTransaction({...newTransaction, idealDay: Number(value)})}
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
              Budget Smart Cycle
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Balance Overview */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-green-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                R$ {totals.availableBalance.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Saldo Disponível</div>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                R$ {userData.totalSaved.toFixed(2)}
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
                <span className="text-green-600 font-medium">R$ {totals.totalIncome.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Gastos Totais:</span>
                <span className="text-red-600 font-medium">R$ {totals.totalExpenses.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Dialog>
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
                <div>
                  <Label>Valor (R$)</Label>
                  <Input
                    type="number"
                    value={newTransaction.amount || ''}
                    onChange={(e) => setNewTransaction({...newTransaction, amount: Number(e.target.value)})}
                    placeholder="0,00"
                  />
                </div>
                
                {newTransaction.type === 'card' && (
                  <>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="recurrent"
                        checked={newTransaction.isRecurrent}
                        onCheckedChange={(checked) => setNewTransaction({...newTransaction, isRecurrent: !!checked})}
                      />
                      <Label htmlFor="recurrent">Compra Recorrente</Label>
                    </div>
                    
                    {!newTransaction.isRecurrent && (
                      <div>
                        <Label>Parcelas</Label>
                        <Input
                          type="number"
                          min="1"
                          value={newTransaction.installments}
                          onChange={(e) => setNewTransaction({...newTransaction, installments: Number(e.target.value)})}
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
              <CardTitle className="text-lg">Transações do Mês</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {userData.transactions
                .filter(t => t.date.startsWith(userData.currentCycle))
                .map((transaction) => (
                  <div key={transaction.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{transaction.description}</div>
                      <div className="text-xs text-gray-500 capitalize">{transaction.type}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}R$ {transaction.amount.toFixed(2)}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteTransaction(transaction.id)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              {userData.transactions.filter(t => t.date.startsWith(userData.currentCycle)).length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  Nenhuma transação este mês
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* New Cycle Button */}
        <Button 
          onClick={startNewCycle}
          className="w-full bg-blue-600 hover:bg-blue-700 py-3"
          size="lg"
        >
          <DollarSign className="h-5 w-5 mr-2" />
          Iniciar Novo Ciclo
        </Button>

        {/* Footer Info */}
        <Card className="border-gray-200">
          <CardContent className="p-4 text-center text-sm text-gray-600">
            <div>Ciclo Atual: {new Date(userData.currentCycle).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</div>
            <div>Dia Ideal do Cartão: {userData.idealDay}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
