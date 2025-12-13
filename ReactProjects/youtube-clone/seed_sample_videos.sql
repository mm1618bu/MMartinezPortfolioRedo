-- Insert sample video data for testing search functionality
-- Run this in your Supabase SQL editor

INSERT INTO videos (id, title, channel_name, description, thumbnail_url, views, likes, is_public, uploaded_at)
VALUES 
  ('test-1', 'React Tutorial for Beginners', 'TechChannel', 'Learn React from scratch', 'https://picsum.photos/320/180?random=1', 10000, 500, true, NOW()),
  ('test-2', 'JavaScript Basics', 'CodeAcademy', 'Master JavaScript fundamentals', 'https://picsum.photos/320/180?random=2', 5000, 250, true, NOW()),
  ('test-3', 'Building a YouTube Clone', 'TechChannel', 'Full stack project tutorial', 'https://picsum.photos/320/180?random=3', 15000, 800, true, NOW()),
  ('test-4', 'CSS Grid Layout', 'DesignMasters', 'Modern CSS techniques', 'https://picsum.photos/320/180?random=4', 3000, 150, true, NOW()),
  ('test-5', 'Node.js Express Tutorial', 'BackendDev', 'Build REST APIs', 'https://picsum.photos/320/180?random=5', 8000, 400, true, NOW()),
  ('test-6', 'Python for Data Science', 'DataHub', 'Analyze data with Python', 'https://picsum.photos/320/180?random=6', 12000, 600, true, NOW()),
  ('test-7', 'React Hooks Deep Dive', 'TechChannel', 'Advanced React patterns', 'https://picsum.photos/320/180?random=7', 7000, 350, true, NOW()),
  ('test-8', 'TypeScript Complete Guide', 'CodeAcademy', 'Type-safe JavaScript', 'https://picsum.photos/320/180?random=8', 9000, 450, true, NOW()),
  ('test-9', 'Docker for Beginners', 'DevOps Pro', 'Containerization basics', 'https://picsum.photos/320/180?random=9', 6000, 300, true, NOW()),
  ('test-10', 'Full Stack JavaScript', 'TechChannel', 'MERN stack tutorial', 'https://picsum.photos/320/180?random=10', 20000, 1000, true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Verify the insert
SELECT COUNT(*) as total_videos FROM videos;
SELECT id, title, channel_name, views FROM videos LIMIT 5;
