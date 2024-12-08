import React, { useState } from 'react';

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

    const handleBack = () => {
        window.location.href = '/broadcast-room';
    };

    return (
        <div className="live-chat-container">
            <h2>Live Chat</h2>
            
            {/* Back button */}
            <button onClick={handleBack}>Back</button>

            {/* Chat messages display area */}
            <div className="chat-messages">
                {messages.map((msg, index) => (
                    <div key={index} className="chat-message">
                        <p><b>Name </b> {msg}</p>
                        <p className="Timestamp">One Minute Ago</p>
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
            </form>
        </div>
    );
};

export default LiveChatFeature;