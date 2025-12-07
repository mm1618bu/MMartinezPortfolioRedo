import { useNavigate } from 'react-router-dom';
import '../../styles/main.css';

export default function LandingPage() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/login');
  };

  const features = [
    {
      icon: '🎥',
      title: 'Upload Videos',
      description: 'Share your content with the world'
    },
    {
      icon: '📺',
      title: 'Create Channel',
      description: 'Build your own community'
    },
    {
      icon: '💬',
      title: 'Engage',
      description: 'Comment, like, and interact'
    },
    {
      icon: '📊',
      title: 'Analytics',
      description: 'Track your video performance'
    }
  ];

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero-content">
          <h1 className="landing-title">
            Welcome to <span className="landing-title-highlight">VideoShare</span>
          </h1>
          <p className="landing-subtitle">
            Create, share, and discover amazing videos from creators around the world
          </p>
          <div className="landing-cta-buttons">
            <button className="landing-btn landing-btn-primary" onClick={handleGetStarted}>
              Get Started
            </button>
            <button className="landing-btn landing-btn-secondary" onClick={() => navigate('/channel')}>
              Explore Videos
            </button>
          </div>
        </div>
        <div className="landing-hero-illustration">
          <div className="landing-hero-card landing-hero-card-1">
            <div className="landing-card-icon">🎬</div>
            <div className="landing-card-text">Create</div>
          </div>
          <div className="landing-hero-card landing-hero-card-2">
            <div className="landing-card-icon">🚀</div>
            <div className="landing-card-text">Share</div>
          </div>
          <div className="landing-hero-card landing-hero-card-3">
            <div className="landing-card-icon">⭐</div>
            <div className="landing-card-text">Discover</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="landing-features">
        <h2 className="landing-features-title">Why Choose Us?</h2>
        <div className="landing-features-grid">
          {features.map((feature, index) => (
            <div key={index} className="landing-feature-card">
              <div className="landing-feature-icon">{feature.icon}</div>
              <h3 className="landing-feature-title">{feature.title}</h3>
              <p className="landing-feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-cta">
        <div className="landing-cta-content">
          <h2 className="landing-cta-title">Ready to Start Your Journey?</h2>
          <p className="landing-cta-text">
            Join thousands of creators sharing their stories
          </p>
          <button className="landing-btn landing-btn-large" onClick={handleGetStarted}>
            Sign Up Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>&copy; 2025 VideoShare. All rights reserved.</p>
      </footer>
    </div>
  );
}
