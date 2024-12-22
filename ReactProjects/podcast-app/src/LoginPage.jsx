import React from 'react';
import radio from './assets/radio.png';
import { Link } from 'react-router-dom';

const LoginPage = () => {
  return (
    <div className="login-container">
      <div className="login-form">
        <h1>Welcome Back!</h1>
        <p>Please enter login details below</p>
        <form>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" placeholder="Enter the email" />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" placeholder="Enter the Password" />
          </div>
          <div className="forgot-password">
            <Link to="/forgot-password" className="back-to-login">Forgot Password</Link>
          </div>
          <button type="submit" className="signin-btn">
            <Link to="/for-you" className="signin-btn">Sign in</Link></button>
          <div className="divider">Or continue</div>
          <button type="button" className="google-btn">Log in with Google</button>
        </form>
        <p className="signup">Don't have an account? <a href="#">Sign Up</a></p>
      </div>

      <div className="illustration">
        <img src={radio} alt="Task illustration" />
      </div>

      <style>
        {`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          .login-container {
            display: flex;
            height: 100vh;
            font-family: 'Arial', sans-serif;
            background-color: #f4f7fc;
          }

          .login-form {
            background-color: white;
            padding: 30px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            width: 50%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            height: 100%;
            padding-left: 5%;
            padding-right: 5%;
            background-color: #121212;
          }

          .login-form h1 {
            color: #ff4500;
            font-size: 28px;
            text-align: center;
            margin-bottom: 15px;
          }

          .login-form p {
            color: #6c757d;
            font-size: 16px;
            text-align: center;
            margin-bottom: 30px;
          }

          .input-group {
            margin-bottom: 20px;
          }

          .input-group label {
            display: block;
            font-weight: 600;
            color: #333;
            margin-bottom: 5px;
          }

          .input-group input {
            width: 100%;
            padding: 12px;
            border: 1px solid #ccc;
            border-radius: 8px;
            font-size: 16px;
            outline: none;
            transition: border-color 0.3s;
          }

          .input-group input:focus {
            border-color:#ff4500;
            box-shadow: 0 0 5px rgba(26, 115, 232, 0.3);
          }

          .forgot-password a {
            color: #ff4500;
            font-size: 14px;
            text-decoration: none;
            display: block;
            text-align: right;
          }

          .signin-btn {
            background-color: #1a73e8;
            color: white;
            padding: 12px;
            border: none;
            border-radius: 8px;
            font-size: 18px;
            width: 100%;
            cursor: pointer;
            transition: background-color 0.3s;
          }

          .signin-btn:hover {
            background-color: #1558b0;
          }

          .divider {
            text-align: center;
            margin: 20px 0;
            font-size: 14px;
            color: #6c757d;
          }

          .google-btn {
            background-color: #db4437;
            color: white;
            padding: 12px;
            border: none;
            border-radius: 8px;
            font-size: 18px;
            width: 100%;
            cursor: pointer;
            transition: background-color 0.3s;
          }

          .google-btn:hover {
            background-color: #c1351d;
          }

          .signup {
            text-align: center;
            margin-top: 15px;
            font-size: 14px;
          }

          .signup a {
            color: #1a73e8;
            text-decoration: none;
          }

          .illustration {
            width: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: #121212;
            height: 100%;
            padding: 0px;
            text-align: center;
          }

          .illustration img {
            max-width: 100%;
            height: auto;
            border-radius: 10px;
          }

          .illustration p {
            color: #6c757d;
            font-size: 16px;
            margin-top: 20px;
          }
        `}
      </style>
    </div>
  );
};

export default LoginPage;
