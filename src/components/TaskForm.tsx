import React, { useState, useEffect } from 'react';
import { NotionPage } from '../types';

interface TaskFormProps {
  task?: NotionPage | null;
  onSubmit: (taskData: TaskFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

export interface TaskFormData {
  담당자: string;
  과제명: string;
  마감일: string;
  완료: boolean;
  긴급: boolean;
  제출처: string;
  비고: string;
}

export const TaskForm: React.FC<TaskFormProps> = ({ task, onSubmit, onCancel, loading = false }) => {
  const [formData, setFormData] = useState<TaskFormData>({
    담당자: '',
    과제명: '',
    마감일: '',
    완료: false,
    긴급: false,
    제출처: '',
    비고: ''
  });

  useEffect(() => {
    if (task) {
      // 기존 과제 데이터로 폼 초기화
      setFormData({
        담당자: task.properties.담당자?.title?.[0]?.plain_text || '',
        과제명: task.properties.과제명?.rich_text?.[0]?.plain_text || '',
        마감일: task.properties.마감일?.date?.start || '',
        완료: task.properties.완료?.checkbox || false,
        긴급: task.properties.긴급?.checkbox || false,
        제출처: task.properties.제출처?.rich_text?.[0]?.plain_text || '',
        비고: task.properties.비고?.rich_text?.[0]?.plain_text || ''
      });
    }
  }, [task]);

  const handleInputChange = (field: keyof TaskFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="task-form-overlay">
      <div className="task-form">
        <h2>{task ? '과제 수정' : '새 과제 등록'}</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="담당자">담당자 *</label>
            <input
              type="text"
              id="담당자"
              value={formData.담당자}
              onChange={(e) => handleInputChange('담당자', e.target.value)}
              required
              disabled={loading}
              placeholder="담당자 이름을 입력하세요"
            />
          </div>

          <div className="form-group">
            <label htmlFor="과제명">과제명 *</label>
            <input
              type="text"
              id="과제명"
              value={formData.과제명}
              onChange={(e) => handleInputChange('과제명', e.target.value)}
              required
              disabled={loading}
              placeholder="과제명을 입력하세요"
            />
          </div>

          <div className="form-group">
            <label htmlFor="마감일">마감기한</label>
            <input
              type="date"
              id="마감일"
              value={formData.마감일}
              onChange={(e) => handleInputChange('마감일', e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="제출처">제출처</label>
            <input
              type="text"
              id="제출처"
              value={formData.제출처}
              onChange={(e) => handleInputChange('제출처', e.target.value)}
              disabled={loading}
              placeholder="제출처를 입력하세요"
            />
          </div>

          <div className="form-group">
            <label htmlFor="비고">비고</label>
            <textarea
              id="비고"
              value={formData.비고}
              onChange={(e) => handleInputChange('비고', e.target.value)}
              disabled={loading}
              placeholder="비고 사항을 입력하세요"
              rows={3}
            />
          </div>

          <div className="checkbox-group">
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="완료"
                checked={formData.완료}
                onChange={(e) => handleInputChange('완료', e.target.checked)}
                disabled={loading}
              />
              <label htmlFor="완료">완료</label>
            </div>

            <div className="checkbox-item">
              <input
                type="checkbox"
                id="긴급"
                checked={formData.긴급}
                onChange={(e) => handleInputChange('긴급', e.target.checked)}
                disabled={loading}
              />
              <label htmlFor="긴급">긴급</label>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} disabled={loading} className="btn-cancel">
              취소
            </button>
            <button type="submit" disabled={loading} className="btn-submit">
              {loading ? '저장 중...' : task ? '수정' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};