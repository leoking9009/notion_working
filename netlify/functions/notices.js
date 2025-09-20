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
        type: notice.properties['유형']?.select?.name || 'general',
        author: notice.properties['작성자']?.rich_text?.[0]?.text?.content || '',
        createdAt: notice.properties['작성일']?.created_time || notice.created_time,
        isImportant: notice.properties['중요']?.checkbox || false
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

      const response = await notion.pages.create({
        parent: { database_id: noticesDbId },
        properties: {
          '제목': {
            title: [{ text: { content: title || '' } }]
          },
          '내용': {
            rich_text: [{ text: { content: content || '' } }]
          },
          '유형': {
            select: { name: type || 'general' }
          },
          '작성자': {
            rich_text: [{ text: { content: author || '' } }]
          },
          '중요': {
            checkbox: isImportant || false
          },
          '작성일': {
            created_time: {}
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