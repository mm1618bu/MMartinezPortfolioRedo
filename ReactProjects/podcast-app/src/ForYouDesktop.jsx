import React from "react";

const ChatRoom = () => {
  return (
    <div className="chat-room">
      <style>
        {`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f0f4f8;
            min-height: 100vh;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 20px;
          }

          .chat-room {
            display: flex;
            flex-direction: column;
            width: 100%;
            padding: 0px;
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            margin-bottom: 40px;
            padding-bottom: 10px;
            border-bottom: 2px solid #f0f4f8;
          }

          .logo span {
            font-size: 28px;
            font-weight: 600;
            color: #3f51b5;
          }

          .exit-button {
            background-color: #ff3b30;
            color: white;
            border: none;
            padding: 12px 18px;
            font-size: 16px;
            font-weight: 500;
            border-radius: 30px;
            cursor: pointer;
            transition: background-color 0.3s ease, transform 0.3s ease;
          }

          .exit-button:hover {
            background-color: #e60000;
            transform: scale(1.05);
          }

          .section {
            width: 100%;
            margin-bottom: 25px;
          }

          .section h3 {
            font-size: 22px;
            color: #3f51b5;
            margin-bottom: 15px;
            text-transform: uppercase;
            font-weight: 600;
          }

          .avatars {
            display: flex;
            gap: 20px;
            justify-content: flex-start;
            flex-wrap: wrap;
            margin-top: 10px;
          }

          .avatar {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 180px;
            height: 180px;
            background-color: orange;
            border-radius: 20%;
            font-weight: bold;
            color: #2e2e2e;
            font-size: 16px;
            cursor: pointer;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }

          .avatar:hover {
            transform: scale(1.2);
            box-shadow: 0px 6px 20px rgba(0, 0, 0, 0.15);
            background-color: lightorange;
          }

          .chat-controls {
            display: flex;
            justify-content: center;
            gap: 25px;
            margin-top: 40px;
          }

          .chat-button, .raise-hand-button, .more-button {
            background-color: #3f51b5;
            color: white;
            border: none;
            padding: 15px 18px;
            border-radius: 50%;
            font-size: 20px;
            cursor: pointer;
            transition: background-color 0.3s ease, transform 0.3s ease;
            box-shadow: 0px 6px 18px rgba(0, 0, 0, 0.1);
          }

          .chat-button:hover, .raise-hand-button:hover, .more-button:hover {
            background-color: #1a237e;
            transform: scale(1.05);
            box-shadow: 0px 8px 25px rgba(0, 0, 0, 0.15);
          }

          .chat-button:active, .raise-hand-button:active, .more-button:active {
            transform: scale(1);
          }

          .chat-button {
            font-size: 22px;
          }

          .raise-hand-button {
            font-size: 22px;
          }

          .more-button {
            font-size: 18px;
          }

          .chat-sidebar {
            width: 300px;
            height: 100vh;
            position: fixed;
            top: 0;
            right: 0;
            background-color: #ffffff;
            border-radius: 15px;
            box-shadow: 0px 10px 30px rgba(0, 0, 0, 0.1);
            padding: 20px;
            overflow-y: auto;
          }

          .chat-sidebar h3 {
            font-size: 24px;
            color: #3f51b5;
            margin-bottom: 20px;
          }

          .messages {
            max-height: 80vh;
            overflow-y: auto;
            padding-right: 10px;
          }

          .message {
            background-color: #f1f1f1;
            border-radius: 8px;
            padding: 10px;
            margin: 10px 0;
            max-width: 80%;
          }

          .input-area {
            display: flex;
            gap: 10px;
            margin-top: 20px;
          }

          .input-field {
            width: 80%;
            padding: 10px;
            border-radius: 20px;
            border: 1px solid #ccc;
          }

          .send-button {
            padding: 12px 15px;
            background-color: #3f51b5;
            color: white;
            border: none;
            border-radius: 20px;
            cursor: pointer;
            transition: background-color 0.3s ease;
          }

          .send-button:hover {
            background-color: #1a237e;
          }
        `}
      </style>

      <div className="chat-room">
        <div className="header">
          <div className="logo">
            <span>Cricket Corner</span>
          </div>
          <button className="exit-button">Exit</button>
        </div>

        <div className="section public-room">
          <h3>Public</h3>
          <div className="avatars">
            <div className="avatar">Tucker</div>
            <div className="avatar">Chris</div>
          </div>
        </div>

        <div className="section participants">
          <h3>Participants</h3>
          <div className="avatars">
            <div className="avatar">حسن</div>
            <div className="avatar">Masoud</div>
            <div className="avatar">Mona</div>
            <div className="avatar">Fiona</div>
            <div className="avatar">HORI</div>
            <div className="avatar">Suhrab</div>
          </div>
        </div>

        <div className="section just-listening">
          <h3>Just Listening</h3>
          <div className="avatars">
            <div className="avatar">Mitchell</div>
            <div className="avatar">Orlando</div>
            <div className="avatar">Jen</div>
            <div className="avatar">Katie</div>
          </div>
        </div>

      </div>

      {/* Chat Sidebar */}
      <div className="chat-sidebar">
        <h3>Chat</h3>
        <div className="messages">
          <div className="message">Hello! How's everyone?</div>
          <div className="message">Hey, I'm good!</div>
          <div className="message">Let's talk cricket!</div>
        </div>
        <div className="input-area">
          <input
            type="text"
            className="input-field"
            placeholder="Type a message..."
          />
          <button className="send-button">Send</button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
