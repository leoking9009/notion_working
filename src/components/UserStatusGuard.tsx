import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface UserStatusGuardProps {
  children: React.ReactNode;
}

export const UserStatusGuard: React.FC<UserStatusGuardProps> = ({ children }) => {
  const { user, signOut } = useAuth();

  if (!user) {
    return null; // 이미 로그인 페이지에서 처리됨
  }

  if (user.status === 'pending' || user.status === '대기중') {
    return (
      <div className="status-pending-screen">
        <div className="status-container">
          <div className="status-icon">⏳</div>
          <h1>가입 승인 대기 중</h1>
          <div className="status-message">
            <p>안녕하세요, <strong>{user.name}</strong>님!</p>
            <p>회원가입이 완료되었습니다.</p>
            <p>관리자의 승인을 기다리고 있습니다.</p>
            <p>승인이 완료되면 시스템을 이용하실 수 있습니다.</p>
          </div>
          <div className="status-info">
            <div className="info-item">
              <span className="info-label">이메일:</span>
              <span className="info-value">{user.email}</span>
            </div>
            <div className="info-item">
              <span className="info-label">상태:</span>
              <span className="status-badge status-pending">승인 대기</span>
            </div>
          </div>
          <div className="status-actions">
            <p className="help-text">
              승인이 지연되는 경우 관리자에게 문의해 주세요.
            </p>
            <div className="status-buttons">
              <button onClick={signOut} className="back-to-login-button">
                로그인 페이지로 돌아가기
              </button>
              <button onClick={signOut} className="signout-button">
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (user.status === 'rejected' || user.status === '거부됨') {
    return (
      <div className="status-rejected-screen">
        <div className="status-container">
          <div className="status-icon">❌</div>
          <h1>접근이 거부되었습니다</h1>
          <div className="status-message">
            <p>안녕하세요, <strong>{user.name}</strong>님!</p>
            <p>시스템 사용 신청이 거부되었습니다.</p>
            <p>접근 권한에 대한 문의는 관리자에게 연락해 주세요.</p>
          </div>
          <div className="status-info">
            <div className="info-item">
              <span className="info-label">이메일:</span>
              <span className="info-value">{user.email}</span>
            </div>
            <div className="info-item">
              <span className="info-label">상태:</span>
              <span className="status-badge status-rejected">접근 거부</span>
            </div>
          </div>
          <div className="status-actions">
            <p className="help-text">
              이의가 있으시면 관리자에게 문의해 주세요.
            </p>
            <div className="status-buttons">
              <button onClick={signOut} className="back-to-login-button">
                로그인 페이지로 돌아가기
              </button>
              <button onClick={signOut} className="signout-button">
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 승인된 사용자만 자식 컴포넌트 렌더링 (approved 또는 승인됨 상태만 허용)
  if (user.status === 'approved' || user.status === '승인됨') {
    return <>{children}</>;
  }

  // 알 수 없는 상태의 경우 대기 화면 표시
  return (
    <div className="status-pending-screen">
      <div className="status-container">
        <div className="status-icon">⏳</div>
        <h1>사용자 상태 확인 중</h1>
        <div className="status-message">
          <p>안녕하세요, <strong>{user.name}</strong>님!</p>
          <p>사용자 상태를 확인하고 있습니다.</p>
          <p>잠시만 기다려 주세요.</p>
        </div>
        <div className="status-info">
          <div className="info-item">
            <span className="info-label">현재 상태:</span>
            <span className="info-value">{user.status || '확인 중'}</span>
          </div>
        </div>
        <div className="status-actions">
          <div className="status-buttons">
            <button onClick={signOut} className="back-to-login-button">
              로그인 페이지로 돌아가기
            </button>
            <button onClick={signOut} className="signout-button">
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};