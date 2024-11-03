import React from 'react';
import './App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle, faMicrophoneSlash, faHandPaper, faSignOutAlt, faComment, faShare } from '@fortawesome/free-solid-svg-icons';

const BroadcastRoom = () => {
  return (
    <div className="audio-room-container">
      <header className="room-header">
      <button className="leave-button">
            <FontAwesomeIcon icon={faSignOutAlt} /><p className='exit'> Exit</p>
          </button>
        <h2>Cricket Corner</h2>
        <p>John Smith, Lisa Lenord</p>
      </header>
      
      <h2>Host</h2>
      <div className="speakers-section hosting">
        
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
      
      <h2>Paid Members</h2>
      <div className="speakers-section">
        <div className="listener">
          <FontAwesomeIcon icon={faUserCircle} className="speaker-icon" />
          <p className="listener-name">Ian</p>
        </div>
        <div className="listener">
          <FontAwesomeIcon icon={faUserCircle} className="speaker-icon" />
          <p className="listener-name">Rebecca</p>
        </div>
        <div className="listener">
          <FontAwesomeIcon icon={faUserCircle} className="speaker-icon" />
          <p className="listener-name">Mitch</p>
        </div>
      </div>

      <h2>Just Listening</h2>
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

          <button className="mute-button">
            <FontAwesomeIcon icon={faMicrophoneSlash} />
          </button>
          <button className="chat-button">
            <FontAwesomeIcon icon={faComment} />
          </button>
          <button className="raise-hand-button">
            <FontAwesomeIcon icon={faHandPaper} />
          </button>
          <button className="end-room-button">
            <FontAwesomeIcon icon={faShare}/></button>
        </div>
      </div>
    </div>
  );
};

export default BroadcastRoom;
