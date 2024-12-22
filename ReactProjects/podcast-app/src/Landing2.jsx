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
            font-family: 'Inter', sans-serif;
            background-color: #121212;
            color: #fff;
            overflow-x: hidden;
          }

          .container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            height: 100%;
            padding: 20px;
            box-sizing: border-box;
            max-width: 100vw;
          }

          .header {
            display: flex;
            justify-content: space-between;
            width: 100%;
            padding: 15px 20px;
            background-color: #1e1e1e;
            position: fixed;
            top: 0;
            left: 0;
            z-index: 1000;
            border-bottom: 1px solid #444;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          }

          .logo {
            display: flex;
            align-items: center;
          }

          .logo img {
            width: 35px;
            height: 35px;
            margin-right: 10px;
          }

          .logo span {
            font-size: 22px;
            font-weight: 600;
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
            font-weight: 500;
            font-size: 14px;
            transition: color 0.3s;
          }

          .menu a:hover {
            color: #ff4500;
          }

          .hero-section {
            background: linear-gradient(135deg, #ff7a00, #ff4500);
            width: 100%;
            padding: 60px 20px;
            text-align: center;
            border-radius: 12px;
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
            margin-top: 90px;
            z-index: 10;
          }

          .hero-section h1 {
            font-size: 2.5rem;
            margin-bottom: 20px;
            color: #fff;
            font-weight: 700;
            line-height: 1.3;
          }

          .hero-section p {
            font-size: 16px;
            color: #fff;
            margin-bottom: 25px;
          }

          .hero-section button {
            padding: 12px 25px;
            font-size: 16px;
            background-color: #ff4500;
            border: none;
            border-radius: 50px;
            color: white;
            cursor: pointer;
            transition: background-color 0.3s;
          }

          .hero-section button:hover {
            background-color: #ff7a00;
          }

          .topic-section {
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 30px;
            margin-top: 40px;
            width: 100%;
            max-width: 1100px;
          }

          .topic-card {
            background-color: #333;
            padding: 25px;
            border-radius: 10px;
            text-align: center;
            width: 250px;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
            transition: transform 0.3s, box-shadow 0.3s;
            margin: 10px;
          }

          .topic-card h3 {
            color: #fff;
            font-size: 1.6rem;
            margin-bottom: 15px;
          }

          .topic-card p {
            color: #bbb;
            font-size: 1rem;
          }

          .topic-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
          }

          .speak-button {
            margin-top: 50px;
            padding: 16px 32px;
            background-color: #ff4500;
            border: none;
            border-radius: 50px;
            color: white;
            font-size: 18px;
            cursor: pointer;
            transition: background-color 0.3s;
          }

          .speak-button:hover {
            background-color: #ff7a00;
          }

          .footer {
            margin-top: 60px;
            text-align: center;
            font-size: 14px;
            color: #b7b7b7;
            width: 100%;
            position: absolute;
            bottom: 20px;
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
              padding: 10px 20px;
            }

            .menu {
              margin-top: 10px;
            }

            .hero-section {
              padding: 50px 20px;
            }

            .topic-section {
              flex-direction: column;
              align-items: center;
              gap: 20px;
            }

            .footer {
              font-size: 12px;
            }

            .speak-button {
              width: 80%;
              font-size: 16px;
              padding: 14px 28px;
            }
          }
        `}
      </style>

      <div className="container">
        <div className="header">
          <div className="logo">
            <img src="https://via.placeholder.com/35" alt="Logo" />
            <span>Tenge Tenge Live</span>
          </div>
          <div className="menu">
            <a href="/">Home</a>
            <a href="/about">About</a>
            <Link to="/Login">Login</Link>
          </div>
        </div>

        <div className="hero-section">
          <h1>Listen to the Best Podcasts Live!</h1>
          <p>Join us and explore exciting topics with engaging hosts and live discussions.</p>
          <button>Start Listening</button>
        </div>

        <div className="topic-section">
          <div className="topic-card">
            <h3>Technology</h3>
            <p>Stay updated with the latest tech trends!</p>
          </div>
          <div className="topic-card">
            <h3>Health & Wellness</h3>
            <p>Learn tips for a healthier, balanced life!</p>
          </div>
          <div className="topic-card">
            <h3>Entertainment</h3>
            <p>Catch up on the hottest movies, music, and more!</p>
          </div>
        </div>

        <button className="speak-button">Join the Discussion</button>


      </div>
    </>
  );
};

export default Landing2;
