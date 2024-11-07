import React, { useState } from "react";
import "./App.css"; 

const EndUserSettings = () => {
    const [pushNotifications, setPushNotifications] = useState(false);
    const [emailNotifications, setEmailNotifications] = useState(false);

    return (
        <>
            <style>
                {`
                    .end-user-settings-container {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        padding: 20px;
                        background-color: #f9f9f9;
                        border-radius: 8px;
                        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                        max-width: 600px;
                        margin: auto;
                        color: #333;
                    }
                    .end-user-settings-form {
                        display: flex;
                        flex-direction: column;
                        width: 100%;
                        margin-bottom: 20px;
                    }
                    .end-user-settings-form label {
                        margin-bottom: 5px;
                        font-weight: bold;
                        color: #333;
                    }
                    .end-user-settings-form input {
                        padding: 10px;
                        margin-bottom: 15px;
                        border: 1px solid #ccc;
                        border-radius: 4px;
                        font-size: 16px;
                        width: calc(100% - 22px); /* Adjust for padding and border */
                    }
                    .end-user-settings-form input:focus {
                        border-color: #007bff;
                        outline: none;
                        box-shadow: 0 0 5px rgba(0, 123, 255, 0.5);
                    }
                    .end-user-settings-form button {
                        padding: 10px;
                        background-color: #007bff;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        font-size: 16px;
                        cursor: pointer;
                        transition: background-color 0.3s ease;
                    }
                    .end-user-settings-form button:hover {
                        background-color: #0056b3;
                    }
                    .end-user-settings-container h2, .end-user-settings-container h3 {
                        margin: 10px 0;
                        color: #007bff;
                    }
                    .end-user-settings-container button {
                        padding: 10px;
                        margin: 5px 0;
                        background-color: #007bff;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        font-size: 16px;
                        cursor: pointer;
                        transition: background-color 0.3s ease;
                    }
                    .end-user-settings-container button:hover {
                        background-color: #0056b3;
                    }
                    .end-user-settings-container p {
                        margin-top: 15px;
                        color: #333;
                    }
                    .end-user-settings-container ul {
                        list-style-type: none;
                        padding: 0;
                    }
                    .end-user-settings-container ul li {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin: 10px 0;
                        padding: 10px;
                        background-color: #f1f1f1;
                        border-radius: 4px;
                        cursor: pointer;
                        transition: background-color 0.3s ease;
                    }
                    .end-user-settings-container ul li:hover {
                        background-color: #e1e1e1;
                    }
                    .switch {
                        position: relative;
                        display: inline-block;
                        width: 40px;
                        height: 20px;
                    }
                    .switch input {
                        opacity: 0;
                        width: 0;
                        height: 0;
                    }
                    .slider {
                        position: absolute;
                        cursor: pointer;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background-color: #ccc;
                        transition: .4s;
                        border-radius: 20px;
                    }
                    .slider:before {
                        position: absolute;
                        content: "";
                        height: 14px;
                        width: 14px;
                        left: 3px;
                        bottom: 3px;
                        background-color: white;
                        transition: .4s;
                        border-radius: 50%;
                    }
                    input:checked + .slider {
                        background-color: #007bff;
                    }
                    input:checked + .slider:before {
                        transform: translateX(20px);
                    }
                `}
            </style>
            <div className="end-user-settings-container">
                <h2>End user settings</h2>
                <form className="end-user-settings-form">
                    <label htmlFor="username">Username</label>
                    <input type="text" id="username" name="username" required />
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" name="email" required />
                    <label htmlFor="password">Password</label>
                    <input type="password" id="password" name="password" required />
                    <button type="submit">Save changes</button>
                </form>
                <h2>Your Name</h2>
                <h3>Your username</h3>
                <button>Share</button>
                <button>Add instagram link</button>
                <button>Add twitter link</button>
                <button>Add facebook link</button>
                <p>Add your bio here</p>
                <div>
                    <ul>
                        <li>
                            Turn off push notifications
                            <label className="switch">
                                <input type="checkbox" checked={pushNotifications} onChange={() => setPushNotifications(!pushNotifications)} />
                                <span className="slider"></span>
                            </label>
                        </li>
                        <li>
                            Turn off email notifications
                            <label className="switch">
                                <input type="checkbox" checked={emailNotifications} onChange={() => setEmailNotifications(!emailNotifications)} />
                                <span className="slider"></span>
                            </label>
                        </li>
                    </ul>
                </div>
            </div>
        </>
    );
}

export default EndUserSettings;