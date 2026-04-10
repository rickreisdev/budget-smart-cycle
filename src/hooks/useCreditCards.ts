import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface CreditCard {
  id: string;
  card_name: string;
  due_day: number;
  days_before_closing: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export const useCreditCards = () => {
  const { user } = useAuth();
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCards = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('user_id', user.id)
      .eq('active', true)
      .order('card_name');

    if (!error && data) {
      setCards(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCards();
  }, [user]);

  return { cards, loading, reload: loadCards };
};
