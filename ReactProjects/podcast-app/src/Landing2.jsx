import React from "react";
import "./App.css";
import radioImage from "./assets/radio.png"; // Import the image

const Landing2 = () => {
    const snowflakes = Array.from({ length: 50 }, (_, index) => ({
        size: Math.random() * 5 + 5, // Random size between 5px and 10px
        left: Math.random() * 100, // Random left position between 0% and 100%
        duration: Math.random() * 5 + 5, // Random duration between 5s and 10s
        delay: Math.random() * 5, // Random delay between 0s and 5s
    }));

    return (
        <>
            <style>
                {`
                    .landing2-container {
                        display: flex;
                        height: 100vh;
                        overflow: hidden;
                        position: relative;
                    }

                    .background {
                        display: block;
                        position: absolute;
                        top: 0;
                        left: 0;
                        object-fit: cover;
                        width: 100%;
                        height: 100%;
                        background-image: url(${radioImage});
                        background-size: cover;
                        background-position: center;
                    }

                    .snowflake-container {
                        position: absolute;
                        width: 100%;
                        height: 100%;
                        top: 0;
                        left: 0;
                        pointer-events: none; /* Prevent snowflakes from blocking interactions */
                    }

                    .snowflake {
                        position: absolute;
                        border-radius: 50%;
                        background-color: rgba(255, 255, 255, 0.8);
                        animation-iteration-count: infinite;
                        animation-timing-function: linear;
                    }

                    @keyframes fall {
                        0% {
                            top: -10%;
                        }
                        100% {
                            top: 110%;
                        }
                    }

                    .text-container {
                        flex: 0 0 50%; /* Take up 50% of the width */
                        padding: 60px;
                        margin: 60px 60px 60px 1960px;
                        color: white;
                        z-index: 1; /* Ensure text is above the background and snowflakes */
                        margin-left: auto; /* Push the text container to the right */
                        border: 4px outset rgba(244, 132, 1, 0.7);
                        border-radius: 20px;
                        background: radial-gradient(circle at 24.1% 68.8%, rgb(50, 50, 50) 0%, rgb(0, 0, 0) 99.4%);
                    }

                    .text-container p {
                        margin-bottom: 20px;
                    }
                `}
            </style>
            <div className="landing2-container">
                <div className="background"></div>
                <div className="snowflake-container">
                    {snowflakes.map((snowflake, index) => (
                        <div
                            key={index}
                            className="snowflake"
                            style={{
                                width: `${snowflake.size}px`,
                                height: `${snowflake.size}px`,
                                left: `${snowflake.left}%`,
                                animation: `fall ${snowflake.duration}s linear ${snowflake.delay}s infinite`,
                            }}
                        ></div>
                    ))}
                </div>
                <div className="text-container">
                    <section>
                        <h1>Podcast App</h1>
                        <p>
                            Welcome to the Podcast App! Listen to your favorite podcasts
                            on the go.
                        </p>
                        <p>
                            This is a simple podcast app built using React. It fetches
                            podcast data from the Listen Notes API.
                        </p>
                    </section>
                    <section>
                        <h1>Features</h1>
                        <ul>
                            <li>Search for podcasts</li>
                            <li>View podcast episodes</li>
                            <li>Listen to podcast episodes</li>
                        </ul>
                    </section>
                </div>
            </div>
        </>
    );
}

export default Landing2;