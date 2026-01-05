import { useState } from "react";
import { supabase } from "../../supabase.ts";
import { mockAuth } from "../utils/mockAuth.js";
import { Link } from "react-router-dom";
import "../../styles/main.css";
import "../../styles/auth.css";

export default function LoginPage() {
  const [emailOrUser, setEmailOrUser] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      // Try Supabase first, fall back to mock auth if it fails
      let data, error;
      
      try {
        const result = await supabase.auth.signInWithPassword({
          email: emailOrUser,
          password: password,
        });
        data = result.data;
        error = result.error;
      } catch (supabaseError) {
        console.warn("Supabase unavailable, using mock authentication for demo");
        // Use mock authentication
        const mockResult = await mockAuth.signInWithPassword({
          email: emailOrUser,
          password: password,
        });
        data = mockResult.data;
        error = mockResult.error;
      }

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      // Logged in successfully
      console.log("User logged in:", data);
      setLoading(false);

      // Redirect to home page after login
      window.location.href = "/home";
    } catch (err) {
      // Handle any other unexpected errors
      console.error("Login error:", err);
      setErrorMsg("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Welcome Back</h1>
            <p>Sign in to continue to your account</p>
          </div>

          <form onSubmit={handleLogin} className="auth-form">
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
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  autoComplete="current-password"
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

            {errorMsg && (
              <div className="alert alert-error">
                <span className="alert-icon">⚠️</span>
                <span>{errorMsg}</span>
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
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>

            <div className="auth-links">
              <Link to="/forgot-password" className="link-secondary">
                Forgot your password?
              </Link>
            </div>

            <div className="auth-divider">
              <span>Don't have an account?</span>
            </div>

            <Link to="/register" className="btn-secondary btn-block">
              Create Account
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
