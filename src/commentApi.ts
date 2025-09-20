import { API_BASE_URL } from './utils/api';

export interface Comment {
  id: string;
  content: string;
  author: string;
  createdAt: string;
  noticeId: string;
}

export interface CommentResponse {
  success: boolean;
  comments: Comment[];
}

export interface CreateCommentResponse {
  success: boolean;
  comment: Comment;
}

export const fetchComments = async (noticeId: string): Promise<CommentResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/.netlify/functions/comments/${noticeId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
};

export const createComment = async (commentData: {
  content: string;
  author: string;
  noticeId: string;
}): Promise<CreateCommentResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/.netlify/functions/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commentData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error;
  }
};

export const deleteComment = async (commentId: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/.netlify/functions/comments/${commentId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};