
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

interface TransactionListProps {
  transactions: Transaction[];
  displayedTransactions: number;
  onLoadMore: () => void;
}

export const TransactionList = ({ 
  transactions, 
  displayedTransactions, 
  onLoadMore 
}: TransactionListProps) => {
  const hasMoreTransactions = displayedTransactions < transactions.length;

  return (
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
                <Button variant="outline" onClick={onLoadMore}>
                  Ver mais resultados ({transactions.length - displayedTransactions} restantes)
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
