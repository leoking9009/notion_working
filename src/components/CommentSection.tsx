import React, { useState, useEffect } from 'react';
import { fetchComments, createComment, deleteComment, Comment } from '../commentApi';

interface CommentSectionProps {
  noticeId: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ noticeId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [author, setAuthor] = useState('');
  const [loading, setLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(true);

  const loadComments = async () => {
    try {
      setCommentsLoading(true);
      const response = await fetchComments(noticeId);
      if (response.success) {
        setComments(response.comments);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setCommentsLoading(false);
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !author.trim()) return;

    try {
      setLoading(true);

      const response = await createComment({
        content: newComment.trim(),
        author: author.trim(),
        noticeId
      });

      if (response.success) {
        setComments(prevComments => [...prevComments, response.comment]);
        setNewComment('');
        setAuthor('');
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addComment();
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;

    try {
      await deleteComment(commentId);
      setComments(prevComments => prevComments.filter(comment => comment.id !== commentId));
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  useEffect(() => {
    loadComments();
  }, [noticeId]);

  return (
    <div className="comment-section">
      <h4 className="comment-section-title">댓글 ({comments.length})</h4>

      {/* 댓글 목록 */}
      <div className="comments-list">
        {commentsLoading ? (
          <div className="comments-loading">
            <p>댓글을 불러오는 중...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="no-comments">
            <p>첫 번째 댓글을 작성해보세요!</p>
          </div>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="comment-item">
              <div className="comment-header">
                <span className="comment-author">{comment.author}</span>
                <span className="comment-date">
                  {new Date(comment.createdAt).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div className="comment-content">
                {comment.content}
              </div>
              <div className="comment-actions">
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="comment-delete-button"
                >
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 댓글 작성 폼 */}
      <form onSubmit={handleSubmit} className="comment-form">
        <div className="comment-form-header">
          <h5>댓글 작성</h5>
        </div>

        <div className="comment-form-fields">
          <div className="comment-author-field">
            <input
              type="text"
              placeholder="작성자 이름"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              disabled={loading}
              className="comment-author-input"
            />
          </div>

          <div className="comment-content-field">
            <textarea
              placeholder="댓글을 입력하세요..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={loading}
              rows={3}
              className="comment-content-input"
            />
          </div>

          <div className="comment-form-actions">
            <button
              type="submit"
              disabled={loading || !newComment.trim() || !author.trim()}
              className="comment-submit-button"
            >
              {loading ? '등록 중...' : '댓글 등록'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};