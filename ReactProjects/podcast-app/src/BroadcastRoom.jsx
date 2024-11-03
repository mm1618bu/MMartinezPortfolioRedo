import React from 'react';
import './App.css';

const BroadcastRoom = () => {
  return (
    <div className="keypad-container">
      <div className="display">
        <div className="camera">
          <div className="camera-dot">A</div>
          <div className="camera-dot"></div>
        </div>
      </div>
      <div className="button-grid">
        {Array(12).fill(0).map((_, index) => (
          <div key={index} className="button"></div>
        ))}
      </div>
    </div>
  );
};

export default BroadcastRoom;
