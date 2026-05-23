
-- Remove transactions from Realtime publication (app doesn't use Realtime)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'transactions'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.transactions';
  END IF;
END $$;

-- Revoke EXECUTE on SECURITY DEFINER trigger functions from API roles
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM PUBLIC, anon, authenticated;

-- Hide tables from anon role (GraphQL/PostgREST). RLS already restricts data,
-- but anon shouldn't even discover the schema.
REVOKE SELECT ON public.credit_cards FROM anon;
REVOKE SELECT ON public.profiles FROM anon;
REVOKE SELECT ON public.shopping_list_items FROM anon;
REVOKE SELECT ON public.transactions FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.credit_cards FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.shopping_list_items FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.transactions FROM anon;
