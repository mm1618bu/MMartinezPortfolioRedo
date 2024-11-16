import React, { useState } from "react";
import "./App.css";

const UserProfile = () => {
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [bio, setBio] = useState("");

    const handleEditBio = () => {
        setIsEditingBio(true);
    };

    const handleSaveBio = () => {
        setIsEditingBio(false);
    };

    return (
        <>
            <style>
                {`
                    .user-profile-card {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        padding: 20px;
                        background-color: #ffffff;
                        border-radius: 12px;
                        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                        max-width: 400px;
                        margin: auto;
                        color: #444;
                    }
                    .user-profile-card img {
                        border-radius: 50%;
                        margin-bottom: 15px;
                    }
                    .user-profile-card h3 {
                        margin: 5px 0;
                        color: #333;
                    }
                    .user-profile-card .buttons {
                        display: flex;
                        gap: 10px;
                        margin-top: 15px;
                    }
                    .user-profile-card button {
                        padding: 10px 20px;
                        background-color: #007bff;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        font-size: 16px;
                        cursor: pointer;
                        transition: background-color 0.3s ease;
                    }
                    .user-profile-card button:hover {
                        background-color: #0056b3;
                    }
                    .user-profile-card p {
                        margin-top: 20px;
                        color: #666;
                        text-align: center;
                    }
                    .bio-container {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        margin-top: 15px;
                    }
                    .bio-container textarea {
                        width: 100%;
                        padding: 10px;
                        border: 1px solid #ccc;
                        border-radius: 4px;
                        font-size: 16px;
                        margin-bottom: 10px;
                    }
                `}
            </style>
            <div className="user-profile-card">
                <div>
                    <img src="https://via.placeholder.com/150" alt="User profile" />
                    <h3>John Doe</h3>
                    <h3>@JDoe1234</h3>
                    <h3>200 Followers</h3>
                </div>
                <div className="buttons">
                    <button>Add</button>
                    <button>Message</button>
                </div>
                <div className="bio-container">
                    {isEditingBio ? (
                        <>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="Enter your bio here..."
                            />
                            <button onClick={handleSaveBio}>Save</button>
                        </>
                    ) : (
                        <>
                            <p>{bio || "Add Bio"}</p>
                            <button onClick={handleEditBio}>Edit Bio</button>
                        </>
                    )}
                </div>
                <div>
                    <p>Likes to talk about:</p>
                    <p>Edit</p>
                </div>
                <div className="tags">
                    <button>Meet People</button>
                    <button>Join Room</button>
                    <button>Follow</button>
                </div>
            </div>
        </>
    );
}

export default UserProfile;