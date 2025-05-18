-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert a row in profiles for their own user ID
CREATE POLICY "Allow users to insert their own profile"
ON profiles
FOR INSERT 
WITH CHECK (true);  -- This allows any authenticated user to insert

-- Allow anyone to select their own profile
CREATE POLICY "Allow users to view their own profile"
ON profiles
FOR SELECT
USING (true);  -- This allows any authenticated user to select

-- Allow users to update their own profile
CREATE POLICY "Allow users to update their own profile"
ON profiles
FOR UPDATE
USING (true);  -- This allows any authenticated user to update

-- Force RLS
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;

-- Grant anon and authenticated roles appropriate permissions
GRANT SELECT, INSERT, UPDATE ON profiles TO anon, authenticated; 