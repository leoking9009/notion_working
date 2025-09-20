import React, { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  const googleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeGoogleButton = () => {
      if (window.google && googleButtonRef.current) {
        try {
          window.google.accounts.id.renderButton(googleButtonRef.current, {
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: '100%',
          });
        } catch (error) {
          console.error('Failed to render Google button:', error);
        }
      }
    };

    // Google Sign-In API가 로드되기까지 대기
    if (window.google) {
      initializeGoogleButton();
    } else {
      const checkGoogle = setInterval(() => {
        if (window.google) {
          clearInterval(checkGoogle);
          initializeGoogleButton();
        }
      }, 100);

      // 10초 후 타임아웃
      setTimeout(() => {
        clearInterval(checkGoogle);
      }, 10000);
    }
  }, []);

  const handleManualSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>자격기획팀 과제 관리 시스템</h1>
          <p>Google 계정으로 로그인하여 과제를 관리하세요</p>
        </div>

        <div className="login-content">
          <div className="login-card">
            <h2>로그인</h2>
            <p>팀원만 접근 가능합니다</p>

            <div className="google-signin-container">
              <div ref={googleButtonRef} className="google-signin-button"></div>

              <button
                onClick={handleManualSignIn}
                className="manual-signin-button"
              >
                Google로 로그인
              </button>
            </div>
          </div>
        </div>

        <div className="login-footer">
          <p>© 2024 자격기획팀. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};