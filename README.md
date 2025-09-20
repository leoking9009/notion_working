# Notion Database Viewer

노션 데이터베이스를 가져와서 웹앱에서 보여주는 React 애플리케이션입니다.

## 기능

- 노션 데이터베이스의 모든 페이지 조회
- 다양한 프로퍼티 타입 지원 (텍스트, 숫자, 선택, 날짜 등)
- 반응형 테이블 UI
- 실시간 데이터 새로고침

## 설정 방법

### 1. 노션 통합 생성

1. [Notion Developers](https://developers.notion.com/)에 접속
2. "My integrations" → "New integration" 클릭
3. 통합 이름을 입력하고 워크스페이스 선택
4. 생성된 "Internal Integration Token" 복사

### 2. 데이터베이스 공유

1. 조회하고 싶은 노션 데이터베이스 페이지로 이동
2. 페이지 오른쪽 상단의 "Share" 버튼 클릭
3. 생성한 통합을 초대하여 접근 권한 부여
4. 데이터베이스 ID 복사 (URL에서 확인 가능)

### 3. 환경 변수 설정

`.env` 파일에 다음 내용을 입력:

```
VITE_NOTION_TOKEN=your_notion_integration_token_here
VITE_NOTION_DATABASE_ID=your_database_id_here
```

### 4. 앱 실행

```bash
npm install
npm run dev
```

## 지원하는 프로퍼티 타입

- Title (제목)
- Rich Text (서식 있는 텍스트)
- Number (숫자)
- Select (단일 선택)
- Multi-select (다중 선택)
- Date (날짜)
- Checkbox (체크박스)
- URL
- Email
- Phone Number

## 기술 스택

- React 18
- TypeScript
- Vite
- Notion API (@notionhq/client)

## 주의사항

- 노션 API에는 요청 제한이 있으므로 과도한 요청을 피하세요
- 환경 변수는 절대 public 저장소에 노출되지 않도록 주의하세요
- 데이터베이스 구조가 변경되면 애플리케이션을 다시 로드해야 할 수 있습니다