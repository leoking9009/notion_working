const { Client } = require('@notionhq/client');

const notion = new Client({
  auth: process.env.VITE_NOTION_TOKEN,
});

exports.handler = async (event, context) => {
  // CORS 헤더 설정
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  // OPTIONS 요청 처리 (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const databaseId = process.env.VITE_NOTION_DATABASE_ID;

    if (!databaseId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Database ID not found' }),
      };
    }

    const response = await notion.databases.query({
      database_id: databaseId,
    });

    const formattedData = {
      results: response.results.map((page) => ({
        id: page.id,
        created_time: page.created_time,
        last_edited_time: page.last_edited_time,
        properties: page.properties,
      })),
      next_cursor: response.next_cursor,
      has_more: response.has_more,
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(formattedData),
    };
  } catch (error) {
    console.error('Error fetching database:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};