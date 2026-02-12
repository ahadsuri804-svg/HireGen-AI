-- Run this in your Supabase SQL Editor to update the schema

-- Add 'cnic' column if it doesn't exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS cnic TEXT;

-- Add 'name' column if it doesn't exist (safety check)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Add 'resumeURL' column if it doesn't exist (safety check)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS "resumeURL" TEXT; -- Quotes for case sensitivity if needed, usually lowercase is better but frontend uses resumeURL

-- Ensure Row Level Security (RLS) policies allow insertion if not already set
-- (Optional, but good for troubleshooting permission issues)
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
-- CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
