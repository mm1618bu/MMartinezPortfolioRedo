import React from "react";
import "./App.css";

const BroadcastRoomDropDown = () => {
    return (
        <>
            <style>
                {`
                    .dropdown {
                        position: relative;
                        display: inline-block;
                    }
                    .dropbtn {
                        background-color: #007bff;
                        color: white;
                        padding: 10px 20px;
                        font-size: 16px;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                    }
                    .dropdown-content {
                        display: none;
                        position: absolute;
                        background-color: #f9f9f9;
                        min-width: 160px;
                        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
                        border-radius: 4px;
                        z-index: 1;
                    }
                    .dropdown-content a {
                        color: black;
                        padding: 12px 16px;
                        text-decoration: none;
                        display: block;
                        border-bottom: 1px solid #ddd;
                    }
                    .dropdown-content a:hover {
                        background-color: #f1f1f1;
                    }
                    .dropdown:hover .dropdown-content {
                        display: block;
                    }
                    .dropdown:hover .dropbtn {
                        background-color: #0056b3;
                    }
                `}
            </style>
            <div className="dropdown">
                <button className="dropbtn">Options</button>
                <div className="dropdown-content">
                    <a href="#">Search</a>
                    <a href="#">Report</a>
                    <a href="#">Exit</a>
                </div>
            </div>
        </>
    );
}

export default BroadcastRoomDropDown;