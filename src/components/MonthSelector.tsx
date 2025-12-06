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
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <div className="max-w-md w-full animate-fade-in">
        <Card className="overflow-hidden border-0 shadow-xl">
          <CardHeader className="text-center gradient-primary text-primary-foreground pb-8 pt-10">
            <div className="mx-auto w-16 h-16 bg-primary-foreground/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm">
              <Calendar className="h-8 w-8" />
            </div>
            <CardTitle className="text-xl font-semibold tracking-tight">
              {title}
            </CardTitle>
            <p className="text-primary-foreground/80 text-sm mt-2">{description}</p>
          </CardHeader>
          <CardContent className="p-6 space-y-6 -mt-4 bg-card rounded-t-3xl relative">
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Mês de Controle Financeiro
              </label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full h-12">
                  <SelectValue placeholder="Selecione o mês atual" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {monthOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Este será o seu ciclo atual de controle financeiro. Você poderá alterar depois se necessário.
              </p>
            </div>
            
            <Button 
              onClick={handleConfirm}
              disabled={!selectedMonth || loading}
              className="w-full h-12 text-base font-medium shadow-glow"
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