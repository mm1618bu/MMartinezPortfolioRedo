import React from 'react';
import './App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle, faMicrophoneSlash, faHandPaper, faSignOutAlt, faComment } from '@fortawesome/free-solid-svg-icons';

const BroadcastRoom = () => {
  return (
    <div className="audio-room-container">
      <header className="room-header">
        <h2>Cricket Corner</h2>
        <p className="room-name">John Smith, Lisa Lenord</p>
      </header>
      
      <div className="speakers-section">
        <div className="speaker">
          <FontAwesomeIcon icon={faUserCircle} className="speaker-icon" />
          <p className="speaker-name">Bethania</p>
          <FontAwesomeIcon icon={faMicrophoneSlash} className="mute-icon" />
        </div>
        <div className="speaker">
          <FontAwesomeIcon icon={faUserCircle} className="speaker-icon" />
          <p className="speaker-name">Dr. Angela</p>
          <FontAwesomeIcon icon={faMicrophoneSlash} className="mute-icon" />
        </div>
        <div className="speaker">
          <FontAwesomeIcon icon={faUserCircle} className="speaker-icon" />
          <p className="speaker-name">Andy</p>
          <FontAwesomeIcon icon={faMicrophoneSlash} className="mute-icon" />
        </div>
      </div>
      
      <div className="followed-section">
        <div className="follower">
          <FontAwesomeIcon icon={faUserCircle} className="follower-icon" />
          <p className="follower-name">Ian</p>
        </div>
        <div className="follower">
          <FontAwesomeIcon icon={faUserCircle} className="follower-icon" />
          <p className="follower-name">Rebecca</p>
        </div>
        <div className="follower">
          <FontAwesomeIcon icon={faUserCircle} className="follower-icon" />
          <p className="follower-name">Mitch</p>
        </div>
      </div>
      
      <div className="footer">
        <p>You’re in the audience on mute.</p>
        <div className="footer-buttons">
          <button className="leave-button">
            <FontAwesomeIcon icon={faSignOutAlt} /> Exit
          </button>
          <button className="raise-hand-button">
            <FontAwesomeIcon icon={faHandPaper} />
          </button>
          <button className="mute-button">
            <FontAwesomeIcon icon={faMicrophoneSlash} />
          </button>
          <button className="chat-button">
            <FontAwesomeIcon icon={faComment} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BroadcastRoom;
