import { DatabaseResponse } from './types';

export const fetchDatabase = async (): Promise<DatabaseResponse> => {
  try {
    const response = await fetch('http://localhost:8000/api/database');

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