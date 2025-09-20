import { DatabaseResponse } from './types';
import { API_BASE_URL } from './utils/api';

export const fetchDatabase = async (): Promise<DatabaseResponse> => {
  try {
    console.log('Fetching database from:', `${API_BASE_URL}/.netlify/functions/database`);

    const response = await fetch(`${API_BASE_URL}/.netlify/functions/database`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching database:', error);
    // Fallback: 빈 데이터 반환
    return {
      results: [],
      next_cursor: null,
      has_more: false
    };
  }
};