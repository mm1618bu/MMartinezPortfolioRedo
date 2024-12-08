import React from 'react';
import batman from './assets/batman.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComment, faShare, faPlus, faHand, faEllipsisH } from '@fortawesome/free-solid-svg-icons';
import BroadcastRoomDropDown from './BroadcastRoomDropdown';
import { Link } from 'react-router-dom';

const BroadcastRoom = () => {
  const [isDropdownVisible, setIsDropdownVisible] = React.useState(false);

  const toggleDropdown = () => {
    setIsDropdownVisible(!isDropdownVisible);
  };

  const handleShareClick = () => {
    const roomLink = "https://example.com/room"; // Replace with the actual room link
    navigator.clipboard.writeText(roomLink).then(() => {
      alert("Room link copied to clipboard!");
    }).catch(err => {
      console.error("Failed to copy: ", err);
    });
  };

  return (
    <>
      <style>
        {`
          .broadcast-room {
            font-family: Arial, sans-serif;
            padding: 30px;
            max-width: 500px;
            margin: auto;
            color: #333;
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            height: 100%;
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 18px;
            margin-bottom: 20px;
            font-weight: bold;
            color: #333;
          }

          .header .leave {
            color: #ff5733;
            cursor: pointer;
            text-decoration: none;
          }

          .participants {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
          }

          .participant {
            position: relative;
            width: 80px;
            text-align: center;
            margin: 0 auto;
          }

          .participant img {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            border: 2px solid #00c853;
            transition: transform 0.3s ease;
          }

          .participant img:hover {
            transform: scale(1.1);
          }

          .participant .name {
            font-size: 12px;
            margin-top: 5px;
            font-weight: 600;
            color: #333;
            cursor: pointer;
          }

          .participant .add {
            position: absolute;
            top: 5px;
            right: 5px;
            background: #007bff;
            color: white;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            font-size: 18px;
            transition: background-color 0.3s ease;
          }

          .participant .add:hover {
            background: #0056b3;
          }

          .muted {
            opacity: 0.6;
          }

          .listener {
            display: flex;
            gap: 20px;
            font-size: 14px;
            margin-bottom: 20px;
          }

          .listener img {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            transition: transform 0.3s ease;
          }

          .listener img:hover {
            transform: scale(1.1);
          }

          .controls {
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: relative;
            width: 100%;
            padding: 0 20px;
            margin-top: 20px;
          }

          .footer .left-icons {
            display: flex;
            gap: 30px;
          }

          .footer .right-icon {
            font-size: 24px;
            cursor: pointer;
          }

          .icon {
            font-size: 24px;
            cursor: pointer;
            margin-left: 10px;
            padding-left: 10px;
            transition: transform 0.3s ease;
          }

          .icon:hover {
            transform: scale(1.2);
          }

          .divisions {
            font-size: 12px;
            color: #b7b7b7;
            margin-top: 10px;
            text-align: center;
          }

          .join-btn {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: #007bff;
            color: white;
            padding: 15px 20px;
            border-radius: 50%;
            font-size: 22px;
            cursor: pointer;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
            transition: background-color 0.3s ease, transform 0.3s ease;
          }

          .join-btn:hover {
            background-color: #0056b3;
            transform: scale(1.1);
          }

          /* Responsive Design */
          @media (max-width: 768px) {
            .broadcast-room {
              padding: 20px;
            }

            .header {
              font-size: 16px;
            }

            .controls {
              padding: 0 10px;
            }

            .participant img {
              width: 50px;
              height: 50px;
            }

            .listener img {
              width: 35px;
              height: 35px;
            }

            .footer .left-icons {
              gap: 20px;
            }
          }
        `}
      </style>

      <div className="broadcast-room">
        <div className="header">
          <span>Public</span>
          <span><Link to="/broadcast-info">Cricket Corner</Link></span>
          <span className="leave"><Link to="/for-you">Exit</Link></span>
        </div>

        <div className="participants">
          {["Tucker", "Chris"].map((name, index) => (
            <div key={index} className={`participant ${name === "Fiona" || name === "HORI" || name === "Suhrab" ? 'muted' : ''}`}>
              <img src={batman} alt={name} />
              <div className="add">+</div>
              <Link to="/user-profile" className="name">{name}</Link>
            </div>
          ))}
        </div>

        <span className="divisions">Participants</span>

        <div className="participants">
          {["جنون", "Masoud", "Mona", "Fiona", "HORI", "Suhrab"].map((name, index) => (
            <div key={index} className={`participant`}>
              <img src={batman} alt={name} />
              <div className="add">+</div>
              <Link to="/user-profile" className="name">{name}</Link>
            </div>
          ))}
        </div>

        <span className="divisions">Just Listening</span>

        <div className="listener">
          <div className="participant">
            <img src={batman} alt="Mitchell" />
            <Link to="/user-profile" className="name">Mitchell</Link>
          </div>
          <div className="participant">
            <Link to='/user-profile'>
            <img src={batman} alt="Orlando" />
            </Link>
            <Link to="/user-profile" className="name">Orlando</Link>
          </div>
        </div>

        <div className="controls">
          <div className="left-icons">
            <Link to="/live-chat"><FontAwesomeIcon icon={faComment} className="icon" title="message" /></Link>
            <FontAwesomeIcon icon={faShare} className="icon" title="share" onClick={handleShareClick} />
            <FontAwesomeIcon icon={faHand} className="icon" title="talk" />
            <FontAwesomeIcon icon={faEllipsisH} className="icon" onClick={toggleDropdown} />
          </div>
          <FontAwesomeIcon icon={faPlus} className="right-icon" />
        </div>

        {isDropdownVisible && (<div className='dropdown'><BroadcastRoomDropDown /></div>)}

        <button className="join-btn">+</button>
      </div>
    </>
  );
};

export default BroadcastRoom;
