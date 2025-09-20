import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
  role?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  checkUserStatus: (user: User) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeGoogleAuth = () => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google) {
          window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
          });

          // 자동 로그인 시도
          window.google.accounts.id.prompt((notification: any) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              // 자동 로그인 실패 시 로딩 상태 해제
              setIsLoading(false);
            }
          });
        }
      };
      document.head.appendChild(script);
    };

    initializeGoogleAuth();

    // 페이지 새로고침 시 저장된 사용자 정보 복원
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const handleCredentialResponse = async (response: any) => {
    try {
      setIsLoading(true);
      // JWT 토큰 디코딩
      const payload = JSON.parse(atob(response.credential.split('.')[1]));

      const userData: User = {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
      };

      // 사용자 등록 및 상태 확인
      const registeredUser = await checkUserStatus(userData);

      setUser(registeredUser);
      localStorage.setItem('user', JSON.stringify(registeredUser));
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to process Google credential:', error);
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.google) {
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isDisplayed()) {
            resolve();
          } else {
            reject(new Error('Google Sign-In was not displayed'));
          }
        });
      } else {
        reject(new Error('Google Sign-In not initialized'));
      }
    });
  };

  const signOut = async (): Promise<void> => {
    setUser(null);
    localStorage.removeItem('user');
    if (window.google) {
      window.google.accounts.id.disableAutoSelect();
    }
  };

  const checkUserStatus = async (user: User): Promise<User> => {
    try {
      // 사용자 등록 요청
      const registerResponse = await fetch('http://localhost:8001/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          googleId: user.id,
          name: user.name,
          email: user.email,
          profilePicture: user.picture,
        }),
      });

      if (registerResponse.ok) {
        const registerData = await registerResponse.json();
        return {
          ...user,
          role: registerData.user.role,
          status: registerData.user.status,
        };
      }

      // 등록이 실패한 경우, 기존 사용자 정보 조회
      const usersResponse = await fetch('http://localhost:8001/api/users');
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        const existingUser = usersData.users.find((u: any) => u.googleId === user.id);

        if (existingUser) {
          return {
            ...user,
            role: existingUser.role,
            status: existingUser.status,
          };
        }
      }

      // 기본값 반환 (새 사용자, 대기 상태)
      return {
        ...user,
        role: '사용자',
        status: 'pending',
      };
    } catch (error) {
      console.error('Failed to check user status:', error);
      // 오류 발생 시 기본값 반환
      return {
        ...user,
        role: '사용자',
        status: 'pending',
      };
    }
  };


  const value: AuthContextType = {
    user,
    isLoading,
    signInWithGoogle,
    signOut,
    checkUserStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Google Sign-In API 타입 정의
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}