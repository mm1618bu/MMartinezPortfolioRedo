import React from 'react';
import '../design/main.css';
import { supabase } from '../supabaseClient';
import { generateId, announceToScreenReaders } from '../a11yUtils';

export default function Login({ onNavigate, onLoginSuccess }) {

    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [message, setMessage] = React.useState('');
    
    // Generate unique IDs for form fields - NFR-4.2: label association
    const emailId = React.useRef(generateId('login-email')).current;
    const passwordId = React.useRef(generateId('login-password')).current;
    const errorId = React.useRef(generateId('login-error')).current;
    const messageId = React.useRef(generateId('login-message')).current;
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');
        
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) throw error;

            setMessage('Login successful!');
            // Announce to screen readers - NFR-4.1
            announceToScreenReaders('Login successful! Redirecting...');
            
            // Call the success callback if provided
            if (onLoginSuccess) {
                onLoginSuccess(data.user);
            }
        } catch (error) {
            setError(error.message);
            // Announce error to screen readers - NFR-4.1
            announceToScreenReaders('Login failed: ' + error.message, 'assertive');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="loginBox" role="main" aria-labelledby="login-title">
            <div>
                {/* NFR-4.2: Semantic heading for screen readers */}
                <h1 id="login-title">TripSync Login</h1>
            </div>
            <br/>
            {error && (
                <div 
                    id={errorId}
                    role="alert"
                    style={{ 
                        padding: '12px', 
                        marginBottom: '15px', 
                        background: '#fee', 
                        border: '2px solid #c33',
                        borderRadius: '6px',
                        color: '#8b0000'
                    }}
                >
                    <strong>Error:</strong> {error}
                </div>
            )}
            {message && (
                <div 
                    id={messageId}
                    role="status"
                    aria-live="polite"
                    style={{ 
                        padding: '12px', 
                        marginBottom: '15px', 
                        background: '#efe', 
                        border: '2px solid #3c3',
                        borderRadius: '6px',
                        color: '#0a6817'
                    }}
                >
                    <strong>Success:</strong> {message}
                </div>
            )}
            <form onSubmit={handleSubmit}>
                {/* NFR-4.2: Proper label elements with htmlFor */}
                <label htmlFor={emailId} className="form-label">Email</label>
                <div className="inputBox">
                    <input 
                        id={emailId}
                        type="email" 
                        required 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        placeholder="your.email@example.com"
                        aria-required="true"
                        aria-describedby={error ? errorId : undefined}
                    />
                </div>
                <br />
                {/* NFR-4.2: Proper label elements with htmlFor */}
                <label htmlFor={passwordId} className="form-label">Password</label>
                <div className="inputBox">
                    <input 
                        id={passwordId}
                        type="password" 
                        required 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        placeholder="Enter your password"
                        aria-required="true"
                        aria-describedby={error ? errorId : undefined}
                    />
                </div>
                <br />
                <div className="inputBox">
                    <button type="submit" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </div>
                <br/>
                <div>
                    <p>
                        {/* NFR-4.1: Keyboard accessible navigation buttons */}
                        <button
                            type="button"
                            onClick={() => onNavigate && onNavigate('forgotPassword')}
                            className="link-button"
                            aria-label="Forgot password, reset your password"
                        >
                            Forgot Password?
                        </button>
                        {' | '}
                        <button
                            type="button"
                            onClick={() => onNavigate && onNavigate('register')}
                            className="link-button"
                            aria-label="Register, create a new account"
                        >
                            Register
                        </button>
                    </p>
                </div>

            </form>
        </div>
    );
}