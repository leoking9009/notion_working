import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface User {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  role: string;
  status: 'pending' | 'approved' | 'rejected';
  joinDate: string;
}

interface AdminDashboardProps {
  onBack: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const { signOut } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:8001/api/users');

      if (!response.ok) {
        throw new Error(`사용자 목록을 불러올 수 없습니다: ${response.status}`);
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (userId: string, status: 'approved' | 'rejected', role?: string) => {
    try {
      const response = await fetch(`http://localhost:8001/api/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          role: role || '사용자',
        }),
      });

      if (!response.ok) {
        throw new Error(`사용자 상태 업데이트 실패: ${response.status}`);
      }

      await loadUsers(); // 목록 새로고침
    } catch (err) {
      setError(err instanceof Error ? err.message : '사용자 상태 업데이트 중 오류가 발생했습니다.');
      console.error('Failed to update user status:', err);
    }
  };

  const handleApprove = (user: User) => {
    if (confirm(`${user.name}님의 가입을 승인하시겠습니까?`)) {
      updateUserStatus(user.id, 'approved', '사용자');
    }
  };

  const handleReject = (user: User) => {
    if (confirm(`${user.name}님의 가입을 거부하시겠습니까?`)) {
      updateUserStatus(user.id, 'rejected');
    }
  };

  const handleRoleChange = (user: User, newRole: string) => {
    if (confirm(`${user.name}님의 역할을 ${newRole}로 변경하시겠습니까?`)) {
      updateUserStatus(user.id, user.status, newRole);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { text: '대기중', className: 'status-pending' },
      approved: { text: '승인됨', className: 'status-approved' },
      rejected: { text: '거부됨', className: 'status-rejected' },
    };

    const badge = badges[status as keyof typeof badges] || { text: status, className: 'status-unknown' };

    return (
      <span className={`status-badge ${badge.className}`}>
        {badge.text}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const pendingUsers = users.filter(user => user.status === 'pending');
  const approvedUsers = users.filter(user => user.status === 'approved');
  const rejectedUsers = users.filter(user => user.status === 'rejected');

  useEffect(() => {
    loadUsers();
  }, []);

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="dashboard-header">
          <button onClick={onBack} className="back-button">
            ← 돌아가기
          </button>
          <h1>사용자 관리</h1>
        </div>
        <div className="loading">
          <p>사용자 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="dashboard-header">
          <button onClick={onBack} className="back-button">
            ← 돌아가기
          </button>
          <h1>사용자 관리</h1>
        </div>
        <div className="error">
          <p>오류: {error}</p>
          <button onClick={loadUsers} className="retry-button">
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <button onClick={onBack} className="back-button">
          ← 돌아가기
        </button>
        <h1>사용자 관리</h1>
        <div className="header-buttons">
          <button onClick={loadUsers} className="refresh-button" disabled={loading}>
            {loading ? '새로고침 중...' : '새로고침'}
          </button>
          <button onClick={signOut} className="signout-button">
            로그아웃
          </button>
        </div>
      </div>

      <div className="user-stats">
        <div className="stat-card">
          <h3>가입 대기</h3>
          <span className="stat-number">{pendingUsers.length}</span>
        </div>
        <div className="stat-card">
          <h3>승인된 사용자</h3>
          <span className="stat-number">{approvedUsers.length}</span>
        </div>
        <div className="stat-card">
          <h3>거부된 사용자</h3>
          <span className="stat-number">{rejectedUsers.length}</span>
        </div>
        <div className="stat-card">
          <h3>전체 사용자</h3>
          <span className="stat-number">{users.length}</span>
        </div>
      </div>

      {pendingUsers.length > 0 && (
        <div className="user-section">
          <h2>가입 대기 중인 사용자</h2>
          <div className="user-table">
            <div className="user-table-header">
              <span>사용자</span>
              <span>이메일</span>
              <span>가입일</span>
              <span>상태</span>
              <span>작업</span>
            </div>
            {pendingUsers.map(user => (
              <div key={user.id} className="user-table-row">
                <div className="user-info">
                  {user.profilePicture && (
                    <img src={user.profilePicture} alt={user.name} className="user-avatar" />
                  )}
                  <span className="user-name">{user.name}</span>
                </div>
                <span className="user-email">{user.email}</span>
                <span className="user-date">{formatDate(user.joinDate)}</span>
                <span className="user-status">{getStatusBadge(user.status)}</span>
                <div className="user-actions">
                  <button
                    onClick={() => handleApprove(user)}
                    className="approve-button"
                  >
                    승인
                  </button>
                  <button
                    onClick={() => handleReject(user)}
                    className="reject-button"
                  >
                    거부
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {approvedUsers.length > 0 && (
        <div className="user-section">
          <h2>승인된 사용자</h2>
          <div className="user-table">
            <div className="user-table-header">
              <span>사용자</span>
              <span>이메일</span>
              <span>역할</span>
              <span>가입일</span>
              <span>상태</span>
              <span>작업</span>
            </div>
            {approvedUsers.map(user => (
              <div key={user.id} className="user-table-row">
                <div className="user-info">
                  {user.profilePicture && (
                    <img src={user.profilePicture} alt={user.name} className="user-avatar" />
                  )}
                  <span className="user-name">{user.name}</span>
                </div>
                <span className="user-email">{user.email}</span>
                <div className="user-role">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user, e.target.value)}
                    className="role-select"
                  >
                    <option value="사용자">사용자</option>
                    <option value="관리자">관리자</option>
                    <option value="팀장">팀장</option>
                  </select>
                </div>
                <span className="user-date">{formatDate(user.joinDate)}</span>
                <span className="user-status">{getStatusBadge(user.status)}</span>
                <div className="user-actions">
                  <button
                    onClick={() => handleReject(user)}
                    className="reject-button"
                  >
                    비활성화
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {rejectedUsers.length > 0 && (
        <div className="user-section">
          <h2>거부된 사용자</h2>
          <div className="user-table">
            <div className="user-table-header">
              <span>사용자</span>
              <span>이메일</span>
              <span>가입일</span>
              <span>상태</span>
              <span>작업</span>
            </div>
            {rejectedUsers.map(user => (
              <div key={user.id} className="user-table-row">
                <div className="user-info">
                  {user.profilePicture && (
                    <img src={user.profilePicture} alt={user.name} className="user-avatar" />
                  )}
                  <span className="user-name">{user.name}</span>
                </div>
                <span className="user-email">{user.email}</span>
                <span className="user-date">{formatDate(user.joinDate)}</span>
                <span className="user-status">{getStatusBadge(user.status)}</span>
                <div className="user-actions">
                  <button
                    onClick={() => handleApprove(user)}
                    className="approve-button"
                  >
                    재승인
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};