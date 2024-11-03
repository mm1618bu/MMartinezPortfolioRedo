import React from "react";
import "./App.css";

const NewAccount = () => {
    return (
        <div className="new-account-container">
        <h2>Create a new account</h2>
        <form className="new-account-form">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" required />
            <label htmlFor="password">Password</label>
            <input type="password" id="password" name="password" required />
            <label htmlFor="confirm-password">Confirm password</label>
            <input type="password" id="confirm-password" name="confirm-password" required />
            <button type="submit">Create account</button>
        </form>
        <p>Already have an account? Sign in</p>
        </div>
    );
    }

export default NewAccount;