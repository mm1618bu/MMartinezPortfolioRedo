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

  const menuSections = [
    {
      title: "Main",
      items: [
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
          icon: "📋",
          label: "Playlists",
          path: "/playlists",
          requiresAuth: false
        }
      ]
    },
    {
      title: "Your Channel",
      show: !!user,
      items: [
        {
          icon: "📺",
          label: "My Channel",
          path: channel ? `/channel/${channel.channel_tag}` : "/channel/create",
          requiresAuth: true,
          show: !!user
        },
        {
          icon: "📊",
          label: "Creator Studio",
          path: "/dashboard",
          requiresAuth: true,
          show: !!user && !!channel
        },
        {
          icon: "📤",
          label: "Upload Video",
          path: "/home",
          requiresAuth: true,
          show: !!user
        }
      ]
    },
    {
      title: "Library",
      show: !!user,
      items: [
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
          path: "/home",
          requiresAuth: true,
          show: !!user
        }
      ]
    },
    {
      title: "Setup",
      show: user && !channel,
      items: [
        {
          icon: "🔧",
          label: "Create Channel",
          path: "/channel/create",
          requiresAuth: true,
          show: user && !channel
        }
      ]
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
        {menuSections.map((section, sectionIndex) => {
          // Skip sections that shouldn't be shown
          if (section.show === false) return null;
          
          // Filter items that should be shown
          const visibleItems = section.items.filter(item => item.show !== false);
          if (visibleItems.length === 0) return null;

          return (
            <div key={sectionIndex} className="sidebar-section">
              {!isCollapsed && section.title && (
                <div className="sidebar-section-title">{section.title}</div>
              )}
              {visibleItems.map((item, itemIndex) => (
                <div
                  key={itemIndex}
                  className={`sidebar-item ${isActive(item.path) ? 'sidebar-item-active' : ''}`}
                  onClick={() => handleNavigation(item.path, item.requiresAuth)}
                  title={isCollapsed ? item.label : ''}
                >
                  <span className="sidebar-item-icon">{item.icon}</span>
                  {!isCollapsed && <span className="sidebar-item-label">{item.label}</span>}
                </div>
              ))}
              {sectionIndex < menuSections.length - 1 && !isCollapsed && (
                <div className="sidebar-section-divider"></div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-divider"></div>
        {user ? (
          <div className="sidebar-user-info" title={isCollapsed ? (channel?.channel_name || user.email?.split('@')[0]) : ''}>
            <div className="sidebar-user-avatar">
              {channel?.channel_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '👤'}
            </div>
            {!isCollapsed && (
              <div className="sidebar-user-details">
                <div className="sidebar-user-name">
                  {channel?.channel_name || user.email?.split('@')[0] || 'User'}
                </div>
                <div className="sidebar-user-email">
                  {user.email}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="sidebar-auth-prompt">
            <button 
              className="sidebar-login-btn"
              onClick={() => navigate('/login')}
              title={isCollapsed ? 'Sign In' : ''}
            >
              {isCollapsed ? '🔐' : 'Sign In'}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
