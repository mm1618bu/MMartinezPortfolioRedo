import React from "react";
import "./App.css";

const UserProfile = () => {
    return (
        <div className="user-profile-card">
            <div>
                <h2>Your Name</h2>
                <h3>Your username</h3>
                <h3>Headcount</h3>
            </div>
            <div>
                <button>Add</button>
                <button>Message</button>
            </div>
            <div>
                <p>Likes to talk about</p>
            </div>
        </div>
    );
}

export default UserProfile;