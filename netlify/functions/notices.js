const { Client } = require('@notionhq/client');

const notion = new Client({
  auth: process.env.VITE_NOTION_TOKEN,
});

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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

  const noticesDbId = process.env.VITE_NOTION_NOTICES_DATABASE_ID;
  if (!noticesDbId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Notices Database ID not found' }),
    };
  }

  try {
    // GET /notices - 공지사항 조회
    if (event.httpMethod === 'GET') {
      const response = await notion.databases.query({
        database_id: noticesDbId,
        sorts: [
          {
            property: '작성일',
            direction: 'descending'
          }
        ]
      });

      const notices = response.results.map(notice => ({
        id: notice.id,
        title: notice.properties['제목']?.title?.[0]?.text?.content || '',
        content: notice.properties['내용']?.rich_text?.[0]?.text?.content || '',
        type: notice.properties['선택']?.select?.name === '중요' ? 'important' : 'general',
        createdAt: notice.properties['작성일']?.date?.start || notice.created_time.split('T')[0],
        author: '',
        isImportant: notice.properties['선택']?.select?.name === '중요'
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ notices }),
      };
    }

    // POST /notices - 공지사항 생성
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body);
      const { title, content, type, author, isImportant } = body;

      console.log('Creating notice with data:', { title, content, type, author, isImportant });

      // 제목을 [작성자] 제목 형식으로 결합
      const fullTitle = `[${author || '익명'}] ${title || ''}`;

      const response = await notion.pages.create({
        parent: { database_id: noticesDbId },
        properties: {
          '제목': {
            title: [{ text: { content: fullTitle } }]
          },
          '내용': {
            rich_text: [{ text: { content: content || '' } }]
          },
          '선택': {
            select: { name: type === 'important' ? '중요' : '일반' }
          },
          '작성일': {
            date: { start: new Date().toISOString().split('T')[0] }
          }
        }
      });

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          notice: {
            id: response.id,
            title,
            content,
            type,
            author,
            isImportant,
            createdAt: response.created_time
          }
        }),
      };
    }

    // DELETE /notices/:noticeId - 공지사항 삭제
    if (event.httpMethod === 'DELETE') {
      const noticeId = event.path.split('/').pop(); // URL에서 noticeId 추출

      const response = await notion.pages.update({
        page_id: noticeId,
        archived: true
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, notice: response }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };

  } catch (error) {
    console.error('Error in notices function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};