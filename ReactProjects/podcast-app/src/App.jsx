import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import LoginPage from './LoginPage'
import ForgotPassword from './ForgotPassword'
import NewAccount from './NewAccount'
import SMSVerify from './SMSVerify'
import ForYouPage from './ForYouPage'
import Search from './Search'
import EndUserSettings from './EndUserSettings'
import BroadcastRoom from './BroadcastRoom'
import LiveChatFeature from './LiveChatFeature'
import LandingPage from './LandingPage'
import BroadcastInfo from './BroadcastInfo'

function App() {

  return (
    <div>
      <LandingPage />
      <LoginPage />
      <ForgotPassword />
      <NewAccount />
      <SMSVerify />
      <ForYouPage />
      <Search />
      <EndUserSettings/>
      <BroadcastRoom />
      <LiveChatFeature />
      <BroadcastInfo />
    </div>
  )
}

export default App;
