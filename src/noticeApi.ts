export interface NoticeData {
  id: string;
  title: string;
  content: string;
  author: string;
  type: 'important' | 'general';
  date: string;
}

export interface NoticeResponse {
  results: any[];
  next_cursor?: string;
  has_more: boolean;
}

export const fetchNotices = async (): Promise<NoticeResponse> => {
  try {
    const response = await fetch('http://localhost:8001/api/notices');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching notices:', error);
    throw error;
  }
};

export const createNotice = async (noticeData: {
  title: string;
  content: string;
  author: string;
  type: 'important' | 'general';
}): Promise<any> => {
  try {
    const response = await fetch('http://localhost:8001/api/notices', {
      method: 'POST',
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
    const response = await fetch(`http://localhost:8001/api/notices/${noticeId}`, {
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
    const response = await fetch(`http://localhost:8001/api/notices/${noticeId}`, {
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