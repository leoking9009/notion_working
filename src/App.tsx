import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { FilteredTaskView } from './components/FilteredTaskView';
import { DatabaseTable } from './components/DatabaseTable';
import { TaskForm, TaskFormData } from './components/TaskForm';
import { NoticeListView } from './components/NoticeListView';
import { LoginPage } from './components/LoginPage';
import { AdminDashboard } from './components/AdminDashboard';
import { UserStatusGuard } from './components/UserStatusGuard';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { fetchDatabase } from './notion';
import { NotionPage } from './types';
import { API_BASE_URL } from './utils/api';
import './App.css';

const AuthenticatedApp: React.FC = () => {
  const { user, signOut } = useAuth();
  const [pages, setPages] = useState<NotionPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<NotionPage | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [currentView, setCurrentView] = useState<string>('dashboard');

  const loadDatabase = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchDatabase();
      setPages(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      console.error('Failed to load database:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setShowForm(true);
  };

  const handleEditTask = (task: NotionPage) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleFormSubmit = async (taskData: TaskFormData) => {
    try {
      setFormLoading(true);

      if (editingTask) {
        // 수정
        const response = await fetch(`${API_BASE_URL}/.netlify/functions/tasks/${editingTask.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            assignee: taskData.담당자,
            taskName: taskData.과제명,
            deadline: taskData.마감일,
            completed: taskData.완료,
            urgent: taskData.긴급,
            submissionTo: taskData.제출처,
            notes: taskData.비고
          }),
        });

        if (!response.ok) {
          throw new Error(`수정 실패: ${response.status}`);
        }
      } else {
        // 생성
        const response = await fetch(`${API_BASE_URL}/.netlify/functions/tasks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            assignee: taskData.담당자,
            taskName: taskData.과제명,
            deadline: taskData.마감일,
            completed: taskData.완료,
            urgent: taskData.긴급,
            submissionTo: taskData.제출처,
            notes: taskData.비고
          }),
        });

        if (!response.ok) {
          throw new Error(`등록 실패: ${response.status}`);
        }
      }

      setShowForm(false);
      setEditingTask(null);
      await loadDatabase(); // 목록 새로고침
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.');
      console.error('Failed to save task:', err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  const handleDeleteTask = async (task: NotionPage) => {
    if (!confirm(`"${task.properties.과제명?.rich_text?.[0]?.plain_text || '제목 없음'}" 과제를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/.netlify/functions/tasks/${task.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`삭제 실패: ${response.status}`);
      }

      await loadDatabase(); // 목록 새로고침
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.');
      console.error('Failed to delete task:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (task: NotionPage) => {
    if (!confirm(`"${task.properties.과제명?.rich_text?.[0]?.plain_text || '제목 없음'}" 과제를 완료 처리하시겠습니까?`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/.netlify/functions/tasks/${task.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completed: true
        }),
      });

      if (!response.ok) {
        throw new Error(`완료 처리 실패: ${response.status}`);
      }

      await loadDatabase(); // 목록 새로고침
    } catch (err) {
      setError(err instanceof Error ? err.message : '완료 처리 중 오류가 발생했습니다.');
      console.error('Failed to complete task:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (view: string) => {
    setCurrentView(view);
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  const renderHeader = () => {
    if (currentView === 'dashboard') {
      return (
        <header className="app-header">
          <div className="header-left">
            <h1>자격기획팀 추진과제 현황</h1>
            <p className="welcome-message">환영합니다, {user?.name}님!</p>
          </div>
          <div className="header-buttons">
            <button onClick={handleCreateTask} className="create-button">
              새 과제 등록
            </button>
            <button onClick={() => setCurrentView('all')} className="view-all-button">
              전체 과제 보기
            </button>
            {user?.role === '관리자' && (
              <button onClick={() => setCurrentView('admin')} className="admin-button">
                사용자 관리
              </button>
            )}
            <button onClick={loadDatabase} disabled={loading} className="refresh-button">
              {loading ? '새로고침 중...' : '새로고침'}
            </button>
            <button onClick={signOut} className="signout-button">
              로그아웃
            </button>
          </div>
        </header>
      );
    } else if (currentView === 'all') {
      return (
        <header className="app-header">
          <div className="header-left">
            <h1>전체 과제 목록</h1>
          </div>
          <div className="header-buttons">
            <button onClick={handleCreateTask} className="create-button">
              새 과제 등록
            </button>
            <button onClick={() => setCurrentView('dashboard')} className="dashboard-button">
              대시보드
            </button>
            <button onClick={loadDatabase} disabled={loading} className="refresh-button">
              {loading ? '새로고침 중...' : '새로고침'}
            </button>
            <button onClick={signOut} className="signout-button">
              로그아웃
            </button>
          </div>
        </header>
      );
    }
    return null;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="loading">
          <p>데이터베이스를 불러오는 중...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error">
          <p>오류: {error}</p>
        </div>
      );
    }

    if (currentView === 'dashboard') {
      return (
        <Dashboard
          pages={pages}
          onNavigate={handleNavigate}
          onEditTask={handleEditTask}
        />
      );
    } else if (currentView === 'all') {
      return (
        <DatabaseTable
          pages={pages}
          loading={false}
          error={null}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
          onCompleteTask={handleCompleteTask}
        />
      );
    } else if (currentView === 'notices') {
      return (
        <NoticeListView
          onBack={handleBackToDashboard}
        />
      );
    } else if (currentView === 'admin') {
      return (
        <AdminDashboard
          onBack={handleBackToDashboard}
        />
      );
    } else {
      return (
        <FilteredTaskView
          pages={pages}
          view={currentView}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
          onCompleteTask={handleCompleteTask}
          onBack={handleBackToDashboard}
        />
      );
    }
  };

  useEffect(() => {
    loadDatabase();
  }, []);

  return (
    <div className="App">
      {renderHeader()}
      <main>
        {renderContent()}
      </main>

      {showForm && (
        <TaskForm
          task={editingTask}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          loading={formLoading}
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner">
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <UserStatusGuard>
      <AuthenticatedApp />
    </UserStatusGuard>
  );
};

export default App;