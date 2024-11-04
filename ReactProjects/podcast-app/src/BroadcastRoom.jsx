import React from 'react';
import batman from './assets/batman.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
const BroadcastRoom = () => {
  return (
    <>
      <style>
        {`
          .broadcast-room {
            font-family: Arial, sans-serif;
            padding: 20px;
            max-width: 400px;
            margin: auto;
            color: #333;
            background: #f9f9f9;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 18px;
            margin-bottom: 15px;
          }
          .header .leave {
            color: #ff5733;
            cursor: pointer;
          }
          .participants {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-bottom: 15px;
          }
          .participant {
            position: relative;
            width: 80px;
            text-align: center;
          }
          .participant img {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            border: 2px solid #00c853;
          }
          .participant .name {
            font-size: 12px;
            margin-top: 5px;
          }
          .participant .add {
            position: absolute;
            top: 5px;
            right: 5px;
            background: #007bff;
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: pointer;
          }
          .muted {
            opacity: 0.5;
          }
          .listener {
            display: flex;
            gap: 10px;
            font-size: 14px;
          }
          .listener img {
            width: 40px;
            height: 40px;
            border-radius: 50%;
          }
          .join-btn {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: #007bff;
            color: white;
            padding: 10px 15px;
            border-radius: 50%;
            font-size: 20px;
            cursor: pointer;
          }
        `}
      </style>

      <div className="broadcast-room">
        <div className="header">
          <span>Public</span>
          <span>🎉 Meet People</span>
          <span className="leave">Exit</span>
        </div>
          <span>Hosts</span>
        <div className="participants">
          {["Tucker","Chris"].map((name, index) => (
            <div key={index} className={`participant ${name === "Fiona" || name === "HORI" || name === "Suhrab" ? 'muted' : ''}`}>
              <img src={batman} alt={name} />
              <div className="add">+</div>
              <div className="name">{name}</div>
            </div>
          ))}
        </div>
        <span>Participants</span>
        <div className="participants">
          {["جنون", "Masoud", "Mona", "Fiona", "HORI", "Suhrab"].map((name, index) => (
            <div key={index} className={`participant ${name === "Fiona" || name === "HORI" || name === "Suhrab" ? 'muted' : ''}`}>
              <img src={batman} alt={name} />
              <div className="add">+</div>
              <div className="name">{name}</div>
            </div>
          ))}
        </div>

        <p>Just Listening</p>
        <div className="listener">
          <div className="participant">
            <img src={batman} alt="Mitchell" />
            <span className="name">Mitchell</span>
          </div>
          <div className="participant">
            <img src={batman} alt="Orlando" />
            <span className="name">Orlando</span>
          </div>
        </div>

        <div className="join-btn">+</div>
      </div>
    </>
  );
};

export default BroadcastRoom;
