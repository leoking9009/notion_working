const { Client } = require('@notionhq/client');

const notion = new Client({
  auth: process.env.VITE_NOTION_TOKEN,
});

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
};

exports.handler = async (event, context) => {
  // OPTIONS 요청 처리 (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  const usersDbId = process.env.VITE_NOTION_USERS_DATABASE_ID;
  if (!usersDbId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Users Database ID not found' }),
    };
  }

  try {
    // POST /users/register - 사용자 등록
    if (event.httpMethod === 'POST' && event.path.includes('/register')) {
      const body = JSON.parse(event.body);
      const { googleId, name, email, profilePicture } = body;

      // 기존 사용자 확인
      const existingUsers = await notion.databases.query({
        database_id: usersDbId,
        filter: {
          property: 'Google ID',
          rich_text: {
            equals: googleId
          }
        }
      });

      if (existingUsers.results.length > 0) {
        const existingUser = existingUsers.results[0];
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            message: 'User already exists',
            user: {
              id: existingUser.id,
              googleId: existingUser.properties['Google ID']?.rich_text?.[0]?.text?.content,
              name: existingUser.properties['이름']?.title?.[0]?.text?.content,
              email: existingUser.properties['이메일']?.email,
              role: existingUser.properties['역할']?.select?.name || '사용자',
              status: existingUser.properties['상태']?.select?.name || 'pending',
              joinDate: existingUser.created_time
            }
          }),
        };
      }

      // 새 사용자 생성
      const response = await notion.pages.create({
        parent: { database_id: usersDbId },
        properties: {
          '이름': {
            title: [{ text: { content: name } }]
          },
          '이메일': {
            email: email
          },
          'Google ID': {
            rich_text: [{ text: { content: googleId } }]
          },
          '프로필 사진': {
            url: profilePicture || null
          },
          '역할': {
            select: { name: '사용자' }
          },
          '상태': {
            select: { name: 'pending' }
          }
        }
      });

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          message: 'User registered successfully',
          user: {
            id: response.id,
            googleId: googleId,
            name: name,
            email: email,
            role: '사용자',
            status: 'pending',
            joinDate: response.created_time
          }
        }),
      };
    }

    // GET /users - 모든 사용자 조회
    if (event.httpMethod === 'GET' && !event.path.includes('/register')) {
      const response = await notion.databases.query({
        database_id: usersDbId,
        sorts: [
          {
            timestamp: 'created_time',
            direction: 'descending'
          }
        ]
      });

      const users = response.results.map(user => ({
        id: user.id,
        googleId: user.properties['Google ID']?.rich_text?.[0]?.text?.content,
        name: user.properties['이름']?.title?.[0]?.text?.content,
        email: user.properties['이메일']?.email,
        profilePicture: user.properties['프로필 사진']?.url,
        role: user.properties['역할']?.select?.name || '사용자',
        status: user.properties['상태']?.select?.name || 'pending',
        joinDate: user.created_time
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ users }),
      };
    }

    // PATCH /users/:userId/status - 사용자 상태 업데이트
    if (event.httpMethod === 'PATCH' && event.path.includes('/status')) {
      const pathParts = event.path.split('/');
      const userId = pathParts[pathParts.length - 2]; // /users/:userId/status에서 userId 추출
      const body = JSON.parse(event.body);
      const { status, role } = body;

      const properties = {};

      if (status) {
        properties['상태'] = {
          select: { name: status }
        };
      }

      if (role) {
        properties['역할'] = {
          select: { name: role }
        };
      }

      const response = await notion.pages.update({
        page_id: userId,
        properties: properties
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'User status updated successfully',
          user: response
        }),
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' }),
    };

  } catch (error) {
    console.error('Error in users function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};