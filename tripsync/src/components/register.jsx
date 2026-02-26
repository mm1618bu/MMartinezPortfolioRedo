import React from 'react';
import '../design/main.css';
import { supabase } from '../supabaseClient';
import { generateId, announceToScreenReaders } from '../a11yUtils';

export default function Register({ onNavigate }) {
    
    const [username, setUsername] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [message, setMessage] = React.useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        // Basic password validation
        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        username: username,
                    }
                }
            });

            if (error) throw error;

            setMessage('Registration successful! Please check your email to confirm your account.');
            setUsername('');
            setEmail('');
            setPassword('');
            
            // Optionally redirect to login after 3 seconds
            setTimeout(() => {
                if (onNavigate) onNavigate('login');
            }, 3000);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        
        <div className="registerBox">
            <div>
                <h1>TripSync Register</h1>
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
                <h3>Username</h3>
                <div className="inputBox">
                    <input 
                        type="text" 
                        required 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={loading}
                        placeholder="Choose a username"
                    />
                </div>
                <br />
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
                <h3>Password</h3>
                <div className="inputBox">
                    <input 
                        type="password" 
                        required 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        placeholder="Minimum 6 characters"
                    />
                </div>
                <br />
                <div className="inputBox">
                    <button type="submit" disabled={loading}>
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </div>
                <br/>
                <div>
                    <p>
                        Already have an account? <button
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
