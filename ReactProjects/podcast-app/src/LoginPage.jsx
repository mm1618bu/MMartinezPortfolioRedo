import React from 'react';
import { SocialIcon } from 'react-social-icons';
import { Link } from 'react-router-dom';
import './Login.css';

const LoginPage = () => {
  const handleLoginClick = () => {
    history.push('/for-you');
  };

  return (
    <div className="login-page-container">
      <div className="sample-text-column">
        <p>Welcome to our platform! Here you can find the best content tailored just for you. Join us and explore the amazing features we offer.</p>
      </div>
      <div className="login-column">
        <h2>Login</h2>
        <div className="sso-options">
          <button className="sso-button" aria-label="Continue with Google">
            <SocialIcon network="google" />
            <p className="icon-paragraph">Continue with Google</p>
          </button>
          <button className="sso-button" aria-label="Continue with Apple">
            <SocialIcon network="apple" />
            <p className="icon-paragraph">Continue with Apple</p>
          </button>
          <button className="sso-button" aria-label="Continue with Facebook">
            <SocialIcon network="facebook" />
            <p className="icon-paragraph">Continue with Facebook</p>
          </button>
          <h3>Or</h3>
          <button className="cta-button" onClick={handleLoginClick}>Log In</button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;