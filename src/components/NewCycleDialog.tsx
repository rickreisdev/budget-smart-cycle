
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

interface NewCycleDialogProps {
  balance: number;
  onStartNewCycle: () => void;
}

export const NewCycleDialog = ({ balance, onStartNewCycle }: NewCycleDialogProps) => {
  return (
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
              <AlertDialogAction onClick={onStartNewCycle}>
                Sim, iniciar novo ciclo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};
