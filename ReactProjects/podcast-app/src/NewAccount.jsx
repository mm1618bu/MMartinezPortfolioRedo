import React from "react";
import "./App.css";
import { Link } from "react-router-dom";

const NewAccount = () => {
    return (
        <div className="new-account-container">
            <h2>Create a new account</h2>
            <form className="new-account-form">
                <input type="email" id="email" name="email" placeholder="Email Address" required />
                <input type="password" id="password" name="password" placeholder="Password" required />
                <input type="password" id="confirm-password" name="confirm-password" placeholder="Confirm Password" required />
                <button type="submit" className='sso-button'>Create account</button>
            </form>
            <p>Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
    );
}

export default NewAccount;