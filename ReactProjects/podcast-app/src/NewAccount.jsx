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
                        padding: 30px;
                        background-color: #ffffff;
                        border-radius: 12px;
                        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                        max-width: 450px;
                        margin: auto;
                        color: #444;
                    }
                    .new-account-container h2 {
                        font-size: 26px;
                        margin-bottom: 25px;
                        color: #333;
                    }
                    .new-account-form {
                        display: flex;
                        flex-direction: column;
                        width: 100%;
                    }
                    .new-account-form input {
                        padding: 12px;
                        margin-bottom: 20px;
                        border: 1px solid #ddd;
                        border-radius: 6px;
                        font-size: 16px;
                        width: calc(100% - 26px); /* Adjust for padding and border */
                    }
                    .new-account-form input:focus {
                        border-color: #555;
                        outline: none;
                        box-shadow: 0 0 6px rgba(85, 85, 85, 0.5);
                    }
                    .sso-button {
                        padding: 12px;
                        background-color: #555;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        font-size: 16px;
                        cursor: pointer;
                        transition: background-color 0.3s ease;
                    }
                    .sso-button:hover {
                        background-color: #333;
                    }
                    .new-account-container p {
                        margin-top: 20px;
                        color: #666;
                    }
                    .new-account-container p a {
                        color: #555;
                        text-decoration: none;
                    }
                    .new-account-container p a:hover {
                        text-decoration: underline;
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
}

export default NewAccount;