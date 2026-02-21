import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface ShoppingItem {
  id: string;
  name: string;
  quantity: string | null;
  price: number | null;
  is_purchased: boolean;
}

interface ShoppingListModalProps {
  userId: string;
}

const STORAGE_KEY = 'shopping_list_last_shown';
const COOLDOWN_HOURS = 4;

const ShoppingListModal: React.FC<ShoppingListModalProps> = ({ userId }) => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const navigate = useNavigate();

  const formatCurrency = (value: number) => {
    return value.toFixed(2).replace('.', ',');
  };

  useEffect(() => {
    checkAndShow();
  }, [userId]);

  const checkAndShow = async () => {
    const lastShown = localStorage.getItem(STORAGE_KEY);
    const now = Date.now();

    if (lastShown) {
      const diff = now - parseInt(lastShown, 10);
      const hoursDiff = diff / (1000 * 60 * 60);
      if (hoursDiff < COOLDOWN_HOURS) return;
    }

    // Load pending items
    try {
      const { data, error } = await supabase
        .from('shopping_list_items')
        .select('*')
        .eq('user_id', userId)
        .eq('is_purchased', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data && data.length > 0) {
        setItems(data);
        setOpen(true);
        localStorage.setItem(STORAGE_KEY, now.toString());
      }
    } catch {
      // silently fail
    }
  };

  const handleGoToList = () => {
    setOpen(false);
    navigate('/shopping-list');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Lista de Compras
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border"
            >
              <div className="h-5 w-5 rounded border border-muted-foreground/30 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.name}</p>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  {item.quantity && <span>{item.quantity}</span>}
                  {item.price && <span>R$ {formatCurrency(item.price)}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
            Fechar
          </Button>
          <Button className="flex-1" onClick={handleGoToList}>
            Editar lista
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShoppingListModal;
