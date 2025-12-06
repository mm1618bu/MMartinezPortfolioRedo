// src/front-end/components/UserProfilePage.jsx
import { useEffect, useState } from "react";
import { supabase } from "../utils/supabase";
import "../../styles/main.css";

/**
 * Simple user profile component using Supabase auth
 */
export default function UserProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function loadUser() {
      setLoading(true);
      setErrorMsg("");

      try {
        // Get current user from Supabase
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) throw error;
        
        setUser(user);
      } catch (err) {
        console.error("Error fetching user:", err);
        setErrorMsg(err.message || "Unable to load user profile.");
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

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
          <p>
            <a href="/channel">View your channel</a>
          </p>
        </section>
      </div>
    </div>
  );
}
