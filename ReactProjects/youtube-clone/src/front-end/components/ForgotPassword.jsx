import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../supabase.ts";
import "../../styles/main.css";
import "../../styles/auth.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/UpdatePassword`,
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      setSuccessMsg("Check your email for the password reset link. It may take a few minutes to arrive.");
      setEmail("");
      setLoading(false);
    } catch (err) {
      setErrorMsg("Unable to send reset email. Please try again later.");
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Reset Password</h1>
            <p>Enter your email address and we'll send you a link to reset your password</p>
          </div>

          <form onSubmit={handleReset} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                autoComplete="email"
              />
            </div>

            {errorMsg && (
              <div className="alert alert-error">
                <span className="alert-icon">⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
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
                  Sending reset link...
                </>
              ) : (
                "Send Reset Link"
              )}
            </button>

            <div className="auth-links">
              <Link to="/login" className="link-secondary">
                ← Back to Sign In
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
