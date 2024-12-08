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
                        padding: 30px;
                        background-color: #ffffff;
                        border-radius: 16px;
                        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
                        max-width: 450px;
                        margin: 30px auto;
                        color: #444;
                        transition: transform 0.3s ease, box-shadow 0.3s ease;
                    }

                    .user-profile-card:hover {
                        transform: translateY(-10px);
                        box-shadow: 0 12px 35px rgba(0, 0, 0, 0.2);
                    }

                    .user-profile-card img {
                        border-radius: 50%;
                        margin-bottom: 20px;
                        width: 120px;
                        height: 120px;
                        object-fit: cover;
                    }

                    .user-profile-card h3 {
                        color: #333;
                        font-size: 24px;
                        font-weight: bold;
                        margin-bottom: 5px;
                    }

                    .user-profile-card p {
                        color: #666;
                        font-size: 14px;
                        margin: 5px 0;
                    }

                    .user-profile-card h4 {
                        color: #007bff;
                        font-size: 16px;
                        margin: 5px 0 20px;
                    }

                    .user-profile-card .buttons {
                        display: flex;
                        gap: 12px;
                        margin-top: 15px;
                    }

                    .user-profile-card button {
                        padding: 12px 24px;
                        background-color: #007bff;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 16px;
                        cursor: pointer;
                        transition: background-color 0.3s ease, transform 0.2s ease;
                    }

                    .user-profile-card button:hover {
                        background-color: #0056b3;
                        transform: translateY(-3px);
                    }

                    .bio-container {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        margin-top: 20px;
                    }

                    .bio-container textarea {
                        width: 100%;
                        padding: 12px;
                        border: 1px solid #ddd;
                        border-radius: 8px;
                        font-size: 16px;
                        margin-bottom: 12px;
                        resize: vertical;
                        min-height: 100px;
                        transition: border-color 0.3s ease;
                    }

                    .bio-container textarea:focus {
                        border-color: #007bff;
                    }

                    .user-name-info {
                        text-align: center;
                    }

                    .tags {
                        display: flex;
                        justify-content: center;
                        gap: 12px;
                        margin-top: 20px;
                    }

                    .tags button {
                        padding: 8px 16px;
                        background-color: #f0f0f0;
                        color: #333;
                        border: 1px solid #ddd;
                        border-radius: 20px;
                        font-size: 14px;
                        cursor: pointer;
                        transition: background-color 0.3s ease;
                    }

                    .tags button:hover {
                        background-color: #007bff;
                        color: white;
                    }

                    @media (max-width: 768px) {
                        .user-profile-card {
                            padding: 20px;
                            width: 90%;
                        }

                        .user-profile-card img {
                            width: 100px;
                            height: 100px;
                        }

                        .user-profile-card h3 {
                            font-size: 20px;
                        }

                        .user-profile-card h4 {
                            font-size: 14px;
                        }

                        .bio-container textarea {
                            font-size: 14px;
                        }
                    }
                `}
            </style>
            <div className="user-profile-card">
                <div className="user-name-info">
                    <img src="https://via.placeholder.com/150" alt="User profile" />
                    <h3>John Doe</h3>
                    <p>@JDoe1234</p>
                    <h4>200 Followers</h4>
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
};

export default UserProfile;
