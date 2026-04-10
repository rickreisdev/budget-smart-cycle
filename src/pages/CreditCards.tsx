import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Trash2, Edit2, CreditCard, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface CreditCardData {
  id: string;
  card_name: string;
  due_day: number;
  days_before_closing: number;
  active: boolean;
}

const CreditCards = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cards, setCards] = useState<CreditCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCardData | null>(null);

  const [formData, setFormData] = useState({
    card_name: '',
    due_day: 10,
    days_before_closing: 7
  });

  useEffect(() => {
    loadCards();
  }, [user]);

  const loadCards = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('user_id', user.id)
      .order('card_name');

    if (error) {
      toast.error('Erro ao carregar cartões');
    } else {
      setCards(data || []);
    }
    setLoading(false);
  };

  const addCard = async () => {
    if (!user || !formData.card_name.trim()) {
      toast.error('Preencha o nome do cartão');
      return;
    }

    const { error } = await supabase
      .from('credit_cards')
      .insert({
        user_id: user.id,
        card_name: formData.card_name.trim(),
        due_day: formData.due_day,
        days_before_closing: formData.days_before_closing
      });

    if (error) {
      toast.error('Erro ao adicionar cartão');
    } else {
      toast.success('Cartão adicionado!');
      setShowAddDialog(false);
      resetForm();
      loadCards();
    }
  };

  const updateCard = async () => {
    if (!editingCard || !formData.card_name.trim()) {
      toast.error('Preencha o nome do cartão');
      return;
    }

    const { error } = await supabase
      .from('credit_cards')
      .update({
        card_name: formData.card_name.trim(),
        due_day: formData.due_day,
        days_before_closing: formData.days_before_closing
      })
      .eq('id', editingCard.id);

    if (error) {
      toast.error('Erro ao atualizar cartão');
    } else {
      toast.success('Cartão atualizado!');
      setEditingCard(null);
      resetForm();
      loadCards();
    }
  };

  const deleteCard = async (card: CreditCardData) => {
    // Check if card has linked transactions
    const { count } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('card_id', card.id);

    if (count && count > 0) {
      toast.error(`Não é possível excluir: ${count} compra(s) vinculada(s) a este cartão`);
      return;
    }

    const { error } = await supabase
      .from('credit_cards')
      .delete()
      .eq('id', card.id);

    if (error) {
      toast.error('Erro ao excluir cartão');
    } else {
      toast.success('Cartão excluído!');
      loadCards();
    }
  };

  const startEdit = (card: CreditCardData) => {
    setEditingCard(card);
    setFormData({
      card_name: card.card_name,
      due_day: card.due_day,
      days_before_closing: card.days_before_closing
    });
  };

  const resetForm = () => {
    setFormData({ card_name: '', due_day: 10, days_before_closing: 7 });
  };

  const CardForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="space-y-4">
      <div>
        <Label>Nome do Cartão</Label>
        <Input
          value={formData.card_name}
          onChange={(e) => setFormData({ ...formData, card_name: e.target.value })}
          placeholder="Ex: Nubank, Inter, Santander"
        />
      </div>
      <div>
        <Label>Dia de Vencimento</Label>
        <Select
          value={formData.due_day.toString()}
          onValueChange={(v) => setFormData({ ...formData, due_day: Number(v) })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {Array.from({ length: 31 }, (_, i) => (
              <SelectItem key={i + 1} value={(i + 1).toString()}>Dia {i + 1}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Dias antes para fechamento</Label>
        <Input
          type="number"
          min="0"
          max="30"
          value={formData.days_before_closing}
          onChange={(e) => setFormData({ ...formData, days_before_closing: Number(e.target.value) || 0 })}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Quantos dias antes do vencimento a fatura fecha
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={onSubmit} className="flex-1">{submitLabel}</Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => {
            setShowAddDialog(false);
            setEditingCard(null);
            resetForm();
          }}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-primary animate-pulse-soft text-lg font-medium">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/')} className="hover-scale">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Cartões de Crédito</h1>
          </div>
          <Button onClick={() => { resetForm(); setShowAddDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Cartão
          </Button>
        </div>

        {cards.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum cartão cadastrado</p>
              <Button className="mt-4" onClick={() => { resetForm(); setShowAddDialog(true); }}>
                Cadastrar primeiro cartão
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cards.map((card) => (
              <Card key={card.id} className="hover-lift">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-installment" />
                      <span>{card.card_name}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => startEdit(card)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir cartão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o cartão "{card.card_name}"?
                              Cartões com compras vinculadas não podem ser excluídos.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteCard(card)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Vencimento: dia <span className="font-medium text-foreground">{card.due_day}</span></p>
                    <p>Fechamento: <span className="font-medium text-foreground">{card.days_before_closing}</span> dias antes do vencimento</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Cartão de Crédito</DialogTitle>
            </DialogHeader>
            <CardForm onSubmit={addCard} submitLabel="Adicionar" />
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={!!editingCard} onOpenChange={() => { setEditingCard(null); resetForm(); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Cartão</DialogTitle>
            </DialogHeader>
            <CardForm onSubmit={updateCard} submitLabel="Salvar" />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CreditCards;
