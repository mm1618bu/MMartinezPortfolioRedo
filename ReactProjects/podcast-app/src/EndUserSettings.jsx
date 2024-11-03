import React from "react";
import "./App.css"; 

const EndUserSettings = () => {
    return (
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
                    <li>Turn off push notifications</li>
                    <li>Turn off email notifications</li>
                    <li>Turn off SMS notifications</li>
                    <li>Set Default Language</li>
                    <li>Set Default Timezone</li>
                    <li>Turn on Dark Mode</li>
                    <li>Blocked Hosts</li>
                </ul>
            </div>
        </div>
    );
    }

export default EndUserSettings;