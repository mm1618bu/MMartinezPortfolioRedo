// src/front-end/components/CommentFeed.jsx
import { useState, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getCommentsForVideo, 
  addComment, 
  deleteComment, 
  updateComment,
  likeComment,
  getRepliesForComment,
  addReply,
  deleteReply,
  updateReply,
  likeReply,
  getChannelByTagForMention
} from "../utils/supabase";
import { debounce, rateLimit, preventDuplicateCalls } from "../utils/rateLimiting";
import { processMentionsAndNotify } from "../utils/mentionUtils";
import { notifyChannelMention } from "../utils/notificationAPI";
import CommentItem from "./CommentItem";
import MentionInput from "./MentionInput";
import "../../styles/main.css";

/**
 * Props:
 *  - videoId: string (required)
 */
export default function CommentFeed({ videoId }) {
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [userName, setUserName] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [replyingTo, setReplyingTo] = useState(null); // commentId being replied to
  const [replyText, setReplyText] = useState("");
  const [replyUserName, setReplyUserName] = useState("");
  const [expandedReplies, setExpandedReplies] = useState(new Set()); // Set of comment IDs with expanded replies
  const [sortBy, setSortBy] = useState('recent'); // 'recent' or 'top'
  const [editingComment, setEditingComment] = useState(null); // commentId being edited
  const [editCommentText, setEditCommentText] = useState("");
  const [editingReply, setEditingReply] = useState(null); // replyId being edited
  const [editReplyText, setEditReplyText] = useState("");

  // Fetch comments with caching
  const { data: comments = [], isLoading: loadingComments, error: commentsError } = useQuery({
    queryKey: ['comments', videoId],
    queryFn: () => getCommentsForVideo(videoId),
    enabled: !!videoId,
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: ({ videoId, userName, commentText }) => 
      addComment(videoId, userName, commentText),
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', videoId]);
      setNewComment("");
      setSubmitError("");
    },
    onError: (err) => {
      console.error("Error submitting comment:", err);
      setSubmitError(err.message || "Unable to post comment.");
    },
  });

  // Like comment mutation
  const likeCommentMutation = useMutation({
    mutationFn: (commentId) => likeComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', videoId]);
    },
    onError: (err) => {
      console.error("Error liking comment:", err);
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId) => deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', videoId]);
    },
    onError: (err) => {
      console.error("Error deleting comment:", err);
      alert("Failed to delete comment.");
    },
  });

  // Add reply mutation
  const addReplyMutation = useMutation({
    mutationFn: ({ commentId, videoId, userName, replyText }) => 
      addReply(commentId, videoId, userName, replyText),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['comments', videoId]);
      queryClient.invalidateQueries(['replies', variables.commentId]);
      setReplyText("");
      setReplyUserName("");
      setReplyingTo(null);
    },
    onError: (err) => {
      console.error("Error submitting reply:", err);
      alert("Unable to post reply.");
    },
  });

  // Delete reply mutation
  const deleteReplyMutation = useMutation({
    mutationFn: (replyId) => deleteReply(replyId),
    onSuccess: (data, replyId) => {
      queryClient.invalidateQueries(['comments', videoId]);
      queryClient.invalidateQueries(['replies']);
    },
    onError: (err) => {
      console.error("Error deleting reply:", err);
      alert("Failed to delete reply.");
    },
  });

  // Like reply mutation
  const likeReplyMutation = useMutation({
    mutationFn: (replyId) => likeReply(replyId),
    onSuccess: () => {
      queryClient.invalidateQueries(['replies']);
    },
    onError: (err) => {
      console.error("Error liking reply:", err);
    },
  });

  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: ({ commentId, commentText }) => updateComment(commentId, commentText),
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', videoId]);
      setEditingComment(null);
      setEditCommentText("");
    },
    onError: (err) => {
      console.error("Error updating comment:", err);
      alert("Failed to update comment.");
    },
  });

  // Update reply mutation
  const updateReplyMutation = useMutation({
    mutationFn: ({ replyId, replyText }) => updateReply(replyId, replyText),
    onSuccess: () => {
      queryClient.invalidateQueries(['replies']);
      setEditingReply(null);
      setEditReplyText("");
    },
    onError: (err) => {
      console.error("Error updating reply:", err);
      alert("Failed to update reply.");
    },
  });

  // Rate-limited comment submission (max 5 per minute)
  const rateLimitedSubmit = useCallback(
    rateLimit((data) => {
      addCommentMutation.mutate(data);
    }, 5, 60000), // 5 comments per 60 seconds
    [addCommentMutation]
  );

  // Prevent duplicate submissions while request is pending
  const guardedSubmit = useCallback(
    preventDuplicateCalls(async (data) => {
      rateLimitedSubmit(data);
    }),
    [rateLimitedSubmit]
  );

  async function handleSubmit(e) {
    e.preventDefault();
    if (!newComment.trim() || !userName.trim()) return;

    const commentText = newComment.trim();

    try {
      // Submit comment
      await guardedSubmit({
        videoId,
        userName: userName.trim(),
        commentText,
      });

      // Process mentions and send notifications asynchronously
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.id) {
        processMentionsAndNotify(
          commentText,
          videoId,
          user.id,
          getChannelByTagForMention,
          notifyChannelMention
        ).catch(err => {
          console.error('Error processing mentions:', err);
          // Don't block comment submission if mention notifications fail
        });
      }
    } catch (error) {
      setSubmitError(error.message);
    }
  }

  // Debounced like handler to prevent spam clicks
  const debouncedLike = useCallback(
    debounce((commentId) => {
      likeCommentMutation.mutate(commentId);
    }, 500), // 500ms debounce
    [likeCommentMutation]
  );

  async function handleLikeComment(commentId) {
    debouncedLike(commentId);
  }

  async function handleDeleteComment(commentId) {
    if (!window.confirm("Delete this comment?")) return;
    deleteCommentMutation.mutate(commentId);
  }

  function handleReplyClick(commentId) {
    setReplyingTo(commentId);
    // Expand replies when starting to reply
    setExpandedReplies(prev => new Set(prev).add(commentId));
  }

  function handleCancelReply() {
    setReplyingTo(null);
    setReplyText("");
    setReplyUserName("");
  }

  async function handleSubmitReply(e, commentId) {
    e.preventDefault();
    if (!replyText.trim() || !replyUserName.trim()) return;

    const trimmedReplyText = replyText.trim();

    addReplyMutation.mutate({
      commentId,
      videoId,
      userName: replyUserName.trim(),
      replyText: trimmedReplyText,
    });

    // Process mentions in reply
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.id) {
      processMentionsAndNotify(
        trimmedReplyText,
        videoId,
        user.id,
        getChannelByTagForMention,
        notifyChannelMention
      ).catch(err => {
        console.error('Error processing mentions in reply:', err);
      });
    }
  }

  function toggleReplies(commentId) {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  }

  async function handleDeleteReply(replyId) {
    if (!window.confirm("Delete this reply?")) return;
    deleteReplyMutation.mutate(replyId);
  }

  const debouncedLikeReply = useCallback(
    debounce((replyId) => {
      likeReplyMutation.mutate(replyId);
    }, 500),
    [likeReplyMutation]
  );

  async function handleLikeReply(replyId) {
    debouncedLikeReply(replyId);
  }

  function handleEditComment(comment) {
    setEditingComment(comment.id);
    setEditCommentText(comment.comment_text);
  }

  function handleCancelEditComment() {
    setEditingComment(null);
    setEditCommentText("");
  }

  function handleSaveEditComment(commentId) {
    if (!editCommentText.trim()) return;
    updateCommentMutation.mutate({ commentId, commentText: editCommentText.trim() });
  }

  function handleEditReply(reply) {
    setEditingReply(reply.id);
    setEditReplyText(reply.reply_text);
  }

  function handleCancelEditReply() {
    setEditingReply(null);
    setEditReplyText("");
  }

  function handleSaveEditReply(replyId) {
    if (!editReplyText.trim()) return;
    updateReplyMutation.mutate({ replyId, replyText: editReplyText.trim() });
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

  // Sort comments based on selected criteria
  const sortedComments = [...(comments || [])].sort((a, b) => {
    if (sortBy === 'top') {
      // Sort by likes (descending)
      return (b.likes || 0) - (a.likes || 0);
    } else {
      // Sort by date (most recent first)
      return new Date(b.created_at) - new Date(a.created_at);
    }
  });

  return (
    <div className="CommentsSection">
      <h3 className="CommentsSection-title">
        Comments ({comments?.length || 0})
      </h3>

      {/* Sort buttons */}
      <div className="CommentsSection-sort">
        <button
          className={`CommentsSection-sortBtn ${sortBy === 'top' ? 'active' : ''}`}
          onClick={() => setSortBy('top')}
        >
          Top
        </button>
        <button
          className={`CommentsSection-sortBtn ${sortBy === 'recent' ? 'active' : ''}`}
          onClick={() => setSortBy('recent')}
        >
          Recent
        </button>
      </div>

      {/* New comment form */
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
              disabled={addCommentMutation.isPending || !newComment.trim() || !userName.trim()}
              className="CommentsSection-button"
            >
              {addCommentMutation.isPending ? "Posting..." : "Comment"}
            </button>
          </div>
        </form>
      </div>}

      {/* Comments list */}
      <div className="CommentsSection-list">
        {loadingComments && <p>Loading comments...</p>}
        {commentsError && (
          <p className="Error-Text CommentsSection-error">{commentsError}</p>
        )}

        {!loadingComments && !commentsError && comments.length === 0 && (
          <p className="CommentsSection-empty">No comments yet. Be the first!</p>
        )}

        {sortedComments.map((c) => (
          <CommentItem
            key={c.id}
            comment={c}
            videoId={videoId}
            expandedReplies={expandedReplies}
            replyingTo={replyingTo}
            replyText={replyText}
            replyUserName={replyUserName}
            editingComment={editingComment}
            editCommentText={editCommentText}
            editingReply={editingReply}
            editReplyText={editReplyText}
            onLikeComment={handleLikeComment}
            onDeleteComment={handleDeleteComment}
            onEditComment={handleEditComment}
            onCancelEditComment={handleCancelEditComment}
            onSaveEditComment={handleSaveEditComment}
            onReplyClick={handleReplyClick}
            onCancelReply={handleCancelReply}
            onSubmitReply={handleSubmitReply}
            onToggleReplies={toggleReplies}
            onLikeReply={handleLikeReply}
            onDeleteReply={handleDeleteReply}
            onEditReply={handleEditReply}
            onCancelEditReply={handleCancelEditReply}
            onSaveEditReply={handleSaveEditReply}
            setReplyText={setReplyText}
            setReplyUserName={setReplyUserName}
            setEditCommentText={setEditCommentText}
            setEditReplyText={setEditReplyText}
            getTimeAgo={getTimeAgo}
            addReplyMutation={addReplyMutation}
            updateCommentMutation={updateCommentMutation}
            updateReplyMutation={updateReplyMutation}
          />
        ))}
      </div>
    </div>
  );
}
