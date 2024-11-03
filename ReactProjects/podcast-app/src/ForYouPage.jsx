import React from "react";
import "./App.css";

const ForYouPage = () => {
    return (
        <div className="for-you-container">
            <h2>For you | Explore </h2>
            <div className="for-you-grid">
                <div className="for-you-card">
                    <img src="podcast-1.jpg" alt="Podcast 1" />
                    <h3>Cricket Corner</h3>
                    <p>John Smith, Lisa Lenord</p>
                </div>
                <div className="for-you-card">
                    <img src="podcast-2.jpg" alt="Podcast 2" />
                    <h3>Football Friendzy</h3>
                    <p>Podcast description</p>
                </div>
                <div className="for-you-card">
                    <img src="podcast-3.jpg" alt="Podcast 3" />
                    <h3>The Eric Cartman Show </h3>
                    <p>Podcast description</p>
                </div>
                <div className="for-you-card">
                    <img src="podcast-4.jpg" alt="Podcast 4" />
                    <h3>Art Gallery</h3>
                    <p>Podcast description</p>
                </div>
            </div>
        </div>
    );
    }

export default ForYouPage;