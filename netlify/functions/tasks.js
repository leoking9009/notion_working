const { Client } = require('@notionhq/client');

const notion = new Client({
  auth: process.env.VITE_NOTION_TOKEN,
});

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
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

  const databaseId = process.env.VITE_NOTION_DATABASE_ID;
  if (!databaseId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Database ID not found' }),
    };
  }

  try {
    // POST - 새 과제 생성
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body);
      const assignee = body.assignee || body['담당자'];
      const taskName = body.taskName || body['과제명'];
      const deadline = body.deadline || body['마감일'];
      const completed = body.completed || body['완료'] || false;
      const urgent = body.urgent || body['긴급'] || false;
      const submissionTo = body.submissionTo || body['제출처'] || '';
      const notes = body.notes || body['비고'] || '';

      const properties = {
        담당자: {
          title: [
            {
              text: {
                content: assignee || ''
              }
            }
          ]
        },
        과제명: {
          rich_text: [
            {
              text: {
                content: taskName || ''
              }
            }
          ]
        },
        완료: {
          checkbox: completed
        },
        긴급: {
          checkbox: urgent
        },
        제출처: {
          rich_text: [
            {
              text: {
                content: submissionTo
              }
            }
          ]
        },
        비고: {
          rich_text: [
            {
              text: {
                content: notes
              }
            }
          ]
        }
      };

      // 마감일이 있는 경우에만 추가
      if (deadline) {
        properties.마감일 = {
          date: {
            start: deadline
          }
        };
      }

      const response = await notion.pages.create({
        parent: { database_id: databaseId },
        properties: properties
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, page: response }),
      };
    }

    // PATCH - 과제 수정
    if (event.httpMethod === 'PATCH') {
      const pageId = event.path.split('/').pop(); // URL에서 pageId 추출
      const body = JSON.parse(event.body);

      const assignee = body.assignee !== undefined ? body.assignee : body['담당자'];
      const taskName = body.taskName !== undefined ? body.taskName : body['과제명'];
      const deadline = body.deadline !== undefined ? body.deadline : body['마감일'];
      const completed = body.completed !== undefined ? body.completed : body['완료'];
      const urgent = body.urgent !== undefined ? body.urgent : body['긴급'];
      const submissionTo = body.submissionTo !== undefined ? body.submissionTo : body['제출처'];
      const notes = body.notes !== undefined ? body.notes : body['비고'];

      const properties = {};

      if (assignee !== undefined) {
        properties.담당자 = {
          title: [{ text: { content: assignee || '' } }]
        };
      }

      if (taskName !== undefined) {
        properties.과제명 = {
          rich_text: [{ text: { content: taskName || '' } }]
        };
      }

      if (completed !== undefined) {
        properties.완료 = { checkbox: completed };
      }

      if (urgent !== undefined) {
        properties.긴급 = { checkbox: urgent };
      }

      if (submissionTo !== undefined) {
        properties.제출처 = {
          rich_text: [{ text: { content: submissionTo || '' } }]
        };
      }

      if (notes !== undefined) {
        properties.비고 = {
          rich_text: [{ text: { content: notes || '' } }]
        };
      }

      if (deadline !== undefined) {
        if (deadline === null || deadline === '') {
          properties.마감일 = { date: null };
        } else {
          properties.마감일 = { date: { start: deadline } };
        }
      }

      const response = await notion.pages.update({
        page_id: pageId,
        properties: properties
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, page: response }),
      };
    }

    // DELETE - 과제 삭제
    if (event.httpMethod === 'DELETE') {
      const pageId = event.path.split('/').pop(); // URL에서 pageId 추출

      const response = await notion.pages.update({
        page_id: pageId,
        archived: true
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, page: response }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };

  } catch (error) {
    console.error('Error in tasks function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};