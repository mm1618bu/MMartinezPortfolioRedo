import React from "react";
import "./App.css";

const LiveChatFeature = () => {
    return (
        <div className="live-chat-container">
            <h2>Live chat with other listeners</h2>
            <form className="live-chat-form">
                <label htmlFor="message">Message</label>
                <input type="text" id="message" name="message" required />
                <button type="submit" className='sso-button'>Send</button>
            </form>
        </div>
    );
    }

export default LiveChatFeature;