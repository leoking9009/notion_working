import React from 'react';
import { NotionPage } from '../types';

interface DatabaseTableProps {
  pages: NotionPage[];
  loading: boolean;
  error: string | null;
  onEditTask?: (task: NotionPage) => void;
  onDeleteTask?: (task: NotionPage) => void;
  onCompleteTask?: (task: NotionPage) => void;
}

const formatPropertyValue = (property: any): string => {
  if (!property) return '';

  switch (property.type) {
    case 'title':
      return property.title?.map((t: any) => t.plain_text).join('') || '';
    case 'rich_text':
      return property.rich_text?.map((t: any) => t.plain_text).join('') || '';
    case 'number':
      return property.number?.toString() || '';
    case 'select':
      return property.select?.name || '';
    case 'multi_select':
      return property.multi_select?.map((s: any) => s.name).join(', ') || '';
    case 'date':
      return property.date?.start || '';
    case 'checkbox':
      return property.checkbox ? '✓' : '';
    case 'url':
      return property.url || '';
    case 'email':
      return property.email || '';
    case 'phone_number':
      return property.phone_number || '';
    default:
      return JSON.stringify(property);
  }
};

export const DatabaseTable: React.FC<DatabaseTableProps> = ({ pages, loading, error, onEditTask, onDeleteTask, onCompleteTask }) => {
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

  if (pages.length === 0) {
    return (
      <div className="empty">
        <p>표시할 데이터가 없습니다.</p>
      </div>
    );
  }

  // 컬럼 순서 정의: 과제명, 담당자, 마감기한, 생성일, 완료여부, 긴급여부, 제출처, 비고
  const orderedColumns = [
    { key: '과제명', label: '과제명' },
    { key: '담당자', label: '담당자' },
    { key: '마감일', label: '마감기한' },
    { key: 'created_time', label: '생성일' },
    { key: '완료', label: '완료여부' },
    { key: '긴급', label: '긴급여부' },
    { key: '제출처', label: '제출처' },
    { key: '비고', label: '비고' },
  ];

  return (
    <div className="database-table">
      <table>
        <thead>
          <tr>
            {orderedColumns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
            <th>수정일</th>
            {(onEditTask || onDeleteTask || onCompleteTask) && <th>작업</th>}
          </tr>
        </thead>
        <tbody>
          {pages.map((page) => (
            <tr key={page.id}>
              {orderedColumns.map((column) => (
                <td key={column.key}>
                  {column.key === 'created_time'
                    ? new Date(page.created_time).toLocaleDateString('ko-KR')
                    : formatPropertyValue(page.properties[column.key])
                  }
                </td>
              ))}
              <td>{new Date(page.last_edited_time).toLocaleDateString('ko-KR')}</td>
              {(onEditTask || onDeleteTask || onCompleteTask) && (
                <td>
                  <div className="action-buttons">
                    {onCompleteTask && !page.properties.완료?.checkbox && (
                      <button
                        onClick={() => onCompleteTask(page)}
                        className="complete-button"
                      >
                        완료
                      </button>
                    )}
                    {onEditTask && (
                      <button
                        onClick={() => onEditTask(page)}
                        className="edit-button"
                      >
                        수정
                      </button>
                    )}
                    {onDeleteTask && (
                      <button
                        onClick={() => onDeleteTask(page)}
                        className="delete-button"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};