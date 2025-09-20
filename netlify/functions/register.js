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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const usersDbId = process.env.VITE_NOTION_USERS_DATABASE_ID;
  if (!usersDbId) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Users Database ID not configured' }),
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { googleId, name, email, profilePicture } = body;

    console.log('Registering user:', { googleId, name, email });

    // 이메일로 기존 사용자 확인 (Google ID 필드가 없을 수 있음)
    const existingUsers = await notion.databases.query({
      database_id: usersDbId,
      filter: {
        property: '이메일',
        email: {
          equals: email
        }
      }
    });

    if (existingUsers.results.length > 0) {
      const existingUser = existingUsers.results[0];
      console.log('Existing user found:', existingUser.id);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'User already exists',
          user: {
            id: existingUser.id,
            googleId: googleId, // 전달받은 googleId 사용
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
    console.log('Creating new user...');
    const response = await notion.pages.create({
      parent: { database_id: usersDbId },
      properties: {
        '이름': {
          title: [{ text: { content: name } }]
        },
        '이메일': {
          email: email
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

    console.log('User created successfully:', response.id);

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

  } catch (error) {
    console.error('Error in register function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Registration failed',
        details: error.message
      }),
    };
  }
};