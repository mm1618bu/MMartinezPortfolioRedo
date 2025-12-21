import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getRepliesForComment } from '../utils/supabase';
import MentionText from './MentionText';

export default function CommentItem({ 
  comment, 
  videoId,
  expandedReplies,
  replyingTo,
  replyText,
  replyUserName,
  editingComment,
  editCommentText,
  editingReply,
  editReplyText,
  onLikeComment,
  onDeleteComment,
  onEditComment,
  onCancelEditComment,
  onSaveEditComment,
  onReplyClick,
  onCancelReply,
  onSubmitReply,
  onToggleReplies,
  onLikeReply,
  onDeleteReply,
  onEditReply,
  onCancelEditReply,
  onSaveEditReply,
  setReplyText,
  setReplyUserName,
  setEditCommentText,
  setEditReplyText,
  getTimeAgo,
  addReplyMutation,
  updateCommentMutation,
  updateReplyMutation
}) {
  const isExpanded = expandedReplies.has(comment.id);
  const isReplying = replyingTo === comment.id;
  const isEditingComment = editingComment === comment.id;

  // Fetch replies when expanded
  const { data: replies = [], isLoading: loadingReplies } = useQuery({
    queryKey: ['replies', comment.id],
    queryFn: () => getRepliesForComment(comment.id),
    enabled: isExpanded,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="CommentsSection-item">
      <div className="CommentsSection-itemHeader">
        <span className="CommentsSection-author">
          {comment.user_name || "Anonymous"}
        </span>
        {comment.created_at && (
          <span className="CommentsSection-date">
            {getTimeAgo(comment.created_at)}
          </span>
        )}
      </div>
      
      {isEditingComment ? (
        <div className="CommentsSection-editForm">
          <textarea
            className="CommentsSection-editTextarea"
            value={editCommentText}
            onChange={(e) => setEditCommentText(e.target.value)}
            rows={3}
            autoFocus
          />
          <div className="CommentsSection-editActions">
            <button
              type="button"
              onClick={onCancelEditComment}
              className="CommentsSection-cancelButton"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSaveEditComment(comment.id)}
              disabled={updateCommentMutation.isPending || !editCommentText.trim()}
              className="CommentsSection-button"
            >
              {updateCommentMutation.isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <p className="CommentsSection-text">
          <MentionText text={comment.comment_text} />
        </p>
      )}
      
      <div className="CommentsSection-itemActions">
        <button
          onClick={() => onLikeComment(comment.id)}
          className="CommentsSection-likeButton"
        >
          👍 {comment.likes || 0}
        </button>
        <button
          onClick={() => onReplyClick(comment.id)}
          className="CommentsSection-replyButton"
        >
          💬 Reply
        </button>
        {!isEditingComment && (
          <button
            onClick={() => onEditComment(comment)}
            className="CommentsSection-editButton"
          >
            ✏️ Edit
          </button>
        )}
        <button
          onClick={() => onDeleteComment(comment.id)}
          className="CommentsSection-deleteButton"
        >
          Delete
        </button>
      </div>

      {/* Show/Hide Replies Toggle */}
      {(comment.reply_count > 0 || isExpanded) && (
        <button
          onClick={() => onToggleReplies(comment.id)}
          className="CommentsSection-toggleReplies"
        >
          {isExpanded ? '▼' : '▶'} {comment.reply_count || 0} {comment.reply_count === 1 ? 'reply' : 'replies'}
        </button>
      )}

      {/* Reply Form */}
      {isReplying && (
        <div className="CommentsSection-replyForm">
          <form onSubmit={(e) => onSubmitReply(e, comment.id)}>
            <input
              type="text"
              className="CommentsSection-replyNameInput"
              placeholder="Your name..."
              value={replyUserName}
              onChange={(e) => setReplyUserName(e.target.value)}
              required
            />
            <textarea
              className="CommentsSection-replyTextarea"
              placeholder="Write a reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={2}
              required
              autoFocus
            />
            <div className="CommentsSection-replyActions">
              <button
                type="button"
                onClick={onCancelReply}
                className="CommentsSection-cancelButton"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addReplyMutation.isPending || !replyText.trim() || !replyUserName.trim()}
                className="CommentsSection-button"
              >
                {addReplyMutation.isPending ? "Posting..." : "Reply"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Replies List */}
      {isExpanded && (
        <div className="CommentsSection-repliesList">
          {loadingReplies && <p className="CommentsSection-repliesLoading">Loading replies...</p>}
          {!loadingReplies && replies.length === 0 && (
            <p className="CommentsSection-noReplies">No replies yet.</p>
          )}
          {replies.map((reply) => {
            const isEditingThisReply = editingReply === reply.id;
            
            return (
              <div key={reply.id} className="CommentsSection-reply">
                <div className="CommentsSection-replyHeader">
                  <span className="CommentsSection-replyAuthor">
                    {reply.user_name || "Anonymous"}
                  </span>
                  {reply.created_at && (
                    <span className="CommentsSection-replyDate">
                      {getTimeAgo(reply.created_at)}
                    </span>
                  )}
                </div>
                
                {isEditingThisReply ? (
                  <div className="CommentsSection-editForm">
                    <textarea
                      className="CommentsSection-editTextarea"
                      value={editReplyText}
                      onChange={(e) => setEditReplyText(e.target.value)}
                      rows={2}
                      autoFocus
                    />
                    <div className="CommentsSection-editActions">
                      <button
                        type="button"
                        onClick={onCancelEditReply}
                        className="CommentsSection-cancelButton"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => onSaveEditReply(reply.id)}
                        disabled={updateReplyMutation.isPending || !editReplyText.trim()}
                        className="CommentsSection-button"
                      >
                        {updateReplyMutation.isPending ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="CommentsSection-replyText">
                    <MentionText text={reply.reply_text} />
                  </p>
                )}
                
                <div className="CommentsSection-replyActions">
                  <button
                    onClick={() => onLikeReply(reply.id)}
                    className="CommentsSection-likeButton"
                  >
                    👍 {reply.likes || 0}
                  </button>
                  {!isEditingThisReply && (
                    <button
                      onClick={() => onEditReply(reply)}
                      className="CommentsSection-editButton"
                    >
                      ✏️ Edit
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteReply(reply.id)}
                    className="CommentsSection-deleteButton"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
