import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, getCurrentUserChannel } from "../utils/supabase";
import "../../styles/main.css";

export default function TopNavBar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    loadUserData();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        loadUserData();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setChannel(null);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      
      setUser(user);

      if (user) {
        const userChannel = await getCurrentUserChannel();
        setChannel(userChannel);
      }
    } catch (err) {
      console.error("Error loading user:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setShowDropdown(false);
    navigate('/');
  };

  const getAvatarUrl = () => {
    return user?.user_metadata?.avatar_url || null;
  };

  const getDisplayName = () => {
    if (channel?.channel_name) return channel.channel_name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const getInitials = () => {
    const name = getDisplayName();
    return name.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <nav className="top-navbar">
        <div className="navbar-content">
          <div className="navbar-logo" onClick={() => navigate('/')}>
            <span className="navbar-logo-icon">▶</span>
            <span className="navbar-logo-text">VideoShare</span>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="top-navbar">
      <div className="navbar-content">
        {/* Logo */}
        <div className="navbar-logo" onClick={() => navigate('/')}>
          <span className="navbar-logo-icon">▶</span>
          <span className="navbar-logo-text">VideoShare</span>
        </div>

        {/* Right side - User profile or Login */}
        <div className="navbar-right">
          {user ? (
            <div className="navbar-user-container">
              <div 
                className="navbar-user-profile"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <div className="navbar-user-avatar">
                  {getAvatarUrl() ? (
                    <img src={getAvatarUrl()} alt={getDisplayName()} />
                  ) : (
                    <span>{getInitials()}</span>
                  )}
                </div>
                <span className="navbar-user-name">{getDisplayName()}</span>
                <span className="navbar-dropdown-arrow">▼</span>
              </div>

              {showDropdown && (
                <div className="navbar-dropdown">
                  <div className="navbar-dropdown-item" onClick={() => {
                    navigate('/home');
                    setShowDropdown(false);
                  }}>
                    <span>🏠</span>
                    <span>Home</span>
                  </div>
                  
                  {channel && (
                    <div className="navbar-dropdown-item" onClick={() => {
                      navigate(`/channel/${channel.channel_tag}`);
                      setShowDropdown(false);
                    }}>
                      <span>📺</span>
                      <span>My Channel</span>
                    </div>
                  )}

                  <div className="navbar-dropdown-item" onClick={() => {
                    navigate('/home'); // Assuming UserProfilePage is in /home
                    setShowDropdown(false);
                  }}>
                    <span>👤</span>
                    <span>Profile</span>
                  </div>

                  {!channel && (
                    <div className="navbar-dropdown-item" onClick={() => {
                      navigate('/channel/create');
                      setShowDropdown(false);
                    }}>
                      <span>➕</span>
                      <span>Create Channel</span>
                    </div>
                  )}

                  <div className="navbar-dropdown-divider"></div>

                  <div className="navbar-dropdown-item navbar-dropdown-signout" onClick={handleSignOut}>
                    <span>🚪</span>
                    <span>Sign Out</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="navbar-auth-buttons">
              <button 
                className="navbar-btn navbar-btn-login"
                onClick={() => navigate('/login')}
              >
                Sign In
              </button>
              <button 
                className="navbar-btn navbar-btn-register"
                onClick={() => navigate('/register')}
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
