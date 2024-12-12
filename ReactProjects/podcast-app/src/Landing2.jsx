import React from 'react';
import { Link } from 'react-router-dom';

const Landing2 = () => {
  return (
    <>
      <style>
        {`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: Arial, sans-serif;
            background-color: #121212;
            color: #fff;
          }

          .container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            height: 100vh;
            padding: 40px;
            overflow: hidden;
          }

          .header {
            display: flex;
            justify-content: space-between;
            width: 100%;
            padding: 10px 50px;
            background-color: #1c1c1c;
            margin-bottom: 40px;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
          }

          .logo {
            display: flex;
            align-items: center;
          }

          .logo img {
            width: 50px;
            height: 50px;
            margin-right: 10px;
          }

          .logo span {
            font-size: 24px;
            font-weight: bold;
            color: #fff;
          }

          .menu {
            display: flex;
            align-items: center;
          }

          .menu a {
            color: #fff;
            text-decoration: none;
            margin-left: 20px;
            font-weight: bold;
            font-size: 18px;
          }

          .menu a:hover {
            color: #ff4500;
          }

          .hero-section {
            background: linear-gradient(135deg, #ff7a00, #ff4500);
            width: 100%;
            padding: 50px 20px;
            text-align: center;
            border-radius: 15px;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
            margin-top: 90px;
            z-index: 10;
          }

          .hero-section h1 {
            font-size: 3rem;
            margin-bottom: 20px;
            color: #fff;
            font-weight: 700;
          }

          .hero-section p {
            font-size: 18px;
            color: #fff;
            margin-bottom: 40px;
          }

          .hero-section button {
            padding: 12px 20px;
            font-size: 16px;
            background-color: #ff4500;
            border: none;
            border-radius: 5px;
            color: white;
            cursor: pointer;
            transition: background-color 0.3s;
          }

          .hero-section button:hover {
            background-color: #ff7a00;
          }

          .player {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            margin-top: 60px;
            width: 100%;
            max-width: 900px;
            padding: 0 20px;
          }

          .player .controls {
            display: inline-flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            gap: 10px;
            width: 40%;
          }

          .player .controls button {
            background-color: #ff4500;
            border: none;
            border-radius: 50%;
            width: 80px;
            height: 80px;
            color: white;
            font-size: 40px;
            cursor: pointer;
            transition: background-color 0.3s;
          }

          .player .controls button:hover {
            background-color: #ff7a00;
          }

          .player .details {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            color: #fff;
            width: 50%;
          }

          .player .details .song-info {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 10px;
          }

          .player .details .artist-info {
            font-size: 1.2rem;
            font-weight: 600;
            color: #ff7a00;
          }

          .footer {
            margin-top: 60px;
            text-align: center;
            font-size: 14px;
            color: #b7b7b7;
            position: absolute;
            bottom: 20px;
            width: 100%;
          }

          .footer a {
            color: #ff4500;
            text-decoration: none;
          }

          .footer a:hover {
            color: #ff7a00;
          }

          @media (max-width: 768px) {
            .header {
              flex-direction: column;
              align-items: center;
            }

            .menu {
              margin-top: 20px;
            }

            .hero-section {
              padding: 30px;
            }

            .player {
              flex-direction: column;
              align-items: center;
            }

            .player .controls button {
              width: 60px;
              height: 60px;
              font-size: 30px;
            }

            .player .details {
              width: 100%;
              text-align: center;
            }

            .footer {
              font-size: 12px;
            }
          }
        `}
      </style>

      <div className="container">
        <div className="header">
          <div className="logo">
            <img src="https://via.placeholder.com/50" alt="Logo" />
            <span>Radio App</span>
          </div>
          <div className="menu">
            <a href="/">Home</a>
            <a href="/about">About</a>
            <Link to="/Login">Login</Link>
          </div>
        </div>

        <div className="hero-section">
          <h1>Listen to the Best Tunes Live!</h1>
          <p>Join us now and experience music like never before. We have all your favorite songs!</p>
          <button>Start Listening</button>
        </div>

        <div className="player">
          <div className="controls">
            <button>⏮️</button>
            <button>▶️</button>
            <button>⏭️</button>
          </div>
          <div className="details">
            <div className="song-info">LostJons - Lartion Now</div>
            <div className="artist-info">Artist: Mitus</div>
          </div>
        </div>

        <div className="footer">
          <p>&copy; 2024 Radio App | All Rights Reserved</p>
        </div>
      </div>
    </>
  );
};

export default Landing2;
