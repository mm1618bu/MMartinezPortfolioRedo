import './styles/main.css';
import './styles/accessibility.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import TopNavBar from './front-end/components/TopNavBar.jsx';
import LandingPage from './front-end/components/LandingPage.jsx';
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
import ChannelSettings from './front-end/components/ChannelSettings.jsx';
import WatchHistory from './front-end/components/WatchHistory.jsx';
import HomeFeed from './front-end/components/HomeFeed.jsx';
import Sidebar from './front-end/components/Sidebar.jsx';
import SearchResults from './front-end/components/SearchResults.jsx';
import NotFound from './front-end/components/NotFound.jsx';
import ServerError from './front-end/components/ServerError.jsx';
import EncodingQueue from './front-end/components/EncodingQueue.jsx';
import NotificationsPage from './front-end/components/NotificationsPage.jsx';
import PersonalizedFeed from './front-end/components/PersonalizedFeed.jsx';
import UserInterests from './front-end/components/UserInterests.jsx';
import ManageSubscriptions from './front-end/components/ManageSubscriptions.jsx';
import SubscriptionsFeed from './front-end/components/SubscriptionsFeed.jsx';
import MentionsDemo from './front-end/components/MentionsDemo.jsx';
import AudienceDemographics from './front-end/components/AudienceDemographics.jsx';
import CreatorDashboard from './front-end/components/CreatorDashboard.jsx';
import AdminDashboard from './front-end/components/AdminDashboard.jsx';
import SkipLink from './front-end/components/SkipLink.jsx';
import { prefetchVideos } from './front-end/utils/videoCacheUtils.js';

// Create a client with enhanced caching and rate limiting
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

// Prefetch videos on app initialization for better performance
prefetchVideos(queryClient);

function HomePage() {
  return (
    <div>
      <Sidebar />
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
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="App">
            <SkipLink />
            <main id="main-content" tabIndex="-1" role="main" aria-label="Main content">
              <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/home" element={<><TopNavBar /><HomePage /></>} />
            <Route path="/feed" element={<><TopNavBar /><PersonalizedFeed /></>} />
            <Route path="/login" element={<><TopNavBar /><LoginPage /></>} />
            <Route path="/register" element={<><TopNavBar /><RegisterPage /></>} />
            <Route path="/forgot-password" element={<><TopNavBar /><ForgotPassword /></>} />
            <Route path="/search" element={<><TopNavBar /><SearchResults /></>} />
            <Route path="/watch/:videoId" element={<><TopNavBar /><VideoPlayer /></>} />
            <Route path="/channel" element={<><TopNavBar /><Channel /></>} />
            <Route path="/channel/:channelTag" element={<><TopNavBar /><Channel /></>} />
            <Route path="/channel/settings" element={<><TopNavBar /><ChannelSettings /></>} />
            <Route path="/dashboard" element={<><TopNavBar /><CreatorDashboard /></>} />
            <Route path="/admin" element={<><TopNavBar /><AdminDashboard /></>} />
            <Route path="/playlists" element={<><TopNavBar /><PlaylistGrid /></>} />
            <Route path="/playlists/:channelName" element={<><TopNavBar /><PlaylistGrid /></>} />
            <Route path="/playlist/:playlistId" element={<><TopNavBar /><PlaylistViewer /></>} />
            <Route path="/playlist/create" element={<><TopNavBar /><CreatePlaylist channelName="DefaultChannel" /></>} />
            <Route path="/channel/create" element={<><TopNavBar /><CreateChannel skipable={false} /></>} />
            <Route path="/history" element={<><TopNavBar /><WatchHistory /></>} />
            <Route path="/interests" element={<><TopNavBar /><UserInterests /></>} />
            <Route path="/subscriptions" element={<><TopNavBar /><ManageSubscriptions /></>} />
            <Route path="/subscriptions/feed" element={<><TopNavBar /><SubscriptionsFeed /></>} />
            <Route path="/mentions-demo" element={<><TopNavBar /><MentionsDemo /></>} />
            <Route path="/analytics/demographics" element={<><TopNavBar /><AudienceDemographics /></>} />
            <Route path="/analytics/demographics/video/:videoId" element={<><TopNavBar /><AudienceDemographics /></>} />
            <Route path="/analytics/demographics/channel/:channelId" element={<><TopNavBar /><AudienceDemographics /></>} />
            <Route path="/notifications" element={<><TopNavBar /><NotificationsPage /></>} />
            <Route path="/encoding-queue" element={<><TopNavBar /><EncodingQueue /></>} />
            <Route path="/error" element={<ServerError />} />
            <Route path="*" element={<NotFound />} />
            </Routes>
            </main>
          </div>
        </Router>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
