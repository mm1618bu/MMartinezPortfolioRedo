import React from 'react';
import './App.css';
import { SocialIcon } from 'react-social-icons'

const LoginPage = () => {
    return (
        <div className="login-page-container">
            <h2>Login</h2>
            <span className="sso-options">
                <button className="sso-button">
                 <SocialIcon network="google"/>
                    <p className='icon-paragraph'>Continue with Apple</p>
                </button>
                <button className="sso-button">
                 <SocialIcon network="google"/>
                    <p className='icon-paragraph'>Continue with Apple</p>
                </button>
                <button className="sso-button">
                 <SocialIcon network="google"/>
                    <p className='icon-paragraph'>Continue with Apple</p>
                </button>
                <h3>Or</h3>
                <button className="sso-button">Continue with email</button>
            </span>
        </div>
    );
};

export default LoginPage;
