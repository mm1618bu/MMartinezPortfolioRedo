import React from 'react';
import '../design/main.css';
import { supabase } from '../supabaseClient';
import { generateId, announceToScreenReaders } from '../a11yUtils';

export default function ForgotPassword({ onNavigate }) {
    
    const [email, setEmail] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [message, setMessage] = React.useState('');
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;

            setMessage('Password reset email sent! Please check your inbox.');
            setEmail('');
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }
    
    return (
        <div className="forgotPasswordBox">
            <div>
                <h1>TripSync Forgot Password</h1>
            </div>
            <br/>
            {error && (
                <div style={{ 
                    padding: '12px', 
                    marginBottom: '15px', 
                    background: '#fee', 
                    border: '1px solid #fcc',
                    borderRadius: '6px',
                    color: '#c33'
                }}>
                    {error}
                </div>
            )}
            {message && (
                <div style={{ 
                    padding: '12px', 
                    marginBottom: '15px', 
                    background: '#efe', 
                    border: '1px solid #cfc',
                    borderRadius: '6px',
                    color: '#3c3'
                }}>
                    {message}
                </div>
            )}
            <form onSubmit={handleSubmit}>
                <h3>Email</h3>
                <div className="inputBox">
                    <input 
                        type="email" 
                        required 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        placeholder="your.email@example.com"
                    />
                </div>
                <br />
                <div className="inputBox">
                    <button type="submit" disabled={loading}>
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </div>
                <br/>
                <div>
                    <p>
                        Remembered your password? <button
                            type="button"
                            onClick={() => onNavigate && onNavigate('login')}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#1abc9c',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                padding: 0,
                                font: 'inherit'
                            }}
                        >
                            Login
                        </button>
                    </p>
                </div>
            </form>
        </div>
    );
}
