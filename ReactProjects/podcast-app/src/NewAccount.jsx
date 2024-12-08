import React from "react";
import { Link } from "react-router-dom";

const NewAccount = () => {
    return (
        <>
            <style>
                {`
                    .new-account-container {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        padding: 40px 30px;
                        background-color: #ffffff;
                        border-radius: 12px;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                        max-width: 480px;
                        margin: auto;
                        color: #444;
                    }

                    .new-account-container h2 {
                        font-size: 28px;
                        margin-bottom: 30px;
                        color: #333;
                        font-weight: bold;
                        text-align: center;
                    }

                    .new-account-form {
                        display: flex;
                        flex-direction: column;
                        width: 100%;
                    }

                    .new-account-form input {
                        padding: 14px;
                        margin-bottom: 20px;
                        border: 1px solid #ddd;
                        border-radius: 8px;
                        font-size: 16px;
                        width: 100%;
                        box-sizing: border-box;
                        transition: border-color 0.3s ease, box-shadow 0.3s ease;
                    }

                    .new-account-form input:focus {
                        border-color: #007bff;
                        outline: none;
                        box-shadow: 0 0 8px rgba(0, 123, 255, 0.5);
                    }

                    .sso-button {
                        padding: 14px;
                        background-color: #007bff;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 16px;
                        cursor: pointer;
                        transition: background-color 0.3s ease, transform 0.2s ease;
                        margin-top: 20px;
                        width: 100%;
                    }

                    .sso-button:hover {
                        background-color: #0056b3;
                        transform: translateY(-2px);
                    }

                    .new-account-container p {
                        margin-top: 25px;
                        color: #666;
                        text-align: center;
                    }

                    .new-account-container p a {
                        color: #007bff;
                        text-decoration: none;
                        font-weight: bold;
                    }

                    .new-account-container p a:hover {
                        text-decoration: underline;
                    }

                    /* Responsive Design */
                    @media (max-width: 768px) {
                        .new-account-container {
                            padding: 30px 20px;
                            max-width: 100%;
                        }

                        .new-account-container h2 {
                            font-size: 24px;
                        }

                        .new-account-form input {
                            font-size: 14px;
                        }

                        .sso-button {
                            font-size: 14px;
                        }
                    }
                `}
            </style>
            <div className="new-account-container">
                <h2>Create a New Account</h2>
                <form className="new-account-form">
                    <input type="email" id="email" name="email" placeholder="Email Address" required />
                    <input type="password" id="password" name="password" placeholder="Password" required />
                    <input type="password" id="confirm-password" name="confirm-password" placeholder="Confirm Password" required />
                    <button type="submit" className='sso-button'>Create Account</button>
                </form>
                <p>Already have an account? <Link to="/login">Sign in</Link></p>
            </div>
        </>
    );
};

export default NewAccount;
