import React, { useMemo } from 'react';
import { NotionPage } from '../types';
import { DatabaseTable } from './DatabaseTable';

interface FilteredTaskViewProps {
  pages: NotionPage[];
  view: string;
  onEditTask: (task: NotionPage) => void;
  onDeleteTask?: (task: NotionPage) => void;
  onCompleteTask?: (task: NotionPage) => void;
  onBack: () => void;
}

export const FilteredTaskView: React.FC<FilteredTaskViewProps> = ({ pages, view, onEditTask, onDeleteTask, onCompleteTask, onBack }) => {
  const { filteredPages, title, description } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    let filtered: NotionPage[] = [];
    let viewTitle = '';
    let viewDescription = '';

    switch (view) {
      case 'progress':
        filtered = pages.filter(page => !page.properties.완료?.checkbox);
        viewTitle = '진행중 과제';
        viewDescription = '아직 완료되지 않은 모든 과제';
        break;

      case 'today':
        filtered = pages.filter(page => {
          const deadline = page.properties.마감일?.date?.start;
          return deadline === todayStr && !page.properties.완료?.checkbox;
        });
        viewTitle = '오늘 마감 과제';
        viewDescription = '오늘까지 완료해야 하는 과제';
        break;

      case 'overdue':
        filtered = pages.filter(page => {
          const deadline = page.properties.마감일?.date?.start;
          if (!deadline) return false;
          return deadline < todayStr && !page.properties.완료?.checkbox;
        });
        viewTitle = '지연 과제';
        viewDescription = '마감일이 지난 미완료 과제';
        break;

      case 'urgent':
        filtered = pages.filter(page =>
          page.properties.긴급?.checkbox && !page.properties.완료?.checkbox
        );
        viewTitle = '긴급 과제';
        viewDescription = '긴급으로 표시된 미완료 과제';
        break;

      case 'completed':
        filtered = pages.filter(page => page.properties.완료?.checkbox);
        viewTitle = '완료 과제';
        viewDescription = '완료된 모든 과제';
        break;

      case 'within7days':
        const sevenDaysFromNow = new Date(today);
        sevenDaysFromNow.setDate(today.getDate() + 7);
        const sevenDaysStr = sevenDaysFromNow.toISOString().split('T')[0];

        filtered = pages.filter(page => {
          const deadline = page.properties.마감일?.date?.start;
          if (!deadline || page.properties.완료?.checkbox) return false;
          return deadline >= todayStr && deadline <= sevenDaysStr;
        });
        viewTitle = '7일 내 마감 과제';
        viewDescription = '앞으로 7일 안에 마감되는 과제';
        break;

      default:
        if (view.startsWith('assignee:')) {
          const assignee = view.replace('assignee:', '');
          filtered = pages.filter(page => {
            const taskAssignee = page.properties.담당자?.title?.[0]?.plain_text || '미배정';
            return taskAssignee === assignee && !page.properties.완료?.checkbox;
          });
          viewTitle = `${assignee} 담당 과제`;
          viewDescription = `${assignee}님이 담당하는 미완료 과제`;
        } else {
          filtered = pages;
          viewTitle = '전체 과제';
          viewDescription = '모든 과제 목록';
        }
        break;
    }

    return {
      filteredPages: filtered,
      title: viewTitle,
      description: viewDescription
    };
  }, [pages, view]);

  const getStatusBadge = (view: string) => {
    switch (view) {
      case 'today':
        return { className: 'status-today', text: '오늘 마감' };
      case 'overdue':
        return { className: 'status-overdue', text: '지연' };
      case 'urgent':
        return { className: 'status-urgent', text: '긴급' };
      case 'completed':
        return { className: 'status-completed', text: '완료' };
      case 'progress':
        return { className: 'status-progress', text: '진행중' };
      case 'within7days':
        return { className: 'status-within7days', text: '7일내' };
      default:
        return null;
    }
  };

  const statusBadge = getStatusBadge(view);

  return (
    <div className="filtered-task-view">
      <div className="view-header">
        <button onClick={onBack} className="back-button">
          ← 대시보드로 돌아가기
        </button>

        <div className="view-title-section">
          <div className="view-title-wrapper">
            <h2>{title}</h2>
            {statusBadge && (
              <span className={`status-badge ${statusBadge.className}`}>
                {statusBadge.text}
              </span>
            )}
          </div>
          <p className="view-description">{description}</p>
          <p className="view-count">총 {filteredPages.length}개 과제</p>
        </div>
      </div>

      <div className="view-content">
        {filteredPages.length > 0 ? (
          <DatabaseTable
            pages={filteredPages}
            loading={false}
            error={null}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            onCompleteTask={onCompleteTask}
          />
        ) : (
          <div className="empty-view">
            <div className="empty-icon">📝</div>
            <h3>표시할 과제가 없습니다</h3>
            <p>현재 조건에 맞는 과제가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};