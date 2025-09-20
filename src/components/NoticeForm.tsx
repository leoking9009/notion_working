import React, { useState, useEffect } from 'react';

export interface NoticeFormData {
  title: string;
  content: string;
  type: 'important' | 'general';
  author: string;
}

interface NoticeFormProps {
  onSubmit: (noticeData: NoticeFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  notice?: NoticeFormData;
}

export const NoticeForm: React.FC<NoticeFormProps> = ({
  onSubmit,
  onCancel,
  loading = false,
  notice
}) => {
  const [formData, setFormData] = useState<NoticeFormData>({
    title: '',
    content: '',
    type: 'general',
    author: ''
  });

  const [errors, setErrors] = useState<Partial<NoticeFormData>>({});

  useEffect(() => {
    if (notice) {
      setFormData(notice);
    }
  }, [notice]);

  const validateForm = (): boolean => {
    const newErrors: Partial<NoticeFormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = '제목을 입력해주세요.';
    }

    if (!formData.content.trim()) {
      newErrors.content = '내용을 입력해주세요.';
    }

    if (!formData.author.trim()) {
      newErrors.author = '작성자를 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (
    field: keyof NoticeFormData,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  return (
    <div className="notice-form-overlay">
      <div className="notice-form-container">
        <div className="notice-form-header">
          <h2>{notice ? '공지사항 수정' : '새 공지사항 작성'}</h2>
          <button
            className="close-button"
            onClick={onCancel}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="notice-form">
          <div className="form-group">
            <label htmlFor="author">작성자</label>
            <input
              type="text"
              id="author"
              value={formData.author}
              onChange={(e) => handleInputChange('author', e.target.value)}
              placeholder="작성자 이름을 입력하세요"
              disabled={loading}
            />
            {errors.author && <span className="error-message">{errors.author}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="type">공지 유형</label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value as 'important' | 'general')}
              disabled={loading}
            >
              <option value="general">일반</option>
              <option value="important">중요</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="title">제목</label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="공지사항 제목을 입력하세요"
              disabled={loading}
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="content">내용</label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="공지사항 내용을 입력하세요"
              rows={6}
              disabled={loading}
            />
            {errors.content && <span className="error-message">{errors.content}</span>}
          </div>

          <div className="form-buttons">
            <button
              type="button"
              onClick={onCancel}
              className="cancel-button"
              disabled={loading}
            >
              취소
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? (notice ? '수정 중...' : '등록 중...') : (notice ? '수정' : '등록')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};