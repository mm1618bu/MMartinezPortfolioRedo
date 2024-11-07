import React from "react";
import "./App.css";

const BroadcastInfo = () => {
    return (
        <>
            <style>
                {`
                    .broadcast-info-card {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        padding: 20px;
                        background-color: #f9f9f9;
                        border-radius: 8px;
                        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                        max-width: 600px;
                        margin: auto;
                        color: #333;
                    }
                    .broadcast-info-card div {
                        margin-bottom: 20px;
                        width: 100%;
                    }
                    .broadcast-info-card h2 {
                        font-size: 24px;
                        margin-bottom: 10px;
                        color: #007bff;
                    }
                    .broadcast-info-card p {
                        font-size: 16px;
                        margin: 5px 0;
                    }
                    .broadcast-info-card p strong {
                        font-weight: bold;
                    }
                `}
            </style>
            <div className="broadcast-info-card">
                <div>
                    <h2>Show Details</h2>
                    <p><strong>Show:</strong> The Daily Podcast</p>
                    <p><strong>Hosts:</strong> John Doe, Jane Smith</p>
                    <p><strong>Start Date:</strong> January 1, 2020</p>
                    <p><strong>Followers:</strong> 10,000</p>
                </div>
                <div>
                    <h2>Behind the Mic</h2>    
                    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Doloremque nam itaque, nobis consequatur laudantium illum molestiae in temporibus sed corporis sequi repellendus doloribus fugiat, incidunt, inventore magnam velit quod nulla.</p>
                </div>
                <div>
                    <h2>Upcoming Episodes</h2>
                    <p><strong>Episode:</strong> The Future of AI</p>
                    <p><strong>Date:</strong> January 5, 2020</p>
                    <p><strong>Time:</strong> 8:00 PM</p>
                </div>
                <div>
                    <p><strong>Episode:</strong> The Future of AI</p>
                    <p><strong>Date:</strong> January 5, 2020</p>
                    <p><strong>Time:</strong> 8:00 PM</p>
                </div>
                <div>
                    <p><strong>Episode:</strong> The Future of AI</p>
                    <p><strong>Date:</strong> January 5, 2020</p>
                    <p><strong>Time:</strong> 8:00 PM</p>
                </div>
            </div>
        </>
    );
}

export default BroadcastInfo;