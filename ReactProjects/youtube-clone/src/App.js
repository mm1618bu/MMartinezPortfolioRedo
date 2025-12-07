import './styles/main.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginPage from './front-end/components/LoginPage.jsx';
import RegisterPage from './front-end/components/RegisterPage.jsx';
import ForgotPassword from './front-end/components/ForgotPassword.jsx';
import VideoUpload from './front-end/components/VideoUpload.jsx';
import VideoGrid from './front-end/components/VideoGrid.jsx';
import VideoPlayer from './front-end/components/VideoPlayer.jsx';
import Channel from './front-end/components/Channel.jsx';
import UserProfilePage from './front-end/components/UserProfilePage.jsx';
import { supabase } from './front-end/utils/supabase.js';
import VideoSearchBar from './front-end/components/VideoSearchBar.jsx';
import PlaylistGrid from './front-end/components/PlaylistGrid.jsx';
import PlaylistViewer from './front-end/components/PlaylistViewer.jsx';
import CreatePlaylist from './front-end/components/CreatePlaylist.jsx';
import CreateChannel from './front-end/components/CreateChannel.jsx';

// Create a client with enhanced rate limiting
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data is fresh for 5 minutes
      cacheTime: 1000 * 60 * 10, // Cache for 10 minutes
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnReconnect: false, // Don't refetch on reconnect
      retry: 1, // Retry failed requests once
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
    mutations: {
      retry: 0, // Don't retry mutations (prevent duplicate actions)
      retryDelay: 1000,
    },
  },
});

function HomePage() {
  return (
    <div>
      <LoginPage />
      <RegisterPage />
      <ForgotPassword/>
      <Channel />
      <VideoSearchBar />
      <VideoUpload />
      <VideoGrid />
      <UserProfilePage />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/watch/:videoId" element={<VideoPlayer />} />
            <Route path="/channel" element={<Channel />} />
            <Route path="/channel/:channelTag" element={<Channel />} />
            <Route path="/playlists" element={<PlaylistGrid />} />
            <Route path="/playlists/:channelName" element={<PlaylistGrid />} />
            <Route path="/playlist/:playlistId" element={<PlaylistViewer />} />
            <Route path="/playlist/create" element={<CreatePlaylist channelName="DefaultChannel" />} />
            <Route path="/channel/create" element={<CreateChannel skipable={false} />} />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
