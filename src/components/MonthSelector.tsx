import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, CheckCircle } from 'lucide-react';

interface MonthSelectorProps {
  onMonthSelected: (monthYear: string) => void;
  loading?: boolean;
  title?: string;
  description?: string;
}

const MonthSelector: React.FC<MonthSelectorProps> = ({ 
  onMonthSelected, 
  loading = false,
  title = "Selecione o Mês Atual",
  description = "Para começar, precisamos saber qual é o seu mês atual de controle financeiro."
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Generate options for current year and next year
  const generateMonthOptions = () => {
    const options = [];
    
    // Current year months (from current month onwards)
    for (let i = currentMonth; i < 12; i++) {
      const value = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
      options.push({
        value,
        label: `${months[i]} ${currentYear}`
      });
    }
    
    // Next year months (all months)
    for (let i = 0; i < 12; i++) {
      const value = `${currentYear + 1}-${String(i + 1).padStart(2, '0')}`;
      options.push({
        value,
        label: `${months[i]} ${currentYear + 1}`
      });
    }
    
    return options;
  };

  const monthOptions = generateMonthOptions();
  
  // Set current month as default
  const defaultValue = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  
  React.useEffect(() => {
    setSelectedMonth(defaultValue);
  }, [defaultValue]);

  const handleConfirm = () => {
    if (selectedMonth) {
      onMonthSelected(selectedMonth);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 flex items-center justify-center">
      <div className="max-w-md w-full">
        <Card className="border-green-200 shadow-lg">
          <CardHeader className="text-center bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
            <CardTitle className="text-xl flex items-center justify-center gap-2">
              <Calendar className="h-5 w-5" />
              {title}
            </CardTitle>
            <p className="text-green-100 text-sm">{description}</p>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Mês de Controle Financeiro
              </label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o mês atual" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Este será o seu ciclo atual de controle financeiro. Você poderá alterar depois se necessário.
              </p>
            </div>
            
            <Button 
              onClick={handleConfirm}
              disabled={!selectedMonth || loading}
              className="w-full bg-green-600 hover:bg-green-700 py-3"
              size="lg"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {loading ? 'Configurando...' : 'Confirmar'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MonthSelector;