import React from "react";
import "./App.css";

const BroadcastInfo = () => {
    return (
        <div className="broadcast-info-card">
            <div>
            <h2>Show Details</h2>
            <p><strong>Show:</strong> The Daily Podcast</p>
            <p><strong>Hosts:</strong> John Doe, Jane Smith</p>
            <p><strong>Start Date:</strong> January 1, 2020</p>
            <p><strong>Followers:</strong> 10,000</p>
            </div>
            <div>
            <h2>Upcoming Episodes</h2>
            <p><strong>Episode:</strong> The Future of AI</p>
            <p><strong>Date:</strong> January 5, 2020</p>
            <p><strong>Time:</strong> 8:00 PM</p>
            <p><strong>Hosts:</strong> John Doe, Jane Smith</p>
            </div>
        </div>
        
    );
}

export default BroadcastInfo;