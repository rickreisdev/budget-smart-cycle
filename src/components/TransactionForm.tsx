
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, TrendingUp, TrendingDown } from 'lucide-react';

interface TransactionFormProps {
  amount: string;
  description: string;
  type: 'income' | 'expense';
  onAmountChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onTypeChange: (type: 'income' | 'expense') => void;
  onSubmit: () => void;
}

export const TransactionForm = ({
  amount,
  description,
  type,
  onAmountChange,
  onDescriptionChange,
  onTypeChange,
  onSubmit
}: TransactionFormProps) => {
  return (
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
              onChange={(e) => onAmountChange(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Descrição</label>
            <Input
              placeholder="Descrição da transação"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={type === 'income' ? 'default' : 'outline'}
            onClick={() => onTypeChange('income')}
            className="flex-1"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Receita
          </Button>
          <Button
            variant={type === 'expense' ? 'default' : 'outline'}
            onClick={() => onTypeChange('expense')}
            className="flex-1"
          >
            <TrendingDown className="h-4 w-4 mr-2" />
            Despesa
          </Button>
        </div>
        
        <Button onClick={onSubmit} className="w-full">
          Adicionar Transação
        </Button>
      </CardContent>
    </Card>
  );
};
