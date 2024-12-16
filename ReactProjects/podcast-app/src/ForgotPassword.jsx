import React, { useState } from "react";
import { Link } from "react-router-dom";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        setMessage("Password reset email sent!");
    };

    return (
        <>
            <style>
                {`
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }

                    .forgot-password-container {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        padding: 40px;
                        background-color: #222222; /* Black background */
                        border-radius: 12px;
                        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
                        max-width: 450px;
                        margin: auto;
                        color: #fff; /* White text color */
                        transition: all 0.3s ease;
                    }

                    .forgot-password-container:hover {
                        transform: translateY(-5px);
                        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
                    }

                    .forgot-password-container h2 {
                        font-size: 32px;
                        margin-bottom: 20px;
                        color: #ff4500; /* Orange color */
                        font-weight: 700;
                        text-align: center;
                    }

                    .forgot-password-container p {
                        font-size: 18px;
                        margin: 15px 0;
                        color: #ccc; /* Lighter text color */
                        text-align: center;
                        line-height: 1.6;
                    }

                    .forgot-password-container form {
                        display: flex;
                        flex-direction: column;
                        width: 100%;
                        margin-top: 25px;
                    }

                    .form-group {
                        margin-bottom: 18px;
                        width: 100%;
                    }

                    .form-group label {
                        margin-bottom: 8px;
                        font-weight: 600;
                        color: #fff; /* White label color */
                        font-size: 16px;
                    }

                    .form-group input {
                        padding: 14px;
                        border: 1px solid #555; /* Dark border */
                        border-radius: 8px;
                        font-size: 16px;
                        width: 100%;
                        box-sizing: border-box;
                        transition: border-color 0.3s ease, box-shadow 0.3s ease;
                        background-color: #333; /* Dark input background */
                        color: #fff; /* White text in inputs */
                    }

                    .form-group input:focus {
                        border-color: #ff4500; /* Orange focus color */
                        outline: none;
                        box-shadow: 0 0 8px rgba(255, 69, 0, 0.4);
                    }

                    .sso-button {
                        padding: 14px 20px;
                        background-color: #ff4500; /* Orange button */
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 18px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        font-weight: 600;
                    }

                    .sso-button:hover {
                        background-color: #e03e00; /* Darker orange on hover */
                        transform: translateY(-2px);
                    }

                    .forgot-password-container .message {
                        margin-top: 25px;
                        color: #28a745; /* Green success message */
                        font-size: 16px;
                        text-align: center;
                    }

                    .forgot-password-container .back-to-login {
                        margin-top: 20px;
                        color: #ff4500; /* Orange link */
                        cursor: pointer;
                        font-size: 16px;
                        text-decoration: underline;
                        font-weight: 600;
                        text-align: center;
                        transition: color 0.3s ease;
                    }

                    .forgot-password-container .back-to-login:hover {
                        color: #e03e00; /* Darker orange on hover */
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
                <Link to="/login" className="back-to-login">Back to Login</Link>
            </div>
        </>
    );
};

export default ForgotPassword;
