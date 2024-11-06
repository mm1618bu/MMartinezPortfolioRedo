import React from "react";
import "./App.css";

const BroadcastRoomDropDown = () => {
    return (
        <div className="dropdown">
            <button className="dropbtn">Broadcast Room</button>
            <div className="dropdown-content">
                <a href="#">Search</a>
                <a href="#">Report</a>
                <a href="#">Exit</a>
            </div>
        </div>
    );
}

export default BroadcastRoomDropDown;