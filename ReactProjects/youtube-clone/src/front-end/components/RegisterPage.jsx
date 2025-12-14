import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";
import CreateChannel from "./CreateChannel";
import "../../styles/main.css";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [emailOrUser, setEmailOrUser] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [wantsChannel, setWantsChannel] = useState(null); // null = not decided, true = wants, false = doesn't want
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const { data, error } = await supabase.auth.signUp({
      email: emailOrUser,
      password: password,
      options: {
        emailRedirectTo: `${window.location.origin}/`
      }
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    setRegisteredUser(data.user);
    setRegistrationComplete(true);
    setSuccessMsg("Registration successful! Do you want to create a channel?");
    setLoading(false);
  };

  const handleChannelChoice = (choice) => {
    setWantsChannel(choice);
  };

  const handleChannelCreated = (channel) => {
    if (channel) {
      alert('Channel created successfully! Please check your email to confirm your account.');
    } else {
      alert('Registration complete! Please check your email to confirm your account.');
    }
    navigate('/home');
  };

  // Show channel creation if user wants one
  if (registrationComplete && wantsChannel === true) {
    return <CreateChannel onChannelCreated={handleChannelCreated} skipable={true} />;
  }

  // Show channel choice if registration is complete
  if (registrationComplete && wantsChannel === null) {
    return (
      <div className="User-Form">
        <div className="channel-choice-container">
          <h2>✓ Registration Successful!</h2>
          <p className="success-message">{successMsg}</p>
          <p className="channel-choice-prompt">
            Would you like to create a channel to upload videos and share content?
          </p>
          
          <div className="channel-choice-buttons">
            <button 
              className="btn-yes-channel"
              onClick={() => handleChannelChoice(true)}
            >
              Yes, Create a Channel
            </button>
            <button 
              className="btn-no-channel"
              onClick={() => {
                handleChannelChoice(false);
                handleChannelCreated(null);
              }}
            >
              No, Just Browse Videos
            </button>
          </div>

          <p className="channel-choice-note">
            Don't worry! You can always create a channel later from your profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="User-Form">
      <form onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="Email"
          required
          value={emailOrUser}
          onChange={(e) => setEmailOrUser(e.target.value)}
        />
        <br />

        <input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <br />

        <button type="submit" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>

        {errorMsg && <p className="Error-Text">{errorMsg}</p>}
        {successMsg && <p className="Success-Text">{successMsg}</p>}

        <br />
        <br />

        <p>
          <a href="/login">Have an Account?</a>
        </p>
      </form>
    </div>
  );
}
