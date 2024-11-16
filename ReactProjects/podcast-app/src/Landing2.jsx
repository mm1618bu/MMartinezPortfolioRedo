import React from "react";
import "./App.css";
import radioImage from "./assets/radio.png"; // Import the image

const Landing2 = () => {
    const circles = Array.from({ length: 40 }, (_, index) => ({
        size: Math.random() * 20 + 10, // Random size between 10px and 30px
        left: Math.random() * 100, // Random left position between 0% and 100%
        duration: Math.random() * 5 + 3, // Random duration between 3s and 8s
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

                    .circle-container {
                        position: absolute;
                        width: 100%;
                        height: 100%;
                        top: 0;
                        left: 0;
                        pointer-events: none; /* Prevent circles from blocking interactions */
                    }

                    .circle {
                        position: absolute;
                        border-radius: 50%;
                        background-color: rgba(255, 255, 255, 0.5);
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
                        padding: 20px;
                        color: #333;
                        z-index: 1; /* Ensure text is above the background and circles */
                        background-color: rgba(255, 255, 255, 0.8); /* Optional: Add a background color for better readability */
                        margin-left: auto; /* Push the text container to the right */
                    }

                    .text-container p {
                        margin-bottom: 20px;
                    }
                `}
            </style>
            <div className="landing2-container">
                <div className="background"></div>
                <div className="circle-container">
                    {circles.map((circle, index) => (
                        <div
                            key={index}
                            className="circle"
                            style={{
                                width: `${circle.size}px`,
                                height: `${circle.size}px`,
                                left: `${circle.left}%`,
                                animation: `fall ${circle.duration}s linear ${circle.delay}s infinite`,
                            }}
                        ></div>
                    ))}
                </div>
                <div className="text-container">
    <p>Welcome to [Your Radio Station Name], your go-to online destination for nonstop music, talk shows, and entertainment!</p>
    <p>Our station brings you the latest hits, timeless classics, and exclusive interviews with your favorite artists from around the world.</p>
    <p>Whether you're tuning in from home, work, or on the go, our goal is to keep you connected with the music and stories you love.</p>
    <p>Join our vibrant community of listeners and discover why we're more than just a radio station – we're your soundtrack to every moment!</p>
</div>


            </div>
        </>
    );
}

export default Landing2;