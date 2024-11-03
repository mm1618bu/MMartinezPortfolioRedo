import React from "react";
import "./App.css";

const SMSVerify = () => {
    return (
        <div className="sms-verify-container">
            <h2>Verify your phone number</h2>
            <form className="sms-verify-form">
                <label htmlFor="phone">Phone number</label>
                <input type="tel" id="phone" name="phone" required />
                <button type="submit" className='sso-button'>Verify</button>
                <p>I cant access my phone</p>
            </form>
        </div>
    );
    }

export default SMSVerify;
