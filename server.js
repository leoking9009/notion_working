const express = require('express');
const cors = require('cors');
const { Client } = require('@notionhq/client');
require('dotenv').config();

const app = express();
const port = 8000;

// CORS 설정
app.use(cors());
app.use(express.json({ charset: 'utf-8' }));
app.use(express.urlencoded({ extended: true, charset: 'utf-8' }));

// 노션 클라이언트 초기화
const notion = new Client({
  auth: process.env.VITE_NOTION_TOKEN,
});

// 데이터베이스 조회 API
app.get('/api/database', async (req, res) => {
  try {
    const databaseId = process.env.VITE_NOTION_DATABASE_ID;

    if (!databaseId) {
      return res.status(400).json({ error: 'Database ID not found' });
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

    res.json(formattedData);
  } catch (error) {
    console.error('Error fetching database:', error);
    res.status(500).json({ error: error.message });
  }
});

// 새 과제 생성 API
app.post('/api/tasks', async (req, res) => {
  try {
    const databaseId = process.env.VITE_NOTION_DATABASE_ID;
    const assignee = req.body.assignee || req.body['담당자'];
    const taskName = req.body.taskName || req.body['과제명'];
    const deadline = req.body.deadline || req.body['마감일'];
    const completed = req.body.completed || req.body['완료'] || false;
    const urgent = req.body.urgent || req.body['긴급'] || false;
    const submissionTo = req.body.submissionTo || req.body['제출처'] || '';
    const notes = req.body.notes || req.body['비고'] || '';

    console.log('Received request body:', req.body);
    console.log('Extracted fields:', { assignee, taskName, deadline, completed, urgent, submissionTo, notes });

    if (!databaseId) {
      return res.status(400).json({ error: 'Database ID not found' });
    }

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

    res.json({ success: true, page: response });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: error.message });
  }
});

// 과제 수정 API
app.patch('/api/tasks/:pageId', async (req, res) => {
  try {
    const { pageId } = req.params;
    console.log('PATCH request body:', req.body);
    const assignee = req.body.assignee !== undefined ? req.body.assignee : req.body['담당자'];
    const taskName = req.body.taskName !== undefined ? req.body.taskName : req.body['과제명'];
    const deadline = req.body.deadline !== undefined ? req.body.deadline : req.body['마감일'];
    const completed = req.body.completed !== undefined ? req.body.completed : req.body['완료'];
    const urgent = req.body.urgent !== undefined ? req.body.urgent : req.body['긴급'];
    const submissionTo = req.body.submissionTo !== undefined ? req.body.submissionTo : req.body['제출처'];
    const notes = req.body.notes !== undefined ? req.body.notes : req.body['비고'];
    console.log('Extracted fields:', { assignee, taskName, deadline, completed, urgent, submissionTo, notes });

    const properties = {};

    if (assignee !== undefined) {
      properties.담당자 = {
        title: [
          {
            text: {
              content: assignee
            }
          }
        ]
      };
    }

    if (taskName !== undefined) {
      properties.과제명 = {
        rich_text: [
          {
            text: {
              content: taskName
            }
          }
        ]
      };
    }

    if (completed !== undefined) {
      properties.완료 = {
        checkbox: completed
      };
    }

    if (urgent !== undefined) {
      properties.긴급 = {
        checkbox: urgent
      };
    }

    if (submissionTo !== undefined) {
      properties.제출처 = {
        rich_text: [
          {
            text: {
              content: submissionTo
            }
          }
        ]
      };
    }

    if (notes !== undefined) {
      properties.비고 = {
        rich_text: [
          {
            text: {
              content: notes
            }
          }
        ]
      };
    }

    if (deadline !== undefined) {
      if (deadline) {
        properties.마감일 = {
          date: {
            start: deadline
          }
        };
      } else {
        properties.마감일 = {
          date: null
        };
      }
    }

    const response = await notion.pages.update({
      page_id: pageId,
      properties: properties
    });

    res.json({ success: true, page: response });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: error.message });
  }
});

// 과제 삭제 API
app.delete('/api/tasks/:pageId', async (req, res) => {
  try {
    const { pageId } = req.params;

    const response = await notion.pages.update({
      page_id: pageId,
      archived: true
    });

    res.json({ success: true, page: response });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});