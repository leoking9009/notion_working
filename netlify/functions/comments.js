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

  const commentsDbId = process.env.VITE_NOTION_COMMENTS_DATABASE_ID;
  if (!commentsDbId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Comments Database ID not found' }),
    };
  }

  try {
    // GET /comments/:noticeId - 특정 공지사항의 댓글 조회
    if (event.httpMethod === 'GET') {
      const noticeId = event.path.split('/').pop(); // URL에서 noticeId 추출

      const response = await notion.databases.query({
        database_id: commentsDbId,
        filter: {
          property: '공지사항 ID',
          rich_text: {
            equals: noticeId
          }
        },
        sorts: [
          {
            timestamp: 'created_time',
            direction: 'ascending'
          }
        ]
      });

      const comments = response.results.map(comment => ({
        id: comment.id,
        content: comment.properties['내용']?.rich_text?.[0]?.text?.content || '',
        author: comment.properties['작성자']?.rich_text?.[0]?.text?.content || '',
        noticeId: comment.properties['공지사항 ID']?.rich_text?.[0]?.text?.content || '',
        createdAt: comment.created_time
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ comments }),
      };
    }

    // POST /comments - 댓글 생성
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body);
      const { content, author, noticeId } = body;

      const response = await notion.pages.create({
        parent: { database_id: commentsDbId },
        properties: {
          '내용': {
            rich_text: [{ text: { content: content || '' } }]
          },
          '작성자': {
            rich_text: [{ text: { content: author || '' } }]
          },
          '공지사항 ID': {
            rich_text: [{ text: { content: noticeId || '' } }]
          }
        }
      });

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          comment: {
            id: response.id,
            content,
            author,
            noticeId,
            createdAt: response.created_time
          }
        }),
      };
    }

    // DELETE /comments/:commentId - 댓글 삭제
    if (event.httpMethod === 'DELETE') {
      const commentId = event.path.split('/').pop(); // URL에서 commentId 추출

      const response = await notion.pages.update({
        page_id: commentId,
        archived: true
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, comment: response }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };

  } catch (error) {
    console.error('Error in comments function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};