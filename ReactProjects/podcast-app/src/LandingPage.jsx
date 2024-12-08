import React from 'react';
import './Landingpage.css';
import { Link } from 'react-router-dom';

const LandingPage= () => {
  return (
    <div className="app">
      {/* Hero Section */}
      <section className="hero">
        <h1>Tenge Tenge Live</h1>
        <p>Connect with Others, Learn More, Become Engaged with your interests</p>
        <Link to="/login">
          <button className="cta-button">Log In</button>
        </Link>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2>Our Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>Global Audience</h3>
            <p>Our product is designed for high performance and speed.</p>
          </div>
          <div className="feature-card">
            <h3>Live Audio Broadcasts</h3>
            <p>We prioritize your security with top-notch encryption and reliability.</p>
          </div>
          <div className="feature-card">
            <h3>Safe & Secure</h3>
            <p>Integrate seamlessly with your existing systems and workflows.</p>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="cta">
        <h2>Ready to Get Started?</h2>
        <p>Sign up today and experience the future of technology.</p>
        <button className="cta-button">Sign Up Now</button>
      </section>

      {/* Footer Section */}
      <footer className="footer">
        <p>© 2024 My Awesome Product. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
