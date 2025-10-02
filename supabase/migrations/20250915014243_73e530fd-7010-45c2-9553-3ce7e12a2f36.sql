-- Update handle_new_user function to use initial_cycle from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, salary, ideal_day, total_saved, current_cycle)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    0,
    5,
    0,
    COALESCE(new.raw_user_meta_data->>'initial_cycle', to_char(now(), 'YYYY-MM'))
  );
  RETURN new;
END;
$$;