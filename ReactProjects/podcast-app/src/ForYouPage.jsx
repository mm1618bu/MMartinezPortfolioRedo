import React, { useState } from "react";
import "./App.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCoffee, faUser, faComment } from "@fortawesome/free-solid-svg-icons";

const ForYouPage = () => {
    const [selectedOption, setSelectedOption] = useState("forYou");

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
                    .toggle-buttons {
                        display: flex;
                        justify-content: center;
                        margin-bottom: 20px;
                    }
                    .toggle-buttons button {
                        padding: 0;
                        margin: 0 10px;
                        border: none;
                        border-radius: 0px;
                        cursor: pointer;
                        color: black;
                        font-size: 16px;
                        background-color: transparent;
                    }
                    .toggle-buttons button.active {
                        border-bottom: 2px solid red;
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
                        transition: color 0.3s ease;
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

                    .for-you-card:hover {
                        background-color: lightyellow;
                    }
                `}
            </style>
            <div className="for-you-container">
                <div className="toggle-buttons">
                    <button
                        className={selectedOption === "forYou" ? "active" : ""}
                        onClick={() => setSelectedOption("forYou")}
                    >
                        For You
                    </button>
                    <button
                        className={selectedOption === "explore" ? "active" : ""}
                        onClick={() => setSelectedOption("explore")}
                    >
                        Explore
                    </button>
                </div>
                {selectedOption === "forYou" && (
                    <div className="for-you-grid">
                        <div className="for-you-card">
                            <div className="room-name">
                                <FontAwesomeIcon icon={faCoffee} className="icon" />
                                <h3>Cricket Corner</h3>
                            </div>
                            <h4>Tagline for the Podcast</h4>
                            <p>John&nbsp;Smith,&nbsp;Lisa&nbsp;Lenord</p>
                            <p>
                                <FontAwesomeIcon icon={faUser} className="icon" />
                                100&nbsp;     
                                <FontAwesomeIcon icon={faComment} className="icon" />
                                10 
                            </p>
                        </div>
                        <div className="for-you-card">
                            <div className="room-name">
                                <FontAwesomeIcon icon={faCoffee} className="icon" />
                                <h3>Tech Talk</h3>
                            </div>
                            <p>Podcast&nbsp;description</p>
                        </div>
                        <div className="for-you-card">
                            <div className="room-name">
                                <FontAwesomeIcon icon={faCoffee} className="icon" />
                                <h3>Health & Wellness</h3>
                            </div>
                            <p>Podcast&nbsp;description</p>
                        </div>
                        <div className="for-you-card">
                            <div className="room-name">
                                <FontAwesomeIcon icon={faCoffee} className="icon" />
                                <h3>Travel Diaries</h3>
                            </div>
                            <p>Podcast&nbsp;description</p>
                        </div>
                    </div>
                )}
                {selectedOption === "explore" && (
                    <div className="for-you-grid">
                        <div className="for-you-card">
                            <div className="room-name">
                                <FontAwesomeIcon icon={faCoffee} className="icon" />
                                <h3>Explore Topic 1</h3>
                            </div>
                            <p>Explore&nbsp;description</p>
                        </div>
                        <div className="for-you-card">
                            <div className="room-name">
                                <FontAwesomeIcon icon={faCoffee} className="icon" />
                                <h3>Explore Topic 2</h3>
                            </div>
                            <p>Explore&nbsp;description</p>
                        </div>
                        <div className="for-you-card">
                            <div className="room-name">
                                <FontAwesomeIcon icon={faCoffee} className="icon" />
                                <h3>Explore Topic 3</h3>
                            </div>
                            <p>Explore&nbsp;description</p>
                        </div>
                        <div className="for-you-card">
                            <div className="room-name">
                                <FontAwesomeIcon icon={faCoffee} className="icon" />
                                <h3>Explore Topic 4</h3>
                            </div>
                            <p>Explore&nbsp;description</p>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

export default ForYouPage;