import React from "react";
import { SocialIcon } from 'react-social-icons';
import "./App.css";

const LoginPage = () => {
    return (
        <>
            <style>
                {`
                    .login-page-container {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        background-color: #f9f9f9;
                    }
                    .login-column, .sample-text-column {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        padding: 20px;
                        max-width: 600px;
                    }
                    .login-column {
                        background-color: #fff;
                        border-radius: 8px;
                        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                    }
                    .login-column h2 {
                        font-size: 24px;
                        margin-bottom: 20px;
                        color: #007bff;
                    }
                    .sso-options {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        width: 100%;
                    }
                    .sso-button {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 10px;
                        background-color: #007bff;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        font-size: 16px;
                        cursor: pointer;
                        transition: background-color 0.3s ease;
                        width: 100%;
                        margin-bottom: 10px;
                    }
                    .sso-button:hover {
                        background-color: #0056b3;
                    }
                    .icon-paragraph {
                        margin-left: 10px;
                    }
                    .sample-text-column p {
                        font-size: 18px;
                        color: #333;
                        text-align: center;
                    }
                `}
            </style>
            <div className="login-page-container">
                <div className="sample-text-column">
                    <p>Welcome to our platform! Here you can find the best content tailored just for you. Join us and explore the amazing features we offer.</p>
                </div>
                <div className="login-column">
                    <h2>Login</h2>
                    <div className="sso-options">
                        <button className="sso-button">
                            <SocialIcon network="google" />
                            <p className='icon-paragraph'>Continue with Google</p>
                        </button>
                        <button className="sso-button">
                            <SocialIcon network="apple" />
                            <p className='icon-paragraph'>Continue with Apple</p>
                        </button>
                        <button className="sso-button">
                            <SocialIcon network="facebook" />
                            <p className='icon-paragraph'>Continue with Facebook</p>
                        </button>
                        <h3>Or</h3>
                        <button className="sso-button">Continue with email</button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default LoginPage;