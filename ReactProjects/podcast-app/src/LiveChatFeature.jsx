import React, { useState } from "react";
import "./App.css";

const LiveChatFeature = () => {
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([
        "Its too quiet in here...",
    ]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (message) {
            setMessages([...messages, message]); // Adds the new message to the display
            setMessage(""); // Clears the input field
        }
    };

    return (
        <div className="live-chat-container">
            <h2>Live Chat</h2>
            
            {/* Chat messages display area */}
            <div className="chat-messages">
                {messages.map((msg, index) => (
                    <div key={index} className="chat-message">
                        <p>{msg}</p>
                    </div>
                ))}
            </div>

            {/* Message input form */}
            <form className="live-chat-form" onSubmit={handleSubmit}>
                <input
                    type="text"
                    id="message"
                    name="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    placeholder="Say Something..."
                />
                <button type="submit" className="message-button">Send</button>
            </form>
        </div>
    );
}

export default LiveChatFeature;
