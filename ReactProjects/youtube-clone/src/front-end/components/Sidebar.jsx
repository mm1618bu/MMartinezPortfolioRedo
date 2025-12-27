import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase, getCurrentUserChannel } from "../utils/supabase";
import "../../styles/main.css";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [channel, setChannel] = useState(null);

  useEffect(() => {
    loadUserData();

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
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const menuItems = [
    {
      icon: "🏠",
      label: "Home",
      path: "/home",
      requiresAuth: false
    },
    {
      icon: "🎥",
      label: "All Videos",
      path: "/channel",
      requiresAuth: false
    },
    {
      icon: "📺",
      label: "My Channel",
      path: channel ? `/channel/${channel.channel_tag}` : "/channel/create",
      requiresAuth: true,
      show: !!user
    },
    {
      icon: "�",
      label: "Creator Studio",
      path: "/dashboard",
      requiresAuth: true,
      show: !!user && !!channel
    },
    {
      icon: "�📤",
      label: "Upload Video",
      path: "/home", // VideoUpload is in home page
      requiresAuth: true,
      show: !!user
    },
    {
      icon: "📋",
      label: "Playlists",
      path: "/playlists",
      requiresAuth: false
    },
    {
      icon: "➕",
      label: "Create Playlist",
      path: "/playlist/create",
      requiresAuth: true,
      show: !!user
    },
    {
      icon: "👤",
      label: "Profile",
      path: "/home", // UserProfilePage is in home page
      requiresAuth: true,
      show: !!user
    },
    {
      icon: "🔧",
      label: "Create Channel",
      path: "/channel/create",
      requiresAuth: true,
      show: user && !channel
    }
  ];

  const handleNavigation = (path, requiresAuth) => {
    if (requiresAuth && !user) {
      navigate('/login');
    } else {
      navigate(path);
    }
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      <button 
        className="sidebar-toggle"
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? '☰' : '✕'}
      </button>

      <nav className="sidebar-nav">
        {menuItems.map((item, index) => {
          // Skip items that shouldn't be shown
          if (item.show === false) return null;

          return (
            <div
              key={index}
              className={`sidebar-item ${isActive(item.path) ? 'sidebar-item-active' : ''}`}
              onClick={() => handleNavigation(item.path, item.requiresAuth)}
            >
              <span className="sidebar-item-icon">{item.icon}</span>
              {!isCollapsed && <span className="sidebar-item-label">{item.label}</span>}
            </div>
          );
        })}
      </nav>

      {!isCollapsed && (
        <div className="sidebar-footer">
          <div className="sidebar-divider"></div>
          {user ? (
            <div className="sidebar-user-info">
              <span className="sidebar-user-icon">👋</span>
              <span className="sidebar-user-text">
                {channel?.channel_name || user.email?.split('@')[0] || 'User'}
              </span>
            </div>
          ) : (
            <div className="sidebar-auth-prompt">
              <button 
                className="sidebar-login-btn"
                onClick={() => navigate('/login')}
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
