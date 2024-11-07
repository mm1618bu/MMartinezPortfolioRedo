import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCoffee, faUser, faComment } from "@fortawesome/free-solid-svg-icons";

const ForYouPage = () => {
    return (
        <>
            <style>
                {`
                    .for-you-container {
                        padding: 20px;
                        max-width: 1200px;
                        margin: auto;
                    }
                    .for-you-container h2 {
                        font-size: 28px;
                        margin-bottom: 20px;
                        color: #007bff;
                        text-align: center;
                    }
                    .for-you-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                        gap: 20px;
                    }
                    .for-you-card {
                        background-color: #fff;
                        border-radius: 8px;
                        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                        padding: 20px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        text-align: center;
                    }
                    .room-name {
                        display: flex;
                        align-items: center;
                        margin-bottom: 10px;
                    }
                    .room-name h3 {
                        margin-left: 10px;
                        font-size: 20px;
                        color: #333;
                    }
                    .for-you-card p {
                        margin: 5px 0;
                        color: #666;
                    }
                    .for-you-card .icon {
                        margin-right: 5px;
                    }
                `}
            </style>
            <div className="for-you-container">
                <h2>For you | Explore</h2>
                <div className="for-you-grid">
                    <div className="for-you-card">
                        <div className="room-name">
                            <FontAwesomeIcon icon={faCoffee} className="icon" />
                            <h3>Cricket Corner</h3>
                        </div>
                        <p>John Smith, Lisa Lenord</p>
                        <p>
                            <FontAwesomeIcon icon={faUser} className="icon" />
                            100 people / 
                            <FontAwesomeIcon icon={faComment} className="icon" />
                            10 messages
                        </p>
                    </div>
                    <div className="for-you-card">
                        <div className="room-name">
                            <FontAwesomeIcon icon={faCoffee} className="icon" />
                            <h3>Tech Talk</h3>
                        </div>
                        <p>Podcast description</p>
                    </div>
                    <div className="for-you-card">
                        <div className="room-name">
                            <FontAwesomeIcon icon={faCoffee} className="icon" />
                            <h3>Health & Wellness</h3>
                        </div>
                        <p>Podcast description</p>
                    </div>
                    <div className="for-you-card">
                        <div className="room-name">
                            <FontAwesomeIcon icon={faCoffee} className="icon" />
                            <h3>Travel Diaries</h3>
                        </div>
                        <p>Podcast description</p>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ForYouPage;