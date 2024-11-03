import React from "react";
import "./App.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCoffee } from "@fortawesome/free-solid-svg-icons";

const ForYouPage = () => {
    return (
        <div className="for-you-container">
            <h2>For you | Explore </h2>
            <div className="for-you-grid">
                <div className="for-you-card">
                    <div className="room-name">
                <FontAwesomeIcon icon={faCoffee}/> <h3>Cricket Corner</h3></div>
                    <p>John Smith, Lisa Lenord</p>
                    <p>100 people/10 messages</p>
                </div>
                <div className="for-you-card">
                <div className="room-name">
                <FontAwesomeIcon icon={faCoffee}/> <h3>Cricket Corner</h3></div>
                    <p>Podcast description</p>
                </div>
                <div className="for-you-card">
                <div className="room-name">
                <FontAwesomeIcon icon={faCoffee}/> <h3>Cricket Corner</h3></div>
                    <p>Podcast description</p>
                </div>
                <div className="for-you-card">
                <div className="room-name">
                <FontAwesomeIcon icon={faCoffee}/> <h3>Cricket Corner</h3></div>
                    <p>Podcast description</p>
                </div>
            </div>
        </div>
    );
    }

export default ForYouPage;