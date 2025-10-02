-- Add new columns to profiles table for initial income and monthly salary
ALTER TABLE public.profiles 
ADD COLUMN initial_income numeric DEFAULT 0,
ADD COLUMN monthly_salary numeric DEFAULT 0;

-- Update existing records to migrate current salary to monthly_salary
UPDATE public.profiles 
SET monthly_salary = salary, 
    initial_income = salary 
WHERE salary > 0;

-- Update existing records with zero salary to have zero initial_income
UPDATE public.profiles 
SET initial_income = 0, 
    monthly_salary = 0 
WHERE salary = 0;

-- Update handle_new_user function to use new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, salary, initial_income, monthly_salary, ideal_day, total_saved, current_cycle)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    0, -- Keep salary for backward compatibility, will be deprecated
    0, -- initial_income to be set during setup
    0, -- monthly_salary to be set during setup
    5,
    0,
    COALESCE(new.raw_user_meta_data->>'initial_cycle', to_char(now(), 'YYYY-MM'))
  );
  RETURN new;
END;
$$;