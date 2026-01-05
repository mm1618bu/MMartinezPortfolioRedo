import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../utils/supabase";
import { mockAuth } from "../utils/mockAuth.js";
import CreateChannel from "./CreateChannel";
import "../../styles/main.css";
import "../../styles/auth.css";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [emailOrUser, setEmailOrUser] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [wantsChannel, setWantsChannel] = useState(null);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    // Validate passwords match
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      // Try Supabase first, fall back to mock auth if it fails
      let data, error;
      
      try {
        const result = await supabase.auth.signUp({
          email: emailOrUser,
          password: password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });
        data = result.data;
        error = result.error;
      } catch (supabaseError) {
        console.warn("Supabase unavailable, using mock authentication for demo");
        // Use mock authentication
        const mockResult = await mockAuth.signUp({
          email: emailOrUser,
          password: password,
          options: {
            data: { username: emailOrUser.split('@')[0] }
          }
        });
        data = mockResult.data;
        error = mockResult.error;
      }

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      setRegisteredUser(data.user);
      setRegistrationComplete(true);
      setSuccessMsg("Registration successful! Do you want to create a channel?");
      setLoading(false);
    } catch (err) {
      console.error("Registration error:", err);
      setErrorMsg("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleChannelChoice = (choice) => {
    setWantsChannel(choice);
  };

  const handleChannelCreated = (channel) => {
    if (channel) {
      alert('Channel created successfully! Please check your email to confirm your account.');
    } else {
      alert('Registration complete! Please check your email to confirm your account.');
    }
    navigate('/home');
  };

  // Show channel creation if user wants one
  if (registrationComplete && wantsChannel === true) {
    return <CreateChannel onChannelCreated={handleChannelCreated} skipable={true} />;
  }

  // Show channel choice if registration is complete
  if (registrationComplete && wantsChannel === null) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <div className="success-icon">✓</div>
              <h1>Registration Successful!</h1>
              <p>{successMsg}</p>
            </div>

            <div className="channel-choice-section">
              <h2>Create a Channel?</h2>
              <p className="channel-choice-description">
                Would you like to create a channel to upload videos and share content with the world?
              </p>
              
              <div className="channel-choice-buttons">
                <button 
                  className="btn-primary btn-block"
                  onClick={() => handleChannelChoice(true)}
                >
                  <span className="btn-icon">🎬</span>
                  Yes, Create My Channel
                </button>
                <button 
                  className="btn-secondary btn-block"
                  onClick={() => {
                    handleChannelChoice(false);
                    handleChannelCreated(null);
                  }}
                >
                  <span className="btn-icon">👀</span>
                  No, Just Browse for Now
                </button>
              </div>

              <p className="help-text">
                💡 Don't worry! You can always create a channel later from your profile settings.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Create Account</h1>
            <p>Join our community and start sharing videos</p>
          </div>

          <form onSubmit={handleRegister} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                required
                value={emailOrUser}
                onChange={(e) => setEmailOrUser(e.target.value)}
                className="form-input"
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password (min. 6 characters)"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  autoComplete="new-password"
                  minLength={6}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-input-wrapper">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-input"
                  autoComplete="new-password"
                  minLength={6}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="alert alert-error">
                <span className="alert-icon">⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && !registrationComplete && (
              <div className="alert alert-success">
                <span className="alert-icon">✓</span>
                <span>{successMsg}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary btn-block"
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </button>

            <div className="auth-divider">
              <span>Already have an account?</span>
            </div>

            <Link to="/login" className="btn-secondary btn-block">
              Sign In Instead
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
