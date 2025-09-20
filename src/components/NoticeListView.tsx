import React, { useState, useEffect } from 'react';
import { fetchNotices, updateNotice, deleteNotice } from '../noticeApi';
import { NoticeForm, NoticeFormData } from './NoticeForm';
import { CommentSection } from './CommentSection';

interface NoticeItem {
  id: string;
  title: string;
  content: string;
  author: string;
  type: 'important' | 'general';
  date: string;
}

interface NoticeListViewProps {
  onBack: () => void;
}

export const NoticeListView: React.FC<NoticeListViewProps> = ({ onBack }) => {
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotice, setSelectedNotice] = useState<NoticeItem | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormLoading, setEditFormLoading] = useState(false);

  const loadNotices = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, []);

  const handleNoticeClick = (notice: NoticeItem) => {
    setSelectedNotice(notice);
  };

  const handleCloseDetail = () => {
    setSelectedNotice(null);
  };

  const handleEditNotice = () => {
    setShowEditForm(true);
  };

  const handleEditSubmit = async (noticeData: NoticeFormData) => {
    if (!selectedNotice) return;

    try {
      setEditFormLoading(true);

      await updateNotice(selectedNotice.id, {
        title: `[${noticeData.author}] ${noticeData.title}`,
        content: noticeData.content,
        type: noticeData.type
      });

      setShowEditForm(false);
      await loadNotices();

      // 수정된 공지사항으로 선택된 상태 업데이트
      const updatedNotices = await loadNotices();
      const updatedNotice = updatedNotices.find(n => n.id === selectedNotice.id);
      if (updatedNotice) {
        setSelectedNotice(updatedNotice);
      }
    } catch (error) {
      console.error('Failed to update notice:', error);
    } finally {
      setEditFormLoading(false);
    }
  };

  const handleEditCancel = () => {
    setShowEditForm(false);
  };

  const handleDeleteNotice = async () => {
    if (!selectedNotice || !confirm('이 공지사항을 삭제하시겠습니까?')) return;

    try {
      await deleteNotice(selectedNotice.id);
      setSelectedNotice(null);
      await loadNotices();
    } catch (error) {
      console.error('Failed to delete notice:', error);
    }
  };

  if (selectedNotice) {
    return (
      <div className="notice-detail-view">
        <div className="notice-detail-header">
          <button onClick={handleCloseDetail} className="back-button">
            ← 목록으로
          </button>
          <h2>공지사항 상세</h2>
          <div className="notice-actions">
            <button onClick={handleEditNotice} className="edit-button">
              수정
            </button>
            <button onClick={handleDeleteNotice} className="delete-button">
              삭제
            </button>
          </div>
        </div>

        <div className="notice-detail-content">
          <div className="notice-detail-card">
            <div className="notice-detail-meta">
              <span className={`notice-type ${selectedNotice.type}`}>
                {selectedNotice.type === 'important' ? '중요' : '일반'}
              </span>
              <span className="notice-author">{selectedNotice.author}</span>
              <span className="notice-date">{selectedNotice.date}</span>
            </div>

            <h3 className="notice-detail-title">{selectedNotice.title}</h3>

            <div className="notice-detail-body">
              <p>{selectedNotice.content}</p>
            </div>

            <CommentSection noticeId={selectedNotice.id} />
          </div>
        </div>

        {showEditForm && (
          <NoticeForm
            notice={{
              title: selectedNotice.title,
              content: selectedNotice.content,
              author: selectedNotice.author,
              type: selectedNotice.type
            }}
            onSubmit={handleEditSubmit}
            onCancel={handleEditCancel}
            loading={editFormLoading}
          />
        )}
      </div>
    );
  }

  return (
    <div className="notice-list-view">
      <div className="notice-list-header">
        <button onClick={onBack} className="back-button">
          ← 대시보드
        </button>
        <h2>전체 공지사항</h2>
      </div>

      {loading ? (
        <div className="loading-notices">
          <p>공지사항을 불러오는 중...</p>
        </div>
      ) : notices.length === 0 ? (
        <div className="no-notices">
          <p>등록된 공지사항이 없습니다.</p>
        </div>
      ) : (
        <div className="notice-full-list">
          {notices.map(notice => (
            <div
              key={notice.id}
              className="notice-list-item"
              onClick={() => handleNoticeClick(notice)}
            >
              <div className="notice-list-header-row">
                <div className="notice-list-meta">
                  <span className={`notice-type ${notice.type}`}>
                    {notice.type === 'important' ? '중요' : '일반'}
                  </span>
                  <span className="notice-author">{notice.author}</span>
                  <span className="notice-date">{notice.date}</span>
                </div>
              </div>

              <h4 className="notice-list-title">{notice.title}</h4>

              <p className="notice-list-preview">
                {notice.content.length > 100
                  ? `${notice.content.substring(0, 100)}...`
                  : notice.content
                }
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};