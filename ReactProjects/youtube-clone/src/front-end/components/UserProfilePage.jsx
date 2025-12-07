// src/front-end/components/UserProfilePage.jsx
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, getCurrentUserChannel, uploadProfilePicture, uploadBannerImage, updateUserMetadata } from "../utils/supabase";
import "../../styles/main.css";

/**
 * Simple user profile component using Supabase auth
 */
export default function UserProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  useEffect(() => {
    async function loadUser() {
      setLoading(true);
      setErrorMsg("");

      try {
        // Get current user from Supabase
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) throw error;
        
        setUser(user);

        // Get user's channel if they have one
        if (user) {
          const userChannel = await getCurrentUserChannel();
          setChannel(userChannel);
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        setErrorMsg(err.message || "Unable to load user profile.");
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setUploadingAvatar(true);
    setErrorMsg("");

    try {
      // Upload to Supabase Storage
      const avatarUrl = await uploadProfilePicture(file, user.id);

      // Update user metadata
      const { user: updatedUser } = await updateUserMetadata({
        avatar_url: avatarUrl
      });

      setUser(updatedUser);
      alert('Profile picture updated successfully!');
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setErrorMsg(err.message || 'Failed to upload profile picture');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 10MB for banners)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size must be less than 10MB');
      return;
    }

    setUploadingBanner(true);
    setErrorMsg("");

    try {
      // Upload to Supabase Storage
      const bannerUrl = await uploadBannerImage(file, user.id);

      // Update user metadata
      const { user: updatedUser } = await updateUserMetadata({
        banner_url: bannerUrl
      });

      setUser(updatedUser);
      alert('Banner image updated successfully!');
    } catch (err) {
      console.error('Error uploading banner:', err);
      setErrorMsg(err.message || 'Failed to upload banner image');
    } finally {
      setUploadingBanner(false);
    }
  };

  if (loading) {
    return (
      <div className="UserProfile UserProfile--loading">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="UserProfile UserProfile--error">
        <p className="Error-Text">{errorMsg}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="UserProfile UserProfile--notLoggedIn">
        <p>You are not logged in.</p>
        <p>
          <a href="/login">Log in</a> or <a href="/register">Sign up</a> to view your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="UserProfile">
      {/* Banner Section */}
      <div 
        className="UserProfile-banner"
        style={{
          backgroundImage: user.user_metadata?.banner_url 
            ? `url(${user.user_metadata.banner_url})` 
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      >
        <button 
          className="UserProfile-uploadBannerBtn"
          onClick={() => bannerInputRef.current?.click()}
          disabled={uploadingBanner}
        >
          {uploadingBanner ? '⏳ Uploading...' : '📷 Change Banner'}
        </button>
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          onChange={handleBannerUpload}
          style={{ display: 'none' }}
        />
      </div>

      <div className="UserProfile-header">
        <div className="UserProfile-avatarWrapper">
          {user.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt={user.email || "User avatar"}
              className="UserProfile-avatar"
            />
          ) : (
            <div className="UserProfile-avatar UserProfile-avatar--placeholder">
              {(user.email || "U").charAt(0).toUpperCase()}
            </div>
          )}
          <button 
            className="UserProfile-uploadAvatarBtn"
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploadingAvatar}
          >
            {uploadingAvatar ? '⏳' : '📷'}
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            style={{ display: 'none' }}
          />
        </div>

        <div className="UserProfile-headerInfo">
          <h1 className="UserProfile-name">
            {user.user_metadata?.display_name || user.email || "User"}
          </h1>

          {user.email && (
            <p className="UserProfile-email">{user.email}</p>
          )}

          {user.created_at && (
            <p className="UserProfile-joined">
              Joined{" "}
              {new Date(user.created_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          )}
        </div>
      </div>

      <div className="UserProfile-body">
        <section className="UserProfile-section">
          <h2>User ID</h2>
          <p className="UserProfile-userId">{user.id}</p>
        </section>

        <section className="UserProfile-section">
          <h2>Channel</h2>
          {channel ? (
            <p>
              <a 
                href={`/channel/${channel.channel_tag}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/channel/${channel.channel_tag}`);
                }}
              >
                View your channel (@{channel.channel_tag})
              </a>
            </p>
          ) : (
            <p>
              You don't have a channel yet.{" "}
              <a 
                href="/channel/create"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/channel/create');
                }}
              >
                Create a channel
              </a>
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
