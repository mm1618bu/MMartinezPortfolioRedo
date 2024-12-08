import React, { useState } from "react";
import "./App.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCoffee, faUser, faComment } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";

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
                        font-size: 32px;
                        margin-bottom: 30px;
                        color: #007bff;
                        text-align: center;
                        font-weight: bold;
                    }

                    .toggle-buttons {
                        display: flex;
                        justify-content: center;
                        margin-bottom: 30px;
                    }

                    .toggle-buttons button {
                        padding: 10px 20px;
                        margin: 0 15px;
                        border: 2px solid transparent;
                        border-radius: 50px;
                        cursor: pointer;
                        font-size: 18px;
                        background-color: transparent;
                        color: #333;
                        transition: all 0.3s ease;
                    }

                    .toggle-buttons button.active {
                        border-color: #007bff;
                        color: #007bff;
                        font-weight: bold;
                    }

                    .toggle-buttons button:hover {
                        background-color: #f0f0f0;
                    }

                    .for-you-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                        gap: 20px;
                        margin-bottom: 40px;
                    }

                    .for-you-card {
                        background-color: #fff;
                        border-radius: 12px;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                        padding: 20px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        text-align: center;
                        transition: transform 0.3s ease, box-shadow 0.3s ease;
                    }

                    .for-you-card:hover {
                        transform: translateY(-10px);
                        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
                    }

                    .room-name {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-bottom: 15px;
                    }

                    .room-name h3 {
                        margin-left: 12px;
                        font-size: 20px;
                        color: #333;
                        font-weight: 600;
                    }

                    .for-you-card h4 {
                        margin-top: 10px;
                        color: #555;
                        font-size: 16px;
                    }

                    .for-you-card p {
                        margin: 5px 0;
                        color: #777;
                        font-size: 14px;
                    }

                    .for-you-card .icon {
                        margin-right: 8px;
                        font-size: 18px;
                    }

                    .for-you-card .icon + .icon {
                        margin-left: 8px;
                    }

                    .tags {
                        display: flex;
                        gap: 12px;
                        justify-content: center;
                        margin-top: 30px;
                    }

                    .tags button {
                        padding: 8px 18px;
                        background-color: #f0f0f0;
                        color: #333;
                        border: none;
                        border-radius: 20px;
                        font-size: 14px;
                        cursor: pointer;
                        transition: background-color 0.3s ease, transform 0.2s ease;
                    }

                    .tags button:hover {
                        background-color: #007bff;
                        color: white;
                        transform: translateY(-2px);
                    }

                    @media (max-width: 768px) {
                        .for-you-container {
                            padding: 15px;
                        }

                        .for-you-container h2 {
                            font-size: 28px;
                        }

                        .toggle-buttons button {
                            font-size: 16px;
                        }

                        .for-you-grid {
                            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                        }

                        .for-you-card h3 {
                            font-size: 18px;
                        }

                        .for-you-card h4 {
                            font-size: 14px;
                        }
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
                                <Link to="/broadcast-room"><h3>Cricket Corner</h3></Link>
                            </div>
                            <h4>Flagship Cricket Podcast in Southern India</h4>
                            <p>Sandeep&nbsp;Ramakrishna,&nbsp;Syed&nbsp;Kodiyala</p>
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
                            <h4>PC, Gaming, Phones&nbsp;... you get the idea</h4>
                            <p>Sandeep&nbsp;Ramakrishna,&nbsp;Syed&nbsp;Kodiyala</p>
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
};

export default ForYouPage;
