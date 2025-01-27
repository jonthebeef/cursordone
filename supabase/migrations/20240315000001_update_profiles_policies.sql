-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Create new policies
CREATE POLICY "Enable read access for users"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Enable insert for users"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users"
  ON profiles FOR UPDATE
  USING (auth.uid() = id); 