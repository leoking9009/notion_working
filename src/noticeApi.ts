import { API_BASE_URL } from './utils/api';

export interface NoticeData {
  id: string;
  title: string;
  content: string;
  author: string;
  type: 'important' | 'general';
  date: string;
}

export interface NoticeResponse {
  notices: any[];
}

export const fetchNotices = async (): Promise<NoticeResponse> => {
  try {
    console.log('Fetching notices from:', `${API_BASE_URL}/.netlify/functions/notices`);

    const response = await fetch(`${API_BASE_URL}/.netlify/functions/notices`);

    console.log('Fetch notices response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Fetch notices error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
    }

    const data = await response.json();
    console.log('Fetch notices success:', data);
    return data;
  } catch (error) {
    console.error('Error fetching notices:', error);
    // 실패 시 빈 배열 반환
    return { notices: [] };
  }
};

export const createNotice = async (noticeData: {
  title: string;
  content: string;
  author: string;
  type: 'important' | 'general';
}): Promise<any> => {
  try {
    const requestData = {
      title: noticeData.title,
      content: noticeData.content,
      author: noticeData.author,
      type: noticeData.type,
      isImportant: noticeData.type === 'important'
    };

    console.log('Creating notice with data:', requestData);

    const response = await fetch(`${API_BASE_URL}/.netlify/functions/notices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    console.log('Notice creation response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Notice creation error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
    }

    const data = await response.json();
    console.log('Notice creation success:', data);
    return data;
  } catch (error) {
    console.error('Error creating notice:', error);
    throw error;
  }
};

export const updateNotice = async (
  noticeId: string,
  noticeData: Partial<{
    title: string;
    content: string;
    author: string;
    type: 'important' | 'general';
  }>
): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/.netlify/functions/notices/${noticeId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(noticeData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating notice:', error);
    throw error;
  }
};

export const deleteNotice = async (noticeId: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/.netlify/functions/notices/${noticeId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting notice:', error);
    throw error;
  }
};