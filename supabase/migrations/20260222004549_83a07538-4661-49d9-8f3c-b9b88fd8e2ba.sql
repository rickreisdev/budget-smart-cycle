
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_username TEXT;
  v_initial_cycle TEXT;
BEGIN
  -- Validate and sanitize username (max 50 chars, fallback to email prefix)
  v_username := COALESCE(
    substring(new.raw_user_meta_data->>'username', 1, 50),
    split_part(new.email, '@', 1)
  );

  -- Validate initial_cycle format (YYYY-MM), fallback to current month
  v_initial_cycle := new.raw_user_meta_data->>'initial_cycle';
  IF v_initial_cycle IS NULL OR v_initial_cycle !~ '^\d{4}-(0[1-9]|1[0-2])$' THEN
    v_initial_cycle := to_char(now(), 'YYYY-MM');
  END IF;

  INSERT INTO public.profiles (id, username, salary, initial_income, monthly_salary, ideal_day, total_saved, current_cycle)
  VALUES (
    new.id,
    v_username,
    0,
    0,
    0,
    5,
    0,
    v_initial_cycle
  );
  RETURN new;
END;
$$;
