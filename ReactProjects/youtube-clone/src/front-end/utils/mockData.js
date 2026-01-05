// Mock data for demo mode

export const mockVideos = [
  {
    id: 'demo-1',
    title: 'Welcome to YouTube Clone Demo',
    description: 'This is a demonstration video for the YouTube clone application. Full backend integration requires Supabase configuration.',
    thumbnail_url: 'https://via.placeholder.com/320x180/FF0000/FFFFFF?text=Demo+Video+1',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    views: 1234,
    created_at: new Date().toISOString(),
    channel_id: 'demo-channel-1',
    channel: {
      channel_name: 'Demo Channel',
      channel_tag: '@demochannel'
    }
  },
  {
    id: 'demo-2',
    title: 'React Tutorial - Building Modern Apps',
    description: 'Learn how to build modern web applications with React.',
    thumbnail_url: 'https://via.placeholder.com/320x180/61DAFB/000000?text=React+Tutorial',
    video_url: 'https://www.youtube.com/watch?v=demo',
    views: 5678,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    channel_id: 'demo-channel-2',
    channel: {
      channel_name: 'Tech Tutorials',
      channel_tag: '@techtutorials'
    }
  },
  {
    id: 'demo-3',
    title: 'Full Stack Development Guide',
    description: 'Complete guide to becoming a full stack developer.',
    thumbnail_url: 'https://via.placeholder.com/320x180/4CAF50/FFFFFF?text=Full+Stack',
    video_url: 'https://www.youtube.com/watch?v=demo',
    views: 9012,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    channel_id: 'demo-channel-3',
    channel: {
      channel_name: 'Code Academy',
      channel_tag: '@codeacademy'
    }
  },
  {
    id: 'demo-4',
    title: 'JavaScript ES6+ Features',
    description: 'Explore modern JavaScript features and best practices.',
    thumbnail_url: 'https://via.placeholder.com/320x180/F7DF1E/000000?text=JavaScript',
    video_url: 'https://www.youtube.com/watch?v=demo',
    views: 3456,
    created_at: new Date(Date.now() - 259200000).toISOString(),
    channel_id: 'demo-channel-2',
    channel: {
      channel_name: 'Tech Tutorials',
      channel_tag: '@techtutorials'
    }
  },
  {
    id: 'demo-5',
    title: 'Building REST APIs with Node.js',
    description: 'Learn how to create powerful REST APIs using Node.js and Express.',
    thumbnail_url: 'https://via.placeholder.com/320x180/339933/FFFFFF?text=Node.js+API',
    video_url: 'https://www.youtube.com/watch?v=demo',
    views: 7890,
    created_at: new Date(Date.now() - 345600000).toISOString(),
    channel_id: 'demo-channel-3',
    channel: {
      channel_name: 'Code Academy',
      channel_tag: '@codeacademy'
    }
  },
  {
    id: 'demo-6',
    title: 'CSS Grid and Flexbox Mastery',
    description: 'Master modern CSS layout techniques with practical examples.',
    thumbnail_url: 'https://via.placeholder.com/320x180/264DE4/FFFFFF?text=CSS+Layout',
    video_url: 'https://www.youtube.com/watch?v=demo',
    views: 2345,
    created_at: new Date(Date.now() - 432000000).toISOString(),
    channel_id: 'demo-channel-1',
    channel: {
      channel_name: 'Demo Channel',
      channel_tag: '@demochannel'
    }
  }
];

export const getMockVideos = async (options = {}) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  let videos = [...mockVideos];
  
  // Apply filters if provided
  if (options.limit) {
    videos = videos.slice(0, options.limit);
  }
  
  if (options.search) {
    const searchLower = options.search.toLowerCase();
    videos = videos.filter(v => 
      v.title.toLowerCase().includes(searchLower) ||
      v.description.toLowerCase().includes(searchLower)
    );
  }
  
  return { data: videos, error: null };
};
