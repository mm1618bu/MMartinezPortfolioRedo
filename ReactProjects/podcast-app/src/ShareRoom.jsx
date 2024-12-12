import React from "react";
import { SocialIcon } from 'react-social-icons';
import "./App.css";

export default function ShareRoom(){
    return (
        <div className="share-container">
            <h2>Share Room</h2>
            <div className="share-form">
                <input type="text" placeholder="Enter Room ID" />
                <button className="sso-button">Join Room</button>
            </div>
            <div className="social-icons">
                <SocialIcon url="https://www.facebook.com/" />
                <SocialIcon url="https://www.twitter.com/" />
                <SocialIcon url="https://www.linkedin.com/" />
                <SocialIcon url="https://www.instagram.com/" />
            </div>
        </div>
    );
}