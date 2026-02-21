import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Trash2, Plus, ShoppingCart, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface ShoppingItem {
  id: string;
  name: string;
  quantity: string | null;
  price: number | null;
  is_purchased: boolean;
  created_at: string;
}

const ShoppingList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', quantity: '', price: '' });

  const formatCurrency = (value: number) => {
    return value.toFixed(2).replace('.', ',');
  };

  useEffect(() => {
    loadItems();
  }, [user]);

  const loadItems = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('shopping_list_items')
        .select('*')
        .eq('user_id', user.id)
        .order('is_purchased', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      toast.error('Erro ao carregar lista de compras');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!user || !newItem.name.trim()) {
      toast.error('Nome do item é obrigatório');
      return;
    }

    try {
      const { error } = await supabase.from('shopping_list_items').insert({
        user_id: user.id,
        name: newItem.name.trim(),
        quantity: newItem.quantity.trim() || null,
        price: newItem.price > 0 ? newItem.price : null,
      });

      if (error) throw error;
      toast.success('Item adicionado!');
      setNewItem({ name: '', quantity: '', price: 0 });
      setShowAddDialog(false);
      loadItems();
    } catch (error) {
      toast.error('Erro ao adicionar item');
    }
  };

  const handleTogglePurchased = async (item: ShoppingItem) => {
    try {
      const { error } = await supabase
        .from('shopping_list_items')
        .update({ is_purchased: !item.is_purchased })
        .eq('id', item.id);

      if (error) throw error;
      loadItems();
    } catch (error) {
      toast.error('Erro ao atualizar item');
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('shopping_list_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Item removido!');
      loadItems();
    } catch (error) {
      toast.error('Erro ao remover item');
    }
  };

  const handleClearPurchased = async () => {
    try {
      const { error } = await supabase
        .from('shopping_list_items')
        .delete()
        .eq('user_id', user?.id)
        .eq('is_purchased', true);

      if (error) throw error;
      toast.success('Itens comprados removidos!');
      loadItems();
    } catch (error) {
      toast.error('Erro ao limpar itens');
    }
  };

  const pendingItems = items.filter(i => !i.is_purchased);
  const purchasedItems = items.filter(i => i.is_purchased);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto space-y-4">
        {/* Header */}
        <Card className="overflow-hidden animate-fade-in">
          <CardHeader className="bg-gradient-to-r from-primary to-accent text-primary-foreground py-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>
              <CardTitle className="text-xl flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Lista de Compras
              </CardTitle>
              <div className="w-16" />
            </div>
          </CardHeader>
        </Card>

        {/* Add item button */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="w-full" size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="Ex: Arroz, Leite..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Quantidade</Label>
                <Input
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                  placeholder="Ex: 2 kg, 1 litro..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Valor estimado</Label>
                <CurrencyInput
                  value={newItem.price}
                  onValueChange={(value) => setNewItem({ ...newItem, price: value })}
                  className="mt-1"
                />
              </div>
              <Button onClick={handleAddItem} className="w-full">
                Adicionar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Pending items */}
        <Card className="animate-fade-in stagger-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              Pendentes ({pendingItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {pendingItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum item pendente
              </p>
            ) : (
              <div className="space-y-2">
                {pendingItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={false}
                      onCheckedChange={() => handleTogglePurchased(item)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        {item.quantity && <span>{item.quantity}</span>}
                        {item.price && <span>R$ {formatCurrency(item.price)}</span>}
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover item?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Deseja remover "{item.name}" da lista?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteItem(item.id)}>
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Purchased items */}
        {purchasedItems.length > 0 && (
          <Card className="animate-fade-in stagger-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-muted-foreground">
                  Comprados ({purchasedItems.length})
                </CardTitle>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-destructive text-xs">
                      Limpar comprados
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Limpar itens comprados?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Todos os itens marcados como comprados serão removidos da lista.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearPurchased}>
                        Limpar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-2">
                {purchasedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 opacity-60"
                  >
                    <Checkbox
                      checked={true}
                      onCheckedChange={() => handleTogglePurchased(item)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate line-through">{item.name}</p>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        {item.quantity && <span>{item.quantity}</span>}
                        {item.price && <span>R$ {formatCurrency(item.price)}</span>}
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover item?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Deseja remover "{item.name}" da lista?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteItem(item.id)}>
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ShoppingList;
