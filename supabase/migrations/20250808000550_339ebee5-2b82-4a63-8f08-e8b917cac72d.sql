-- Optimize RLS policies for profiles table to improve performance
-- Replace auth.uid() with (select auth.uid()) to cache the result

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Recreate policies with optimized auth.uid() calls
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING ((SELECT auth.uid()) = id);