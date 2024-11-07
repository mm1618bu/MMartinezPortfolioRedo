import React, { useState } from "react";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle password reset logic here
        setMessage("If an account with that email exists, a password reset link has been sent.");
    };

    return (
        <>
            <style>
                {`
                    .forgot-password-container {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        padding: 20px;
                        background-color: #f9f9f9;
                        border-radius: 8px;
                        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                        max-width: 400px;
                        margin: auto;
                        color: #333;
                    }
                    .forgot-password-container h2 {
                        font-size: 24px;
                        margin-bottom: 10px;
                        color: #007bff;
                    }
                    .forgot-password-container p {
                        font-size: 16px;
                        margin: 10px 0;
                    }
                    .forgot-password-container form {
                        display: flex;
                        flex-direction: column;
                        width: 100%;
                    }
                    .form-group {
                        margin-bottom: 15px;
                    }
                    .form-group label {
                        margin-bottom: 5px;
                        font-weight: bold;
                        color: #333;
                    }
                    .form-group input {
                        padding: 10px;
                        border: 1px solid #ccc;
                        border-radius: 4px;
                        font-size: 16px;
                        width: calc(100% - 22px); /* Adjust for padding and border */
                    }
                    .form-group input:focus {
                        border-color: #007bff;
                        outline: none;
                        box-shadow: 0 0 5px rgba(0, 123, 255, 0.5);
                    }
                    .sso-button {
                        padding: 10px;
                        background-color: #007bff;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        font-size: 16px;
                        cursor: pointer;
                        transition: background-color 0.3s ease;
                    }
                    .sso-button:hover {
                        background-color: #0056b3;
                    }
                    .forgot-password-container .message {
                        margin-top: 15px;
                        color: green;
                    }
                    .forgot-password-container .back-to-login {
                        margin-top: 15px;
                        color: #007bff;
                        cursor: pointer;
                        text-decoration: underline;
                    }
                `}
            </style>
            <div className="forgot-password-container">
                <h2>Forgot Password</h2>
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
                    <button type="submit" className="sso-button">Reset Password</button>
                </form>
                {message && <p className="message">{message}</p>}
                <p className="back-to-login">Back to Login</p>
            </div>
        </>
    );
};

export default ForgotPassword;