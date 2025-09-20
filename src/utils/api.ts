// API 베이스 URL 설정
const getApiBaseUrl = () => {
  // 프로덕션 환경에서는 현재 도메인을 사용, 개발 환경에서는 localhost 사용
  return import.meta.env.VITE_API_BASE_URL || (
    import.meta.env.PROD ? '' : 'http://localhost:8001'
  );
};

export const API_BASE_URL = getApiBaseUrl();

// API 호출을 위한 helper 함수들
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

export const get = (endpoint: string) => apiRequest(endpoint);

export const post = (endpoint: string, data: any) =>
  apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const patch = (endpoint: string, data: any) =>
  apiRequest(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const del = (endpoint: string) =>
  apiRequest(endpoint, {
    method: 'DELETE',
  });