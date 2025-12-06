import './styles/main.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import LoginPage from './front-end/components/LoginPage.jsx';
import RegisterPage from './front-end/components/RegisterPage.jsx';
import ForgotPassword from './front-end/components/ForgotPassword.jsx';
import VideoUpload from './front-end/components/VideoUpload.jsx';
import VideoGrid from './front-end/components/VideoGrid.jsx';
import VideoPlayer from './front-end/components/VideoPlayer.jsx';
import Channel from './front-end/components/Channel.jsx';
import UserProfilePage from './front-end/components/UserProfilePage.jsx';
import { supabase } from './front-end/utils/supabase.js';

function HomePage() {
  return (
    <div>
      <VideoUpload />
      <VideoGrid />
      <UserProfilePage />
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/watch/:videoId" element={<VideoPlayer />} />
          <Route path="/channel" element={<Channel />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
