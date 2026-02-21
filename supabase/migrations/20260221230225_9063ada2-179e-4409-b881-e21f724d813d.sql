
CREATE TABLE public.shopping_list_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  quantity TEXT,
  price NUMERIC,
  is_purchased BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own shopping list items"
ON public.shopping_list_items FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shopping list items"
ON public.shopping_list_items FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shopping list items"
ON public.shopping_list_items FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shopping list items"
ON public.shopping_list_items FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_shopping_list_items_updated_at
BEFORE UPDATE ON public.shopping_list_items
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
