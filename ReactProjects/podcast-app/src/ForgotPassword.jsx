import React, { useState } from 'react';
import './App.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        // Add logic to handle password reset request
        setMessage('If an account with that email exists, a password reset link has been sent.');
    };

    return (
        <div className="forgot-password-container">
            <h2>Forgot Password</h2>
            <br></br>
            <p>Forgot your password? No problem! Reset it below</p>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Reset Password</button>
            </form>
            {message && <p>{message}</p>}
            <p>Back to Login</p>
        </div>
    );
};

export default ForgotPassword;