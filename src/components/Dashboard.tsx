import React, { useMemo, useState, useEffect } from 'react';
import { NotionPage } from '../types';
import { NoticeForm, NoticeFormData } from './NoticeForm';
import { fetchNotices, createNotice } from '../noticeApi';

interface DashboardProps {
  pages: NotionPage[];
  onNavigate: (view: string) => void;
  onEditTask: (task: NotionPage) => void;
}

export interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  urgent: number;
  today: number;
  overdue: number;
  within7Days: number;
  byAssignee: { [key: string]: number };
}

export const Dashboard: React.FC<DashboardProps> = ({ pages, onNavigate, onEditTask }) => {
  const [showNoticeForm, setShowNoticeForm] = useState(false);
  const [noticeFormLoading, setNoticeFormLoading] = useState(false);
  const [notices, setNotices] = useState<any[]>([]);
  const [noticesLoading, setNoticesLoading] = useState(true);

  const stats = useMemo((): TaskStats => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayStr = today.toISOString().split('T')[0];

    const completed = pages.filter(page => page.properties.완료?.checkbox).length;
    const urgent = pages.filter(page => page.properties.긴급?.checkbox && !page.properties.완료?.checkbox).length;

    const todayTasks = pages.filter(page => {
      const deadline = page.properties.마감일?.date?.start;
      return deadline === todayStr && !page.properties.완료?.checkbox;
    }).length;

    const overdue = pages.filter(page => {
      const deadline = page.properties.마감일?.date?.start;
      if (!deadline) return false;
      return deadline < todayStr && !page.properties.완료?.checkbox;
    }).length;

    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);
    const sevenDaysStr = sevenDaysFromNow.toISOString().split('T')[0];

    const within7Days = pages.filter(page => {
      const deadline = page.properties.마감일?.date?.start;
      if (!deadline || page.properties.완료?.checkbox) return false;
      return deadline >= todayStr && deadline <= sevenDaysStr;
    }).length;

    const byAssignee: { [key: string]: number } = {};
    pages.forEach(page => {
      const assignee = page.properties.담당자?.title?.[0]?.plain_text || '미배정';
      if (!page.properties.완료?.checkbox) {
        byAssignee[assignee] = (byAssignee[assignee] || 0) + 1;
      }
    });

    return {
      total: pages.length,
      completed,
      inProgress: pages.length - completed,
      urgent,
      today: todayTasks,
      overdue,
      within7Days,
      byAssignee
    };
  }, [pages]);

  const getRecentTasks = (limit: number = 5) => {
    return pages
      .filter(page => !page.properties.완료?.checkbox)
      .sort((a, b) => new Date(b.last_edited_time).getTime() - new Date(a.last_edited_time).getTime())
      .slice(0, limit);
  };

  const getUrgentTasks = (limit: number = 5) => {
    return pages
      .filter(page => page.properties.긴급?.checkbox && !page.properties.완료?.checkbox)
      .slice(0, limit);
  };

  const handleCreateNotice = () => {
    setShowNoticeForm(true);
  };

  const loadNotices = async () => {
    try {
      setNoticesLoading(true);
      const response = await fetchNotices();

      const formattedNotices = response.results.map(notice => {
        const fullTitle = notice.properties.제목?.title?.[0]?.plain_text || '';
        const authorMatch = fullTitle.match(/^\[([^\]]+)\]\s*(.*)/);
        const author = authorMatch ? authorMatch[1] : '익명';
        const title = authorMatch ? authorMatch[2] : fullTitle;

        return {
          id: notice.id,
          title: title,
          content: notice.properties.내용?.rich_text?.[0]?.plain_text || '',
          author: author,
          type: notice.properties.선택?.select?.name === '중요' ? 'important' : 'general',
          date: notice.properties.작성일?.date?.start || notice.created_time.split('T')[0]
        };
      });

      setNotices(formattedNotices);
    } catch (error) {
      console.error('Failed to load notices:', error);
    } finally {
      setNoticesLoading(false);
    }
  };

  const handleNoticeSubmit = async (noticeData: NoticeFormData) => {
    try {
      setNoticeFormLoading(true);

      await createNotice({
        title: noticeData.title,
        content: noticeData.content,
        author: noticeData.author,
        type: noticeData.type
      });

      setShowNoticeForm(false);
      await loadNotices(); // 공지사항 목록 새로고침
    } catch (error) {
      console.error('Failed to create notice:', error);
    } finally {
      setNoticeFormLoading(false);
    }
  };

  const handleNoticeCancel = () => {
    setShowNoticeForm(false);
  };

  useEffect(() => {
    loadNotices();
  }, []);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>자격기획팀 과제 대시보드</h2>
      </div>

      {/* 통계 카드 */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>전체 과제</h3>
            <p className="stat-number">{stats.total}</p>
          </div>
        </div>

        <div className="stat-card progress" onClick={() => onNavigate('progress')}>
          <div className="stat-icon">🔄</div>
          <div className="stat-content">
            <h3>진행중 과제</h3>
            <p className="stat-number">{stats.inProgress}</p>
          </div>
        </div>

        <div className="stat-card today" onClick={() => onNavigate('today')}>
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>오늘 마감</h3>
            <p className="stat-number">{stats.today}</p>
          </div>
        </div>

        <div className="stat-card within7days" onClick={() => onNavigate('within7days')}>
          <div className="stat-icon">📆</div>
          <div className="stat-content">
            <h3>7일 내 과제</h3>
            <p className="stat-number">{stats.within7Days}</p>
          </div>
        </div>

        <div className="stat-card overdue" onClick={() => onNavigate('overdue')}>
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <h3>지연 과제</h3>
            <p className="stat-number">{stats.overdue}</p>
          </div>
        </div>

        <div className="stat-card urgent" onClick={() => onNavigate('urgent')}>
          <div className="stat-icon">🚨</div>
          <div className="stat-content">
            <h3>긴급 과제</h3>
            <p className="stat-number">{stats.urgent}</p>
          </div>
        </div>

        <div className="stat-card completed" onClick={() => onNavigate('completed')}>
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>완료 과제</h3>
            <p className="stat-number">{stats.completed}</p>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="dashboard-content">
        {/* 최근 업데이트된 과제 */}
        <div className="dashboard-section">
          <h3>최근 업데이트된 과제</h3>
          <div className="task-list">
            {getRecentTasks().map(task => (
              <div key={task.id} className="task-item" onClick={() => onEditTask(task)}>
                <div className="task-info">
                  <h4>{task.properties.과제명?.rich_text?.[0]?.plain_text || '제목 없음'}</h4>
                  <p className="task-assignee">
                    담당자: {task.properties.담당자?.title?.[0]?.plain_text || '미배정'}
                  </p>
                  <p className="task-deadline">
                    마감일: {task.properties.마감일?.date?.start || '미정'}
                  </p>
                </div>
                <div className="task-badges">
                  {task.properties.긴급?.checkbox && <span className="badge urgent">긴급</span>}
                  {task.properties.완료?.checkbox && <span className="badge completed">완료</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 긴급 과제 */}
        <div className="dashboard-section">
          <h3>긴급 과제</h3>
          <div className="task-list">
            {getUrgentTasks().length > 0 ? getUrgentTasks().map(task => (
              <div key={task.id} className="task-item urgent-task" onClick={() => onEditTask(task)}>
                <div className="task-info">
                  <h4>{task.properties.과제명?.rich_text?.[0]?.plain_text || '제목 없음'}</h4>
                  <p className="task-assignee">
                    담당자: {task.properties.담당자?.title?.[0]?.plain_text || '미배정'}
                  </p>
                  <p className="task-deadline">
                    마감일: {task.properties.마감일?.date?.start || '미정'}
                  </p>
                </div>
                <div className="task-badges">
                  <span className="badge urgent">긴급</span>
                </div>
              </div>
            )) : (
              <p className="no-tasks">긴급 과제가 없습니다.</p>
            )}
          </div>
        </div>

        {/* 담당자별 과제 현황 */}
        <div className="dashboard-section">
          <h3>담당자별 과제 현황</h3>
          <div className="assignee-stats">
            {Object.entries(stats.byAssignee)
              .sort(([,a], [,b]) => b - a)
              .map(([assignee, count]) => (
                <div
                  key={assignee}
                  className="assignee-item"
                  onClick={() => onNavigate(`assignee:${assignee}`)}
                >
                  <span className="assignee-name">{assignee}</span>
                  <span className="assignee-count">{count}개</span>
                </div>
              ))}
          </div>
        </div>

        {/* 팀 소통 게시판 */}
        <div className="dashboard-section team-board">
          <div className="section-header">
            <h3>팀 소통 게시판</h3>
            <button className="add-notice-btn" onClick={handleCreateNotice}>
              ✏️ 글쓰기
            </button>
          </div>
          <div className="notice-list">
            {noticesLoading ? (
              <div className="loading-notices">
                <p>공지사항을 불러오는 중...</p>
              </div>
            ) : notices.length === 0 ? (
              <div className="no-notices">
                <p>등록된 공지사항이 없습니다.</p>
              </div>
            ) : notices.map(notice => (
              <div key={notice.id} className="notice-item">
                <div className="notice-header">
                  <span className={`notice-type ${notice.type}`}>
                    {notice.type === 'important' ? '중요' : '일반'}
                  </span>
                  <span className="notice-author">{notice.author}</span>
                  <span className="notice-date">{notice.date}</span>
                </div>
                <div className="notice-content">
                  <h4>{notice.title}</h4>
                  <p>{notice.content}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="board-footer">
            <button
              className="view-all-notices"
              onClick={() => onNavigate('notices')}
            >
              전체 공지사항 보기
            </button>
          </div>
        </div>
      </div>

      {showNoticeForm && (
        <NoticeForm
          onSubmit={handleNoticeSubmit}
          onCancel={handleNoticeCancel}
          loading={noticeFormLoading}
        />
      )}
    </div>
  );
};