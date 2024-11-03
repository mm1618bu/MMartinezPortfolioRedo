import React from 'react';
import './App.css';

const LoginPage = () => {
    return (
        <div className="login-page-container">
            <h2>Login</h2>
            <div className="sso-options">
                <button className="sso-button">
                    <img src="apple-icon.png" alt="Apple icon" />
                    Continue with Apple
                </button>
                <button className="sso-button">
                    <img src="google-icon.png" alt="Google icon" />
                    Continue with Google
                </button>
                <button className="sso-button">
                    <img src="facebook-icon.png" alt="Facebook icon" />
                    Continue with Facebook
                </button>
                <h3>Or</h3>
                <button className="sso-button">Continue with email</button>
            </div>
        </div>
    );
};

export default LoginPage;
