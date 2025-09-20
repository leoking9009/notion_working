import { DatabaseResponse } from './types';

export const fetchDatabase = async (): Promise<DatabaseResponse> => {
  try {
    // 직접 Notion API 호출 (임시 해결책)
    const notionToken = import.meta.env.VITE_NOTION_TOKEN;
    const databaseId = import.meta.env.VITE_NOTION_DATABASE_ID;

    if (!notionToken || !databaseId) {
      throw new Error('Notion token or database ID is missing');
    }

    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching database:', error);
    throw error;
  }
};