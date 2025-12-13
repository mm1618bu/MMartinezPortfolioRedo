-- Check if videos table has data
SELECT COUNT(*) as total_videos FROM videos;

-- Check sample video titles
SELECT id, title, channel_name, views 
FROM videos 
WHERE is_public = true
LIMIT 5;

-- Check if search functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%search%'
ORDER BY routine_name;
