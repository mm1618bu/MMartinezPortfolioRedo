import React from "react";
import { Link } from "react-router-dom";

const NewAccount = () => {
    return (
        <>
            <style>
                {`
                    /* New layout container */
                    .account-page {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        background-color: #000000; /* Black background */
                    }

                    .account-box {
                        background-color: #222222;
                        padding: 40px;
                        border-radius: 15px;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                        width: 100%;
                        max-width: 480px;
                        color: #fff; /* White text */
                    }

                    .account-box h2 {
                        font-size: 32px;
                        color: #ff4500; /* Orange color */
                        text-align: center;
                        margin-bottom: 20px;
                    }

                    .account-box p {
                        text-align: center;
                        color: #ccc;
                        font-size: 16px;
                        margin-bottom: 20px;
                    }

                    .input-group {
                        margin-bottom: 20px;
                        display: flex;
                        flex-direction: column;
                    }

                    .input-group label {
                        font-size: 16px;
                        font-weight: 600;
                        color: #fff; /* White label */
                        margin-bottom: 8px;
                    }

                    .input-group input {
                        padding: 14px;
                        border-radius: 8px;
                        border: 1px solid #444;
                        background-color: #333; /* Dark input background */
                        color: #fff; /* White text */
                        font-size: 16px;
                        width: 100%;
                        box-sizing: border-box;
                        transition: border-color 0.3s ease, box-shadow 0.3s ease;
                    }

                    .input-group input:focus {
                        border-color: #ff4500; /* Orange border on focus */
                        box-shadow: 0 0 8px rgba(255, 69, 0, 0.5);
                        outline: none;
                    }

                    .submit-btn {
                        background-color: #ff4500; /* Orange button */
                        color: white;
                        padding: 14px;
                        font-size: 16px;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        width: 100%;
                        transition: background-color 0.3s ease, transform 0.2s ease;
                    }

                    .submit-btn:hover {
                        background-color: #e03e00; /* Darker orange on hover */
                        transform: translateY(-2px);
                    }

                    .signin-link {
                        text-align: center;
                        font-size: 14px;
                        margin-top: 20px;
                        color: #ff4500; /* Orange link */
                    }

                    .signin-link a {
                        color: #ff4500;
                        text-decoration: none;
                        font-weight: bold;
                    }

                    .signin-link a:hover {
                        text-decoration: underline;
                    }

                    /* Responsive Design */
                    @media (max-width: 768px) {
                        .account-box {
                            padding: 30px;
                        }

                        .account-box h2 {
                            font-size: 24px;
                        }

                        .input-group input {
                            font-size: 14px;
                        }

                        .submit-btn {
                            font-size: 14px;
                        }
                    }
                `}
            </style>

            <div className="account-page">
                <div className="account-box">
                    <h2>Create a New Account</h2>
                    <p>Fill in the form below to create a new account.</p>

                    <form>
                        <div className="input-group">
                            <label htmlFor="email">Email Address:</label>
                            <input type="email" id="email" placeholder="Enter your email" required />
                        </div>

                        <div className="input-group">
                            <label htmlFor="password">Password:</label>
                            <input type="password" id="password" placeholder="Enter your password" required />
                        </div>

                        <div className="input-group">
                            <label htmlFor="confirm-password">Confirm Password:</label>
                            <input type="password" id="confirm-password" placeholder="Confirm your password" required />
                        </div>

                        <button type="submit" className="submit-btn">Create Account</button>
                    </form>

                    <div className="signin-link">
                        <p>Already have an account? <Link to="/login">Sign in</Link></p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default NewAccount;
