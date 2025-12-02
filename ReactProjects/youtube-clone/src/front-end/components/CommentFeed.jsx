// src/front-end/components/CommentFeed.jsx
import { useEffect, useState } from "react";
import { getCommentsForVideo, addComment, deleteComment, likeComment } from "../utils/supabase";
import "../../styles/main.css";

/**
 * Props:
 *  - videoId: string (required)
 */
export default function CommentFeed({ videoId }) {
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentsError, setCommentsError] = useState("");

  const [newComment, setNewComment] = useState("");
  const [userName, setUserName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Load comments when videoId changes
  useEffect(() => {
    if (!videoId) return;

    async function fetchComments() {
      setLoadingComments(true);
      setCommentsError("");

      try {
        const data = await getCommentsForVideo(videoId);
        setComments(data || []);
      } catch (err) {
        console.error("Error fetching comments:", err);
        setCommentsError("Unable to load comments right now.");
      } finally {
        setLoadingComments(false);
      }
    }

    fetchComments();
  }, [videoId]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!newComment.trim() || !userName.trim()) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      const created = await addComment(videoId, userName.trim(), newComment.trim());

      // Add to top of list
      setComments((prev) => [created, ...prev]);
      setNewComment("");
      // Don't clear userName so user doesn't have to retype it
    } catch (err) {
      console.error("Error submitting comment:", err);
      setSubmitError(err.message || "Unable to post comment.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLikeComment(commentId) {
    try {
      const updated = await likeComment(commentId);
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? updated : c))
      );
    } catch (err) {
      console.error("Error liking comment:", err);
    }
  }

  async function handleDeleteComment(commentId) {
    if (!window.confirm("Delete this comment?")) return;

    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error("Error deleting comment:", err);
      alert("Failed to delete comment.");
    }
  }

  function getTimeAgo(timestamp) {
    const now = new Date();
    const created = new Date(timestamp);
    const diffMs = now - created;
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return "just now";
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return created.toLocaleDateString();
  }

  return (
    <div className="CommentsSection">
      <h3 className="CommentsSection-title">
        Comments ({comments?.length || 0})
      </h3>

      {/* New comment form */}
      <div className="CommentsSection-new">
        <form onSubmit={handleSubmit} className="CommentsSection-form">
          <input
            type="text"
            className="CommentsSection-nameInput"
            placeholder="Your name..."
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            required
          />
          <textarea
            className="CommentsSection-textarea"
            placeholder="Add a public comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            required
          />
          <div className="CommentsSection-actions">
            {submitError && (
              <span className="Error-Text CommentsSection-error">
                {submitError}
              </span>
            )}
            <button
              type="submit"
              disabled={submitting || !newComment.trim() || !userName.trim()}
              className="CommentsSection-button"
            >
              {submitting ? "Posting..." : "Comment"}
            </button>
          </div>
        </form>
      </div>

      {/* Comments list */}
      <div className="CommentsSection-list">
        {loadingComments && <p>Loading comments...</p>}
        {commentsError && (
          <p className="Error-Text CommentsSection-error">{commentsError}</p>
        )}

        {!loadingComments && !commentsError && comments.length === 0 && (
          <p className="CommentsSection-empty">No comments yet. Be the first!</p>
        )}

        {comments.map((c) => (
          <div key={c.id} className="CommentsSection-item">
            <div className="CommentsSection-itemHeader">
              <span className="CommentsSection-author">
                {c.user_name || "Anonymous"}
              </span>
              {c.created_at && (
                <span className="CommentsSection-date">
                  {getTimeAgo(c.created_at)}
                </span>
              )}
            </div>
            <p className="CommentsSection-text">{c.comment_text}</p>
            <div className="CommentsSection-itemActions">
              <button
                onClick={() => handleLikeComment(c.id)}
                className="CommentsSection-likeButton"
              >
                👍 {c.likes || 0}
              </button>
              <button
                onClick={() => handleDeleteComment(c.id)}
                className="CommentsSection-deleteButton"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
