import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import LoginPage from './LoginPage';
import ForgotPassword from './ForgotPassword';
import NewAccount from './NewAccount';
import SMSVerify from './SMSVerify';
import ForYouPage from './ForYouPage';
import Search from './Search';
import EndUserSettings from './EndUserSettings';
import BroadcastRoom from './BroadcastRoom';
import LiveChatFeature from './LiveChatFeature';
import LandingPage from './LandingPage';
import BroadcastInfo from './BroadcastInfo';
import UserProfile from './UserProfile';
import Landing2 from './Landing2';
import UserAccountSettings from './UserAccountSettings';

function App() {


  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing2 />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/new-account" element={<NewAccount />} />
        <Route path="/sms-verify" element={<SMSVerify />} />
        <Route path="/for-you" element={<ForYouPage />} />
        <Route path="/search" element={<Search />} />
        <Route path="/settings" element={<EndUserSettings />} />
        <Route path="/broadcast-room" element={<BroadcastRoom />} />
        <Route path="/live-chat" element={<LiveChatFeature />} />
        <Route path="/broadcast-info" element={<BroadcastInfo />} />
        <Route path="/user-profile" element={<UserProfile />} />
        <Route path="/landing2" element={<Landing2 />} />
        <Route path="/user-account-settings" element={<UserAccountSettings />} />
      </Routes>
    </Router>
  );
}

export default App;