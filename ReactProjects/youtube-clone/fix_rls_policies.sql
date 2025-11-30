-- First, disable RLS temporarily to test (you can enable it later with proper policies)
ALTER TABLE videos DISABLE ROW LEVEL SECURITY;

-- OR keep RLS enabled and add proper policies:
-- DROP existing policies if any
DROP POLICY IF EXISTS "Allow public read access" ON videos;
DROP POLICY IF EXISTS "Allow public insert access" ON videos;
DROP POLICY IF EXISTS "Allow public update access" ON videos;

-- Enable RLS
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for all operations
CREATE POLICY "Enable read access for all users" ON videos
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert access for all users" ON videos
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON videos
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for all users" ON videos
  FOR DELETE
  USING (true);
