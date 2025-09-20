# 🚀 Netlify 배포 가이드

이 가이드는 자격기획팀 과제 관리 시스템을 Netlify에 배포하는 방법을 설명합니다.

## 📋 사전 준비사항

### 1. 필요한 계정
- [GitHub](https://github.com) 계정
- [Netlify](https://netlify.com) 계정
- [Google Cloud Console](https://console.cloud.google.com) 프로젝트
- [Notion](https://notion.so) 계정 및 API 토큰

### 2. 환경 변수 준비
다음 환경 변수들을 준비해주세요:

```
VITE_NOTION_TOKEN=your_notion_integration_token
VITE_NOTION_DATABASE_ID=your_tasks_database_id
VITE_NOTION_NOTICES_DATABASE_ID=your_notices_database_id
VITE_NOTION_COMMENTS_DATABASE_ID=your_comments_database_id
VITE_NOTION_USERS_DATABASE_ID=your_users_database_id
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

## 🔧 1단계: GitHub 레포지토리 설정

### 1.1 GitHub에 레포지토리 생성
1. GitHub에서 새 레포지토리 생성
2. 현재 프로젝트를 GitHub에 푸시:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

## 🌐 2단계: Netlify 배포 설정

### 2.1 Netlify 사이트 생성
1. [Netlify](https://app.netlify.com)에 로그인
2. "New site from Git" 클릭
3. GitHub 연결 및 레포지토리 선택
4. 빌드 설정:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`

### 2.2 환경 변수 설정
1. Netlify 대시보드 → Site settings → Environment variables
2. 다음 환경 변수들을 추가:

```
VITE_NOTION_TOKEN=your_notion_integration_token
VITE_NOTION_DATABASE_ID=your_tasks_database_id
VITE_NOTION_NOTICES_DATABASE_ID=your_notices_database_id
VITE_NOTION_COMMENTS_DATABASE_ID=your_comments_database_id
VITE_NOTION_USERS_DATABASE_ID=your_users_database_id
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

## 🔑 3단계: Google OAuth 설정

### 3.1 승인된 JavaScript 출처 추가
1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. APIs & Services → Credentials
3. OAuth 2.0 클라이언트 ID 선택
4. "Authorized JavaScript origins"에 추가:
   ```
   https://your-site-name.netlify.app
   https://your-custom-domain.com (커스텀 도메인 사용시)
   ```

### 3.2 승인된 리디렉션 URI 추가 (필요시)
"Authorized redirect URIs"에 추가:
```
https://your-site-name.netlify.app
https://your-custom-domain.com (커스텀 도메인 사용시)
```

## 📊 4단계: Notion 데이터베이스 설정

### 4.1 Integration 권한 확인
모든 Notion 데이터베이스에 Integration이 연결되어 있는지 확인:
1. 각 데이터베이스 페이지에서 "..." → "Connections" → "your_integration_name" 추가

### 4.2 데이터베이스 ID 확인
각 데이터베이스 URL에서 ID 추출:
```
https://www.notion.so/workspace/DATABASE_ID?v=...
```

## 🚀 5단계: 배포 및 테스트

### 5.1 자동 배포
- GitHub에 푸시하면 Netlify가 자동으로 배포를 시작합니다
- 배포 로그에서 오류가 없는지 확인하세요

### 5.2 기능 테스트
배포 후 다음 기능들을 테스트하세요:
- [ ] Google OAuth 로그인
- [ ] 사용자 등록 및 승인 시스템
- [ ] 과제 생성, 수정, 삭제
- [ ] 공지사항 관리
- [ ] 댓글 시스템
- [ ] 관리자 대시보드

## 🔧 트러블슈팅

### API 호출 실패
- Netlify Functions가 제대로 배포되었는지 확인
- 환경 변수가 올바르게 설정되었는지 확인
- Functions 로그에서 오류 메시지 확인

### Google OAuth 오류
- JavaScript 출처가 올바르게 설정되었는지 확인
- 클라이언트 ID가 정확한지 확인

### Notion API 오류
- Integration 토큰이 유효한지 확인
- 데이터베이스 ID가 정확한지 확인
- Integration이 모든 데이터베이스에 연결되었는지 확인

## 📈 성능 최적화

### 추천 설정
1. **Build & Deploy** → **Environment variables**에서 `NODE_ENV=production` 추가
2. **Build & Deploy** → **Build settings**에서 Node.js 버전을 18로 설정
3. Asset optimization 활성화

## 🔐 보안 고려사항

1. **환경 변수**: 모든 민감한 정보는 환경 변수로 관리
2. **CORS**: API 요청이 허용된 도메인에서만 가능하도록 설정
3. **HTTPS**: Netlify는 기본적으로 HTTPS를 제공
4. **Content Security Policy**: 필요시 추가 보안 헤더 설정

## 🎯 배포 완료!

모든 단계가 완료되면 다음 URL에서 애플리케이션에 접근할 수 있습니다:
- **기본 URL**: `https://your-site-name.netlify.app`
- **커스텀 도메인**: `https://your-custom-domain.com` (설정한 경우)

문제가 발생하면 Netlify 대시보드의 Functions 탭과 Deploy 로그를 확인하세요.