import React, { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const { signInWithGoogle, signInAsTestUser } = useAuth();
  const googleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.google && googleButtonRef.current) {
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
      });
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

              <div className="test-signin-section">
                <p className="test-signin-label">테스트 로그인 (OAuth 문제 해결용)</p>
                <div className="test-signin-buttons">
                  <button
                    onClick={() => signInAsTestUser('user')}
                    className="test-signin-button user"
                  >
                    일반 사용자로 로그인
                  </button>
                  <button
                    onClick={() => signInAsTestUser('admin')}
                    className="test-signin-button admin"
                  >
                    관리자로 로그인
                  </button>
                </div>
              </div>
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