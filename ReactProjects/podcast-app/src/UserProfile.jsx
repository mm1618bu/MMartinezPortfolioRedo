import React from "react";
import "./App.css";

const UserProfile = () => {
    return (
        <div className="user-profile-card">
            <div>
                <img src="https://via.placeholder.com/150" alt="User profile" />
                <h3>John Doe</h3>
                <h3>@JDoe1234</h3>
                <h3>200 Followers</h3>
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